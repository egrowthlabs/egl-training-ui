'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'

interface Props {
  seconds: number
  onComplete?: () => void
  onClose?: () => void
}

export function RestTimer({ seconds: initialSeconds, onComplete, onClose }: Props) {
  const [total,     setTotal]    = useState(initialSeconds)
  const [running,   setRunning]  = useState(true)
  const [displayMs, setDisplayMs] = useState(initialSeconds * 1000)

  // Refs para el loop rAF — evitan stale closures
  const endTimeRef    = useRef<number>(Date.now() + initialSeconds * 1000)
  const remainMsRef   = useRef<number>(initialSeconds * 1000)
  const runningRef    = useRef(true)
  const rafRef        = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Loop a 60 fps
  const animate = useCallback(() => {
    if (!runningRef.current) return
    const remaining = Math.max(0, endTimeRef.current - Date.now())
    remainMsRef.current = remaining
    setDisplayMs(remaining)
    if (remaining <= 0) {
      runningRef.current = false
      setRunning(false)
      onCompleteRef.current?.()
      return
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (running) {
      endTimeRef.current = Date.now() + remainMsRef.current
      runningRef.current = true
      rafRef.current = requestAnimationFrame(animate)
    } else {
      runningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running, animate])

  const reset = () => {
    remainMsRef.current = total * 1000
    endTimeRef.current  = Date.now() + total * 1000
    setDisplayMs(total * 1000)
    setRunning(true)
  }

  const adjust = (deltaS: number) => {
    const newTotal = Math.max(5, total + deltaS)
    setTotal(newTotal)
    const newRemainMs = Math.max(0, remainMsRef.current + deltaS * 1000)
    remainMsRef.current = newRemainMs
    endTimeRef.current  = Date.now() + newRemainMs
    setDisplayMs(newRemainMs)
  }

  const togglePause = () => {
    if (running) remainMsRef.current = Math.max(0, endTimeRef.current - Date.now())
    setRunning(r => !r)
  }

  // Arco SVG con stroke-dashoffset (mucho más suave que stroke-dasharray)
  const R             = 54
  const circumference = 2 * Math.PI * R
  const pct           = Math.max(0, Math.min(1, displayMs / (total * 1000)))
  const dashOffset    = (1 - pct) * circumference   // 0 = lleno → circumference = vacío
  const isDone        = displayMs <= 0

  const fmt = (ms: number) => {
    const s = Math.ceil(ms / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5 w-80"
        onClick={e => e.stopPropagation()}
      >
        <p className="font-melodrama text-xl text-dark">Rest Timer</p>

        {/* Círculo animado a 60 fps */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#e5e7eb" strokeWidth="9" />
            <circle
              cx="60" cy="60" r={R}
              fill="none"
              stroke={isDone ? '#22c55e' : '#2D4A3E'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-melodrama text-4xl text-dark tabular-nums">{fmt(displayMs)}</span>
            <span className="text-xs text-dark/40 font-urwdin mt-1">
              {isDone ? '¡Listo!' : running ? 'descansando' : 'pausado'}
            </span>
          </div>
        </div>

        {/* Ajustar tiempo — fila compacta */}
        <div className="flex items-center justify-center gap-4 w-full">
          <button onClick={() => adjust(-15)}
            className="w-9 h-9 rounded-full bg-secondary/30 text-dark/60 hover:bg-secondary/60 flex items-center justify-center transition-colors shrink-0">
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-urwdin text-dark/40">−15s / +15s</span>
          <button onClick={() => adjust(+15)}
            className="w-9 h-9 rounded-full bg-secondary/30 text-dark/60 hover:bg-secondary/60 flex items-center justify-center transition-colors shrink-0">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Botón Pausar / Continuar — grande y centrado */}
        <button
          onClick={togglePause}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-urwdin font-semibold text-base transition-all active:scale-95"
          style={{
            background: running ? '#2D4A3E' : '#4a6063',
            color: '#fff',
            boxShadow: running
              ? '0 4px 24px rgba(45,74,62,0.35)'
              : '0 4px 24px rgba(74,96,99,0.25)',
          }}
        >
          {running
            ? <Pause className="h-6 w-6" strokeWidth={2.5} />
            : <Play  className="h-6 w-6" strokeWidth={2.5} />
          }
          {running ? 'Pausar' : 'Continuar'}
        </button>

        {/* Reiniciar + Cerrar — fila secundaria discreta */}
        <div className="flex items-center justify-between w-full">
          <button onClick={reset}
            className="flex items-center gap-1.5 text-sm text-dark/40 hover:text-dark font-urwdin transition-colors">
            <RotateCcw className="h-4 w-4" /> Reiniciar
          </button>
          <button onClick={onClose}
            className="text-sm text-dark/40 hover:text-dark font-urwdin transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}


