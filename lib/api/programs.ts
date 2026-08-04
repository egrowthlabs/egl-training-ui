// lib/api/programs.ts
import { getAuthHeaders, API_URL } from '../api'
import type { ProgramDto, ProgramDetail, SaveProgramPayload } from '../types/program'

const BASE = `${API_URL}/api/programs`

// ── Helper genérico ────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? body.message ?? body.title ?? `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

// ── Upload portada → S3 ────────────────────────────────────────────────────────

/**
 * Sube una imagen de portada al backend (→ S3).
 * No lleva Content-Type en headers para que fetch asigne multipart automáticamente.
 */
export async function uploadProgramCover(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE}/upload-cover`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? body.message ?? `Error ${res.status}`)
  }
  const { url } = await res.json()
  return url as string
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export async function getPrograms(params?: {
  onlyActive?: boolean
  pageNumber?: number
  pageSize?: number
}): Promise<{ items: ProgramDto[]; totalCount: number; pageNumber: number; pageSize: number }> {
  const q = new URLSearchParams()
  if (params?.onlyActive !== undefined) q.set('onlyActive', String(params.onlyActive))
  if (params?.pageNumber)               q.set('pageNumber', String(params.pageNumber))
  if (params?.pageSize)                 q.set('pageSize',   String(params.pageSize))
  return apiFetch(`${BASE}?${q}`)
}

export async function getProgramById(id: number): Promise<ProgramDetail> {
  return apiFetch(`${BASE}/${id}`)
}

export async function createProgram(payload: SaveProgramPayload): Promise<ProgramDetail> {
  return apiFetch(BASE, {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function updateProgram(id: number, payload: SaveProgramPayload): Promise<ProgramDetail> {
  return apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  })
}

export async function deleteProgram(id: number): Promise<void> {
  return apiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}

// ── Enrollment & Progress ──────────────────────────────────────────────────────

import type { UserProgramDto } from '../types/program'

const ME_BASE = `${API_URL}/api/me`

/** Inscribir al usuario en un programa */
export async function enrollProgram(programId: number): Promise<UserProgramDto> {
  return apiFetch(`${BASE}/${programId}/enroll`, { method: 'POST' })
}

/** Obtener progreso del usuario en un programa específico */
export async function getProgramProgress(programId: number): Promise<UserProgramDto | null> {
  const res = await fetch(`${BASE}/${programId}/progress`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  return res.json()
}

/** Marcar un workout del programa como completado */
export async function completeProgramWorkout(
  programId: number,
  programWorkoutId: number
): Promise<void> {
  return apiFetch(`${BASE}/${programId}/complete/${programWorkoutId}`, { method: 'POST' })
}

/** Programa activo del usuario — para el widget del dashboard */
export async function getActiveProgram(): Promise<UserProgramDto | null> {
  const res = await fetch(`${ME_BASE}/active-program`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data ?? null
}
