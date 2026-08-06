import { getAuthHeaders } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface WorkoutSetRecord {
  id: number
  roundNumber: number
  reps: number
  durationSeconds: number
  weightLbs: number
  completedAt: string
  exerciseId?: number
  exerciseTitle?: string
}

export interface WorkoutSessionRecord {
  id: number
  workoutId: number
  workoutTitle: string
  workoutThumbnailUrl?: string
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  notes?: string
  sets: WorkoutSetRecord[]
}

export interface WorkoutProgressPoint {
  date: string
  maxWeightLbs: number
  totalReps: number
  setsCompleted: number
}

export async function startSession(params: number | { workoutId: number }): Promise<{ id: number }> {
  const workoutId = typeof params === 'number' ? params : params.workoutId
  const res = await fetch(`${API_URL}/api/workout-sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ workoutId }),
  })
  if (!res.ok) throw new Error('Error al iniciar sesión')
  return res.json()
}

export async function completeSession(sessionId: number, durationSeconds?: number, notes?: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/workout-sessions/${sessionId}/complete`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ durationSeconds: durationSeconds ?? 0, notes }),
  })
  if (!res.ok) throw new Error('Error al completar sesión')
}

export async function cancelSession(sessionId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/workout-sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cancelar sesión')
}

export interface LogSetParams {
  sessionId: number
  exerciseId?: number
  roundNumber?: number
  reps?: number
  durationSeconds?: number
  weightLbs?: number
}

export async function logSet(params: LogSetParams | number, roundNumber?: number, reps?: number, weightLbs?: number): Promise<{ id: number }> {
  // Support both old positional style and new object style
  let body: object
  let sid: number
  if (typeof params === 'object') {
    sid = params.sessionId
    body = {
      exerciseId:      params.exerciseId,
      roundNumber:     params.roundNumber ?? 1,
      reps:            params.reps ?? 0,
      durationSeconds: params.durationSeconds ?? 0,
      weightLbs:       params.weightLbs ?? 0,
    }
  } else {
    sid = params
    body = { roundNumber, reps, weightLbs }
  }
  const res = await fetch(`${API_URL}/api/workout-sessions/${sid}/sets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (res.status === 404) throw new Error('SESSION_NOT_FOUND')
  if (!res.ok) throw new Error('Error al guardar set')
  return res.json()
}

export async function getMyHistory(page = 1): Promise<{ items: WorkoutSessionRecord[]; totalCount: number }> {
  const res = await fetch(`${API_URL}/api/workout-sessions/my-history?pageNumber=${page}&pageSize=20`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar historial')
  return res.json()
}

export async function getSessionsByWorkout(workoutId: number): Promise<WorkoutSessionRecord[]> {
  const res = await fetch(`${API_URL}/api/workout-sessions/workout/${workoutId}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar sesiones')
  return res.json()
}

export async function getProgressData(workoutId: number): Promise<WorkoutProgressPoint[]> {
  const res = await fetch(`${API_URL}/api/workout-sessions/progress/${workoutId}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar progreso')
  return res.json()
}

/** Progreso de un ejercicio específico del usuario autenticado */
export async function getExerciseProgress(exerciseId: number): Promise<WorkoutProgressPoint[]> {
  const res = await fetch(`${API_URL}/api/workout-sessions/exercise/${exerciseId}/progress`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar progreso del ejercicio')
  return res.json()
}

export async function updateWeightUnit(unit: 'lbs' | 'kg'): Promise<void> {
  const res = await fetch(`${API_URL}/api/users/me/weight-unit`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ unit }),
  })
  if (!res.ok) throw new Error('Error al actualizar preferencia')
}

export async function getMe(): Promise<{ preferredWeightUnit: 'lbs' | 'kg' }> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error')
  return res.json()
}

/** Admin: obtiene el historial de un usuario específico */
export async function getUserHistory(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: WorkoutSessionRecord[]; totalCount: number }> {
  const res = await fetch(
    `${API_URL}/api/workout-sessions/user/${userId}?pageNumber=${page}&pageSize=${pageSize}`,
    { headers: getAuthHeaders() },
  )
  if (!res.ok) throw new Error('Error al cargar historial del usuario')
  return res.json()
}
