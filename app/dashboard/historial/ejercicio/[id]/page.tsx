'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, Loader2, TrendingUp, Repeat, Timer, Weight, BarChart3, AlertTriangle } from 'lucide-react'
import { getExerciseById } from '@/lib/api/exercises'
import { Exercise, TRACKING_LABELS } from '@/lib/types/exercise'
import { getProgressData, getMe } from '@/lib/api/sessions'
import { getUserExerciseProgress } from '@/lib/api/progress'
import { WorkoutProgressPoint } from '@/lib/api/sessions'
import Image from 'next/image'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

function fmtDuration(secs: number) {
  if (secs <= 0) return '0s'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-dark/10 rounded-xl px-3 py-2 shadow-lg text-xs font-urwdin">
      <p className="text-dark/50 mb-1">{label}</p>
      <p className="text-primary font-semibold text-sm">{payload[0]?.value} <span className="font-normal text-dark/40">{unit}</span></p>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className={`${color} rounded-2xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-urwdin text-dark/50">{label}</p>
        {icon}
      </div>
      <p className="font-melodrama text-3xl text-dark">{value}</p>
      <p className="text-xs text-dark/40 font-urwdin mt-0.5">{sub}</p>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function EjercicioHistorialPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  // If ?userId= is present, we're in admin mode
  const adminUserId = searchParams.get('userId') ?? undefined
  const adminUserName = searchParams.get('userName') ?? undefined

  const exerciseId = Number(id)

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [progress, setProgress] = useState<WorkoutProgressPoint[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [activeMetric, setActiveMetric] = useState<'weight' | 'reps' | 'duration'>('weight')
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')

  const convert = (lbs: number) =>
    weightUnit === 'kg' ? Math.round(lbs * 0.453592 * 10) / 10 : lbs

  useEffect(() => {
    async function load() {
      try {
        const [ex, prog, me] = await Promise.all([
          getExerciseById(exerciseId),
          adminUserId
            ? getUserExerciseProgress(adminUserId, exerciseId)
            : getProgressData(exerciseId),
          getMe().catch(() => ({ preferredWeightUnit: 'lbs' as const })),
        ])
        setExercise(ex)
        setProgress(prog)
        setWeightUnit(me.preferredWeightUnit ?? 'lbs')

        // Set default metric based on tracking type
        if (ex.trackingType.includes('weight')) setActiveMetric('weight')
        else if (ex.trackingType.includes('time')) setActiveMetric('duration')
        else setActiveMetric('reps')
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [exerciseId, adminUserId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-dark/40 font-urwdin">Cargando progreso...</p>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="text-center py-16">
        <p className="font-melodrama text-dark/30">Ejercicio no encontrado</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Volver</button>
      </div>
    )
  }

  const isWeight = exercise.trackingType.includes('weight')
  const isTime   = exercise.trackingType.includes('time')
  const hasReps  = exercise.trackingType.includes('reps')

  // Build chart data — convert to user's preferred unit
  const chartData = progress.map(p => ({
    date:     fmtDate(p.date),
    peso:     convert(p.maxWeightLbs),
    reps:     p.totalReps,
    duration: p.setsCompleted,
    sets:     p.setsCompleted,
  }))

  // Stats — convert weights to user unit
  const maxWeight  = progress.length > 0 ? Math.max(...progress.map(p => convert(p.maxWeightLbs))) : 0
  const maxReps    = progress.length > 0 ? Math.max(...progress.map(p => p.totalReps)) : 0
  const totalSets  = progress.reduce((a, p) => a + p.setsCompleted, 0)
  const sessions   = progress.length

  // Trend: last vs first
  const trend = progress.length >= 2
    ? isWeight
      ? ((progress[progress.length-1].maxWeightLbs - progress[0].maxWeightLbs) / (progress[0].maxWeightLbs || 1) * 100).toFixed(0)
      : ((progress[progress.length-1].totalReps - progress[0].totalReps) / (progress[0].totalReps || 1) * 100).toFixed(0)
    : null

  const metrics = [
    ...(isWeight ? [{ key: 'weight' as const, label: 'Peso', unit: weightUnit, color: '#4a6063' }] : []),
    ...(hasReps  ? [{ key: 'reps'   as const, label: 'Reps', unit: 'reps', color: '#7c9ea0' }] : []),
    { key: 'duration' as const, label: 'Series', unit: 'sets', color: '#9db4b6' },
  ]

  const currentMetric = metrics.find(m => m.key === activeMetric) ?? metrics[0]
  const dataKey = activeMetric === 'weight' ? 'peso' : activeMetric === 'reps' ? 'reps' : 'sets'

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl border border-dark/15 hover:bg-secondary/40 transition-colors">
          <ArrowLeft className="h-4 w-4 text-dark/60" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-dark/40 font-urwdin">
            {adminUserId ? `Progreso de ${adminUserName ?? 'alumno'}` : 'Mi progreso'}
          </p>
          <h1 className="font-melodrama text-2xl text-dark truncate">{exercise.title}</h1>
        </div>
        <span className="shrink-0 px-2.5 py-1 bg-secondary/40 text-dark/60 text-xs font-urwdin rounded-xl">
          {TRACKING_LABELS[exercise.trackingType] ?? exercise.trackingType}
        </span>
      </div>

      {/* Exercise card */}
      <div className="card flex items-center gap-4 p-4">
        {exercise.thumbnailUrl && (
          <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
            <Image src={exercise.thumbnailUrl} alt={exercise.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-dark/60 font-urwdin line-clamp-2">{exercise.description ?? 'Sin descripción'}</p>
        </div>
        {trend !== null && (
          <div className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl
            ${Number(trend) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 mb-0.5 ${Number(trend) < 0 ? 'rotate-180' : ''}`} />
            <span className="font-melodrama text-sm">{trend}%</span>
            <span className="text-xs font-urwdin opacity-70">evolución</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Sesiones" value={sessions} sub="veces realizadas"
          icon={<BarChart3 className="h-4 w-4 text-primary" />} color="bg-primary/8" />
        <StatCard label="Series totales" value={totalSets} sub="sets completados"
          icon={<Repeat className="h-4 w-4 text-dark/50" />} color="bg-secondary/30" />
        {isWeight && <StatCard label="Peso máximo" value={`${maxWeight} lbs`} sub="mejor marca"
          icon={<Weight className="h-4 w-4 text-amber-600" />} color="bg-amber-50" />}
        {hasReps && <StatCard label="Reps máximas" value={maxReps} sub="en una sesión"
          icon={<Repeat className="h-4 w-4 text-green-600" />} color="bg-green-50" />}
      </div>

      {/* Chart section */}
      {progress.length < 2 ? (
        <div className="card text-center py-16 border border-dashed border-dark/15">
          <TrendingUp className="h-10 w-10 text-dark/20 mx-auto mb-3" />
          <p className="font-melodrama text-dark/30 mb-1">Sin datos suficientes</p>
          <p className="text-sm text-dark/40 font-urwdin">Completa al menos 2 sesiones para ver la gráfica de progreso</p>
        </div>
      ) : (
        <div className="card space-y-4">
          {/* Metric selector */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-melodrama text-base text-dark">Progreso en el tiempo</h2>
            <div className="flex gap-1.5">
              {metrics.map(m => (
                <button key={m.key} onClick={() => setActiveMetric(m.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-urwdin transition-all border
                    ${activeMetric === m.key
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'border-dark/15 text-dark/60 hover:border-primary/40 bg-white'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Area chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a6063" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4a6063" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edee" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#9babb0', fontFamily: 'var(--font-urwdin)' }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#9babb0', fontFamily: 'var(--font-urwdin)' }} />
                <Tooltip content={<ChartTooltip unit={currentMetric?.unit} />} />
                <Area type="monotone" dataKey={dataKey} stroke="#4a6063" strokeWidth={2.5}
                  fill="url(#progressGrad)" dot={{ r: 4, fill: '#4a6063', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#4a6063', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sessions table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark/8">
          <h2 className="font-melodrama text-base text-dark">Historial de sesiones</h2>
        </div>
        {progress.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-dark/40 font-urwdin">Sin sesiones registradas</p>
          </div>
        ) : (
          <table className="w-full text-sm font-urwdin">
            <thead>
              <tr className="border-b border-dark/5">
                <th className="text-left px-5 py-3 text-xs text-dark/40 font-medium uppercase tracking-wider">Fecha</th>
                {isWeight && <th className="text-right px-4 py-3 text-xs text-dark/40 font-medium uppercase tracking-wider">Peso máx</th>}
                {hasReps  && <th className="text-right px-4 py-3 text-xs text-dark/40 font-medium uppercase tracking-wider">Total reps</th>}
                <th className="text-right px-5 py-3 text-xs text-dark/40 font-medium uppercase tracking-wider">Series</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {[...progress].reverse().map((p, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3 text-dark/70">{fmtDate(p.date)}</td>
                  {isWeight && (
                    <td className="px-4 py-3 text-right font-medium text-dark">
                      {p.maxWeightLbs > 0 ? `${convert(p.maxWeightLbs)} ${weightUnit}` : '—'}
                    </td>
                  )}
                  {hasReps && (
                    <td className="px-4 py-3 text-right font-medium text-dark">
                      {p.totalReps > 0 ? p.totalReps : '—'}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right text-dark/60">{p.setsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
