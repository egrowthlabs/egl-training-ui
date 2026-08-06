'use client'

import { useEffect, useState } from 'react'
import { getMyHistory, getMe, WorkoutSessionRecord } from '@/lib/api/sessions'
import { Flame, Calendar, Clock, Weight, Dumbbell, TrendingUp, Zap } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDateKey(iso: string) {
  return iso.slice(0, 10) // 'YYYY-MM-DD'
}

function computeStreak(sessions: WorkoutSessionRecord[]): number {
  if (sessions.length === 0) return 0

  // Unique days with completed sessions, sorted descending
  const days = Array.from(
    new Set(sessions.map(s => toDateKey(s.completedAt ?? s.startedAt)))
  ).sort((a, b) => b.localeCompare(a))

  const today    = toDateKey(new Date().toISOString())
  const yesterday = toDateKey(new Date(Date.now() - 86400000).toISOString())

  // Streak only counts if last session is today or yesterday
  if (days[0] !== today && days[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

function fmtWeight(lbs: number, unit: 'lbs' | 'kg') {
  const val = unit === 'kg' ? Math.round(lbs * 0.453592) : Math.round(lbs)
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k ${unit}`
  return `${val} ${unit}`
}

function fmtMinutes(mins: number) {
  if (mins >= 60) return `${Math.round(mins / 60)}h`
  return `${mins}m`
}

// ── Single KPI tile ────────────────────────────────────────────────────────────

interface KpiTile {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  highlight?: boolean
}

function KpiCard({ tile }: { tile: KpiTile }) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 ${
        tile.highlight
          ? 'bg-primary text-white'
          : 'bg-secondary/30 hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <p className={`text-xs font-urwdin ${tile.highlight ? 'text-white/70' : 'text-dark/50'}`}>
          {tile.label}
        </p>
        <span className={tile.highlight ? 'text-white/80' : 'text-primary/70'}>
          {tile.icon}
        </span>
      </div>
      <p className={`font-melodrama text-2xl font-semibold leading-none mt-1 ${tile.highlight ? 'text-white' : 'text-dark'}`}>
        {tile.value}
      </p>
      <p className={`text-xs font-urwdin ${tile.highlight ? 'text-white/60' : 'text-dark/40'}`}>
        {tile.sub}
      </p>
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-secondary/40 rounded-2xl" />
      ))}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

interface Props {
  /** Compact mode: shows only 4 KPIs (for dashboard). Full mode: shows 6 (for progreso page). */
  compact?: boolean
}

export function ActivityStatsWidget({ compact = false }: Props) {
  const [tiles,   setTiles]   = useState<KpiTile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [histRes, me] = await Promise.all([
          getMyHistory(1),
          getMe().catch(() => ({ preferredWeightUnit: 'lbs' as const })),
        ])

        // Collect ALL sessions (getMyHistory paginates 20, for KPIs we need all)
        // We'll compute from the first page (20 most recent) — sufficient for streak
        // and we'll load more pages for totals
        let allSessions: WorkoutSessionRecord[] = histRes.items
        const total = histRes.totalCount
        if (total > 20) {
          // Load remaining pages in parallel
          const pages = Math.ceil(total / 20)
          const extra = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) => getMyHistory(i + 2))
          )
          allSessions = [...allSessions, ...extra.flatMap(r => r.items)]
        }

        const weightUnit = me.preferredWeightUnit ?? 'lbs'

        // ── Compute KPIs ──────────────────────────────────────────────────────

        // 1. Streak (consecutive days trained)
        const streak = computeStreak(allSessions)

        // 2. Total unique training days
        const uniqueDays = new Set(
          allSessions.map(s => toDateKey(s.completedAt ?? s.startedAt))
        ).size

        // 3. Total minutes
        const totalMins = Math.round(
          allSessions.reduce((a, s) => a + (s.durationSeconds ?? 0), 0) / 60
        )

        // 4. Total weight lifted (sum of ALL sets' weightLbs)
        const totalWeightLbs = allSessions
          .flatMap(s => s.sets)
          .reduce((a, set) => a + (set.weightLbs ?? 0), 0)

        // 5. Total sessions
        const totalSessions = allSessions.length

        // 6. Total sets completed
        const totalSets = allSessions.reduce((a, s) => a + s.sets.length, 0)

        // ── Build tiles ───────────────────────────────────────────────────────
        const all: KpiTile[] = [
          {
            label:     'Racha actual',
            value:     streak > 0 ? `${streak} 🔥` : '0',
            sub:       streak === 1 ? 'día seguido' : streak > 1 ? 'días seguidos' : 'Sin racha activa',
            icon:      <Flame className="h-4 w-4" />,
            highlight: streak >= 3,  // Se resalta si hay racha de 3+ días
          },
          {
            label: 'Días entrenados',
            value: uniqueDays,
            sub:   'desde que te uniste',
            icon:  <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Minutos totales',
            value: fmtMinutes(totalMins),
            sub:   'de entrenamiento',
            icon:  <Clock className="h-4 w-4" />,
          },
          {
            label: 'Peso total levantado',
            value: totalWeightLbs > 0 ? fmtWeight(totalWeightLbs, weightUnit) : '—',
            sub:   `en ${weightUnit}`,
            icon:  <Weight className="h-4 w-4" />,
          },
          {
            label: 'Clases completadas',
            value: totalSessions,
            sub:   'sesiones finalizadas',
            icon:  <Dumbbell className="h-4 w-4" />,
          },
          {
            label: 'Sets completados',
            value: totalSets,
            sub:   'rondas terminadas',
            icon:  <Zap className="h-4 w-4" />,
          },
        ]

        setTiles(compact ? all.slice(0, 4) : all)
      } catch (e) {
        console.error('ActivityStatsWidget:', e)
        setTiles([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [compact])

  if (loading) return <KpiSkeleton />

  if (tiles.length === 0) return null

  return (
    <div
      className={`grid gap-3 ${
        compact
          ? 'grid-cols-2 sm:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      }`}
    >
      {tiles.map(tile => (
        <KpiCard key={tile.label} tile={tile} />
      ))}
    </div>
  )
}
