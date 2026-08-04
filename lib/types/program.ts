// lib/types/program.ts

export type ProgramAccessType = 'free' | 'subscription'

export interface ProgramDto {
  id: number
  name: string
  description?: string
  isActive: boolean
  coverImageUrl?: string
  totalWeeks: number
  daysPerWeek: number
  workoutCount: number
  accessType: ProgramAccessType
}

export interface ProgramSlot {
  id: number          // ProgramWorkout.Id (0 si es nuevo)
  week: number        // 1-based
  dayNumber: number   // 1-based
  order: number
  workoutId: number
  workoutTitle: string
  workoutThumbnail?: string
  workoutDuration: number
  workoutCategory: string
}

export interface ProgramDetail {
  id: number
  name: string
  description?: string
  isActive: boolean
  coverImageUrl?: string
  totalWeeks: number
  daysPerWeek: number
  accessType: ProgramAccessType
  slots: ProgramSlot[]
}

/** Payload para crear / actualizar programa */
export interface SaveProgramPayload {
  name: string
  description?: string
  coverImageUrl?: string
  isActive?: boolean
  accessType?: ProgramAccessType
  totalWeeks: number
  daysPerWeek: number
  slots: {
    week: number
    dayNumber: number
    workoutId: number
    order: number
  }[]
}

// ── Enrollment & Progress ──────────────────────────────────────────────────────

export interface NextSlotDto {
  programWorkoutId: number
  week: number
  dayNumber: number
  workoutId: number
  workoutTitle: string
  workoutThumbnail?: string
  workoutDuration: number
}

export interface UserProgramDto {
  id: number
  programId: number
  programName: string
  coverImageUrl?: string
  totalWeeks: number
  daysPerWeek: number
  totalSlots: number
  completedSlots: number
  progressPct: number        // 0-100
  status: 'inprogress' | 'completed' | 'paused'
  startedAt: string
  nextSlot?: NextSlotDto | null
  completedWorkoutIds: number[]  // ProgramWorkout.Id[] ya completados
}
