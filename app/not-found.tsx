'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-6 py-20">
      <div
        className="text-center max-w-md"
        style={{
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="font-melodrama text-3xl text-white tracking-tight">rl</span>
          </div>
        </div>

        {/* 404 */}
        <p className="font-melodrama text-8xl text-primary/20 leading-none mb-2">404</p>

        <h1 className="font-melodrama text-2xl text-dark mb-3">
          Página no encontrada
        </h1>
        <p className="font-urwdin text-dark/60 text-sm leading-relaxed mb-8">
          La página que buscas no existe o fue movida.
          Vuelve al dashboard y continúa tu entrenamiento.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-urwdin font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/dashboard/workouts"
            className="inline-flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-urwdin font-semibold text-sm px-6 py-3 rounded-full hover:border-primary/60 transition-colors"
          >
            Ver clases
          </Link>
        </div>
      </div>
    </div>
  )
}
