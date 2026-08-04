'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getSubscriptionStatus,
  verifyCheckoutSession,
  createCheckoutSession,
  createPortalSession,
  type SubscriptionStatus,
} from '@/lib/api/stripe'
import { CheckCircle, XCircle, CreditCard, Settings, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  Active:     'Activa',
  Trialing:   'Período de prueba',
  PastDue:    'Pago pendiente',
  Canceled:   'Cancelada',
  Incomplete: 'Incompleta',
  None:       'Sin suscripción',
}

// ── Componente interno que usa useSearchParams ────────────────────────────────
function SuscripcionContent() {
  const searchParams = useSearchParams()
  const success   = searchParams.get('success')
  const canceled  = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')

  const [status,        setStatus]        = useState<SubscriptionStatus | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [retrying,      setRetrying]      = useState(false)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 5
    const delayMs = 2000

    const fetchStatus = async () => {
      try {
        const s = await getSubscriptionStatus()
        setStatus(s)
        // Si venimos de un pago exitoso y aun no esta activo, reintentamos
        if (success && !s.isActive && attempts < maxAttempts) {
          attempts++
          setRetrying(true)
          setTimeout(fetchStatus, delayMs)
        } else {
          setRetrying(false)
          setLoading(false)
        }
      } catch {
        setError('No se pudo obtener el estado de tu suscripción.')
        setLoading(false)
      }
    }

    const init = async () => {
      // Si Stripe redirige con session_id, verificar directamente contra Stripe API
      // Esto actualiza la BD sin necesitar el webhook
      if (success && sessionId) {
        try {
          const verified = await verifyCheckoutSession(sessionId)
          setStatus(verified)
          setRetrying(false)
          setLoading(false)
          return
        } catch {
          // Si falla la verificacion directa, caemos al polling normal
        }
      }
      fetchStatus()
    }

    init()
  }, [success, sessionId])

  const handleSubscribe = async () => {
    setActionLoading(true)
    try {
      const url = await createCheckoutSession()
      window.location.href = url
    } catch {
      setError('No se pudo iniciar el proceso de pago. Intenta de nuevo.')
      setActionLoading(false)
    }
  }

  const handlePortal = async () => {
    setActionLoading(true)
    try {
      const url = await createPortalSession()
      window.location.href = url
    } catch {
      setError('No se pudo abrir el portal. Intenta de nuevo.')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  // ── Vista especial para Administradores ─────────────────────────────────────
  if (status?.status === 'admin') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Mi Suscripción</h1>
          <p className="text-dark/50 font-urwdin text-sm mt-1">Gestiona tu plan re_line</p>
        </div>
        <div className="card border-2 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-melodrama text-xl text-dark">Acceso de Administrador</p>
              <p className="text-sm text-dark/60 font-urwdin mt-0.5">
                Tienes acceso completo a la plataforma sin necesidad de suscripción.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-melodrama text-3xl text-dark">Mi Suscripción</h1>
        <p className="text-dark/50 font-urwdin text-sm mt-1">Gestiona tu plan re_line</p>
      </div>

      {/* Success / Cancel banners */}
      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-green-700 font-urwdin text-sm">¡Suscripción activada! Ya tienes acceso completo a re_line.</p>
        </div>
      )}
      {canceled && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-5 py-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-yellow-700 font-urwdin text-sm">Proceso cancelado. Puedes suscribirte cuando quieras.</p>
        </div>
      )}

      {/* Status card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.isActive
              ? <CheckCircle className="h-8 w-8 text-green-500" />
              : <XCircle    className="h-8 w-8 text-dark/30" />}
            <div>
              <p className="font-melodrama text-xl text-dark">
                {STATUS_LABELS[status?.status ?? 'None'] ?? status?.status}
              </p>
              {status?.currentPeriodEnd && (
                <p className="text-xs text-dark/50 font-urwdin">
                  {status.cancelAtPeriodEnd ? 'Cancela el' : 'Renueva el'}{' '}
                  {new Date(status.currentPeriodEnd).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Plan badge */}
          <div className="text-right">
            <p className="font-melodrama text-2xl text-primary">$450</p>
            <p className="text-xs text-dark/40 font-urwdin">MXN / mes</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600 font-urwdin">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {retrying ? (
            <div className="flex items-center gap-2 text-sm text-dark/60 font-urwdin">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Procesando tu pago, un momento…
            </div>
          ) : status?.isActive ? (
            <button
              onClick={handlePortal}
              disabled={actionLoading}
              className="btn-secondary flex items-center gap-2"
            >
              {actionLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Settings className="h-4 w-4" />}
              Gestionar suscripción
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={actionLoading}
              className="btn-primary flex items-center gap-2"
            >
              {actionLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CreditCard className="h-4 w-4" />}
              Suscribirme — $450 MXN/mes
            </button>
          )}
        </div>
      </div>

      {/* Plan details */}
      <div className="card">
        <h2 className="font-melodrama text-lg text-dark mb-4">Plan re_line Completo</h2>
        <ul className="space-y-2">
          {[
            'Acceso ilimitado a todas las clases VOD',
            'Cardio consciente, fuerza, resistencia y Pilates Reformer',
            'Nuevas clases cada semana',
            'Cancela cuando quieras',
          ].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm font-urwdin text-dark/70">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Export default con Suspense boundary (requerido por Next.js 14) ───────────
export default function SuscripcionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <SuscripcionContent />
    </Suspense>
  )
}
