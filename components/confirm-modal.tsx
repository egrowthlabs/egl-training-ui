'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen:      boolean
  title:       string
  message:     string
  confirmText?: string
  cancelText?:  string
  variant?:    'danger' | 'warning' | 'info'
  onConfirm:   () => void
  onCancel:    () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText  = 'Cancelar',
  variant     = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button and handle Escape
  useEffect(() => {
    if (!isOpen) return
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter')  onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel, onConfirm])

  if (!isOpen) return null

  const iconColors = {
    danger:  'bg-red-50 text-red-500',
    warning: 'bg-amber-50 text-amber-500',
    info:    'bg-primary/10 text-primary',
  }

  const btnColors = {
    danger:  'bg-red-500 hover:bg-red-600 focus:ring-red-300',
    warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300',
    info:    'bg-primary hover:bg-primary/90 focus:ring-primary/30',
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden
                   animate-[modal-in_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close X */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-dark/30 hover:text-dark/70 hover:bg-dark/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${iconColors[variant]}`}>
            {variant === 'danger'  && <Trash2        className="h-5 w-5" />}
            {variant === 'warning' && <AlertTriangle className="h-5 w-5" />}
            {variant === 'info'    && <AlertTriangle className="h-5 w-5" />}
          </div>

          <h2 id="modal-title" className="font-melodrama text-xl text-dark mb-2">
            {title}
          </h2>
          <p className="font-urwdin text-sm text-dark/60 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dark/15 text-dark/70
                       font-urwdin text-sm font-semibold hover:border-dark/30 hover:bg-dark/5
                       transition-all focus:outline-none focus:ring-2 focus:ring-dark/20"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-urwdin text-sm font-semibold
                        transition-all focus:outline-none focus:ring-2 ${btnColors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
