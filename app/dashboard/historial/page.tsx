'use client'

import { useEffect, useState } from 'react'
import { getMyHistory, WorkoutSessionRecord } from '@/lib/api/sessions'
import { Clock, Dumbbell, ChevronDown, ChevronUp, Calendar, Timer, Weight, Repeat } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import Image from 'next/image'

function fmtDuration(secs: number) {
  if (secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function SessionCard({ session, weightUnit }: { session: WorkoutSessionRecord; weightUnit: 'lbs' | 'kg' }) {
  const [open, setOpen] = useState(false)
  const convert = (lbs: number) => weightUnit === 'kg' ? Math.round(lbs * 0.453592 * 10) / 10 : lbs

  const totalReps    = session.sets.reduce((a, s) => a + s.reps, 0)
  const totalSecs    = session.sets.reduce((a, s) => a + (s.durationSeconds ?? 0), 0)
  const maxWeight    = session.sets.length > 0 ? Math.max(...session.sets.map(s => convert(s.weightLbs))) : 0
  const hasWeight    = maxWeight > 0
  const hasTime      = totalSecs > 0
  const hasReps      = totalReps > 0

  return (
    <div className="card space-y-0 overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {session.workoutThumbnailUrl && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <Image src={session.workoutThumbnailUrl} alt={session.workoutTitle} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/dashboard/workouts/${session.workoutId}`}
            className="font-urwdin font-semibold text-dark text-sm hover:text-primary transition-colors line-clamp-1">
            {session.workoutTitle}
          </Link>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-dark/50 font-urwdin">
              <Calendar className="h-3 w-3" />
              {fmtDate(session.completedAt ?? session.startedAt)}
            </span>
            {session.durationSeconds != null && session.durationSeconds > 0 && (
              <span className="flex items-center gap-1 text-xs text-dark/50 font-urwdin">
                <Clock className="h-3 w-3" />
                {fmtDuration(session.durationSeconds)}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-dark/40 hover:text-dark shrink-0 mt-1">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Quick stats */}
      {session.sets.length > 0 && (
        <div className="flex gap-0 border-t border-secondary divide-x divide-secondary">
          <div className="flex-1 text-center py-3">
            <p className="font-melodrama text-xl text-primary">{session.sets.length}</p>
            <p className="text-xs text-dark/40 font-urwdin">sets</p>
          </div>
          {hasReps && (
            <div className="flex-1 text-center py-3">
              <p className="font-melodrama text-xl text-primary">{totalReps}</p>
              <p className="text-xs text-dark/40 font-urwdin">reps</p>
            </div>
          )}
          {hasTime && (
            <div className="flex-1 text-center py-3">
              <p className="font-melodrama text-xl text-primary">{Math.round(totalSecs / 60)}m</p>
              <p className="text-xs text-dark/40 font-urwdin">en ejercicio</p>
            </div>
          )}
          {hasWeight && (
            <div className="flex-1 text-center py-3">
              <p className="font-melodrama text-xl text-primary">{maxWeight}</p>
              <p className="text-xs text-dark/40 font-urwdin">{weightUnit} máx</p>
            </div>
          )}
        </div>
      )}

      {/* Expanded set detail */}
      {open && session.sets.length > 0 && (
        <div className="border-t border-secondary divide-y divide-secondary/50">
          {session.sets.map((set, i) => (
            <div key={set.id ?? i} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0 flex-1">
                {set.exerciseTitle && set.exerciseId ? (
                  <Link
                    href={`/dashboard/historial/ejercicio/${set.exerciseId}`}
                    className="text-sm font-medium text-dark hover:text-primary transition-colors truncate block"
                  >
                    {set.exerciseTitle} →
                  </Link>
                ) : set.exerciseTitle ? (
                  <p className="text-sm font-medium text-dark truncate">{set.exerciseTitle}</p>
                ) : null}
                <p className="text-xs text-dark/40 font-urwdin">
                  Round {set.roundNumber}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {set.reps > 0 && (
                  <span className="flex items-center gap-1 text-sm font-urwdin font-medium text-dark">
                    <Repeat className="h-3.5 w-3.5 text-primary" />
                    {set.reps}
                  </span>
                )}
                {set.durationSeconds > 0 && (
                  <span className="flex items-center gap-1 text-sm font-urwdin font-medium text-dark">
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    {set.durationSeconds}s
                  </span>
                )}
                {set.weightLbs > 0 && (
                  <span className="flex items-center gap-1 text-sm font-urwdin font-medium text-primary">
                    <Weight className="h-3.5 w-3.5" />
                    {convert(set.weightLbs)} {weightUnit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistorialPage() {
  const [sessions,   setSessions]   = useState<WorkoutSessionRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')
  const { user } = useAuth()

  useEffect(() => {
    const stored = localStorage.getItem('preferredWeightUnit') as 'lbs' | 'kg' | null
    if (stored) setWeightUnit(stored)

    getMyHistory()
      .then(r => setSessions(r.items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Mi Historial</h1>
          <p className="text-dark/50 font-urwdin text-sm mt-1">{sessions.length} sesiones completadas</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="h-16 w-16 text-dark/20 mx-auto mb-4" />
          <p className="font-melodrama text-2xl text-dark/40">Sin sesiones aún</p>
          <p className="text-sm text-dark/30 font-urwdin mt-2">Completa tu primera clase para ver el historial</p>
          <Link href="/dashboard/workouts" className="btn-primary inline-flex mt-6">Ver clases</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} weightUnit={weightUnit} />
          ))}
        </div>
      )}
    </div>
  )
}
