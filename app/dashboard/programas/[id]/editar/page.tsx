'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { getProgramById, updateProgram } from '@/lib/api/programs'
import { getWorkouts } from '@/lib/api/workouts'
import type { ProgramDetail, SaveProgramPayload } from '@/lib/types/program'
import {
  ChevronLeft, Plus, X, Search, Loader2,
  ChevronUp, ChevronDown, Save, Dumbbell,
} from 'lucide-react'
import { CoverImageUploader } from '@/components/cover-image-uploader'

// ── Re-use types from nuevo/page.tsx ──────────────────────────────────────────

interface WorkoutOption {
  id: number
  title: string
  thumbnailUrl?: string
  durationMinutes: number
  category: string
  level: string
}

interface GridSlot {
  workoutId: number
  workoutTitle: string
  workoutThumbnail?: string
  workoutDuration: number
  workoutCategory: string
}

type Grid = (GridSlot | null)[][]

function buildGrid(weeks: number, days: number, slots: ProgramDetail['slots']): Grid {
  const grid: Grid = Array.from({ length: weeks }, () => Array(days).fill(null))
  for (const s of slots) {
    const wi = s.week - 1
    const di = s.dayNumber - 1
    if (wi < weeks && di < days) {
      grid[wi][di] = {
        workoutId:       s.workoutId,
        workoutTitle:    s.workoutTitle,
        workoutThumbnail: s.workoutThumbnail,
        workoutDuration: s.workoutDuration,
        workoutCategory: s.workoutCategory,
      }
    }
  }
  return grid
}

// ── WorkoutPickerModal (same as builder) ──────────────────────────────────────

