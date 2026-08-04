'use client'

/**
 * CoverImageUploader — componente reutilizable para subir una imagen de portada.
 * Muestra preview local inmediato, luego sube al backend (→ S3) y entrega la URL permanente.
 *
 * Props:
 *  - value:     URL actual de la imagen (puede ser null/undefined)
 *  - onChange:  callback con la nueva URL de S3 tras la subida
 *  - onError:   callback con el mensaje de error si la subida falla
 *  - uploading: se llama con true/false para que el padre pueda bloquear el guardado
 */

import { useRef, useState, useCallback } from 'react'
import { uploadProgramCover } from '@/lib/api/programs'
import { ImagePlus, Loader2, Trash2, CheckCircle2 } from 'lucide-react'

interface Props {
  value?:     string | null
  onChange:   (url: string) => void
  onError?:   (msg: string) => void
  onUploading?: (loading: boolean) => void
  label?:     string
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_MB   = 5

export function CoverImageUploader({
  value, onChange, onError, onUploading, label = 'Imagen de portada',
}: Props) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  // Muestra la imagen actual (S3 URL) o la preview local
  const displayUrl = preview ?? value ?? null

  const handleFile = useCallback(async (file: File) => {
    // Validación client-side
    if (!file.type.startsWith('image/')) {
      onError?.('Solo se permiten imágenes (JPEG, PNG, WebP, GIF).')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      onError?.(`La imagen no puede superar ${MAX_MB} MB.`)
      return
    }

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setSuccess(false)

    // Upload
    setLoading(true)
    onUploading?.(true)
    try {
      const s3Url = await uploadProgramCover(file)
      onChange(s3Url)
      setSuccess(true)
      // Revocar el object URL para liberar memoria
      URL.revokeObjectURL(localUrl)
      setPreview(null)        // ahora usamos la URL de S3
    } catch (e: any) {
      onError?.(e.message ?? 'Error al subir la imagen.')
      setPreview(null)        // revertir preview si falla
    } finally {
      setLoading(false)
      onUploading?.(false)
    }
  }, [onChange, onError, onUploading])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''       // reset input para poder subir el mismo archivo otra vez
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    setPreview(null)
    setSuccess(false)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark font-urwdin">{label}</label>

      {displayUrl ? (
        /* ── Preview con imagen ───────────────────────── */
        <div className="relative group rounded-xl overflow-hidden border border-dark/10 h-44 bg-secondary">
          <img
            src={displayUrl}
            alt="Portada"
            className="w-full h-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-1.5 bg-white text-dark text-xs font-urwdin font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-urwdin font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Quitar
            </button>
          </div>

          {/* Upload spinner */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
              <span className="text-white text-xs font-urwdin">Subiendo...</span>
            </div>
          )}

          {/* Success flash */}
          {success && !loading && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-urwdin px-2 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Guardada
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ── Drop zone vacío ──────────────────────────── */
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="h-44 rounded-xl border-2 border-dashed border-dark/20 bg-secondary/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-urwdin text-dark/50">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-dark/30 group-hover:text-primary transition-colors" />
              <p className="text-sm font-urwdin text-dark/50 group-hover:text-dark/70 transition-colors">
                Haz clic o arrastra una imagen aquí
              </p>
              <p className="text-xs font-urwdin text-dark/30">
                JPEG, PNG, WebP · Máx {MAX_MB} MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
