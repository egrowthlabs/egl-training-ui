'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getExerciseById, getExerciseStreamUrl } from '@/lib/api/exercises'
import { Exercise } from '@/lib/types/exercise'
import { VideoPlayer } from '@/components/video-player'
import { cn } from '@/lib/utils'
import { ArrowLeft, BarChart2, Dumbbell, Flame, Target, Timer, Repeat, Weight, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { getSubscriptionStatus } from '@/lib/api/stripe'

const TRACKING_LABELS: Record<string, string> = {
  reps:        'Repeticiones',
  reps_weight: 'Reps + Peso',
  time:        'Tiempo',
  time_weight: 'Tiempo + Peso',
}

const LEVEL_COLORS: Record<string, string> = {
  Principiante: 'bg-green-100 text-green-700',
  Intermedio:   'bg-yellow-100 text-yellow-700',
  Avanzado:     'bg-red-100 text-red-700',
}

const INTENSITY_COLORS: Record<string, string> = {
  Baja:  'bg-blue-100 text-blue-700',
  Media: 'bg-orange-100 text-orange-700',
  Alta:  'bg-red-100 text-red-700',
}

export default function ExerciseDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { user } = useAuth()
  const isAdmin  = user?.roles?.includes('Admin') ?? false

  const [exercise,   setExercise]   = useState<Exercise | null>(null)
  const [streamUrl,  setStreamUrl]  = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)

  useEffect(() => {
    getSubscriptionStatus()
      .then(s => setHasSubscription(s.isActive))
      .catch(() => setHasSubscription(false))
  }, [])

  useEffect(() => {
    if (!id) return
    getExerciseById(Number(id))
      .then(setExercise)
      .catch(() => setError('Ejercicio no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePlay = async () => {
    if (streamUrl) return
    setLoadingUrl(true)
    try {
      const url = await getExerciseStreamUrl(Number(id))
      setStreamUrl(url)
    } catch {
      setError('No se pudo obtener el video.')
    } finally {
      setLoadingUrl(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  if (error || !exercise) return (
    <div className="text-center py-16">
      <p className="font-melodrama text-2xl text-dark/40">{error ?? 'Error'}</p>
      <button onClick={() => router.back()} className="btn-secondary mt-4">Volver</button>
    </div>
  )

  const canWatch = exercise.isPublished && (hasSubscription || isAdmin)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a ejercicios
      </button>

      {/* Video */}
      <div className="bg-dark rounded-2xl overflow-hidden aspect-video relative">
        {!exercise.videoProviderId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark/90">
            <Dumbbell className="h-16 w-16 text-white/20 mb-4" />
            <p className="text-white/50 font-urwdin text-sm">Sin video asignado</p>
            {isAdmin && (
              <Link href={`/dashboard/ejercicios/${id}/editar`} className="mt-3 text-secondary text-sm underline">
                Asignar video →
              </Link>
            )}
          </div>
        ) : streamUrl ? (
          <VideoPlayer src={streamUrl} poster={exercise.thumbnailUrl ?? undefined} className="w-full h-full" />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
            onClick={handlePlay}
            style={{
              background: exercise.thumbnailUrl
                ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url(${exercise.thumbnailUrl}) center/cover`
                : 'linear-gradient(135deg, #4a6063 0%, #2c3c3e 100%)',
            }}
          >
            {loadingUrl ? (
              <div className="h-16 w-16 rounded-full border-4 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
                  <svg className="h-8 w-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-white/80 text-sm font-urwdin mt-4">Click para reproducir</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-melodrama text-2xl text-dark">{exercise.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn('badge text-xs px-2 py-0.5', LEVEL_COLORS[exercise.level])}>
                {exercise.level}
              </span>
              <span className={cn('badge text-xs px-2 py-0.5', INTENSITY_COLORS[exercise.intensity])}>
                {exercise.intensity}
              </span>
              <span className="badge text-xs px-2 py-0.5 bg-primary/10 text-primary">
                {TRACKING_LABELS[exercise.trackingType] ?? exercise.trackingType}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Link
              href={`/dashboard/ejercicios/${id}/editar`}
              className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin border border-dark/20 rounded-lg px-3 py-1.5 hover:border-primary shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Link>
          )}
        </div>

        {exercise.description && (
          <p className="text-dark/70 font-urwdin text-sm leading-relaxed mt-4">{exercise.description}</p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary-50">
            <Repeat className="h-4 w-4 text-primary" />
            <span className="font-melodrama text-lg text-dark">
              {exercise.defaultRounds ?? 3}
            </span>
            <span className="text-xs text-dark/50 font-urwdin">rounds</span>
          </div>
          {(exercise.trackingType === 'reps' || exercise.trackingType === 'reps_weight') && (
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary-50">
              <Repeat className="h-4 w-4 text-primary" />
              <span className="font-melodrama text-lg text-dark">{exercise.defaultReps ?? '—'}</span>
              <span className="text-xs text-dark/50 font-urwdin">reps</span>
            </div>
          )}
          {(exercise.trackingType === 'time' || exercise.trackingType === 'time_weight') && (
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary-50">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-melodrama text-lg text-dark">{exercise.defaultDurationSeconds ?? '—'}</span>
              <span className="text-xs text-dark/50 font-urwdin">seg</span>
            </div>
          )}
          {(exercise.trackingType === 'reps_weight' || exercise.trackingType === 'time_weight') && (
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary-50">
              <Weight className="h-4 w-4 text-primary" />
              <span className="font-melodrama text-lg text-dark">{exercise.defaultWeightLbs ?? '—'}</span>
              <span className="text-xs text-dark/50 font-urwdin">lbs</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary-50">
            <Timer className="h-4 w-4 text-primary" />
            <span className="font-melodrama text-lg text-dark">{exercise.defaultRestTimerSeconds ?? 60}</span>
            <span className="text-xs text-dark/50 font-urwdin">desc (seg)</span>
          </div>
        </div>

        {/* Categorías */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-dark/40 font-urwdin uppercase tracking-wide">Categoría</span>
            <span className="text-sm text-dark font-urwdin">{exercise.category}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-dark/40 font-urwdin uppercase tracking-wide">Equipo</span>
            <span className="text-sm text-dark font-urwdin">{exercise.equipment}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-dark/40 font-urwdin uppercase tracking-wide">Objetivo</span>
            <span className="text-sm text-dark font-urwdin">{exercise.objective}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
