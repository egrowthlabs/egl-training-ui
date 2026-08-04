import { API_URL, getAuthHeaders } from '@/lib/api'

export interface SubscriptionAdminDto {
  userId: string
  fullName: string
  email: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  canceledAt?: string
}

export interface PagedSubscriptions {
  items: SubscriptionAdminDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export async function getAdminSubscriptions(
  pageNumber = 1,
  pageSize   = 20,
  status?: string,
  search?: string,
): Promise<PagedSubscriptions> {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize:   String(pageSize),
  })
  if (status) params.set('status', status)
  if (search) params.set('search', search)

  const res = await fetch(`${API_URL}/api/admin/subscriptions?${params}`, {
    headers: getAuthHeaders(),
  })

  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function assignTrial(
  userId: string,
  trialDays: number,
): Promise<{ message: string; currentPeriodEnd: string }> {
  const res = await fetch(`${API_URL}/api/admin/subscriptions/assign-trial`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ userId, trialDays }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Error ${res.status}`)
  }
  return res.json()
}

export async function revokeSubscription(
  userId: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/admin/subscriptions/revoke`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ userId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Error ${res.status}`)
  }
  return res.json()
}
