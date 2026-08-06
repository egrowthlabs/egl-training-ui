'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ArrowLeft, Calendar, Clock, Dumbbell, ChevronDown, ChevronUp,
  Loader2, TrendingUp, Repeat, Weight, BarChart3,
} from 'lucide-react'
import { getWorkoutById } from '@/lib/api/workouts'
import { getSessionsByWorkout, WorkoutSessionRecord, getMe } from '@/lib/api/sessions'
import { Workout } from '@/lib/types/workout'
import Image from 'next/image'
import Link from 'next/link'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

function fmtDuration(secs: number) {
  if (secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-dark/10 rounded-xl px-3 py-2 shadow-lg text-xs font-urwdin">
      <p className="text-dark/50 mb-1">{label}</p>
      <p className="text-primary font-semibold text-sm">{payload[0]?.value}</p>
    </div>
  )
}

// ── Session row ────────────────────────────────────────────────────────────────

function SessionRow({
  session, index, weightUnit,
}: {
  session: WorkoutSessionRecord
  index: number
  weightUnit: 'lbs' | 'kg'
}) {
  const [open, setOpen] = useState(false)
  const convert = (lbs: number) =>
    weightUnit === 'kg' ? Math.round(lbs * 0.453592 * 10) / 10 : lbs

  const totalReps = session.sets.reduce((a, s) => a + (s.reps ?? 0), 0)
  const totalSecs = session.sets.reduce((a, s) => a + (s.durationSeconds ?? 0), 0)
  const maxWeight = session.sets.length > 0
    ? Math.max(...session.sets.map(s => convert(s.weightLbs ?? 0)))
    : 0
  const hasWeight = maxWeight > 0

  return (
    <div className="card overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {index}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-urwdin font-semibold text-dark">
              {fmtDate(session.completedAt ?? session.startedAt)}
            </p>
            <div className="flex gap-3 mt-0.5 flex-wrap">
              {session.durationSeconds != null && session.durationSeconds > 0 && (
                <span className="flex items-center gap-1 text-xs text-dark/40 font-urwdin">
                  <Clock className="h-3 w-3" /> {fmtDuration(session.durationSeconds)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-dark/40 font-urwdin">
                <Repeat className="h-3 w-3" /> {session.sets.length} sets
              </span>
              {hasWeight && (
                <span className="flex items-center gap-1 text-xs text-dark/40 font-urwdin">
                  <Weight className="h-3 w-3" /> {maxWeight} {weightUnit} máx
                </span>
              )}
              {totalReps > 0 && (
                <span className="flex items-center gap-1 text-xs text-dark/40 font-urwdin">
                  <Dumbbell className="h-3 w-3" /> {totalReps} reps
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-dark/30 hover:text-dark shrink-0"
        >
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Expanded sets */}
      {open && session.sets.length > 0 && (
        <div className="border-t border-secondary">
          <table className="w-full text-xs font-urwdin">
            <thead>
              <tr className="border-b border-dark/5 bg-secondary/20">
                <th className="text-left px-4 py-2 text-dark/40 font-medium">Ejercicio</th>
                <th className="text-right px-3 py-2 text-dark/40 font-medium">Rnd</th>
                <th className="text-right px-3 py-2 text-dark/40 font-medium">Reps</th>
                <th className="text-right px-4 py-2 text-dark/40 font-medium">Peso ({weightUnit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {session.sets.map((set, i) => (
                <tr key={set.id ?? i} className="hover:bg-secondary/10">
                  <td className="px-4 py-2 text-dark/70 truncate max-w-[180px]">
                    {set.exerciseTitle ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-dark/50">{set.roundNumber}</td>
                  <td className="px-3 py-2 text-right text-dark">{set.reps > 0 ? set.reps : '—'}</td>
                  <td className="px-4 py-2 text-right font-medium text-dark">
                    {set.weightLbs > 0 ? convert(set.weightLbs) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ProgramaHistorialPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const workoutId = Number(id)

  const [workout,    setWorkout]    = useState<Workout | null>(null)
  const [sessions,   setSessions]   = useState<WorkoutSessionRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')

  const convert = (lbs: number) =>
    weightUnit === 'kg' ? Math.round(lbs * 0.453592 * 10) / 10 : lbs

  useEffect(() => {
    async function load() {
      try {
        const [wo, sess, me] = await Promise.all([
          getWorkoutById(workoutId),
          getSessionsByWorkout(workoutId),
          getMe().catch(() => ({ preferredWeightUnit: 'lbs' as const })),
        ])
        setWorkout(wo)
        setSessions(sess)
        setWeightUnit(me.preferredWeightUnit ?? 'lbs')
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workoutId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-dark/40 font-urwdin">Cargando historial...</p>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="text-center py-16">
        <p className="font-melodrama text-dark/30">Clase no encontrada</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Volver</button>
      </div>
    )
  }

  // ── Stats de todas las sesiones ─────────────────────────────────────────────
  const allSets     = sessions.flatMap(s => s.sets)
  const totalReps   = allSets.reduce((a, s) => a + (s.reps ?? 0), 0)
  const maxWeight   = allSets.length > 0 ? Math.max(...allSets.map(s => convert(s.weightLbs ?? 0))) : 0
  const hasWeight   = maxWeight > 0
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.durationSeconds ?? 0), 0) / sessions.length)
    : 0

  // ── Gráfica: número de sets por sesión ──────────────────────────────────────
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .map(s => ({
      date:     fmtDateShort(s.completedAt ?? s.startedAt),
      sets:     s.sets.length,
      maxPeso:  s.sets.length > 0 ? Math.max(...s.sets.map(x => convert(x.weightLbs ?? 0))) : 0,
    }))

  return (
    <div className="space-y-6 pb-12 max-w-4xl animate-fade-in">

      {/* Back + Title */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-dark/15 hover:bg-secondary/40 transition-colors mt-1"
        >
          <ArrowLeft className="h-4 w-4 text-dark/60" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-dark/40 font-urwdin">Historial del programa</p>
          <h1 className="font-melodrama text-2xl text-dark truncate">{workout.title}</h1>
        </div>
        <Link
          href={`/dashboard/workouts/${workoutId}`}
          className="shrink-0 px-3 py-1.5 rounded-xl border border-dark/15 text-xs font-urwdin text-dark/60 hover:bg-secondary/40 transition-colors mt-1"
        >
          Ver clase →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="h-16 w-16 text-dark/20 mx-auto mb-4" />
          <p className="font-melodrama text-2xl text-dark/40">Sin sesiones aún</p>
          <p className="text-sm text-dark/30 font-urwdin mt-2">
            Completa esta clase para ver tu historial
          </p>
          <Link href={`/dashboard/workouts/${workoutId}`} className="btn-primary inline-flex mt-6">
            Ir a la clase
          </Link>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sesiones', value: sessions.length, sub: 'completadas', icon: <BarChart3 className="h-4 w-4 text-primary/60" /> },
              { label: 'Sets totales', value: allSets.length, sub: 'completados', icon: <Repeat className="h-4 w-4 text-primary/60" /> },
              ...(hasWeight ? [{ label: 'Peso máximo', value: `${maxWeight} ${weightUnit}`, sub: 'mejor marca', icon: <Weight className="h-4 w-4 text-primary/60" /> }] : []),
              ...(totalReps > 0 ? [{ label: 'Reps totales', value: totalReps, sub: 'en total', icon: <TrendingUp className="h-4 w-4 text-primary/60" /> }] : []),
              ...(avgDuration > 0 ? [{ label: 'Duración media', value: fmtDuration(avgDuration), sub: 'por sesión', icon: <Clock className="h-4 w-4 text-primary/60" /> }] : []),
            ].map(s => (
              <div key={s.label} className="bg-secondary/20 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-urwdin text-dark/50">{s.label}</p>
                  {s.icon}
                </div>
                <p className="font-melodrama text-2xl text-dark">{s.value}</p>
                <p className="text-xs text-dark/40 font-urwdin mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Gráfica de sets por sesión */}
          {chartData.length >= 2 && (
            <div className="card space-y-4">
              <h2 className="font-urwdin font-semibold text-sm text-dark">Sets por sesión</h2>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4a6063" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4a6063" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(63,63,62,0.4)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(63,63,62,0.4)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="sets" stroke="#4a6063" strokeWidth={2} fill="url(#pgGrad)" dot={{ r: 3, fill: '#4a6063' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lista de sesiones */}
          <div className="space-y-3">
            <h2 className="font-urwdin font-semibold text-sm text-dark">
              {sessions.length} sesiones completadas
            </h2>
            {[...sessions]
              .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
              .map((session, i) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  index={sessions.length - i}
                  weightUnit={weightUnit}
                />
              ))
            }
          </div>
        </>
      )}
    </div>
  )
}
