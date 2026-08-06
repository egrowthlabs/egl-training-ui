import { getAuthHeaders, API_URL } from '../api';
import { Workout, WorkoutFilters } from '../types/workout';
import { PaginatedResponse } from '../types';

export async function getWorkouts(
  filters: WorkoutFilters = {}
): Promise<PaginatedResponse<Workout>> {
  const params = new URLSearchParams();
  if (filters.category)                       params.set('category',    filters.category);
  if (filters.level)                           params.set('level',        filters.level);
  if (filters.intensity)                       params.set('intensity',    filters.intensity);
  if (filters.equipment)                       params.set('equipment',    filters.equipment);
  if (filters.objective)                       params.set('objective',    filters.objective);
  if (filters.search)                          params.set('search',       filters.search);
  if (filters.isFree !== undefined)            params.set('isFree',       String(filters.isFree));
  params.set('pageNumber', String(filters.pageNumber ?? 1));
  params.set('pageSize',   String(filters.pageSize   ?? 12));


  const res = await fetch(`${API_URL}/api/workouts?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener workouts');
  return res.json();
}

export async function getWorkoutById(id: number): Promise<Workout> {
  const res = await fetch(`${API_URL}/api/workouts/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener workout');
  return res.json();
}

export async function getWorkoutStreamUrl(id: number): Promise<string> {
  const res = await fetch(`${API_URL}/api/workouts/${id}/stream-url`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener URL de streaming');
  const data = await res.json();
  return data.url;
}

export async function updateWorkout(id: number, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_URL}/api/workouts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? body.title ?? 'Error al actualizar la clase')
  }
}

/** Clase del día — retorna el workout destacado para la fecha local del usuario, o null si no hay. */
export async function getFeaturedToday(): Promise<Workout | null> {
  // Enviar la fecha local del navegador en formato YYYY-MM-DD
  const localDate = new Date().toLocaleDateString('en-CA'); // en-CA da el formato YYYY-MM-DD
  const res = await fetch(`${API_URL}/api/schedule/today?date=${localDate}`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  return res.json()
}

/** [Admin] Obtiene el calendario de clases en un rango. */
export async function getSchedule(from: string, to: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/schedule?from=${from}&to=${to}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al obtener calendario')
  return res.json()
}

/** [Admin] Programa una clase para un día específico. */
export async function setSchedule(date: string, workoutId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/schedule/${date}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ workoutId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? 'Error al programar clase')
  }
}

/** [Admin] Elimina una clase de un día específico. */
export async function deleteSchedule(date: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/schedule/${date}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    throw new Error('Error al quitar clase del calendario')
  }
}
