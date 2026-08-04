'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { createProgram } from '@/lib/api/programs'
import { getWorkouts } from '@/lib/api/workouts'
import type { SaveProgramPayload } from '@/lib/types/program'
import {
  ChevronLeft, Plus, X, Search, Loader2,
  Calendar, Dumbbell, ChevronUp, ChevronDown, Save,
} from 'lucide-react'
import Link from 'next/link'
import { CoverImageUploader } from '@/components/cover-image-uploader'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// grid[week][day] = GridSlot | null  (week: 0-based, day: 0-based)
type Grid = (GridSlot | null)[][]

function buildEmptyGrid(weeks: number, days: number): Grid {
  return Array.from({ length: weeks }, () => Array(days).fill(null))
}

// ── WorkoutPicker Modal ───────────────────────────────────────────────────────

function WorkoutPickerModal({
  workouts,
  onSelect,
  onClose,
}: {
  workouts: WorkoutOption[]
  onSelect: (w: WorkoutOption) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = workouts.filter(w =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark/10">
          <h3 className="font-melodrama text-lg text-dark">Seleccionar clase</h3>
          <button onClick={onClose} className="text-dark/40 hover:text-dark transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar clase..."
              className="input-base pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-2 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-dark/40 font-urwdin text-sm py-8">No se encontraron clases</p>
          ) : (
            filtered.map(w => (
              <button
                key={w.id}
                onClick={() => onSelect(w)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-left group"
              >
                {/* Thumbnail */}
                <div className="h-12 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {w.thumbnailUrl
                    ? <img src={w.thumbnailUrl} alt={w.title} className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-primary/40" />
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-urwdin text-sm font-medium text-dark truncate">{w.title}</p>
                  <p className="text-xs text-dark/50 font-urwdin">{w.category} · {w.durationMinutes} min</p>
                </div>
                <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-dark/10">
          <button onClick={onClose} className="w-full text-sm font-urwdin text-dark/50 hover:text-dark py-2">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grid Cell ─────────────────────────────────────────────────────────────────

function GridCell({
  slot,
  weekLabel,
  dayLabel,
  onClick,
}: {
  slot: GridSlot | null
  weekLabel: string
  dayLabel: string
  onClick: () => void
}) {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        className="h-24 w-full rounded-xl border-2 border-dashed border-dark/15 flex flex-col items-center justify-center gap-1 text-dark/30 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group"
      >
        <Plus className="h-5 w-5" />
        <span className="text-xs font-urwdin">Agregar</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="h-24 w-full rounded-xl border border-primary/20 bg-primary/5 flex flex-col p-2.5 text-left hover:bg-primary/10 transition-colors group relative overflow-hidden"
    >
      {slot.workoutThumbnail && (
        <div className="absolute inset-0 opacity-10">
          <img src={slot.workoutThumbnail} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10 flex flex-col h-full">
        <p className="font-urwdin text-xs font-medium text-dark line-clamp-2 flex-1">{slot.workoutTitle}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] text-dark/50 font-urwdin">{slot.workoutDuration} min</span>
          <X className="h-3.5 w-3.5 text-dark/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NuevoProgramaPage() {
  const router  = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

  // Form state
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl,    setCoverUrl]    = useState('')
  const [totalWeeks,  setTotalWeeks]  = useState(4)
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [accessType,  setAccessType]  = useState<'free' | 'subscription'>('subscription')

  // Grid
  const [grid, setGrid] = useState<Grid>(() => buildEmptyGrid(4, 3))

  // Picker modal
  const [picker, setPicker]  = useState<{ week: number; day: number } | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutOption[]>([])
  const [loadingWo, setLoadingWo] = useState(true)

  // Saving
  const [saving,         setSaving]        = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [error,          setError]          = useState('')

  // Load workouts once
  useEffect(() => {
    getWorkouts({ pageSize: 200 })
      .then(res => setWorkouts(
        (res.items ?? []).map(w => ({
          id:              w.id,
          title:           w.title,
          thumbnailUrl:    w.thumbnailUrl,
          durationMinutes: w.durationMinutes ?? 0,
          category:        w.category,
          level:           w.level,
        }))
      ))
      .catch(() => {})
      .finally(() => setLoadingWo(false))
  }, [])

  // Resize grid when weeks/days change
  useEffect(() => {
    setGrid(prev => {
      const next = buildEmptyGrid(totalWeeks, daysPerWeek)
      // Preserve existing slots within bounds
      prev.forEach((week, wi) => {
        if (wi < totalWeeks) {
          week.forEach((slot, di) => {
            if (di < daysPerWeek && slot) next[wi][di] = slot
          })
        }
      })
      return next
    })
  }, [totalWeeks, daysPerWeek])

  const openPicker = (week: number, day: number) => setPicker({ week, day })

  const handleSelectWorkout = useCallback((w: WorkoutOption) => {
    if (!picker) return
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[picker.week][picker.day] = {
        workoutId:       w.id,
        workoutTitle:    w.title,
        workoutThumbnail: w.thumbnailUrl,
        workoutDuration: w.durationMinutes,
        workoutCategory: w.category,
      }
      return next
    })
    setPicker(null)
  }, [picker])

  const handleClearCell = (week: number, day: number) => {
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[week][day] = null
      return next
    })
  }

  const totalAssigned = grid.flat().filter(Boolean).length

  async function handleSave() {
    if (!name.trim()) { setError('El nombre del programa es obligatorio.'); return }
    if (coverUploading)  { setError('Espera a que termine de subir la imagen.'); return }
    setError('')
    setSaving(true)

    const slots = grid.flatMap((week, wi) =>
      week.flatMap((slot, di) =>
        slot ? [{ week: wi + 1, dayNumber: di + 1, workoutId: slot.workoutId, order: 1 }] : []
      )
    )

    const payload: SaveProgramPayload = {
      name:        name.trim(),
      description: description.trim() || undefined,
      coverImageUrl: coverUrl.trim() || undefined,
      isActive:    true,
      accessType,
      totalWeeks,
      daysPerWeek,
      slots,
    }

    try {
      const created = await createProgram(payload)
      router.push(`/dashboard/programas/${created.id}`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <p className="font-melodrama text-dark/40">Acceso restringido a administradores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/programas" className="p-2 rounded-xl hover:bg-secondary/40 transition-colors text-dark/60">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-melodrama text-2xl text-dark">Nuevo programa</h1>
          <p className="text-sm text-dark/50 font-urwdin">Define las semanas y asigna clases a cada día</p>
        </div>
      </div>

      {/* ── Sección 1: Metadata ──────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-melodrama text-base text-dark">Información general</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">
              Nombre del programa <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: 6 semanas Movimiento Consciente"
              className="input-base"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe el objetivo del programa..."
              className="input-base resize-none"
            />
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
        </div>
      </div>

      {/* ── Sección 2: Estructura ──────────────────────────────── */}
      <div className="card">
        <h2 className="font-melodrama text-base text-dark mb-4">Estructura del programa</h2>
        <div className="flex flex-wrap gap-8">
          {/* Weeks */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark font-urwdin">Semanas</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTotalWeeks(w => Math.max(1, w - 1))}
                className="p-1.5 rounded-lg border border-dark/15 hover:bg-secondary/40 transition-colors"
              >
                <ChevronDown className="h-4 w-4 text-dark/60" />
              </button>
              <span className="w-10 text-center font-melodrama text-xl text-dark">{totalWeeks}</span>
              <button
                onClick={() => setTotalWeeks(w => Math.min(16, w + 1))}
                className="p-1.5 rounded-lg border border-dark/15 hover:bg-secondary/40 transition-colors"
              >
                <ChevronUp className="h-4 w-4 text-dark/60" />
              </button>
            </div>
            <p className="text-xs text-dark/40 font-urwdin">Máx. 16 semanas</p>
          </div>

          {/* Days */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark font-urwdin">Días por semana</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDaysPerWeek(d => Math.max(1, d - 1))}
                className="p-1.5 rounded-lg border border-dark/15 hover:bg-secondary/40 transition-colors"
              >
                <ChevronDown className="h-4 w-4 text-dark/60" />
              </button>
              <span className="w-10 text-center font-melodrama text-xl text-dark">{daysPerWeek}</span>
              <button
                onClick={() => setDaysPerWeek(d => Math.min(7, d + 1))}
                className="p-1.5 rounded-lg border border-dark/15 hover:bg-secondary/40 transition-colors"
              >
                <ChevronUp className="h-4 w-4 text-dark/60" />
              </button>
            </div>
            <p className="text-xs text-dark/40 font-urwdin">Máx. 7 días</p>
          </div>

          {/* Summary */}
          <div className="ml-auto flex items-center gap-4 self-end pb-1">
            <div className="text-right">
              <p className="text-xs text-dark/50 font-urwdin">Clases asignadas</p>
              <p className="font-melodrama text-2xl text-primary">{totalAssigned}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-dark/50 font-urwdin">Total slots</p>
              <p className="font-melodrama text-2xl text-dark/40">{totalWeeks * daysPerWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección 3: Grid W×D ──────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark/10 flex items-center justify-between">
          <h2 className="font-melodrama text-base text-dark">
            Grilla del programa
          </h2>
          <p className="text-xs text-dark/40 font-urwdin">
            Haz clic en cualquier celda para asignar una clase
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max p-5">
            {/* Column headers */}
            <div
              className="grid gap-3 mb-3"
              style={{ gridTemplateColumns: `100px repeat(${daysPerWeek}, minmax(150px, 1fr))` }}
            >
              <div /> {/* Empty corner */}
              {Array.from({ length: daysPerWeek }, (_, d) => (
                <div key={d} className="text-center">
                  <span className="text-xs font-melodrama text-dark/60 uppercase tracking-wider">
                    Día {d + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {grid.map((week, wi) => (
              <div
                key={wi}
                className="grid gap-3 mb-3"
                style={{ gridTemplateColumns: `100px repeat(${daysPerWeek}, minmax(150px, 1fr))` }}
              >
                {/* Row label */}
                <div className="flex items-center justify-end pr-3">
                  <span className="text-xs font-melodrama text-dark uppercase tracking-wider whitespace-nowrap">
                    Semana {wi + 1}
                  </span>
                </div>
                {/* Cells */}
                {week.map((slot, di) => (
                  <div key={di} className="relative">
                    {slot ? (
                      <div className="relative">
                        <GridCell
                          slot={slot}
                          weekLabel={`S${wi + 1}`}
                          dayLabel={`D${di + 1}`}
                          onClick={() => openPicker(wi, di)}
                        />
                        <button
                          onClick={() => handleClearCell(wi, di)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                          title="Quitar clase"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <GridCell
                        slot={null}
                        weekLabel={`S${wi + 1}`}
                        dayLabel={`D${di + 1}`}
                        onClick={() => openPicker(wi, di)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error & Save ──────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/dashboard/programas" className="btn-secondary">
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
            : <><Save className="h-4 w-4" /> Guardar programa</>}
        </button>
      </div>

      {/* Workout Picker Modal */}
      {picker && (
        <WorkoutPickerModal
          workouts={workouts}
          onSelect={handleSelectWorkout}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
