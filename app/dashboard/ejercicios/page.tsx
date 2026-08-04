'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getExercises, deleteExercise } from '@/lib/api/exercises'
import { getCatalogByType, CatalogItem } from '@/lib/api/catalogs'
import { Exercise, TRACKING_LABELS } from '@/lib/types/exercise'
import { useAuth } from '@/context/auth-context'
import { ConfirmModal } from '@/components/confirm-modal'
import { Dumbbell, Plus, Search, Edit, Trash2, Loader2, ImageIcon } from 'lucide-react'

export default function EjerciciosPage() {
  const { user } = useAuth()
  const isAdmin = user?.roles.includes('Admin') ?? false
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [trackingType, setTrackingType] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [page, setPage] = useState(1)
  const [catalogs, setCatalogs] = useState<Record<string, CatalogItem[]>>({ Category: [], Level: [] })
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null)

  useEffect(() => {
    Promise.all(['Category', 'Level'].map(t => getCatalogByType(t).then(items => ({ t, items }))))
      .then(results => {
        const map: Record<string, CatalogItem[]> = { Category: [], Level: [] }
        results.forEach(({ t, items }) => { map[t] = items })
        setCatalogs(map)
      }).catch(console.error)
  }, [])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const res = await getExercises({ search, trackingType, category, level, pageNumber: page, pageSize: 20 })
      setExercises(res.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [search, trackingType, category, level, page])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteExercise(deleteTarget.id)
      setDeleteTarget(null)
      loadExercises()
    } catch (err) {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Ejercicios</h1>
          <p className="text-dark/50 font-urwdin text-sm mt-1">Gestiona el catálogo de ejercicios individuales</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/ejercicios/nuevo" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo ejercicio
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base pl-10"
          />
        </div>
        <select
          value={trackingType}
          onChange={(e) => { setTrackingType(e.target.value); setPage(1); }}
          className="input-base md:w-48"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TRACKING_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input-base md:w-40">
          <option value="">Categoría</option>
          {catalogs.Category.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }} className="input-base md:w-40">
          <option value="">Nivel</option>
          {catalogs.Level.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exercises.map(exercise => (
            <Link key={exercise.id} href={`/dashboard/ejercicios/${exercise.id}`} className="card p-0 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="aspect-video relative bg-dark/5 border-b border-dark/10">
                {exercise.thumbnailUrl ? (
                  <img src={exercise.thumbnailUrl} alt={exercise.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark/20">
                    <Dumbbell className="h-10 w-10" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/30 transition-all flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all scale-75 group-hover:scale-100">
                    <svg className="h-5 w-5 text-primary ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {!exercise.isPublished && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">Borrador</span>
                )}
                {exercise.videoProviderId && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-400" title="Tiene video" />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-urwdin font-bold text-dark text-base leading-snug truncate group-hover:text-primary transition-colors">{exercise.title}</h3>
                <span className="inline-block mt-2 px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full self-start">
                  {TRACKING_LABELS[exercise.trackingType]}
                </span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {exercise.category && <span className="px-2 py-0.5 bg-dark/5 text-dark/70 text-[10px] uppercase tracking-wider rounded">{exercise.category}</span>}
                  {exercise.level && <span className="px-2 py-0.5 bg-dark/5 text-dark/70 text-[10px] uppercase tracking-wider rounded">{exercise.level}</span>}
                </div>
                {isAdmin && (
                  <div className="mt-auto pt-3 flex gap-2" onClick={e => e.preventDefault()}>
                    <Link href={`/dashboard/ejercicios/${exercise.id}/editar`} className="btn-secondary flex-1 flex justify-center py-1.5 text-xs">
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(exercise)}
                      className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-xs"
                      title="Eliminar ejercicio"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
          {exercises.length === 0 && (
            <div className="col-span-full py-12 text-center text-dark/50 font-urwdin">
              No se encontraron ejercicios.
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Eliminar ejercicio"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
