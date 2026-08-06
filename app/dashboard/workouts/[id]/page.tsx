'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getWorkoutById, deleteWorkout } from '@/lib/api/workouts'
import { getWorkoutBlocks } from '@/lib/api/exercises'
import { WorkoutBlock } from '@/lib/types/exercise'
import type { Workout } from '@/lib/types/workout'
import { CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/types/workout'
import { cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Clock, Dumbbell, Pencil, Play, Repeat, Timer, Weight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { WorkoutTracker, LoggedSet } from '@/components/WorkoutTracker'
import { getMe } from '@/lib/api/sessions'
import { getSubscriptionStatus } from '@/lib/api/stripe'
import { PaywallOverlay, PaywallBadge } from '@/components/paywall-overlay'

const LEVEL_COLORS: Record<string, string> = {
  Principiante: 'bg-green-100 text-green-700',
  Intermedio:   'bg-yellow-100 text-yellow-700',
  Avanzado:     'bg-red-100 text-red-700',
}

export default function WorkoutDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { user }  = useAuth()
  const isAdmin   = user?.roles?.includes('Admin') ?? false

  const [workout,    setWorkout]    = useState<Workout | null>(null)
  const [blocks,     setBlocks]     = useState<WorkoutBlock[]>([])
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')
  const [sessionKey, setSessionKey] = useState(0)
  const [deleting,   setDeleting]   = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase?')) return
    setDeleting(true)
    try {
      await deleteWorkout(Number(id))
      router.push('/dashboard/workouts')
    } catch (err: any) {
      alert(err.message)
      setDeleting(false)
    }
  }

  // Live session log emitted by WorkoutTracker
  const [sessionLog,         setSessionLog]         = useState<LoggedSet[]>([])
  const [isSessionReviewing, setIsSessionReviewing] = useState(false)

  useEffect(() => {
    getSubscriptionStatus()
      .then(s => setHasSubscription(s.isActive))
      .catch(() => setHasSubscription(false))
  }, [])

  useEffect(() => {
    if (!id) return
    Promise.all([
      getWorkoutById(Number(id)),
      getWorkoutBlocks(Number(id)).catch(() => [])
    ])
      .then(([w, b]) => { setWorkout(w); setBlocks(b) })
      .catch(() => setError('Clase no encontrada'))
      .finally(() => setLoading(false))

    getMe()
      .then(me => setWeightUnit(me.preferredWeightUnit || 'lbs'))
      .catch(() => {})
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  if (error || !workout) return (
    <div className="text-center py-16">
      <p className="font-melodrama text-2xl text-dark/40">{error ?? 'Error'}</p>
      <button onClick={() => router.back()} className="btn-secondary mt-4">Volver</button>
    </div>
  )

  // ── Session status helpers ────────────────────────────────────────────────
  const setsFor = (blockName: string, exerciseId: number) =>
    sessionLog.filter(s => s.blockName === blockName && s.exerciseId === exerciseId)

  const blockComplete = (block: WorkoutBlock) =>
    sessionLog.length > 0 &&
    block.exercises.every(ex => setsFor(block.name, ex.exerciseId).length >= block.rounds)

  const exStatus = (block: WorkoutBlock, exerciseId: number): 'done' | 'partial' | 'pending' | 'none' => {
    const count = setsFor(block.name, exerciseId).length
    if (count >= block.rounds) return 'done'
    if (count > 0) return 'partial'
    if (isSessionReviewing) return 'pending'
    return 'none'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </button>

      {/* Header con thumbnail */}
      <div
        className="rounded-2xl overflow-hidden h-48 relative flex items-end"
        style={{
          background: workout.thumbnailUrl
            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${workout.thumbnailUrl}) center/cover`
            : 'linear-gradient(135deg, #4a6063 0%, #2c3c3e 100%)',
        }}
      >
        <div className="p-6 flex-1">
          <p className="text-white/70 text-xs font-urwdin uppercase tracking-widest mb-1">
            {CATEGORY_LABELS[workout.category] ?? workout.category}
          </p>
          <h1 className="font-melodrama text-2xl text-white">{workout.title}</h1>
          <span className={cn('badge text-xs mt-2 inline-block', LEVEL_COLORS[workout.level])}>
            {LEVEL_LABELS[workout.level] ?? workout.level}
          </span>
        </div>
        {isAdmin ? (
          <Link
            href={`/dashboard/workouts/${id}/editar`}
            className="absolute top-4 right-4 flex items-center gap-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar clase
          </Link>
        ) : workout.isCustom ? (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Link
              href={`/dashboard/workouts/${id}/editar-custom`}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar Rutina
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 text-sm text-red-200 hover:text-red-100 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-sm rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Descripción */}
      {workout.description && (
        <div className="card">
          <p className="text-dark/70 font-urwdin text-sm leading-relaxed">{workout.description}</p>
        </div>
      )}

      {/* Link al historial del programa */}
      <Link
        href={`/dashboard/historial/programa/${id}`}
        className="flex items-center justify-between px-4 py-3 rounded-2xl border border-secondary hover:bg-secondary/30 transition-colors font-urwdin"
      >
        <span className="text-sm text-dark/70">Mi historial de esta clase</span>
        <span className="text-xs text-primary">Ver →</span>
      </Link>

      {/* Tracker or Paywall */}
      {workout && !!user && (() => {
        // Admins always get access
        const needsSub = !isAdmin && !workout.isFree && hasSubscription === false
        if (needsSub) {
          return (
            <PaywallOverlay
              contentName={workout.title}
              contentType="workout"
            />
          )
        }
        return (
          <WorkoutTracker
            key={sessionKey}
            workoutId={workout.id}
            workoutBlocks={blocks}
            weightUnit={weightUnit}
            onSessionComplete={() => {
              setSessionKey(k => k + 1)
              setSessionLog([])
              setIsSessionReviewing(false)
            }}
            onLogUpdate={(log, reviewing) => {
              setSessionLog(log)
              setIsSessionReviewing(reviewing)
            }}
          />
        )
      })()}

      {/* Bloques de ejercicios */}
      <div className="card space-y-4">
        <h2 className="font-melodrama text-xl font-semibold text-dark">Ejercicios de la clase</h2>
        {blocks.length === 0 ? (
          <p className="text-dark/50 text-sm">Esta clase no tiene ejercicios configurados.</p>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, i) => {
              const isDone = blockComplete(block)
              // Parsear "A BLOCK - Piernas" → { letter: "A", group: "Piernas" }
              const blockMatch = block.name.match(/^([A-Z\d]+)\s+BLOCK\s*[-–]\s*(.+)$/i)
              const blockLetter = blockMatch?.[1] ?? block.name.charAt(0)
              const blockGroup  = blockMatch?.[2] ?? block.name
              return (
                <div key={i} className={cn(
                  'border rounded-xl overflow-hidden transition-colors duration-500',
                  isDone ? 'border-green-300' : 'border-secondary'
                )}>
                  {/* Block header */}
                  <div className={cn(
                    'px-4 py-3 border-b flex justify-between items-center transition-colors duration-500',
                    isDone
                      ? 'bg-green-50 border-green-200'
                      : 'bg-secondary/20 border-secondary'
                  )}>
                    <div className="flex items-center gap-3">
                      {/* Letter badge */}
                      <span
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: isDone ? '#16a34a' : 'var(--color-primary)' }}
                      >
                        {blockLetter}
                      </span>
                      {/* Group name */}
                      <span className={cn(
                        'font-urwdin font-semibold text-sm',
                        isDone ? 'text-green-800' : 'text-dark'
                      )}>
                        {blockGroup}
                      </span>
                    </div>
                    <span className={cn(
                      'text-xs font-urwdin px-2.5 py-1 rounded-full',
                      isDone
                        ? 'bg-green-200 text-green-800'
                        : 'bg-secondary/60 text-dark/60'
                    )}>
                      {block.rounds} rounds
                    </span>
                  </div>

                  {/* Exercises */}
                  <div className="divide-y divide-secondary/20">
                    {block.exercises.map((ex, j) => {
                      const status = exStatus(block, ex.exerciseId)
                      const sets   = setsFor(block.name, ex.exerciseId)
                      return (
                        <div key={j} className={cn(
                          'transition-colors duration-300',
                          status === 'done'    ? 'bg-green-50/60' :
                          status === 'pending' ? 'bg-yellow-50/60' :
                          status === 'partial' ? 'bg-blue-50/30'  : ''
                        )}>
                          {/* Exercise row */}
                          <div className="flex items-center gap-3 p-3 group">
                            {ex.exerciseThumbnailUrl ? (
                              <img src={ex.exerciseThumbnailUrl} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-14 h-14 bg-dark/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Dumbbell className="h-5 w-5 text-dark/30" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/dashboard/ejercicios/${ex.exerciseId}`}
                                  className="font-medium text-dark text-sm hover:text-primary transition-colors line-clamp-1"
                                >
                                  {ex.exerciseTitle}
                                </Link>
                                {status === 'done' && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-urwdin">
                                    <CheckCircle2 className="h-3 w-3" /> Completado
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-urwdin">
                                    <Clock className="h-3 w-3" /> Pendiente
                                  </span>
                                )}
                                {status === 'partial' && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-urwdin">
                                    {sets.length}/{block.rounds} rounds
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 text-xs text-dark/60 mt-1 flex-wrap">
                                {(ex.trackingType === 'reps' || ex.trackingType === 'reps_weight') && (
                                  <span className="flex items-center gap-0.5">
                                    <Repeat className="h-3 w-3" /> {ex.effectiveReps} reps
                                  </span>
                                )}
                                {(ex.trackingType === 'time' || ex.trackingType === 'time_weight') && (
                                  <span className="flex items-center gap-0.5">
                                    <Timer className="h-3 w-3" /> {ex.effectiveDurationSeconds}s
                                  </span>
                                )}
                                {(ex.trackingType === 'reps_weight' || ex.trackingType === 'time_weight') && ex.effectiveWeightLbs && (
                                  <span className="flex items-center gap-0.5">
                                    <Weight className="h-3 w-3" /> {ex.effectiveWeightLbs} {weightUnit}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Link
                              href={`/dashboard/ejercicios/${ex.exerciseId}`}
                              className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all group-hover:scale-105"
                            >
                              <Play className="h-4 w-4 ml-0.5" />
                            </Link>
                          </div>

                          {/* Completed sets rows */}
                          {sets.length > 0 && (
                            <div className="px-4 pb-3 space-y-1.5 pt-0">
                              {sets.map((s, ri) => (
                                <div key={s.key}
                                  className="flex items-center justify-between bg-white border border-green-200 rounded-lg px-3 py-1.5 text-xs font-urwdin shadow-sm">
                                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Round {ri + 1}
                                  </span>
                                  <div className="flex items-center gap-3 text-dark/70">
                                    {s.reps > 0     && <span>🔁 {s.reps} reps</span>}
                                    {s.duration > 0 && <span>⏱ {s.duration}s</span>}
                                    {s.weight > 0   && <span className="text-primary font-semibold">🏋️ {s.weight} {weightUnit}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
