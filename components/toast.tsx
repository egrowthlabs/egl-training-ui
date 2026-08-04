'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error:   <XCircle      className="h-5 w-5 text-red-500"   />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info:    <Info          className="h-5 w-5 text-primary"   />,
}

const STYLES: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200   bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info:    'border-primary/20 bg-primary/5',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10)
    const duration = toast.duration ?? 4000
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, duration)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg',
        'transition-all duration-300 ease-out max-w-sm w-full',
        STYLES[toast.type],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      <span className="shrink-0 mt-0.5">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark font-urwdin">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-dark/60 font-urwdin mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        className="shrink-0 text-dark/40 hover:text-dark transition-colors mt-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
