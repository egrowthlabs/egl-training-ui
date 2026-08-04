'use client'

import Link from 'next/link'
import { Lock, Star, CheckCircle2, ArrowRight, Zap, Trophy, TrendingUp } from 'lucide-react'

interface PaywallOverlayProps {
  title?: string
  subtitle?: string
  /** Si viene de un programa, muestra el nombre del programa */
  contentName?: string
  contentType?: 'workout' | 'program'
}

const BENEFITS = [
  { icon: <Zap className="h-4 w-4 text-primary" />, text: 'Acceso ilimitado a todas las clases' },
  { icon: <Trophy className="h-4 w-4 text-primary" />, text: 'Todos los programas de entrenamiento' },
  { icon: <TrendingUp className="h-4 w-4 text-primary" />, text: 'Seguimiento de tu progreso y gráficas' },
  { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, text: 'Nuevas clases cada semana' },
]

export function PaywallOverlay({
  title = 'Contenido premium',
  contentName,
  contentType = 'workout',
}: PaywallOverlayProps) {
  const label = contentType === 'program' ? 'programa' : 'clase'

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred background hint */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/20 to-primary/10 backdrop-blur-sm" />

      {/* Animated glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 animate-pulse" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-14 space-y-6">
        {/* Lock icon with ring */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20 ring-offset-2">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="h-7 w-7 text-primary" />
            </div>
          </div>
          {/* Orbiting star */}
          <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
            <Star className="h-3.5 w-3.5 text-white fill-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 max-w-sm">
          <h3 className="font-melodrama text-2xl text-dark">
            {contentName ? `"${contentName}"` : title}
          </h3>
          <p className="text-sm font-urwdin text-dark/60">
            {contentName
              ? `Este ${label} es exclusivo para suscriptores. Activa tu plan para acceder.`
              : 'Este contenido es exclusivo para suscriptores. Activa tu plan y desbloquea todo.'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 space-y-3 w-full max-w-xs border border-white/80 shadow-sm">
          <p className="text-xs font-urwdin font-semibold text-dark/50 uppercase tracking-wider">
            Tu plan incluye
          </p>
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-sm font-urwdin text-dark/70">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3 w-full max-w-xs">
          <Link
            href="/dashboard/suscripcion"
            className="flex items-center justify-center gap-2 w-full btn-primary py-3 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          >
            Activar suscripción <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-dark/40 font-urwdin">
            Cancela cuando quieras. Sin contratos.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Versión compacta para tarjetas del catálogo (overlay sobre imagen)
 */
export function PaywallCardBadge() {
  return (
    <div className="absolute inset-0 bg-dark/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center transition-opacity">
      <div className="flex flex-col items-center gap-1">
        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
          <Lock className="h-4 w-4 text-white" />
        </div>
        <span className="text-white text-xs font-urwdin font-medium">Suscripción</span>
      </div>
    </div>
  )
}

/**
 * Badge inline para cards sin overlay full
 */
export function PaywallBadge({ isFree }: { isFree: boolean }) {
  if (isFree) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="h-3 w-3" /> Gratis
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
      <Lock className="h-3 w-3" /> Premium
    </span>
  )
}
