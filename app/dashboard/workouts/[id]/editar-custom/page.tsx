'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAuthHeaders, API_URL } from '@/lib/api'
import { getWorkoutById, updateWorkout } from '@/lib/api/workouts'
import { saveWorkoutBlocks, getExercises, getWorkoutBlocks } from '@/lib/api/exercises'
import { Exercise } from '@/lib/types/exercise'
import { ArrowLeft, Loader2, CheckCircle, Plus, Sparkles } from 'lucide-react'

export default function EditarClasePersonalizadaPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [form, setForm] = useState({
    title: '', description: '',
    category: 'CardioConsciente', level: 'Principiante',
    objective: 'Tonificacion'
  })
  const [loading,      setLoading]      = useState(true)
  const [submitting,   setSubmitting]   = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState('')

  // Bloques
  type BlockExercise = {
    exerciseId: number; exerciseTitle: string; exerciseThumbnailUrl?: string;
    trackingType: string; overrideReps?: number; overrideDurationSeconds?: number;
    overrideWeightLbs?: number; defaultRestTimerSeconds?: number;
    effectiveReps?: number; effectiveDurationSeconds?: number;
    effectiveWeightLbs?: number; notes?: string;
  }
  type Block = { name: string; rounds: number; restTimerSeconds: number; exercises: BlockExercise[] }
  const [blocks, setBlocks] = useState<Block[]>([])
  const [exerciseSearch,  setExerciseSearch]  = useState<Record<number, string>>({})
  const [exerciseResults, setExerciseResults] = useState<Record<number, Exercise[]>>({})
  const searchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const workout = await getWorkoutById(Number(id))
        const w = workout as any
        
        // Prevent editing if not custom
        if (!w.isCustom) {
          setError('No puedes editar una clase que no es tuya.')
          setLoading(false)
          return
        }

        setForm({
          title:             w.title,
          description:       w.description ?? '',
          category:          w.category,
          level:             w.level,
          objective:         w.objective,
        })
        
        // Load blocks
        const loadedBlocks = await getWorkoutBlocks(Number(id))
        setBlocks(loadedBlocks.map(b => ({
          name: b.name,
          rounds: b.rounds,
          restTimerSeconds: b.restTimerSeconds,
          exercises: b.exercises.map(e => ({
            exerciseId: e.exerciseId,
            exerciseTitle: e.exerciseTitle,
            exerciseThumbnailUrl: e.exerciseThumbnailUrl,
            trackingType: e.trackingType,
            overrideReps: e.overrideReps,
            overrideDurationSeconds: e.overrideDurationSeconds,
            overrideWeightLbs: e.overrideWeightLbs ?? undefined,
            defaultRestTimerSeconds: e.defaultRestTimerSeconds,
            effectiveReps: e.effectiveReps,
            effectiveDurationSeconds: e.effectiveDurationSeconds,
            effectiveWeightLbs: e.effectiveWeightLbs ?? undefined,
            notes: e.notes,
          }))
        })))
      } catch {
        setError('No se pudo cargar la clase')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // --- Block helpers ---
  const addBlock = () => setBlocks(prev => [...prev, {
    name: `${String.fromCharCode(65 + prev.length)} BLOCK`, rounds: 3, restTimerSeconds: 60, exercises: []
  }])
  const removeBlock = (bi: number) => setBlocks(prev => prev.filter((_, i) => i !== bi))
  const updateBlock = (bi: number, field: string, value: any) =>
    setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, [field]: value } : b))
  const removeExercise = (bi: number, ei: number) =>
    setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== ei) } : b))
  const updateBlockExercise = (bi: number, ei: number, field: string, value: any) =>
    setBlocks(prev => prev.map((b, i) => i === bi ? {
      ...b, exercises: b.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e)
    } : b))
  const moveExercise = (bi: number, ei: number, dir: -1 | 1) =>
    setBlocks(prev => prev.map((b, i) => {
      if (i !== bi) return b
      const exs = [...b.exercises]
      ;[exs[ei], exs[ei + dir]] = [exs[ei + dir], exs[ei]]
      return { ...b, exercises: exs }
    }))
  const addExerciseToBlock = (bi: number, ex: Exercise) => {
    setBlocks(prev => prev.map((b, i) => i === bi ? {
      ...b, exercises: [...b.exercises, {
        exerciseId: ex.id, exerciseTitle: ex.title, exerciseThumbnailUrl: ex.thumbnailUrl,
        trackingType: ex.trackingType,
        effectiveReps: ex.defaultReps,
        effectiveDurationSeconds: ex.defaultDurationSeconds,
        effectiveWeightLbs: ex.defaultWeightLbs ?? undefined,
        defaultRestTimerSeconds: ex.defaultRestTimerSeconds
      }]
    } : b))
    setExerciseSearch(prev => ({ ...prev, [bi]: '' }))
    setExerciseResults(prev => ({ ...prev, [bi]: [] }))
  }
  const searchExercises = (bi: number, query: string) => {
    setExerciseSearch(prev => ({ ...prev, [bi]: query }))
    clearTimeout(searchTimers.current[bi])
    if (!query.trim()) { setExerciseResults(prev => ({ ...prev, [bi]: [] })); return }
    searchTimers.current[bi] = setTimeout(async () => {
      try {
        const res = await getExercises({ search: query, pageSize: 8 })
        setExerciseResults(prev => ({ ...prev, [bi]: res.items }))
      } catch { /* ignore */ }
    }, 300)
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('El título es obligatorio.'); return }
    setSubmitting(true); setError('')
    try {
      await updateWorkout(Number(id), form)
      if (blocks.length > 0) {
        await saveWorkoutBlocks(Number(id), blocks.map((b, i) => ({
          name: b.name, rounds: b.rounds, order: i, restTimerSeconds: b.restTimerSeconds,
          exercises: b.exercises.map((e, j) => ({
            exerciseId: e.exerciseId, order: j,
            overrideReps: e.overrideReps,
            overrideDurationSeconds: e.overrideDurationSeconds,
            overrideWeightLbs: e.overrideWeightLbs,
            defaultRestTimerSeconds: e.defaultRestTimerSeconds,
            notes: e.notes,
          }))
        })))
      }
      setSuccess(true)
      setTimeout(() => router.push(`/dashboard/workouts/${id}`), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>

  if (success) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <p className="font-melodrama text-2xl text-dark">¡Clase actualizada!</p>
    </div>
  )

  const CATALOG_LABELS: Record<string, string> = {
    Category: 'Categoría', Level: 'Nivel', Objective: 'Objetivo'
  }
  const FIELD_MAP: Record<string, keyof typeof form> = {
    Category: 'category', Level: 'level', Objective: 'objective'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <div>
        <h1 className="font-melodrama text-3xl text-dark flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Editar Rutina Personalizada
        </h1>
        <p className="text-dark/50 font-urwdin text-sm mt-1">Modifica los detalles de tu clase</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Información de la Rutina</h2>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Nombre de la Rutina *</label>
            <input type="text" value={form.title} onChange={set('title')} required className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Descripción <span className="text-dark/40 font-normal">(opcional)</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input-base resize-none" />
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3"><p className="text-sm text-red-600 font-urwdin">{error}</p></div>}

        
        {/* Bloques */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-melodrama text-lg text-dark">Bloques de ejercicios</h3>
            <button type="button" onClick={addBlock} className="btn-primary text-sm px-4 py-2">+ Agregar bloque</button>
          </div>
          {blocks.map((block, bi) => (
            <div key={bi} className="border border-dark/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <input value={block.name} onChange={e => updateBlock(bi, 'name', e.target.value)} className="input-base flex-1 font-medium" placeholder="A BLOCK" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark/60 font-urwdin">Rounds</label>
                  <input type="number" min={1} max={10} value={block.rounds} onChange={e => updateBlock(bi, 'rounds', Number(e.target.value))} className="input-base w-16 text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark/60 font-urwdin">Rest (s)</label>
                  <input type="number" min={0} step={15} value={block.restTimerSeconds} onChange={e => updateBlock(bi, 'restTimerSeconds', Number(e.target.value))} className="input-base w-20 text-center" />
                </div>
                <button type="button" onClick={() => removeBlock(bi)} className="text-red-400 hover:text-red-600 p-1">✕</button>
              </div>
              <div className="space-y-2">
                {block.exercises.map((ex, ei) => (
                  <div key={ei} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-secondary/20 rounded-lg p-3">
                    {ex.exerciseThumbnailUrl && <img src={ex.exerciseThumbnailUrl} className="w-10 h-10 rounded object-cover" />}
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-sm font-medium text-dark truncate">{ex.exerciseTitle}</p>
                      <span className="text-xs text-primary/70">{ex.trackingType}</span>
                    </div>
                    {(ex.trackingType.includes('reps')) && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-dark/40 font-urwdin uppercase tracking-wider">Reps</span>
                        <input type="number" placeholder={String(ex.effectiveReps ?? ex.overrideReps ?? '12')} value={ex.overrideReps ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideReps', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-16 text-center text-sm" title="Reps" />
                      </div>
                    )}
                    {(ex.trackingType.includes('time')) && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-dark/40 font-urwdin uppercase tracking-wider">Segundos</span>
                        <input type="number" placeholder={String(ex.effectiveDurationSeconds ?? ex.overrideDurationSeconds ?? '45')} value={ex.overrideDurationSeconds ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideDurationSeconds', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" title="Tiempo (s)" />
                      </div>
                    )}
                    {(ex.trackingType.includes('weight')) && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-dark/40 font-urwdin uppercase tracking-wider">Libras</span>
                        <input type="number" placeholder={String(ex.effectiveWeightLbs ?? ex.overrideWeightLbs ?? '0')} value={ex.overrideWeightLbs ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideWeightLbs', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-16 text-center text-sm" title="Peso (lbs)" />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-dark/40 font-urwdin uppercase tracking-wider">Descanso (s)</span>
                      <input type="number" placeholder={String(ex.defaultRestTimerSeconds ?? '30')} value={ex.defaultRestTimerSeconds ?? ''}
                          onChange={e => updateBlockExercise(bi, ei, 'defaultRestTimerSeconds', e.target.value ? Number(e.target.value) : undefined)}
                          className="input-base w-20 text-center text-sm" title="Descanso (s)" />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] text-dark/40 font-urwdin uppercase tracking-wider ml-1">Notas (Opcional)</span>
                      <input placeholder="Per side, Alternating..." value={ex.notes ?? ''}
                        onChange={e => updateBlockExercise(bi, ei, 'notes', e.target.value)}
                        className="input-base w-32 text-sm" title="Notas" />
                    </div>
                    <button type="button" onClick={() => moveExercise(bi, ei, -1)} disabled={ei === 0} className="text-dark/40 hover:text-dark disabled:opacity-20">↑</button>
                    <button type="button" onClick={() => moveExercise(bi, ei, 1)} disabled={ei === block.exercises.length - 1} className="text-dark/40 hover:text-dark disabled:opacity-20">↓</button>
                    <button type="button" onClick={() => removeExercise(bi, ei)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input value={exerciseSearch[bi] ?? ''} onChange={e => searchExercises(bi, e.target.value)} placeholder="Buscar y agregar ejercicio..." className="input-base w-full" />
                {exerciseResults[bi] && exerciseResults[bi].length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-secondary rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {exerciseResults[bi].map(ex => (
                      <button key={ex.id} type="button" onClick={() => addExerciseToBlock(bi, ex)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-secondary/20 text-left">
                        {ex.thumbnailUrl && <img src={ex.thumbnailUrl} className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <p className="text-sm font-medium">{ex.title}</p>
                          <p className="text-xs text-dark/50">{ex.trackingType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <span className="flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span> : 'Guardar cambios'}
        </button>
      </form>

      {addingTo && (
        <AddCatalogItemModal
          catalogType={addingTo}
          typeLabel={CATALOG_LABELS[addingTo]}
          onCreated={(value, label) => handleCatalogItemCreated(addingTo, value, label)}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  )
}
