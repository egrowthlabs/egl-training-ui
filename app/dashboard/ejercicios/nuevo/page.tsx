'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createExercise, uploadExerciseVideo } from '@/lib/api/exercises'
import { TRACKING_LABELS, TrackingType } from '@/lib/types/exercise'
import { ArrowLeft, Plus, Upload, CheckCircle, Loader2, FolderSearch, Film, X, ImageIcon } from 'lucide-react'
import { getCatalogByType, CatalogItem } from '@/lib/api/catalogs'
import { AddCatalogItemModal } from '@/components/AddCatalogItemModal'
import { VideoPickerModal } from '@/components/video-picker-modal'
import { getAuthHeaders, API_URL } from '@/lib/api'

const CATALOG_FIELDS = ['Category', 'Level', 'Intensity', 'Equipment', 'Objective'] as const
const FIELD_LABELS: Record<string, string> = {
  Category: 'Categoría', Level: 'Nivel', Intensity: 'Intensidad',
  Equipment: 'Equipo', Objective: 'Objetivo',
}
const FIELD_MAP: Record<string, string> = {
  Category: 'category', Level: 'level', Intensity: 'intensity',
  Equipment: 'equipment', Objective: 'objective',
}
const MAX_VIDEO_MB = 500

export default function NuevoEjercicioPage() {
  const router  = useRouter()
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    trackingType:    'reps_weight' as TrackingType,
    category:        'CardioConsciente',
    level:           'Principiante',
    intensity:       'Media',
    equipment:       'SinEquipo',
    objective:       'Tonificacion',
    isPublished:     true,
    videoProviderId: '' as string,
    thumbnailUrl:    '' as string,
  })

  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState('')
  const [catalogs,        setCatalogs]        = useState<Record<string, CatalogItem[]>>({
    Category: [], Level: [], Intensity: [], Equipment: [], Objective: []
  })
  const [addingTo,        setAddingTo]        = useState<string | null>(null)

  // Video state
  const [videoMode,       setVideoMode]       = useState<'upload'|'url'>('upload')
  const [videoFile,       setVideoFile]       = useState<File | null>(null)
  const [videoProgress,   setVideoProgress]   = useState<number | null>(null)
  const [videoUploaded,   setVideoUploaded]   = useState(false)
  const [videoError,      setVideoError]      = useState('')
  const [showPicker,      setShowPicker]      = useState(false)

  // Thumbnail state
  const [thumbFile,       setThumbFile]       = useState<File | null>(null)
  const [thumbPreview,    setThumbPreview]    = useState('')
  const [thumbUploading,  setThumbUploading]  = useState(false)
  const [thumbDone,       setThumbDone]       = useState(false)

  useEffect(() => {
    Promise.all(CATALOG_FIELDS.map(t => getCatalogByType(t).then(items => ({ t, items }))))
      .then(results => {
        const map: Record<string, CatalogItem[]> = {}
        results.forEach(({ t, items }) => { map[t] = items })
        setCatalogs(map)
      }).catch(console.error)
  }, [])

  const handleCatalogItemCreated = (type: string, value: string, label: string) => {
    setCatalogs(prev => ({ ...prev, [type]: [...prev[type], { id: 0, value, label, sortOrder: 99, isActive: true }] }))
    setForm(f => ({ ...f, [FIELD_MAP[type]]: value }))
    setAddingTo(null)
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  // ── Video upload ──────────────────────────────────────────────────────────
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > MAX_VIDEO_MB) {
      setVideoError(`El archivo pesa ${sizeMB.toFixed(0)} MB. Límite: ${MAX_VIDEO_MB} MB. Usa "S3 Key" en su lugar.`)
      setVideoMode('url')
      return
    }
    setVideoFile(file)
    setVideoError('')
    setVideoProgress(null)
    setVideoUploaded(false)
  }

  const handleUploadVideo = async () => {
    if (!videoFile) return
    setVideoProgress(0)
    setVideoError('')
    try {
      const key = await uploadExerciseVideo(videoFile, pct => setVideoProgress(pct))
      setForm(f => ({ ...f, videoProviderId: key }))
      setVideoUploaded(true)
      setVideoProgress(null)
    } catch (err: any) {
      setVideoError(err.message)
      setVideoProgress(null)
    }
  }

  // ── Thumbnail upload ──────────────────────────────────────────────────────
  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
    setThumbDone(false)
  }

  const handleUploadThumb = async () => {
    if (!thumbFile) return
    setThumbUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', thumbFile)
      const headers = getAuthHeaders() as Record<string, string>
      delete headers['Content-Type']
      const res = await fetch(`${API_URL}/api/workouts/upload-thumbnail`, {
        method: 'POST', headers, body: formData,
      })
      if (!res.ok) throw new Error('Error al subir imagen')
      const data = await res.json()
      setForm(f => ({ ...f, thumbnailUrl: data.url }))
      setThumbDone(true)
    } catch (err: any) {
      setVideoError(err.message)
    } finally {
      setThumbUploading(false)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createExercise({
        ...form,
        videoProviderId: form.videoProviderId || undefined,
        thumbnailUrl:    form.thumbnailUrl    || undefined,
      })
      router.push('/dashboard/ejercicios')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div>
        <h1 className="font-melodrama text-2xl text-dark">Nuevo Ejercicio</h1>
        <p className="text-sm text-dark/50 font-urwdin mt-1">
          Agrega un ejercicio al catálogo. Los rounds, reps y descansos se configuran al armar una clase.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Título *</label>
          <input type="text" value={form.title} onChange={set('title')} className="input-base"
            placeholder="Ej: Sentadilla con barra" required />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Descripción</label>
          <textarea value={form.description} onChange={set('description')} className="input-base" rows={3}
            placeholder="Descripción breve del movimiento, músculos trabajados, etc." />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Thumbnail</label>
          <div className="border-2 border-dashed border-dark/20 rounded-xl overflow-hidden">
            {thumbPreview ? (
              <div className="relative">
                <img src={thumbPreview} alt="Preview" className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-dark/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                  {!thumbDone && !thumbUploading && (
                    <button type="button" onClick={handleUploadThumb}
                      className="btn-primary flex items-center gap-2 text-sm">
                      <Upload className="h-3 w-3" /> Subir a S3
                    </button>
                  )}
                  {thumbUploading && <Loader2 className="h-6 w-6 animate-spin text-white" />}
                  {thumbDone && <div className="flex items-center gap-2 text-green-300 font-urwdin text-sm"><CheckCircle className="h-4 w-4" /> Guardado</div>}
                  <button type="button"
                    onClick={() => { setThumbFile(null); setThumbPreview(''); setThumbDone(false); setForm(f => ({ ...f, thumbnailUrl: '' })) }}
                    className="bg-white/20 rounded-full p-1.5 text-white hover:bg-white/40">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {thumbDone && <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1"><CheckCircle className="h-3 w-3 text-white" /></div>}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-5 cursor-pointer">
                <ImageIcon className="h-7 w-7 text-dark/30" />
                <span className="text-sm text-dark/50 font-urwdin">JPG, PNG o WebP</span>
                <span className="btn-secondary text-xs">Elegir imagen</span>
                <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbSelect} className="hidden" />
              </label>
            )}
          </div>
          {thumbFile && !thumbDone && (
            <button type="button" onClick={handleUploadThumb} disabled={thumbUploading}
              className="mt-2 btn-primary w-full flex items-center gap-2 justify-center text-sm">
              {thumbUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {thumbUploading ? 'Subiendo...' : 'Subir thumbnail a S3'}
            </button>
          )}
        </div>

        {/* Video */}
        <div>
          <label className="block text-sm font-medium text-dark font-urwdin mb-1.5">Video</label>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-dark/5 rounded-xl mb-3">
            <button type="button" onClick={() => setVideoMode('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-urwdin font-medium transition-all ${
                videoMode === 'upload' ? 'bg-white text-dark shadow-sm' : 'text-dark/50 hover:text-dark'
              }`}>
              <Upload className="h-3.5 w-3.5" /> Subir archivo (≤{MAX_VIDEO_MB} MB)
            </button>
            <button type="button" onClick={() => setVideoMode('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-urwdin font-medium transition-all ${
                videoMode === 'url' ? 'bg-white text-dark shadow-sm' : 'text-dark/50 hover:text-dark'
              }`}>
              <FolderSearch className="h-3.5 w-3.5" /> Buscar en S3
            </button>
          </div>

          {videoMode === 'upload' ? (
            <div className="space-y-2">
              <div
                className="border-2 border-dashed border-dark/20 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVideoFileSelect({ target: { files: [f] } } as any) }}
              >
                <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/x-m4v"
                  onChange={handleVideoFileSelect} className="hidden" />

                {videoUploaded ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-urwdin font-medium text-dark truncate">{videoFile?.name}</p>
                      <p className="text-xs text-green-600 font-urwdin">Subido correctamente a S3</p>
                      <p className="text-[10px] text-dark/40 font-mono truncate">{form.videoProviderId}</p>
                    </div>
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setVideoFile(null); setVideoUploaded(false); setForm(f => ({ ...f, videoProviderId: '' })) }}
                      className="p-1.5 rounded-full hover:bg-dark/5 text-dark/40">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : videoProgress !== null ? (
                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-urwdin text-dark/60 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Subiendo {videoFile?.name}... {videoProgress}%
                    </div>
                    <div className="w-full bg-dark/10 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6">
                    <Film className="h-8 w-8 text-dark/30" />
                    <span className="text-sm text-dark/50 font-urwdin">
                      {videoFile ? videoFile.name : 'Arrastra o selecciona MP4 / MOV'}
                    </span>
                    {videoFile && <span className="text-xs text-dark/40 font-urwdin">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                    {!videoFile && <span className="btn-secondary text-xs">Elegir video</span>}
                  </div>
                )}
              </div>

              {videoFile && !videoUploaded && videoProgress === null && (
                <button type="button" onClick={handleUploadVideo}
                  className="btn-primary w-full flex items-center gap-2 justify-center">
                  <Upload className="h-4 w-4" /> Subir video a S3
                </button>
              )}

              {videoError && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-700 font-urwdin">{videoError}</p>
                  <button type="button" onClick={() => setVideoMode('url')}
                    className="mt-1.5 text-xs text-primary font-urwdin font-medium hover:underline">
                    Buscar en S3 en su lugar →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button type="button" onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                           border-2 border-primary/30 text-primary bg-primary/5
                           hover:bg-primary/10 transition-all font-urwdin text-sm font-medium">
                <FolderSearch className="h-4 w-4" /> Buscar video en S3
              </button>

              <div className="flex items-center gap-2 text-dark/30">
                <div className="flex-1 h-px bg-dark/10" />
                <span className="text-xs font-urwdin">o pega la S3 key</span>
                <div className="flex-1 h-px bg-dark/10" />
              </div>

              <input
                type="text"
                value={form.videoProviderId}
                onChange={e => setForm(f => ({ ...f, videoProviderId: e.target.value.trim() }))}
                placeholder="exercises/mi-video.mp4"
                className="input-base font-mono text-sm"
              />
              {form.videoProviderId && (
                <p className="text-xs text-green-600 font-urwdin flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {form.videoProviderId}
                </p>
              )}
            </div>
          )}
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
            Publicar ejercicio (visible para coaches y clientes)
          </label>
        </div>

        {error && <p className="text-red-500 text-sm font-urwdin">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Guardando...' : 'Crear ejercicio'}
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
        isOpen={showPicker}
        currentKey={form.videoProviderId}
        onSelect={key => {
          setForm(f => ({ ...f, videoProviderId: key }))
          setVideoUploaded(true)
          setVideoMode('url')
        }}
        onClose={() => setShowPicker(false)}
      />
    </div>
  )
}
