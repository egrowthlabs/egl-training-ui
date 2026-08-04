import { getAuthHeaders } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface CatalogItem {
  id: number
  value: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface CatalogItemFull extends CatalogItem {
  catalogType: string
}

export async function getCatalogByType(type: string): Promise<CatalogItem[]> {
  const res = await fetch(`${API_URL}/api/catalogs/${type}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar catálogo')
  return res.json()
}

export async function getAllCatalogs(): Promise<CatalogItemFull[]> {
  const res = await fetch(`${API_URL}/api/catalogs`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar catálogos')
  return res.json()
}

export interface CreateCatalogItemDto {
  catalogType: string
  value: string
  label: string
  sortOrder?: number
  isActive?: boolean
}

export async function createCatalogItem(dto: CreateCatalogItemDto): Promise<CatalogItem> {
  const res = await fetch(`${API_URL}/api/catalogs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? 'Error al crear item')
  }
  return res.json()
}

export async function updateCatalogItem(id: number, dto: Partial<CreateCatalogItemDto> & { isActive?: boolean }): Promise<void> {
  const res = await fetch(`${API_URL}/api/catalogs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error('Error al actualizar item')
}

export async function deleteCatalogItem(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/catalogs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al eliminar item')
}
