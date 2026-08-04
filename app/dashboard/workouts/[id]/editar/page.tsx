'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAuthHeaders, API_URL } from '@/lib/api'
import { getWorkoutById, updateWorkout } from '@/lib/api/workouts'
import { getCatalogByType, CatalogItem } from '@/lib/api/catalogs'
import { AddCatalogItemModal } from '@/components/AddCatalogItemModal'
import { saveWorkoutBlocks, getExercises, getWorkoutBlocks } from '@/lib/api/exercises'
import { Exercise } from '@/lib/types/exercise'
import { ArrowLeft, Loader2, CheckCircle, ImageIcon, X, Plus, Upload } from 'lucide-react'

export default function EditarClasePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [form, setForm] = useState({
    title: '', description: '',
    category: 'CardioConsciente', level: 'Principiante',
    objective: 'Tonificacion',
    thumbnailUrl: '', videoProviderId: '', isFree: false, isPublished: false,
    
  })
  const [loading,      setLoading]      = useState(true)
  const [submitting,   setSubmitting]   = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState('')
  const [catalogs,     setCatalogs]     = useState<Record<string, CatalogItem[]>>({
    Category: [], Level: [], Objective: []
  })
  const [addingTo,     setAddingTo]     = useState<string | null>(null)
  // thumbnail
  const [thumbFile,      setThumbFile]      = useState<File | null>(null)
  const [thumbPreview,   setThumbPreview]   = useState<string>('')
  const [thumbProgress,  setThumbProgress]  = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const thumbInputRef = useRef<HTMLInputElement>(null)

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
    const types = ['Category', 'Level', 'Objective']
    const load = async () => {
      try {
        const [workout, ...catalogResults] = await Promise.all([
          getWorkoutById(Number(id)),
          ...types.map(t => getCatalogByType(t).then(items => ({ t, items })))
        ])
        const w = workout as any
        setForm({
          title:             w.title,
          description:       w.description ?? '',
          category:          w.category,
          level:             w.level,
          objective:         w.objective,
          thumbnailUrl:      w.thumbnailUrl ?? '',
          videoProviderId:   w.videoProviderId ?? '',
          isFree:            w.isFree,
          isPublished:       w.isPublished,
        })
        if (w.thumbnailUrl) setThumbPreview(w.thumbnailUrl)
        const map: Record<string, CatalogItem[]> = {}
        ;(catalogResults as { t: string; items: CatalogItem[] }[]).forEach(({ t, items }) => { map[t] = items })
        setCatalogs(map)
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

  const toggleBool = (field: 'isFree' | 'isPublished') =>
    setForm(f => ({ ...f, [field]: !f[field] }))

  const handleCatalogItemCreated = (type: string, value: string, label: string) => {
    setCatalogs(prev => ({
      ...prev,
      [type]: [...prev[type], { id: 0, value, label, sortOrder: 99, isActive: true }]
    }))
    const fieldMap: Record<string, string> = {
      Category: 'category', Level: 'level', Objective: 'objective'
    }
    setForm(f => ({ ...f, [fieldMap[type]]: value }))
    setAddingTo(null)
  }

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file); setThumbPreview(URL.createObjectURL(file)); setThumbProgress('idle')
  }

  const handleUploadThumb = async () => {
    if (!thumbFile) return
    setThumbProgress('uploading'); setError('')
    try {
      const formData = new FormData(); formData.append('file', thumbFile)
      const headers = getAuthHeaders() as Record<string, string>; delete headers['Content-Type']
      const res = await fetch(`${API_URL}/api/workouts/upload-thumbnail`, { method: 'POST', headers, body: formData })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Error')
      const data = await res.json()
      setForm(f => ({ ...f, thumbnailUrl: data.url })); setThumbProgress('done')
    } catch (err: any) { setError(err.message); setThumbProgress('error') }
  }

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
        <h1 className="font-melodrama text-3xl text-dark">Editar Clase</h1>
        <p className="text-dark/50 font-urwdin text-sm mt-1">Modifica los detalles de la clase</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Información</h2>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Título *</label>
            <input type="text" value={form.title} onChange={set('title')} required className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input-base resize-none" />
          </div>
          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Thumbnail</label>
            <div className="border-2 border-dashed border-dark/20 rounded-xl overflow-hidden">
              {thumbPreview ? (
                <div className="relative">
                  <img src={thumbPreview} alt="Preview" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-dark/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                    {thumbProgress === 'idle' && thumbFile && <button type="button" onClick={handleUploadThumb} className="btn-primary flex items-center gap-2 text-sm"><Upload className="h-3 w-3" /> Subir a S3</button>}
                    {thumbProgress === 'uploading' && <div className="flex items-center gap-2 text-white font-urwdin text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</div>}
                    {thumbProgress === 'done' && <div className="flex items-center gap-2 text-green-300 font-urwdin text-sm"><CheckCircle className="h-4 w-4" /> Guardado en S3</div>}
                    <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(''); setThumbProgress('idle'); setForm(f => ({ ...f, thumbnailUrl: '' })) }} className="bg-white/20 rounded-full p-1.5 text-white hover:bg-white/40"><X className="h-3 w-3" /></button>
                  </div>
                  {thumbProgress === 'done' && <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1"><CheckCircle className="h-3 w-3 text-white" /></div>}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 cursor-pointer">
                  <ImageIcon className="h-8 w-8 text-dark/30" />
                  <span className="text-sm text-dark/50 font-urwdin">Selecciona JPG, PNG o WebP</span>
                  <span className="btn-secondary text-xs">Elegir imagen</span>
                  <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbSelect} className="hidden" />
                </label>
              )}
            </div>
            {thumbProgress === 'idle' && thumbFile && (
              <button type="button" onClick={handleUploadThumb} className="mt-2 btn-primary w-full flex items-center gap-2 justify-center"><Upload className="h-4 w-4" /> Subir thumbnail a S3</button>
            )}
            {form.thumbnailUrl && <p className="text-xs text-green-600 font-urwdin mt-1 break-all">✓ {form.thumbnailUrl}</p>}
          </div>
        </div>

        {/* Clasificación */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Clasificación</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['Category', 'Level'] as const).map(type => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-dark font-urwdin">{CATALOG_LABELS[type]}</label>
                  <button type="button" onClick={() => setAddingTo(type)} className="text-xs text-primary hover:underline font-urwdin flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar</button>
                </div>
                <select value={form[FIELD_MAP[type]] as string} onChange={set(FIELD_MAP[type])} className="input-base">
                  {catalogs[type].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            ))}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-dark font-urwdin">Objetivo</label>
                <button type="button" onClick={() => setAddingTo('Objective')} className="text-xs text-primary hover:underline font-urwdin flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar</button>
              </div>
              <select value={form.objective} onChange={set('objective')} className="input-base">
                {catalogs.Objective.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Acceso */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Acceso y visibilidad</h2>
          {[{field: 'isFree' as const, label: 'Clase gratuita', desc: 'Cualquier usuario puede verla sin suscripción'},
            {field: 'isPublished' as const, label: 'Publicar clase', desc: 'Si no está publicada, solo los admins pueden verla'}]
            .map(({ field, label, desc }) => (
              <div key={field} className="flex items-center justify-between p-4 rounded-xl bg-secondary-50">
                <div>
                  <p className="font-urwdin font-medium text-dark text-sm">{label}</p>
                  <p className="text-xs text-dark/50 font-urwdin">{desc}</p>
                </div>
                <button type="button" onClick={() => toggleBool(field)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form[field] ? 'bg-primary' : 'bg-dark/20'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
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
                      <input type="number" placeholder={String(ex.effectiveReps ?? ex.overrideReps ?? '12')} value={ex.overrideReps ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideReps', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" title="Reps" />
                    )}
                    {(ex.trackingType.includes('time')) && (
                      <input type="number" placeholder={String(ex.effectiveDurationSeconds ?? ex.overrideDurationSeconds ?? '45')} value={ex.overrideDurationSeconds ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideDurationSeconds', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" title="Tiempo (s)" />
                    )}
                    {(ex.trackingType.includes('weight')) && (
                      <input type="number" placeholder={String(ex.effectiveWeightLbs ?? ex.overrideWeightLbs ?? '0')} value={ex.overrideWeightLbs ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideWeightLbs', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" title="Peso (lbs)" />
                    )}
                    <input type="number" placeholder={String(ex.defaultRestTimerSeconds ?? '30')} value={ex.defaultRestTimerSeconds ?? ''}
                        onChange={e => updateBlockExercise(bi, ei, 'defaultRestTimerSeconds', e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base w-24 text-center text-sm" title="Descanso (s)" />
                    <input placeholder="Per side, Alternating..." value={ex.notes ?? ''} onChange={e => updateBlockExercise(bi, ei, 'notes', e.target.value)} className="input-base w-32 text-sm" title="Notas" />
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
