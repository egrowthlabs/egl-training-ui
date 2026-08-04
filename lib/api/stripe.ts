import { getAuthHeaders, API_URL } from '@/lib/api';

export interface SubscriptionStatus {
  isActive: boolean;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await fetch(`${API_URL}/api/stripe/subscription-status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener estado de suscripción');
  return res.json();
}

export async function verifyCheckoutSession(sessionId: string): Promise<SubscriptionStatus> {
  const res = await fetch(`${API_URL}/api/stripe/verify-session`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Error al verificar sesión');
  return res.json();
}

export async function createCheckoutSession(): Promise<string> {
  // {CHECKOUT_SESSION_ID} es reemplazado por Stripe con el ID real al redirigir
  const successUrl = `${window.location.origin}/dashboard/suscripcion?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${window.location.origin}/dashboard/suscripcion?canceled=true`;

  const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ successUrl, cancelUrl }),
  });
  if (!res.ok) throw new Error('Error al crear sesión de pago');
  const data = await res.json();
  return data.url;
}

export async function createPortalSession(): Promise<string> {
  const returnUrl = `${window.location.origin}/dashboard/suscripcion`;
  const res = await fetch(`${API_URL}/api/stripe/portal-session`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ returnUrl }),
  });
  if (!res.ok) throw new Error('Error al acceder al portal');
  const data = await res.json();
  return data.url;
}
