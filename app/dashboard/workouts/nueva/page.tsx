'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthHeaders, API_URL } from '@/lib/api'
import { ArrowLeft, Upload, Loader2, CheckCircle, ImageIcon, X, Plus, Link2, Film, FolderSearch } from 'lucide-react'
import { getCatalogByType, CatalogItem } from '@/lib/api/catalogs'
import { AddCatalogItemModal } from '@/components/AddCatalogItemModal'
import { saveWorkoutBlocks, getExercises } from '@/lib/api/exercises'
import { Exercise } from '@/lib/types/exercise'
import { VideoPickerModal } from '@/components/video-picker-modal'

// Constantes removidas en favor de catálogos dinámicos

export default function NuevaClasePage() {
  const router = useRouter()

  const [form, setForm] = useState({
    title:           '',
    description:     '',
    category:        'CardioConsciente',
    level:           'Principiante',
    objective:       'Tonificacion',
    thumbnailUrl:    '',
    videoProviderId: '',
    isFree:          false,
    isPublished:     false,
  })

  const [thumbFile,        setThumbFile]        = useState<File | null>(null)
  const [thumbPreview,     setThumbPreview]     = useState<string>('')
  const [thumbProgress,    setThumbProgress]    = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [submitting,       setSubmitting]       = useState(false)
  const [success,          setSuccess]          = useState(false)
  const [error,            setError]            = useState('')

  // Video upload state
  const [videoMode,        setVideoMode]        = useState<'upload'|'url'>('upload')
  const [videoFile,        setVideoFile]        = useState<File | null>(null)
  const [videoProgress,    setVideoProgress]    = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [videoError,       setVideoError]       = useState('')
  const [showVideoPicker,  setShowVideoPicker]  = useState(false)
  const MAX_VIDEO_MB = 500

  const [blocks, setBlocks] = useState<Array<{
    name: string;
    rounds: number;
    restTimerSeconds: number;
    exercises: Array<{
      exerciseId: number;
      exerciseTitle: string;
      exerciseThumbnailUrl?: string;
      trackingType: string;
      overrideReps?: number;
      overrideDurationSeconds?: number;
      overrideWeightLbs?: number;
      defaultRestTimerSeconds?: number;
      effectiveReps?: number;
      effectiveDurationSeconds?: number;
      effectiveWeightLbs?: number;
      notes?: string;
    }>;
  }>>([]);
  const [exerciseSearch, setExerciseSearch] = useState<Record<number, string>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<number, Exercise[]>>({});
  
  const addBlock = () => setBlocks(prev => [...prev, { name: `${String.fromCharCode(65 + prev.length)} BLOCK`, rounds: 3, restTimerSeconds: 60, exercises: [] }]);
  const removeBlock = (bi: number) => setBlocks(prev => prev.filter((_, i) => i !== bi));
  const updateBlock = (bi: number, field: string, value: any) => setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, [field]: value } : b));
  const removeExercise = (bi: number, ei: number) => setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== ei) } : b));
  const updateBlockExercise = (bi: number, ei: number, field: string, value: any) => setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e) } : b));
  const moveExercise = (bi: number, ei: number, dir: -1 | 1) => setBlocks(prev => prev.map((b, i) => {
    if (i !== bi) return b;
    const exs = [...b.exercises];
    [exs[ei], exs[ei + dir]] = [exs[ei + dir], exs[ei]];
    return { ...b, exercises: exs };
  }));
  const addExerciseToBlock = (bi: number, ex: Exercise) => {
    setBlocks(prev => prev.map((b, i) => i === bi ? {
      ...b,
      exercises: [...b.exercises, { 
        exerciseId: ex.id, 
        exerciseTitle: ex.title, 
        exerciseThumbnailUrl: ex.thumbnailUrl, 
        trackingType: ex.trackingType,
        effectiveReps: ex.defaultReps,
        effectiveDurationSeconds: ex.defaultDurationSeconds,
        effectiveWeightLbs: ex.defaultWeightLbs ?? undefined,
        defaultRestTimerSeconds: ex.defaultRestTimerSeconds
      }]
    } : b));
    setExerciseSearch(prev => ({ ...prev, [bi]: '' }));
    setExerciseResults(prev => ({ ...prev, [bi]: [] }));
  };

  const searchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const searchExercises = (bi: number, query: string) => {
    setExerciseSearch(prev => ({ ...prev, [bi]: query }));
    clearTimeout(searchTimers.current[bi]);
    if (!query.trim()) { setExerciseResults(prev => ({ ...prev, [bi]: [] })); return; }
    searchTimers.current[bi] = setTimeout(async () => {
      const res = await getExercises({ search: query, pageSize: 8 });
      setExerciseResults(prev => ({ ...prev, [bi]: res.items || [] }));
    }, 300);
  };

  const [catalogs, setCatalogs] = useState<Record<string, CatalogItem[]>>({
    Category: [], Level: [], Objective: []
  })
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    const types = ['Category', 'Level', 'Objective']
    Promise.all(types.map(t => getCatalogByType(t).then(items => ({ t, items }))))
      .then(results => {
        const map: Record<string, CatalogItem[]> = {}
        results.forEach(({ t, items }) => { map[t] = items })
        setCatalogs(map)
      })
      .catch(console.error)
  }, [])

  const handleCatalogItemCreated = (type: string, value: string, label: string) => {
    setCatalogs(prev => ({
      ...prev,
      [type]: [...prev[type], { id: 0, value, label, sortOrder: 99, isActive: true }]
    }))
    const fieldMap: Record<string, string> = {
      Category: 'category', Level: 'level', Objective: 'objective'
    }
    setForm(f => ({ ...f, [fieldMap[type]]: value }))
    setAddingTo(null)
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const toggleBool = (field: 'isFree' | 'isPublished') =>
    setForm(f => ({ ...f, [field]: !f[field] }))

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
    setThumbProgress('idle')
  }

  const handleUploadThumb = async () => {
    if (!thumbFile) return
    setThumbProgress('uploading')
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', thumbFile)
      const headers = getAuthHeaders() as Record<string, string>
      delete headers['Content-Type']
      const res = await fetch(`${API_URL}/api/workouts/upload-thumbnail`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? 'Error al subir la imagen')
      }
      const data = await res.json()
      setForm(f => ({ ...f, thumbnailUrl: data.url }))
      setThumbProgress('done')
    } catch (err: any) {
      setError(err.message)
      setThumbProgress('error')
    }
  }

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > MAX_VIDEO_MB) {
      setVideoError(`El archivo pesa ${sizeMB.toFixed(0)} MB. El límite es ${MAX_VIDEO_MB} MB. Usa la opción de URL/S3 key.`)
      setVideoMode('url')
      return
    }
    setVideoFile(file)
    setVideoError('')
    setVideoProgress('idle')
  }

  const handleUploadVideo = async () => {
    if (!videoFile) return
    setVideoProgress('uploading')
    setVideoError('')
    try {
      const formData = new FormData()
      formData.append('file', videoFile)
      const headers = getAuthHeaders() as Record<string, string>
      delete headers['Content-Type']
      const res = await fetch(`${API_URL}/api/workouts/upload-video`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? 'Error al subir el video')
      }
      const data = await res.json()
      setForm(f => ({ ...f, videoProviderId: data.key }))
      setVideoProgress('done')
    } catch (err: any) {
      setVideoError(err.message)
      setVideoProgress('error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('El título es obligatorio.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/workouts`, {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? body.title ?? 'Error al crear la clase')
      }
      
      const data = await res.json()
      if (blocks.length > 0) {
        await saveWorkoutBlocks(data.id, blocks.map((b, i) => ({
          name: b.name,
          rounds: b.rounds,
          order: i,
          restTimerSeconds: b.restTimerSeconds,
          exercises: b.exercises.map((e, j) => ({
            exerciseId: e.exerciseId,
            order: j,
            overrideReps: e.overrideReps,
            overrideDurationSeconds: e.overrideDurationSeconds,
            overrideWeightLbs: e.overrideWeightLbs,
            defaultRestTimerSeconds: e.defaultRestTimerSeconds,
            notes: e.notes,
          }))
        })));
      }
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/workouts'), 2000)
    
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="font-melodrama text-2xl text-dark">¡Clase creada!</p>
        <p className="text-dark/50 font-urwdin text-sm">Redirigiendo al catálogo...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-dark/60 hover:text-primary transition-colors font-urwdin"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      <div>
        <h1 className="font-melodrama text-3xl text-dark">Nueva Clase</h1>
        <p className="text-dark/50 font-urwdin text-sm mt-1">Agrega una clase al catálogo de re_line</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Información</h2>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Título *</label>
            <input type="text" value={form.title} onChange={set('title')} placeholder="Ej: Cardio Consciente con Bandas" required className="input-base" />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe la clase..."
              rows={3}
              className="input-base resize-none"
            />
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Thumbnail</label>
            <div className="border-2 border-dashed border-dark/20 rounded-xl overflow-hidden">
              {thumbPreview ? (
                <div className="relative">
                  <img src={thumbPreview} alt="Preview" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-dark/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                    {thumbProgress === 'idle' && (
                      <button type="button" onClick={handleUploadThumb}
                        className="btn-primary flex items-center gap-2 text-sm">
                        <Upload className="h-3 w-3" /> Subir a S3
                      </button>
                    )}
                    {thumbProgress === 'uploading' && (
                      <div className="flex items-center gap-2 text-white font-urwdin text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Subiendo...
                      </div>
                    )}
                    {thumbProgress === 'done' && (
                      <div className="flex items-center gap-2 text-green-300 font-urwdin text-sm">
                        <CheckCircle className="h-4 w-4" /> Guardado en S3
                      </div>
                    )}
                    <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(''); setThumbProgress('idle'); setForm(f => ({ ...f, thumbnailUrl: '' })) }}
                      className="bg-white/20 rounded-full p-1.5 text-white hover:bg-white/40">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {thumbProgress === 'done' && (
                    <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 cursor-pointer">
                  <ImageIcon className="h-8 w-8 text-dark/30" />
                  <span className="text-sm text-dark/50 font-urwdin">Selecciona JPG, PNG o WebP</span>
                  <span className="btn-secondary text-xs">Elegir imagen</span>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {thumbProgress === 'idle' && thumbFile && (
              <button type="button" onClick={handleUploadThumb}
                className="mt-2 btn-primary w-full flex items-center gap-2 justify-center">
                <Upload className="h-4 w-4" /> Subir thumbnail a S3
              </button>
            )}
            {form.thumbnailUrl && (
              <p className="text-xs text-green-600 font-urwdin mt-1 break-all">✓ {form.thumbnailUrl}</p>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5 font-urwdin">Video</label>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-dark/5 rounded-xl mb-3">
              <button type="button"
                onClick={() => setVideoMode('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-urwdin font-medium transition-all ${
                  videoMode === 'upload' ? 'bg-white text-dark shadow-sm' : 'text-dark/50 hover:text-dark'
                }`}>
                <Upload className="h-3.5 w-3.5" /> Subir archivo (≤{MAX_VIDEO_MB} MB)
              </button>
              <button type="button"
                onClick={() => setVideoMode('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-urwdin font-medium transition-all ${
                  videoMode === 'url' ? 'bg-white text-dark shadow-sm' : 'text-dark/50 hover:text-dark'
                }`}>
                <Link2 className="h-3.5 w-3.5" /> S3 Key / URL
              </button>
            </div>

            {videoMode === 'upload' ? (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-dark/20 rounded-xl">
                  {videoProgress === 'done' ? (
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-urwdin font-medium text-dark truncate">{videoFile?.name}</p>
                        <p className="text-xs text-green-600 font-urwdin">Subido correctamente a S3</p>
                        <p className="text-[10px] text-dark/40 font-mono truncate">{form.videoProviderId}</p>
                      </div>
                      <button type="button" onClick={() => { setVideoFile(null); setVideoProgress('idle'); setForm(f => ({ ...f, videoProviderId: '' })) }}
                        className="p-1.5 rounded-full hover:bg-dark/5 text-dark/40">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 cursor-pointer">
                      <Film className="h-8 w-8 text-dark/30" />
                      <span className="text-sm text-dark/50 font-urwdin">
                        {videoFile ? videoFile.name : 'Selecciona MP4 o MOV'}
                      </span>
                      {videoFile && (
                        <span className="text-xs text-dark/40 font-urwdin">
                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}
                      {!videoFile && <span className="btn-secondary text-xs">Elegir video</span>}
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-m4v"
                        onChange={handleVideoFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {videoFile && videoProgress === 'idle' && (
                  <button type="button" onClick={handleUploadVideo}
                    className="btn-primary w-full flex items-center gap-2 justify-center">
                    <Upload className="h-4 w-4" /> Subir video a S3
                  </button>
                )}
                {videoProgress === 'uploading' && (
                  <div className="flex items-center gap-2 justify-center py-2 text-sm text-dark/60 font-urwdin">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Subiendo {videoFile?.name}... puede tardar varios minutos
                  </div>
                )}
                {videoError && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-700 font-urwdin">{videoError}</p>
                    <button type="button" onClick={() => setVideoMode('url')}
                      className="mt-1.5 text-xs text-primary font-urwdin font-medium hover:underline">
                      Usar S3 Key / URL en su lugar →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Browse S3 button */}
                <button
                  type="button"
                  onClick={() => setShowVideoPicker(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             border-2 border-primary/30 text-primary bg-primary/5
                             hover:bg-primary/10 transition-all font-urwdin text-sm font-medium"
                >
                  <FolderSearch className="h-4 w-4" />
                  Buscar video en S3
                </button>

                <div className="flex items-center gap-2 text-dark/30">
                  <div className="flex-1 h-px bg-dark/10" />
                  <span className="text-xs font-urwdin">o pega la key manualmente</span>
                  <div className="flex-1 h-px bg-dark/10" />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-urwdin text-amber-800 font-medium mb-1">Para videos &gt;500 MB:</p>
                  <ol className="text-xs text-amber-700 font-urwdin space-y-0.5 list-decimal list-inside">
                    <li>Sube el video a S3 desde la consola de AWS o AWS CLI</li>
                    <li>Copia la key del objeto (ej: <code className="font-mono bg-amber-100 px-1 rounded">videos/rutina-funcional.mov</code>)</li>
                    <li>Pégala aquí abajo o usa el buscador de arriba</li>
                  </ol>
                </div>
                <input
                  type="text"
                  value={form.videoProviderId}
                  onChange={e => setForm(f => ({ ...f, videoProviderId: e.target.value.trim() }))}
                  placeholder="videos/rutina-funcional.mov"
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
        </div>

        <VideoPickerModal
          isOpen={showVideoPicker}
          currentKey={form.videoProviderId}
          onSelect={key => {
            setForm(f => ({ ...f, videoProviderId: key }))
            setVideoMode('url')
          }}
          onClose={() => setShowVideoPicker(false)}
        />

        {/* Clasificación */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Clasificación</h2>

          <div className="grid grid-cols-2 gap-4">
            {(['Category', 'Level'] as const).map(type => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-dark font-urwdin">
                    {{ Category: 'Categoría', Level: 'Nivel' }[type]}
                  </label>
                  <button type="button" onClick={() => setAddingTo(type)}
                    className="text-xs text-primary hover:underline font-urwdin flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Agregar nueva
                  </button>
                </div>
                <select 
                  value={form[({ Category: 'category', Level: 'level' } as Record<string, keyof typeof form>)[type]] as string} 
                  onChange={set(({ Category: 'category', Level: 'level' } as Record<string, string>)[type])} 
                  className="input-base"
                >
                  {catalogs[type].map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-dark font-urwdin">Objetivo</label>
                <button type="button" onClick={() => setAddingTo('Objective')}
                  className="text-xs text-primary hover:underline font-urwdin flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Agregar nueva
                </button>
              </div>
              <select value={form.objective} onChange={set('objective')} className="input-base">
                {catalogs.Objective.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Acceso y visibilidad */}
        <div className="card space-y-4">
          <h2 className="font-melodrama text-lg text-dark">Acceso y visibilidad</h2>

          {/* Toggle IsFree */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary-50">
            <div>
              <p className="font-urwdin font-medium text-dark text-sm">Clase gratuita</p>
              <p className="text-xs text-dark/50 font-urwdin">Cualquier usuario puede verla sin suscripción</p>
            </div>
            <button
              type="button"
              onClick={() => toggleBool('isFree')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.isFree ? 'bg-primary' : 'bg-dark/20'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isFree ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Toggle IsPublished */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary-50">
            <div>
              <p className="font-urwdin font-medium text-dark text-sm">Publicar clase</p>
              <p className="text-xs text-dark/50 font-urwdin">Si no está publicada, solo los admins pueden verla</p>
            </div>
            <button
              type="button"
              onClick={() => toggleBool('isPublished')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.isPublished ? 'bg-primary' : 'bg-dark/20'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isPublished ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600 font-urwdin">{error}</p>
          </div>
        )}

        
        {/* Bloques */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-melodrama text-lg text-dark">Bloques de ejercicios</h3>
            <button type="button" onClick={addBlock} className="btn-primary text-sm px-4 py-2">+ Agregar bloque</button>
          </div>
          {blocks.map((block, bi) => (
            <div key={bi} className="border border-dark/20 p-4 rounded-xl space-y-3">
              {/* Header del bloque */}
              <div className="flex items-center gap-3">
                <input value={block.name} onChange={e => updateBlock(bi, 'name', e.target.value)}
                  className="input-base flex-1 font-medium" placeholder="A BLOCK" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark/60 font-urwdin">Rounds</label>
                  <input type="number" min={1} max={10} value={block.rounds}
                    onChange={e => updateBlock(bi, 'rounds', Number(e.target.value))}
                    className="input-base w-16 text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark/60 font-urwdin">Rest (s)</label>
                  <input type="number" min={0} step={15} value={block.restTimerSeconds}
                    onChange={e => updateBlock(bi, 'restTimerSeconds', Number(e.target.value))}
                    className="input-base w-20 text-center" />
                </div>
                <button type="button" onClick={() => removeBlock(bi)} className="text-red-400 hover:text-red-600 p-1">✕</button>
              </div>

              {/* Ejercicios del bloque */}
              <div className="space-y-2">
                {block.exercises.map((ex, ei) => (
                  <div key={ei} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-secondary/20 rounded-lg p-3">
                    {ex.exerciseThumbnailUrl && <img src={ex.exerciseThumbnailUrl} className="w-10 h-10 rounded object-cover" />}
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-sm font-medium text-dark truncate">{ex.exerciseTitle}</p>
                      <span className="text-xs text-primary/70">{ex.trackingType}</span>
                    </div>
                    {(ex.trackingType.includes('reps')) && (
                      <input type="number" placeholder={String(ex.effectiveReps ?? ex.overrideReps ?? '12')} value={ex.overrideReps ?? ''}
                        onChange={e => updateBlockExercise(bi, ei, 'overrideReps', e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base w-20 text-center text-sm" title="Reps" />
                    )}
                    {(ex.trackingType.includes('time')) && (
                      <input type="number" placeholder={String(ex.effectiveDurationSeconds ?? ex.overrideDurationSeconds ?? '45')} value={ex.overrideDurationSeconds ?? ''}
                        onChange={e => updateBlockExercise(bi, ei, 'overrideDurationSeconds', e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base w-20 text-center text-sm" title="Tiempo (s)" />
                    )}
                    {(ex.trackingType.includes('weight')) && (
                      <input type="number" placeholder={String(ex.effectiveWeightLbs ?? ex.overrideWeightLbs ?? '0')} value={ex.overrideWeightLbs ?? ''}
                        onChange={e => updateBlockExercise(bi, ei, 'overrideWeightLbs', e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base w-20 text-center text-sm" title="Peso (lbs)" />
                    )}
                    <input type="number" placeholder={String(ex.defaultRestTimerSeconds ?? '30')} value={ex.defaultRestTimerSeconds ?? ''}
                        onChange={e => updateBlockExercise(bi, ei, 'defaultRestTimerSeconds', e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base w-24 text-center text-sm" title="Descanso (s)" />
                    <input placeholder="Per side, Alternating..." value={ex.notes ?? ''}
                      onChange={e => updateBlockExercise(bi, ei, 'notes', e.target.value)}
                      className="input-base w-32 text-sm" title="Notas" />
                    <button type="button" onClick={() => moveExercise(bi, ei, -1)} disabled={ei === 0} className="text-dark/40 hover:text-dark disabled:opacity-20">↑</button>
                    <button type="button" onClick={() => moveExercise(bi, ei, 1)} disabled={ei === block.exercises.length - 1} className="text-dark/40 hover:text-dark disabled:opacity-20">↓</button>
                    <button type="button" onClick={() => removeExercise(bi, ei)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>

              {/* Buscador de ejercicios */}
              <div className="relative">
                <input
                  value={exerciseSearch[bi] ?? ''}
                  onChange={e => searchExercises(bi, e.target.value)}
                  placeholder="Buscar y agregar ejercicio..."
                  className="input-base w-full"
                />
                {exerciseResults[bi] && exerciseResults[bi].length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-secondary rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {exerciseResults[bi].map(ex => (
                      <button key={ex.id} type="button" onClick={() => addExerciseToBlock(bi, ex)}
                        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-secondary/20 text-left">
                        {ex.thumbnailUrl && <img src={ex.thumbnailUrl} className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <p className="text-sm font-medium">{ex.title}</p>
                          <p className="text-xs text-dark/50">{ex.trackingType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <span className="flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span>
          ) : 'Crear clase'}
        </button>
      </form>

      {addingTo && (
        <AddCatalogItemModal
          catalogType={addingTo}
          typeLabel={{ Category: 'Categoría', Level: 'Nivel', Objective: 'Objetivo' }[addingTo] ?? addingTo}
          onCreated={(value, label) => handleCatalogItemCreated(addingTo, value, label)}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  )
}
