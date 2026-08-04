'use client'

/**
 * ActiveProgramWidget — muestra el programa activo del usuario en el dashboard.
 * Si no tiene programa activo, invita a explorar la sección de programas.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getActiveProgram } from '@/lib/api/programs'
import type { UserProgramDto } from '@/lib/types/program'
import {
  Calendar, Dumbbell, PlayCircle, LayoutGrid,
  ChevronRight, Trophy,
} from 'lucide-react'

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-white rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

export function ActiveProgramWidget() {
  const [program, setProgram] = useState<UserProgramDto | null | undefined>(undefined)

  useEffect(() => {
    getActiveProgram().then(setProgram).catch(() => setProgram(null))
  }, [])

  // Loading
  if (program === undefined) {
    return (
      <div className="card animate-pulse h-32" />
    )
  }

  // No active program
  if (!program) {
    return (
      <div className="card border border-dark/10 flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary rounded-xl">
            <LayoutGrid className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <p className="font-melodrama text-sm text-dark">Sin programa activo</p>
            <p className="text-xs text-dark/50 font-urwdin mt-0.5">
              Únete a un programa de entrenamiento estructurado
            </p>
          </div>
        </div>
        <Link href="/dashboard/programas" className="btn-primary flex items-center gap-1.5 whitespace-nowrap text-sm py-2 px-4">
          Ver programas <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  const isCompleted = program.status === 'completed'

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm">
      {/* Background — cover image or gradient */}
      <div className="absolute inset-0">
        {program.coverImageUrl
          ? <img src={program.coverImageUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60" />}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/70 via-dark/50 to-dark/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-urwdin uppercase tracking-widest text-white/60 mb-1">
              {isCompleted ? '🎉 Programa completado' : 'Tu programa actual'}
            </p>
            <h3 className="font-melodrama text-lg leading-tight truncate">{program.programName}</h3>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-2 text-xs font-urwdin text-white/70">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {program.totalWeeks} sem.
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                {program.completedSlots}/{program.totalSlots} clases
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 space-y-1">
              <ProgressBar pct={program.progressPct} />
              <p className="text-xs font-urwdin text-white/60">{program.progressPct}% completado</p>
            </div>
          </div>

          {/* Right action */}
          <div className="shrink-0">
            {isCompleted ? (
              <div className="p-3 bg-yellow-400/20 rounded-xl border border-yellow-400/30">
                <Trophy className="h-6 w-6 text-yellow-300" />
              </div>
            ) : (
              <Link
                href={`/dashboard/programas/${program.programId}`}
                className="flex items-center gap-1.5 bg-white text-dark text-xs font-urwdin font-medium px-3 py-2 rounded-xl hover:bg-white/90 transition-colors"
              >
                <PlayCircle className="h-4 w-4 text-primary" />
                Continuar
              </Link>
            )}
          </div>
        </div>

        {/* Next slot */}
        {program.nextSlot && !isCompleted && (
          <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-11 rounded-lg overflow-hidden bg-white/10 shrink-0">
                {program.nextSlot.workoutThumbnail
                  ? <img src={program.nextSlot.workoutThumbnail} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center"><Dumbbell className="h-3 w-3 text-white/40" /></div>}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/50 font-urwdin">
                  Próxima — Sem. {program.nextSlot.week} / Día {program.nextSlot.dayNumber}
                </p>
                <p className="text-xs font-urwdin text-white font-medium truncate">
                  {program.nextSlot.workoutTitle}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/workouts/${program.nextSlot.workoutId}`}
              className="shrink-0 flex items-center gap-1 text-xs font-urwdin text-white/80 hover:text-white transition-colors whitespace-nowrap"
            >
              Ir <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
