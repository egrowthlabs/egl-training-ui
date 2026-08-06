'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFeaturedToday } from '@/lib/api/workouts'
import { Workout, CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/types/workout'
import { Clock, ChevronRight, Zap, Star } from 'lucide-react'

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl overflow-hidden">
      <div className="h-40 bg-secondary/50" />
      <div className="p-4 space-y-2 bg-secondary/20 rounded-b-2xl">
        <div className="h-4 w-2/3 bg-secondary/60 rounded-lg" />
        <div className="h-3 w-1/3 bg-secondary/40 rounded-lg" />
      </div>
    </div>
  )
}

// ── Main widget ────────────────────────────────────────────────────────────────

export function DailyClassWidget() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedToday()
      .then(setWorkout)
      .catch(() => setWorkout(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  // No hay clase del día — no renderiza nada
  if (!workout) return null

  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <Link
      href={`/dashboard/workouts/${workout.id}`}
      className="group block rounded-2xl overflow-hidden border border-dark/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Thumbnail / gradient header */}
      <div
        className="relative h-44 flex flex-col justify-end p-5"
        style={{
          background: workout.thumbnailUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url(${workout.thumbnailUrl}) center/cover`
            : 'linear-gradient(135deg, #4a6063 0%, #2c3c3e 100%)',
        }}
      >
        {/* "Clase del día" badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1 shadow-sm">
          <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
          <span className="text-xs font-urwdin font-semibold text-dark/80 capitalize">
            Clase de hoy
          </span>
        </div>

        {/* Title */}
        <div>
          <p className="text-white/60 text-xs font-urwdin uppercase tracking-widest mb-1">
            {CATEGORY_LABELS[workout.category] ?? workout.category}
          </p>
          <h3 className="font-melodrama text-2xl text-white leading-tight group-hover:text-white/90 transition-colors">
            {workout.title}
          </h3>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date */}
          <span className="text-xs font-urwdin text-dark/40 capitalize">{todayLabel}</span>

          {/* Level */}
          <span className="text-xs font-urwdin font-medium text-dark/60">
            {LEVEL_LABELS[workout.level] ?? workout.level}
          </span>

          {/* Duration */}
          {(workout.durationMinutes ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs font-urwdin text-dark/50">
              <Clock className="h-3 w-3" />
              {workout.durationMinutes} min
            </span>
          )}

          {/* Free badge */}
          {workout.isFree && (
            <span className="flex items-center gap-1 text-xs font-urwdin text-green-600 font-semibold">
              <Zap className="h-3 w-3" /> Gratis
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-primary shrink-0">
          <span className="text-xs font-urwdin font-semibold">Hacer clase</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
