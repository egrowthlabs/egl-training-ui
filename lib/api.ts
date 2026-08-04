import { User, CreateUserDto, UpdateUserDto, PaginatedResponse } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('app-token') : null;
  return {
    'Authorization': `Bearer ${token ?? ''}`,
    'Content-Type': 'application/json',
  };
}

export async function getUsers(
  page = 1, pageSize = 10, search = ''
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    pageNumber:  page.toString(),
    pageSize:    pageSize.toString(),
    searchTerm:  search,          // backend usa 'searchTerm' no 'search'
  });
  const res = await fetch(`${API_URL}/api/users?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener usuarios');
  const json = await res.json();
  // El backend envuelve en ApiResponse<PagedResult<T>> → { data: { items, totalCount, ... } }
  return json?.data ?? json;
}

export async function createUser(data: CreateUserDto): Promise<User> {
  const res = await fetch(`${API_URL}/api/users`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method:  'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar usuario');
}

export async function updateUser(
  id: string,
  data: { userName?: string; firstName?: string; lastName?: string; email?: string; roles?: string[] }
): Promise<void> {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method:  'PUT',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any)?.message ?? 'Error al actualizar usuario');
  }
}

export async function getUserById(id: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener usuario');
  const json = await res.json();
  return json?.data ?? json;
}

export async function toggleUserLock(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/users/${id}/toggle-lock`, {
    method:  'PUT',
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.message ?? 'Error al cambiar estado');
  return { message: (json as any)?.message ?? '' };
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ newPassword }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.message ?? 'Error al resetear contraseña');
}
