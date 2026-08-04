import { getAuthHeaders, API_URL } from '../api';
import { Exercise, WorkoutBlock } from '../types/exercise';
import { PaginatedResponse } from '../types';

export async function getExercises(params?: {
  search?: string;
  trackingType?: string;
  category?: string;
  level?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Exercise>> {
  const p = new URLSearchParams();
  if (params?.search) p.set('search', params.search);
  if (params?.trackingType) p.set('trackingType', params.trackingType);
  if (params?.category) p.set('category', params.category);
  if (params?.level) p.set('level', params.level);
  p.set('pageNumber', String(params?.pageNumber ?? 1));
  p.set('pageSize', String(params?.pageSize ?? 50));
  const res = await fetch(`${API_URL}/api/exercises?${p}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener ejercicios');
  const data = await res.json();
  // El backend devuelve array directo — normalizamos a PaginatedResponse
  if (Array.isArray(data)) {
    return {
      items: data,
      totalCount: data.length,
      pageNumber: 1,
      pageSize: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
  return data;
}

export async function getExerciseById(id: number): Promise<Exercise> {
  const res = await fetch(`${API_URL}/api/exercises/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Ejercicio no encontrado');
  return res.json();
}

export async function createExercise(data: Partial<Exercise>): Promise<{ id: number }> {
  const res = await fetch(`${API_URL}/api/exercises`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear ejercicio');
  return res.json();
}

export async function updateExercise(id: number, data: Partial<Exercise>): Promise<void> {
  const res = await fetch(`${API_URL}/api/exercises/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) throw new Error('Error al actualizar ejercicio');
}

export async function deleteExercise(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/exercises/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar ejercicio');
}

export async function getExerciseStreamUrl(id: number): Promise<string> {
  const res = await fetch(`${API_URL}/api/exercises/${id}/stream-url`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener URL de streaming del ejercicio');
  const data = await res.json();
  return data.url;
}

export async function uploadExerciseVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers = getAuthHeaders() as Record<string, string>;
    delete headers['Content-Type']; // let browser set multipart boundary

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/workouts/upload-video`);
    // Set headers (except Content-Type which is deleted)
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.key);
        } catch {
          reject(new Error('Respuesta inválida del servidor'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message ?? `Error ${xhr.status}`));
        } catch {
          reject(new Error(`Error al subir el video (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Error de red al subir el video'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export async function getWorkoutBlocks(workoutId: number): Promise<WorkoutBlock[]> {
  const res = await fetch(`${API_URL}/api/workouts/${workoutId}/blocks`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener bloques');
  return res.json();
}

export async function saveWorkoutBlocks(workoutId: number, blocks: any[]): Promise<void> {
  const res = await fetch(`${API_URL}/api/workouts/${workoutId}/blocks`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) throw new Error('Error al guardar bloques');
}
