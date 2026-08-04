'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getAuthHeaders, API_URL } from '@/lib/api'
import { Film, Search, X, Loader2, CheckCircle, HardDrive, Clock } from 'lucide-react'

interface S3VideoItem {
  key:          string   // videos/rutina.mp4
  fileName:     string   // rutina.mp4
  sizeBytes:    number
  lastModified: string
}

interface VideoPickerModalProps {
  isOpen:    boolean
  onSelect:  (key: string) => void
  onClose:   () => void
  currentKey?: string
}

function fmtSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function VideoPickerModal({ isOpen, onSelect, onClose, currentKey }: VideoPickerModalProps) {
  const [videos,    setVideos]    = useState<S3VideoItem[]>([])
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState<string>(currentKey ?? '')
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchVideos = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ prefix: '' })
      if (q.trim()) params.set('search', q.trim())
      const res = await fetch(`${API_URL}/api/workouts/videos?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Error al listar videos')
      setVideos(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on open
  useEffect(() => {
    if (!isOpen) return
    setSearch('')
    setSelected(currentKey ?? '')
    fetchVideos('')
    setTimeout(() => searchRef.current?.focus(), 100)
  }, [isOpen, currentKey, fetchVideos])

  // Debounced search
  const handleSearch = (q: string) => {
    setSearch(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchVideos(q), 350)
  }

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden
                   animate-[modal-in_0.2s_ease-out]"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar video de S3"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-dark/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Film className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-melodrama text-lg text-dark leading-none">Videos en S3</h2>
            <p className="text-xs text-dark/50 font-urwdin mt-0.5">
              {loading
                ? 'Cargando...'
                : search
                  ? `${videos.length} resultado${videos.length !== 1 ? 's' : ''}`
                  : `${videos.length} más recientes — busca para ver todos`
              }
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark/5 text-dark/40 hover:text-dark/70 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-dark/5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nombre para ver todos los videos..."
              className="input-base pl-10 text-sm"
            />
            {search && (
              <button onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark/70">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-dark/40 gap-2">
              <Film className="h-8 w-8" />
              <p className="font-urwdin text-sm">No se encontraron videos</p>
            </div>
          ) : (
            <div className="space-y-1">
              {videos.map(v => {
                const isActive = selected === v.key
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setSelected(v.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-primary/10 border-2 border-primary/30'
                        : 'hover:bg-dark/5 border-2 border-transparent'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary/20' : 'bg-dark/5'
                    }`}>
                      {isActive
                        ? <CheckCircle className="h-5 w-5 text-primary" />
                        : <Film className="h-5 w-5 text-dark/40" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-urwdin font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-dark'}`}>
                        {v.fileName}
                      </p>
                      <p className="text-[10px] text-dark/40 font-mono truncate">{v.key}</p>
                    </div>

                    {/* Meta */}
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-dark/50 font-urwdin justify-end">
                        <HardDrive className="h-3 w-3" />
                        {fmtSize(v.sizeBytes)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-dark/35 font-urwdin justify-end">
                        <Clock className="h-2.5 w-2.5" />
                        {fmtDate(v.lastModified)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-dark/10 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dark/15 text-dark/70
                       font-urwdin text-sm font-semibold hover:border-dark/30 hover:bg-dark/5 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => { onSelect(selected); onClose() }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-urwdin text-sm
                       font-semibold hover:bg-primary/90 transition-all disabled:opacity-40
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {selected
              ? <><CheckCircle className="h-4 w-4" /> Usar este video</>
              : 'Seleccionar video'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
