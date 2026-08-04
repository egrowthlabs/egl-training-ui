'use client'

import { useEffect, useState } from 'react'
import { getAllCatalogs, createCatalogItem, updateCatalogItem, deleteCatalogItem, CatalogItemFull } from '@/lib/api/catalogs'
import { Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/confirm-modal'

const CATALOG_TYPES = [
  { key: 'Category',  label: 'Categorías' },
  { key: 'Level',     label: 'Niveles' },
  { key: 'Intensity', label: 'Intensidades' },
  { key: 'Equipment', label: 'Equipamiento' },
  { key: 'Objective', label: 'Objetivos' },
]

export default function CatalogosPage() {
  const [items,       setItems]       = useState<CatalogItemFull[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeType,  setActiveType]  = useState<string>('Category')
  const [editingId,   setEditingId]   = useState<number | null>(null)
  const [editLabel,   setEditLabel]   = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [newLabel,    setNewLabel]    = useState('')
  const [newValue,    setNewValue]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    getAllCatalogs().then(setItems).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter(i => i.catalogType === activeType)

  const toValue = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-zA-Z0-9]/g, '')
       .replace(/^(.)/, c => c.toUpperCase())

  const handleAdd = async () => {
    if (!newLabel.trim() || !newValue.trim()) return
    setSaving(true); setError('')
    try {
      await createCatalogItem({ catalogType: activeType, value: newValue.trim(), label: newLabel.trim() })
      setNewLabel(''); setNewValue(''); setShowAdd(false)
      load()
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleEdit = async (id: number) => {
    if (!editLabel.trim()) return
    setSaving(true)
    try {
      const item = items.find(i => i.id === id)!
      await updateCatalogItem(id, { catalogType: item.catalogType, value: item.value, label: editLabel.trim(), sortOrder: item.sortOrder, isActive: item.isActive })
      setEditingId(null)
      load()
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleToggle = async (item: CatalogItemFull) => {
    try {
      await updateCatalogItem(item.id, { catalogType: item.catalogType, value: item.value, label: item.label, sortOrder: item.sortOrder, isActive: !item.isActive })
      load()
    } catch (err: any) { setError(err.message) }
  }

  const handleDelete = async () => {
    if (deleteTargetId === null) return
    try { await deleteCatalogItem(deleteTargetId); setDeleteTargetId(null); load() }
    catch (err: any) { setError(err.message); setDeleteTargetId(null) }
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-melodrama text-3xl text-dark">Catálogos</h1>
        <p className="text-dark/50 font-urwdin text-sm mt-1">Gestiona los valores de clasificación de las clases</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATALOG_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => { setActiveType(type.key); setShowAdd(false); setEditingId(null) }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-urwdin transition-all border',
              activeType === type.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-dark/70 border-secondary hover:border-primary hover:text-primary'
            )}
          >
            {type.label} ({items.filter(i => i.catalogType === type.key).length})
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3"><p className="text-sm text-red-600 font-urwdin">{error}</p></div>}

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-melodrama text-lg text-dark">
            {CATALOG_TYPES.find(t => t.key === activeType)?.label}
          </h2>
          <button
            onClick={() => { setShowAdd(v => !v); setNewLabel(''); setNewValue('') }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" /> Nuevo valor
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark mb-1 font-urwdin">Nombre a mostrar</label>
                <input
                  type="text" value={newLabel} autoFocus
                  onChange={e => { setNewLabel(e.target.value); setNewValue(toValue(e.target.value)) }}
                  placeholder="Ej: Yoga Restaurativo"
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark mb-1 font-urwdin">Clave interna</label>
                <input
                  type="text" value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  placeholder="YogaRestaurativo"
                  className="input-base text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm flex-1">Cancelar</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm flex-1 flex items-center gap-2 justify-center">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-dark/40 font-urwdin py-8">Sin valores en este catálogo</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                item.isActive ? 'bg-white border-secondary' : 'bg-secondary-50 border-dashed border-dark/20 opacity-60'
              )}>
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input
                      type="text" value={editLabel} autoFocus
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="input-base text-sm"
                    />
                  ) : (
                    <>
                      <p className="font-urwdin text-sm font-medium text-dark">{item.label}</p>
                      <p className="text-xs text-dark/40 font-mono">{item.value}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === item.id ? (
                    <>
                      <button onClick={() => handleEdit(item.id)} disabled={saving}
                        className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-secondary-100 text-dark/60 hover:bg-secondary-200">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleToggle(item)} title={item.isActive ? 'Desactivar' : 'Activar'}
                        className={cn('text-xs px-2 py-1 rounded-full font-urwdin font-medium transition-all',
                          item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-secondary-100 text-dark/40 hover:bg-secondary-200'
                        )}>
                        {item.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                      <button onClick={() => { setEditingId(item.id); setEditLabel(item.label) }}
                        className="p-1.5 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTargetId(item.id)}
                        className="p-1.5 rounded-lg text-dark/40 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      isOpen={deleteTargetId !== null}
      title="Eliminar valor de catálogo"
      message="¿Eliminar este valor? Las clases que ya lo usen mantendrán el texto guardado. Esta acción no se puede deshacer."
      confirmText="Sí, eliminar"
      variant="warning"
      onConfirm={handleDelete}
      onCancel={() => setDeleteTargetId(null)}
    />
    </>
  )
}
