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
