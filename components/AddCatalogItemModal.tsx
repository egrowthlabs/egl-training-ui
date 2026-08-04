'use client'

import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { createCatalogItem } from '@/lib/api/catalogs'

interface Props {
  catalogType: string
  typeLabel: string
  onCreated: (value: string, label: string) => void
  onClose: () => void
}

export function AddCatalogItemModal({ catalogType, typeLabel, onCreated, onClose }: Props) {
  const [label,       setLabel]       = useState('')
  const [value,       setValue]       = useState('')
  const [autoValue,   setAutoValue]   = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  const toValue = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-zA-Z0-9]/g, '')
       .replace(/^(.)/, c => c.toUpperCase())

  const handleLabelChange = (val: string) => {
    setLabel(val)
    if (autoValue) setValue(toValue(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !value.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createCatalogItem({ catalogType, value: value.trim(), label: label.trim() })
      onCreated(value.trim(), label.trim())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-fade-in"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-melodrama text-lg text-dark">Nuevo {typeLabel}</h3>
          <button onClick={onClose} className="text-dark/40 hover:text-dark transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1 font-urwdin">
              Nombre a mostrar
            </label>
            <input
              type="text"
              value={label}
              onChange={e => handleLabelChange(e.target.value)}
              placeholder={`Ej: ${typeLabel} personalizada`}
              required
              autoFocus
              className="input-base"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-dark font-urwdin">Clave interna</label>
              <button
                type="button"
                onClick={() => setAutoValue(v => !v)}
                className="text-xs text-primary/70 hover:text-primary font-urwdin"
              >
                {autoValue ? 'Editar manual' : 'Auto'}
              </button>
            </div>
            <input
              type="text"
              value={value}
              onChange={e => { setAutoValue(false); setValue(e.target.value) }}
              disabled={autoValue}
              placeholder="ClaveSinEspacios"
              required
              className="input-base font-mono text-sm disabled:opacity-60"
            />
            <p className="text-xs text-dark/40 mt-1 font-urwdin">Identificador único. Sin espacios ni tildes.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-urwdin bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center gap-2 justify-center">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
