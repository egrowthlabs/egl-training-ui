'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { getPrograms, deleteProgram } from '@/lib/api/programs'
import type { ProgramDto } from '@/lib/types/program'
import {
  Plus, Calendar, Trash2, Pencil, LayoutGrid,
  CheckCircle2, XCircle, Loader2, AlertTriangle, Lock, Sparkles,
} from 'lucide-react'
import { getSubscriptionStatus } from '@/lib/api/stripe'
import { PaywallCardBadge, PaywallBadge } from '@/components/paywall-overlay'

export default function ProgramasPage() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

  const [programs, setPrograms]   = useState<ProgramDto[]>([])
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState('')
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [confirm,  setConfirm]    = useState<ProgramDto | null>(null)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)

  useEffect(() => {
    getSubscriptionStatus()
      .then(s => setHasSubscription(s.isActive))
      .catch(() => setHasSubscription(false))
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getPrograms({ onlyActive: false, pageSize: 50 })
      setPrograms(res.items ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(p: ProgramDto) {
    setDeleting(p.id)
    setConfirm(null)
    try {
      await deleteProgram(p.id)
      setPrograms(prev => prev.filter(x => x.id !== p.id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-melodrama text-2xl text-dark">Programas</h1>
          <p className="text-sm text-dark/50 font-urwdin mt-0.5">
            Planes de entrenamiento estructurados por semanas
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/programas/nuevo" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo programa
          </Link>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="card text-center py-16">
          <LayoutGrid className="h-10 w-10 text-dark/20 mx-auto mb-3" />
          <p className="font-melodrama text-dark/40">No hay programas creados</p>
          {isAdmin && (
            <Link href="/dashboard/programas/nuevo" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Crear el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              isAdmin={!!isAdmin}
              isDeleting={deleting === p.id}
              hasSubscription={hasSubscription}
              onDeleteClick={() => setConfirm(p)}
            />
          ))}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-melodrama text-lg text-dark">¿Eliminar programa?</h3>
            <p className="font-urwdin text-sm text-dark/60">
              Se eliminará <strong>{confirm.name}</strong> y todos sus días asignados.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-dark/20 text-sm font-urwdin text-dark hover:bg-secondary/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-urwdin hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProgramCard({
  program, isAdmin, isDeleting, hasSubscription, onDeleteClick,
}: {
  program: ProgramDto
  isAdmin: boolean
  isDeleting: boolean
  hasSubscription: boolean | null
  onDeleteClick: () => void
}) {
  const isLocked = !isAdmin && program.accessType === 'subscription' && hasSubscription === false
  return (
    <div className="card group overflow-hidden p-0 flex flex-col hover:shadow-md transition-shadow">
      {/* Cover */}
      <div className="relative h-36 bg-gradient-to-br from-primary/20 to-secondary overflow-hidden">
        {program.coverImageUrl ? (
          <img src={program.coverImageUrl} alt={program.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-primary/30" />
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-2 right-2 inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full border
          ${program.isActive
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {program.isActive
            ? <><CheckCircle2 className="h-3 w-3" /> Activo</>
            : <><XCircle className="h-3 w-3" /> Inactivo</>}
        </span>
        {/* Access type badge */}
        <div className="absolute top-2 left-2">
          <PaywallBadge isFree={program.accessType === 'free'} />
        </div>
        {/* Paywall overlay */}
        {isLocked && <PaywallCardBadge />}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-melodrama text-base text-dark line-clamp-2 mb-1">{program.name}</h3>
        {program.description && (
          <p className="text-xs text-dark/50 font-urwdin line-clamp-2 mb-3">{program.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-dark/60 font-urwdin mt-auto mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {program.totalWeeks} sem.
          </span>
          <span>·</span>
          <span>{program.daysPerWeek} días/sem.</span>
          <span>·</span>
          <span>{program.workoutCount} clases</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/programas/${program.id}`}
            className="flex-1 text-center text-sm font-urwdin py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Ver programa
          </Link>
          {isAdmin && (
            <>
              <Link
                href={`/dashboard/programas/${program.id}/editar`}
                className="p-2 rounded-xl border border-dark/15 text-dark/60 hover:bg-secondary/30 transition-colors"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={onDeleteClick}
                disabled={isDeleting}
                className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                {isDeleting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
