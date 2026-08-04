import { getAuthHeaders, API_URL } from '@/lib/api'
import { WorkoutProgressPoint, WorkoutSessionRecord } from './sessions'

// ── Program progress ───────────────────────────────────────────────────────────

export interface ProgramSummary {
  programId:      number
  programTitle:   string
  coverUrl?:      string
  totalWeeks:     number
  status:         string
  enrolledAt:     string
  totalSlots:     number
  completedSlots: number
  progressPct:    number
}

export interface ProgramWorkoutProgress {
  weekNumber:   number
  dayNumber:    number
  order:        number
  workoutId:    number
  workoutTitle: string
  completed:    boolean
}

// Customer: mis programas
export async function getMyProgramsSummary(): Promise<ProgramSummary[]> {
  const res = await fetch(`${API_URL}/api/progress/programs`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar progreso de programas')
  return res.json()
}

// Admin: programas de un usuario
export async function getUserProgramsSummary(userId: string): Promise<ProgramSummary[]> {
  const res = await fetch(`${API_URL}/api/progress/programs/user/${userId}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar progreso del usuario')
  return res.json()
}

// Progreso por clase dentro de un programa
export async function getProgramWorkoutProgress(
  programId: number,
  userId?: string,
): Promise<ProgramWorkoutProgress[]> {
  const url = userId
    ? `${API_URL}/api/progress/programs/${programId}/workouts?userId=${userId}`
    : `${API_URL}/api/progress/programs/${programId}/workouts`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar progreso del programa')
  return res.json()
}

// ── Exercise progress ──────────────────────────────────────────────────────────

// Customer: mi progreso por ejercicio (ya existe en sessions.ts como getProgressData)

// Admin: progreso de ejercicio de un usuario específico
export async function getUserExerciseProgress(
  userId: string,
  exerciseId: number,
): Promise<WorkoutProgressPoint[]> {
  const res = await fetch(
    `${API_URL}/api/workout-sessions/user/${userId}/exercise/${exerciseId}/progress`,
    { headers: getAuthHeaders() },
  )
  if (!res.ok) throw new Error('Error al cargar progreso del ejercicio')
  return res.json()
}

// Admin: sesiones de un workout de un usuario
export async function getUserWorkoutSessions(
  userId: string,
  workoutId: number,
): Promise<WorkoutSessionRecord[]> {
  const res = await fetch(
    `${API_URL}/api/workout-sessions/user/${userId}/workout/${workoutId}/progress`,
    { headers: getAuthHeaders() },
  )
  if (!res.ok) throw new Error('Error al cargar sesiones del usuario')
  return res.json()
}
