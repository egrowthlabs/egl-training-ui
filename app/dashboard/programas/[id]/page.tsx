'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import {
  getProgramById, getProgramProgress,
  enrollProgram, completeProgramWorkout,
} from '@/lib/api/programs'
import type { ProgramDetail, ProgramSlot, UserProgramDto } from '@/lib/types/program'
import {
  ChevronLeft, Calendar, Dumbbell, Pencil, CheckCircle2,
  PlayCircle, Lock, Loader2, Star, Clock, Trophy,
  ChevronDown, ChevronUp, Unlock,
} from 'lucide-react'
import { getSubscriptionStatus } from '@/lib/api/stripe'
import { PaywallOverlay } from '@/components/paywall-overlay'

// ── Agrupar slots por semana / día ────────────────────────────────────────────
function groupSlots(slots: ProgramSlot[]) {
  const map: Record<number, Record<number, ProgramSlot[]>> = {}
  for (const s of slots) {
    if (!map[s.week]) map[s.week] = {}
    if (!map[s.week][s.dayNumber]) map[s.week][s.dayNumber] = []
    map[s.week][s.dayNumber].push(s)
  }
  return map
}

// ── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-dark/10 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

// ── Badge de acceso ───────────────────────────────────────────────────────────
function AccessBadge({ type }: { type: string }) {
  if (type === 'free') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-urwdin px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
        <Unlock className="h-3 w-3" /> Gratis
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-urwdin px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      <Star className="h-3 w-3" /> Con suscripción
    </span>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProgramDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const { user } = useAuth()
  const isAdmin  = user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

  const [program,  setProgram]  = useState<ProgramDetail | null>(null)
  const [progress, setProgress] = useState<UserProgramDto | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [completing, setCompleting] = useState<number | null>(null)  // programWorkoutId
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getProgramById(Number(id)),
      getProgramProgress(Number(id)),
      getSubscriptionStatus().catch(() => ({ isActive: false })),
    ])
      .then(([prog, prog_progress, subStatus]) => {
        setProgram(prog)
        setProgress(prog_progress)
        setHasSubscription(subStatus.isActive)
        // Expand the current week if enrolled
        if (prog_progress?.nextSlot?.week) {
          setExpandedWeeks(new Set([prog_progress.nextSlot.week]))
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleEnroll() {
    setEnrolling(true)
    setError('')
    try {
      const up = await enrollProgram(Number(id))
      setProgress(up)
      if (up.nextSlot?.week) setExpandedWeeks(new Set([up.nextSlot.week]))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setEnrolling(false)
    }
  }

  async function handleComplete(slot: ProgramSlot) {
    if (!progress) return
    setCompleting(slot.id)
    setError('')
    try {
      await completeProgramWorkout(Number(id), slot.id)
      // Actualizar progreso local
      const updated = await getProgramProgress(Number(id))
      setProgress(updated)
      if (updated?.nextSlot?.week) {
        setExpandedWeeks(prev => new Set(Array.from(prev).concat([updated.nextSlot!.week])))
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCompleting(null)
    }
  }

  function toggleWeek(week: number) {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error && !program) return (
    <div className="card text-center py-16">
      <p className="font-urwdin text-red-500">{error}</p>
      <Link href="/dashboard/programas" className="btn-secondary mt-4 inline-flex">← Volver</Link>
    </div>
  )
  if (!program) return null

  const groups       = groupSlots(program.slots)
  const totalSlots   = program.slots.length
  const isEnrolled   = !!progress
  const isCompleted  = progress?.status === 'completed'
  const completedIds = new Set(progress?.completedWorkoutIds ?? [])

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/programas" className="p-2 rounded-xl hover:bg-secondary/40 transition-colors text-dark/60 mt-0.5 shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-melodrama text-2xl text-dark">{program.name}</h1>
            <AccessBadge type={program.accessType ?? 'subscription'} />
          </div>
          {program.description && (
            <p className="text-sm text-dark/50 font-urwdin mt-1">{program.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-sm font-urwdin text-dark/60">
              <Calendar className="h-4 w-4 text-primary" /> {program.totalWeeks} semanas
            </span>
            <span className="flex items-center gap-1.5 text-sm font-urwdin text-dark/60">
              <Dumbbell className="h-4 w-4 text-primary" /> {program.daysPerWeek} días/sem.
            </span>
            <span className="flex items-center gap-1.5 text-sm font-urwdin text-dark/60">
              <Clock className="h-4 w-4 text-primary" /> {totalSlots} clases
            </span>
          </div>
        </div>
        {isAdmin && (
          <Link href={`/dashboard/programas/${id}/editar`} className="btn-secondary flex items-center gap-2 shrink-0">
            <Pencil className="h-4 w-4" /> Editar
          </Link>
        )}
      </div>

      {/* ── Cover ──────────────────────────────────────────────── */}
      {program.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden h-52 w-full relative">
          <img src={program.coverImageUrl} alt={program.name} className="w-full h-full object-cover" />
          {isCompleted && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <Trophy className="h-10 w-10" />
                <p className="font-melodrama text-lg">¡Programa completado!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Progreso (si está inscrito) ───────────────────────── */}
      {isEnrolled && progress && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-melodrama text-sm text-dark">
                {isCompleted ? '🎉 ¡Completado!' : 'Tu progreso'}
              </p>
              <p className="text-xs text-dark/50 font-urwdin mt-0.5">
                {progress.completedSlots} de {progress.totalSlots} clases completadas
              </p>
            </div>
            <span className="font-melodrama text-3xl text-primary">{progress.progressPct}%</span>
          </div>
          <ProgressBar pct={progress.progressPct} />

          {/* Siguiente clase */}
          {progress.nextSlot && !isCompleted && (
            <div className="mt-2 flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/15">
              <div className="h-10 w-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                {progress.nextSlot.workoutThumbnail
                  ? <img src={progress.nextSlot.workoutThumbnail} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center"><Dumbbell className="h-4 w-4 text-primary/40" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-primary font-urwdin uppercase tracking-wider mb-0.5">
                  Siguiente — Sem. {progress.nextSlot.week} / Día {progress.nextSlot.dayNumber}
                </p>
                <p className="font-urwdin text-sm font-medium text-dark truncate">{progress.nextSlot.workoutTitle}</p>
              </div>
              <Link
                href={`/dashboard/workouts/${progress.nextSlot.workoutId}`}
                className="shrink-0 btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <PlayCircle className="h-3.5 w-3.5" /> Ver
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Acción principal (si NO está inscrito) ───────────── */}
      {!isEnrolled && (() => {
        const needsSub = !isAdmin && program.accessType === 'subscription' && hasSubscription === false
        if (needsSub) {
          return <PaywallOverlay contentName={program.name} contentType="program" />
        }
        return (
          <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-melodrama text-base text-dark">¿Listo para empezar?</p>
              <p className="text-sm text-dark/50 font-urwdin">
                {totalSlots} clases · {program.totalWeeks} semanas
              </p>
            </div>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {enrolling
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando...</>
                : <><PlayCircle className="h-4 w-4" /> Empezar programa</>}
            </button>
          </div>
        )
      })()}

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          {error}
        </div>
      )}

      {/* ── Grilla de semanas ─────────────────────────────────── */}
      <div className="space-y-3">
        {Array.from({ length: program.totalWeeks }, (_, wi) => {
          const weekNum  = wi + 1
          const weekData = groups[weekNum] ?? {}
          const isExpanded = expandedWeeks.has(weekNum)
          const isCurrentWeek = progress?.nextSlot?.week === weekNum

          // Contar completados en esta semana
          const slotsInWeek = Object.values(weekData).flat()
          const completedInWeek = slotsInWeek.filter(s => completedIds.has(s.id)).length
          const weekDone = slotsInWeek.length > 0 && completedInWeek === slotsInWeek.length

          return (
            <div key={weekNum} className={`card p-0 overflow-hidden transition-all ${isCurrentWeek ? 'ring-2 ring-primary/30' : ''}`}>
              {/* Week header — clickable accordion */}
              <button
                onClick={() => toggleWeek(weekNum)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {weekDone
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    : <div className={`h-5 w-5 rounded-full border-2 shrink-0 ${isCurrentWeek ? 'border-primary' : 'border-dark/20'}`} />}
                  <div className="text-left">
                    <span className="font-melodrama text-sm text-dark">
                      Semana {weekNum}
                      {isCurrentWeek && !weekDone && (
                        <span className="ml-2 text-[10px] bg-primary text-white rounded-full px-2 py-0.5 font-urwdin uppercase tracking-wider align-middle">
                          Actual
                        </span>
                      )}
                    </span>
                    <p className="text-xs text-dark/40 font-urwdin">
                      {completedInWeek}/{slotsInWeek.length} clases
                    </p>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-dark/40" />
                  : <ChevronDown className="h-4 w-4 text-dark/40" />}
              </button>

              {/* Days */}
              {isExpanded && (
                <div className="divide-y divide-dark/5 border-t border-dark/5">
                  {Array.from({ length: program.daysPerWeek }, (_, di) => {
                    const dayNum = di + 1
                    const slots  = (weekData[dayNum] ?? []).sort((a, b) => a.order - b.order)
                    const isNextDay = progress?.nextSlot?.week === weekNum && progress?.nextSlot?.dayNumber === dayNum

                    return (
                      <div key={dayNum} className={`px-5 py-4 ${isNextDay ? 'bg-primary/3' : ''}`}>
                        <div className="flex items-start gap-4">
                          {/* Day label */}
                          <div className="shrink-0 w-14 text-center pt-0.5">
                            <span className="block text-[10px] text-dark/40 font-urwdin uppercase">Día</span>
                            <span className={`font-melodrama text-lg ${isNextDay ? 'text-primary' : 'text-dark/60'}`}>{dayNum}</span>
                          </div>

                          {/* Workouts */}
                          <div className="flex-1 space-y-2">
                            {slots.length === 0 ? (
                              <p className="text-sm text-dark/30 font-urwdin italic">Sin clase asignada</p>
                            ) : (
                              slots.map(slot => {
                                const done      = completedIds.has(slot.id)
                                const isNext    = progress?.nextSlot?.programWorkoutId === slot.id
                                const canComplete = isEnrolled && !done && isNext

                                return (
                                  <div key={slot.id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors
                                    ${done ? 'bg-green-50/50' : isNext ? 'bg-primary/5' : ''}`}>

                                    {/* Status icon */}
                                    <div className="shrink-0">
                                      {done
                                        ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        : isNext
                                          ? <PlayCircle className="h-5 w-5 text-primary animate-pulse" />
                                          : <div className="h-5 w-5 rounded-full border-2 border-dark/15" />}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="h-10 w-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                                      {slot.workoutThumbnail
                                        ? <img src={slot.workoutThumbnail} alt="" className="h-full w-full object-cover" />
                                        : <div className="h-full w-full flex items-center justify-center">
                                            <Dumbbell className="h-4 w-4 text-primary/40" />
                                          </div>}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <Link
                                        href={`/dashboard/workouts/${slot.workoutId}`}
                                        className={`font-urwdin text-sm font-medium hover:text-primary transition-colors truncate block
                                          ${done ? 'text-dark/50 line-through' : 'text-dark'}`}
                                      >
                                        {slot.workoutTitle}
                                      </Link>
                                      <p className="text-xs text-dark/40 font-urwdin">
                                        {slot.workoutCategory} · {slot.workoutDuration} min
                                      </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center gap-2">
                                      <Link
                                        href={`/dashboard/workouts/${slot.workoutId}`}
                                        className="text-xs font-urwdin text-primary/70 hover:text-primary underline underline-offset-2"
                                      >
                                        Ver
                                      </Link>
                                      {canComplete && (
                                        <button
                                          onClick={() => handleComplete(slot)}
                                          disabled={completing === slot.id}
                                          className="text-xs font-urwdin font-medium text-white bg-green-500 hover:bg-green-600 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-60"
                                        >
                                          {completing === slot.id
                                            ? <Loader2 className="h-3 w-3 animate-spin" />
                                            : <CheckCircle2 className="h-3 w-3" />}
                                          Completar
                                        </button>
                                      )}
                                      {isEnrolled && !done && !isNext && (
                                        <Lock className="h-3.5 w-3.5 text-dark/20" />
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completed banner */}
      {isCompleted && (
        <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 flex items-center gap-4 p-6">
          <Trophy className="h-10 w-10 text-yellow-500 shrink-0" />
          <div>
            <p className="font-melodrama text-lg text-dark">¡Felicitaciones!</p>
            <p className="text-sm text-dark/60 font-urwdin">Completaste el programa {program.name}. ¡Excelente trabajo!</p>
          </div>
        </div>
      )}
    </div>
  )
}
