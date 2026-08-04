'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getExerciseById, updateExercise, uploadExerciseVideo, getExerciseStreamUrl } from '@/lib/api/exercises'
import { TRACKING_LABELS, TrackingType } from '@/lib/types/exercise'
import { ArrowLeft, Loader2, Plus, Upload, CheckCircle, RefreshCw, FolderSearch } from 'lucide-react'
import { getCatalogByType, CatalogItem } from '@/lib/api/catalogs'
import { AddCatalogItemModal } from '@/components/AddCatalogItemModal'
import { VideoPickerModal } from '@/components/video-picker-modal'

const CATALOG_FIELDS = ['Category', 'Level', 'Intensity', 'Equipment', 'Objective'] as const
const FIELD_LABELS: Record<string, string> = {
  Category: 'Categoría', Level: 'Nivel', Intensity: 'Intensidad',
  Equipment: 'Equipo', Objective: 'Objetivo',
}
const FIELD_MAP: Record<string, string> = {
  Category: 'category', Level: 'level', Intensity: 'intensity',
  Equipment: 'equipment', Objective: 'objective',
}

export default function EditarEjercicioPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const exerciseId = parseInt(params.id, 10)

  const [form, setForm] = useState({
    title: '',
    description: '',
    trackingType: 'reps_weight' as TrackingType,
    category: 'CardioConsciente',
    level: 'Principiante',
    intensity: 'Media',
    equipment: 'SinEquipo',
    objective: 'Tonificacion',
    isPublished: true,
    // Mantenemos el video para no perder la S3 key al hacer PUT
    videoProviderId: undefined as string | undefined,
    thumbnailUrl: undefined as string | undefined,
  })

  const [loading,        setLoading]        = useState(true)
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadDone,     setUploadDone]     = useState(false)
  const [streamUrl,      setStreamUrl]      = useState<string | null>(null)
  const [loadingStream,  setLoadingStream]  = useState(false)
  const [videoError,     setVideoError]     = useState(false)
  const [showVideoPicker, setShowVideoPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [catalogs, setCatalogs] = useState<Record<string, CatalogItem[]>>({
    Category: [], Level: [], Intensity: [], Equipment: [], Objective: []
  })
  const [addingTo, setAddingTo] = useState<string | null>(null)

  useEffect(() => {
    Promise.all(CATALOG_FIELDS.map(t => getCatalogByType(t).then(items => ({ t, items }))))
      .then(results => {
        const map: Record<string, CatalogItem[]> = {}
        results.forEach(({ t, items }) => { map[t] = items })
        setCatalogs(map)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    getExerciseById(exerciseId)
      .then(ex => {
        setForm({
          title:           ex.title,
          description:     ex.description || '',
          trackingType:    ex.trackingType as TrackingType,
          category:        ex.category || 'CardioConsciente',
          level:           ex.level || 'Principiante',
          intensity:       ex.intensity || 'Media',
          equipment:       ex.equipment || 'SinEquipo',
          objective:       ex.objective || 'Tonificacion',
          isPublished:     ex.isPublished,
          videoProviderId: ex.videoProviderId ?? undefined,
          thumbnailUrl:    ex.thumbnailUrl ?? undefined,
        })
        // Si tiene video, cargamos el stream URL para preview
        if (ex.videoProviderId) {
          setLoadingStream(true)
          getExerciseStreamUrl(exerciseId)
            .then(url => setStreamUrl(url))
            .catch(() => {}) // silencioso si falla el stream
            .finally(() => setLoadingStream(false))
        }
      })
      .catch(() => setError('Error al cargar el ejercicio'))
      .finally(() => setLoading(false))
  }, [exerciseId])

  const handleCatalogItemCreated = (type: string, value: string, label: string) => {
    setCatalogs(prev => ({ ...prev, [type]: [...prev[type], { id: 0, value, label, sortOrder: 99, isActive: true }] }))
    setForm(f => ({ ...f, [FIELD_MAP[type]]: value }))
    setAddingTo(null)
  }

  const handleVideoChange = async (file: File) => {
    setUploadProgress(0)
    setUploadDone(false)
    setError('')
    try {
      const key = await uploadExerciseVideo(file, pct => setUploadProgress(pct))
      setForm(f => ({ ...f, videoProviderId: key }))
      setUploadDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Error al subir el video')
    } finally {
      setUploadProgress(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateExercise(exerciseId, form)
      router.push('/dashboard/ejercicios')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div>
        <h1 className="font-melodrama text-2xl text-dark">Editar Ejercicio</h1>
        <p className="text-sm text-dark/50 font-urwdin mt-1">
          Los rounds, reps y descansos se configuran al armar una clase.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Título *</label>
          <input type="text" value={form.title} onChange={set('title')} className="input-base" required />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Descripción</label>
          <textarea value={form.description} onChange={set('description')} className="input-base" rows={3} />
        </div>

        {/* Tipo de tracking */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Tipo de tracking</label>
          <p className="text-xs text-dark/50 font-urwdin mb-2">¿Cómo se mide este ejercicio?</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(TRACKING_LABELS) as [TrackingType, string][]).map(([k, v]) => (
              <label key={k} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                form.trackingType === k ? 'border-primary bg-primary/5 text-primary' : 'border-dark/10 hover:border-primary/40'
              }`}>
                <input type="radio" name="trackingType" value={k}
                  checked={form.trackingType === k}
                  onChange={() => setForm(f => ({ ...f, trackingType: k }))}
                  className="sr-only" />
                <span className="text-sm font-urwdin">{v}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clasificación */}
        <div>
          <p className="text-sm font-medium text-dark font-urwdin mb-3">Clasificación</p>
          <div className="grid grid-cols-2 gap-4">
            {CATALOG_FIELDS.map(type => (
              <div key={type} className={type === 'Objective' ? 'col-span-2' : ''}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-dark/70 font-urwdin">{FIELD_LABELS[type]}</label>
                  <button type="button" onClick={() => setAddingTo(type)}
                    className="text-xs text-primary hover:underline font-urwdin flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Nueva
                  </button>
                </div>
                <select
                  value={form[FIELD_MAP[type] as keyof typeof form] as string}
                  onChange={set(FIELD_MAP[type])}
                  className="input-base"
                >
                  {catalogs[type].map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Publicado */}
        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" id="isPublished" checked={form.isPublished}
            onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
            className="h-4 w-4 rounded border-dark/20 text-primary focus:ring-primary" />
          <label htmlFor="isPublished" className="text-sm font-urwdin text-dark">
            Publicar ejercicio
          </label>
        </div>

        {/* Video */}
        <div>
          <p className="text-sm font-medium text-dark font-urwdin mb-3">Video del ejercicio</p>

          {/* Preview del video actual */}
          {(streamUrl || loadingStream) && !uploadDone && (
            <div className="rounded-xl overflow-hidden aspect-video bg-dark mb-3 relative">
              {loadingStream ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
                </div>
              ) : streamUrl && !videoError ? (
                <video
                  src={streamUrl}
                  controls
                  className="w-full h-full"
                  onError={() => setVideoError(true)}
                />
              ) : (
                // Video no disponible en S3
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark/90">
                  <RefreshCw className="h-8 w-8 text-white/30 mb-2" />
                  <p className="text-white/60 text-sm font-urwdin">Video no disponible</p>
                  <p className="text-white/30 text-xs font-mono mt-1">{form.videoProviderId}</p>
                  <p className="text-white/40 text-xs font-urwdin mt-2">Sube un nuevo archivo para reemplazarlo</p>
                </div>
              )}
            </div>
          )}

          {/* Video nuevo subido con éxito */}
          {uploadDone && form.videoProviderId && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-3 text-xs font-urwdin bg-green-50 text-green-700 border border-green-200">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Video actualizado: </span>
              <span className="font-mono truncate">{form.videoProviderId}</span>
            </div>
          )}

          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-dark/20 rounded-xl p-5 text-center hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleVideoChange(file)
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-m4v"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoChange(f) }}
            />

            {uploadProgress !== null ? (
              <div className="space-y-2">
                <Loader2 className="h-7 w-7 text-primary animate-spin mx-auto" />
                <p className="text-sm font-urwdin text-dark/70">Subiendo... {uploadProgress}%</p>
                <div className="w-full bg-dark/10 rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                {form.videoProviderId
                  ? <RefreshCw className="h-6 w-6 text-dark/30 group-hover:text-primary mx-auto transition-colors" />
                  : <Upload className="h-6 w-6 text-dark/30 group-hover:text-primary mx-auto transition-colors" />}
                <p className="text-sm font-urwdin text-dark/60 mt-2">
                  {form.videoProviderId ? 'Reemplazar video' : 'Subir video'}
                </p>
                <p className="text-xs text-dark/40 font-urwdin mt-0.5">MP4, MOV — máx. 500 MB</p>
              </>
            )}
          </div>

          {/* Buscar en S3 */}
          <button
            type="button"
            onClick={() => setShowVideoPicker(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl
                       border-2 border-primary/30 text-primary bg-primary/5
                       hover:bg-primary/10 transition-all font-urwdin text-sm font-medium"
          >
            <FolderSearch className="h-4 w-4" />
            Buscar video existente en S3
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {addingTo && (
        <AddCatalogItemModal
          catalogType={addingTo}
          typeLabel={FIELD_LABELS[addingTo] ?? addingTo}
          onCreated={(value, label) => handleCatalogItemCreated(addingTo, value, label)}
          onClose={() => setAddingTo(null)}
        />
      )}

      <VideoPickerModal
        isOpen={showVideoPicker}
        currentKey={form.videoProviderId ?? ''}
        onSelect={key => {
          setForm(f => ({ ...f, videoProviderId: key }))
          setUploadDone(true)
          setStreamUrl(null)
        }}
        onClose={() => setShowVideoPicker(false)}
      />
    </div>
  )
}