function WorkoutPickerModal({ workouts, onSelect, onClose }: {
  workouts: WorkoutOption[]
  onSelect: (w: WorkoutOption) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = workouts.filter(w =>
    w.title.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-dark/10">
          <h3 className="font-melodrama text-lg text-dark">Seleccionar clase</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-dark/40" /></button>
        </div>
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-base pl-9" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-2 space-y-2">
          {filtered.map(w => (
            <button key={w.id} onClick={() => onSelect(w)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-left group">
              <div className="h-12 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                {w.thumbnailUrl ? <img src={w.thumbnailUrl} alt={w.title} className="h-full w-full object-cover" /> : <Dumbbell className="h-5 w-5 text-primary/40 m-auto" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-urwdin text-sm font-medium text-dark truncate">{w.title}</p>
                <p className="text-xs text-dark/50 font-urwdin">{w.category} · {w.durationMinutes} min</p>
              </div>
              <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-dark/10">
          <button onClick={onClose} className="w-full text-sm font-urwdin text-dark/50 py-2">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EditarProgramaPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { user } = useAuth()
  const isAdmin  = user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl,    setCoverUrl]    = useState('')
  const [isActive,    setIsActive]    = useState(true)
  const [totalWeeks,  setTotalWeeks]  = useState(4)
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [accessType,  setAccessType]  = useState<'free' | 'subscription'>('subscription')
  const [grid,        setGrid]        = useState<Grid>([])
  const [workouts,    setWorkouts]    = useState<WorkoutOption[]>([])
  const [picker,      setPicker]      = useState<{ week: number; day: number } | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [coverUploading,setCoverUploading] = useState(false)
  const [error,         setError]         = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      getProgramById(Number(id)),
      getWorkouts({ pageSize: 200 }),
    ]).then(([prog, wo]) => {
      setName(prog.name)
      setDescription(prog.description ?? '')
      setCoverUrl(prog.coverImageUrl ?? '')
      setIsActive(prog.isActive)
      setTotalWeeks(prog.totalWeeks)
      setDaysPerWeek(prog.daysPerWeek)
      setAccessType((prog.accessType ?? 'subscription') as 'free' | 'subscription')
      setGrid(buildGrid(prog.totalWeeks, prog.daysPerWeek, prog.slots))
      setWorkouts(
        (wo.items ?? []).map(w => ({
          id:              w.id,
          title:           w.title,
          thumbnailUrl:    w.thumbnailUrl,
          durationMinutes: w.durationMinutes ?? 0,
          category:        w.category,
          level:           w.level,
        }))
      )
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // Resize grid preserving existing slots
  useEffect(() => {
    if (!grid.length) return
    setGrid(prev => {
      const next: Grid = Array.from({ length: totalWeeks }, (_, wi) =>
        Array.from({ length: daysPerWeek }, (_, di) =>
          (prev[wi]?.[di]) ?? null
        )
      )
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWeeks, daysPerWeek])

  const handleSelectWorkout = useCallback((w: WorkoutOption) => {
    if (!picker) return
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[picker.week][picker.day] = {
        workoutId: w.id, workoutTitle: w.title,
        workoutThumbnail: w.thumbnailUrl,
        workoutDuration: w.durationMinutes, workoutCategory: w.category,
      }
      return next
    })
    setPicker(null)
  }, [picker])

  async function handleSave() {
    if (!name.trim())   { setError('El nombre es obligatorio.'); return }
    if (coverUploading) { setError('Espera a que termine de subir la imagen.'); return }
    setError(''); setSaving(true)
    const slots = grid.flatMap((week, wi) =>
      week.flatMap((slot, di) =>
        slot ? [{ week: wi + 1, dayNumber: di + 1, workoutId: slot.workoutId, order: 1 }] : []
      )
    )
    const payload: SaveProgramPayload = {
      name: name.trim(), description: description.trim() || undefined,
      coverImageUrl: coverUrl.trim() || undefined,
      isActive, accessType, totalWeeks, daysPerWeek, slots,
    }
    try {
      await updateProgram(Number(id), payload)
      router.push(`/dashboard/programas/${id}`)
    } catch (e: any) {
      setError(e.message); setSaving(false)
    }
  }

  if (!isAdmin) return <div className="card text-center py-16"><p className="text-dark/40 font-urwdin">Acceso restringido.</p></div>
  if (loading)  return <div className="flex justify-center py-24"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/programas/${id}`} className="p-2 rounded-xl hover:bg-secondary/40 transition-colors text-dark/60">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-melodrama text-2xl text-dark">Editar programa</h1>
          <p className="text-sm text-dark/50 font-urwdin">{name}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="card space-y-4">
        <h2 className="font-melodrama text-base text-dark">Información general</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-base" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-base resize-none" />
          </div>
          <div className="md:col-span-2">
            <CoverImageUploader
              value={coverUrl || null}
              onChange={setCoverUrl}
              onError={msg => setError(msg)}
              onUploading={setCoverUploading}
            />
          </div>

          {/* AccessType selector */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark mb-2 font-urwdin">Acceso</label>
            <div className="flex gap-3">
              {(['subscription', 'free'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccessType(type)}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all
                    ${accessType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-dark/15 bg-white hover:border-primary/40'}`}
                >
                  <span className="text-lg">{type === 'free' ? '🎁' : '⭐'}</span>
                  <span className="font-urwdin font-semibold text-sm text-dark">
                    {type === 'free' ? 'Gratis' : 'Con suscripción'}
                  </span>
                  <span className="text-xs text-dark/40 font-urwdin">
                    {type === 'free' ? 'Accesible para todos' : 'Requiere plan activo'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end pb-1">
            <label className="font-urwdin text-sm text-dark">Programa activo</label>
            <button
              onClick={() => setIsActive(v => !v)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-dark/20'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Structure */}
      <div className="card">
        <h2 className="font-melodrama text-base text-dark mb-4">Estructura</h2>
        <div className="flex flex-wrap gap-8">
          {[
            { label: 'Semanas', val: totalWeeks, set: setTotalWeeks, max: 16 },
            { label: 'Días/semana', val: daysPerWeek, set: setDaysPerWeek, max: 7 },
          ].map(({ label, val, set, max }) => (
            <div key={label} className="space-y-2">
              <label className="block text-sm font-medium text-dark font-urwdin">{label}</label>
              <div className="flex items-center gap-2">
                <button onClick={() => set(v => Math.max(1, v - 1))} className="p-1.5 rounded-lg border border-dark/15 hover:bg-secondary/40 transition-colors">
                  <ChevronDown className="h-4 w-4 text-dark/60" />
                </button>
                <span className="w-10 text-center font-melodrama text-xl text-dark">{val}</span>
                <button onClick={() => set(v => Math.min(max, v + 1))} className="p-1.5 rounded-lg border border-dark/15 hover:bg-secondary/40 transition-colors">
                  <ChevronUp className="h-4 w-4 text-dark/60" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark/10">
          <h2 className="font-melodrama text-base text-dark">Grilla de clases</h2>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-max p-5">
            <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: `100px repeat(${daysPerWeek}, minmax(150px, 1fr))` }}>
              <div />
              {Array.from({ length: daysPerWeek }, (_, d) => (
                <div key={d} className="text-center">
                  <span className="text-xs font-melodrama text-dark/60 uppercase tracking-wider">Día {d + 1}</span>
                </div>
              ))}
            </div>
            {grid.map((week, wi) => (
              <div key={wi} className="grid gap-3 mb-3" style={{ gridTemplateColumns: `100px repeat(${daysPerWeek}, minmax(150px, 1fr))` }}>
                <div className="flex items-center justify-end pr-3">
                  <span className="text-xs font-melodrama text-dark uppercase tracking-wider whitespace-nowrap">Semana {wi + 1}</span>
                </div>
                {week.map((slot, di) => (
                  <div key={di} className="relative">
                    {slot ? (
                      <>
                        <button onClick={() => setPicker({ week: wi, day: di })} className="h-24 w-full rounded-xl border border-primary/20 bg-primary/5 flex flex-col p-2.5 text-left hover:bg-primary/10 transition-colors">
                          <p className="font-urwdin text-xs font-medium text-dark line-clamp-2 flex-1">{slot.workoutTitle}</p>
                          <span className="text-[10px] text-dark/50 font-urwdin">{slot.workoutDuration} min</span>
                        </button>
                        <button onClick={() => setGrid(prev => { const n = prev.map(r => [...r]); n[wi][di] = null; return n })}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 z-10">
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setPicker({ week: wi, day: di })} className="h-24 w-full rounded-xl border-2 border-dashed border-dark/15 flex flex-col items-center justify-center gap-1 text-dark/30 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                        <Plus className="h-5 w-5" />
                        <span className="text-xs font-urwdin">Agregar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">{error}</div>}

      <div className="flex items-center justify-between">
        <Link href={`/dashboard/programas/${id}`} className="btn-secondary">Cancelar</Link>
        <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
        </button>
      </div>

      {picker && (
        <WorkoutPickerModal workouts={workouts} onSelect={handleSelectWorkout} onClose={() => setPicker(null)} />
      )}
    </div>
  )
}
