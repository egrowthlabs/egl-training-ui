'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import {
  getAdminSubscriptions,
  assignTrial,
  revokeSubscription,
  type SubscriptionAdminDto,
} from '@/lib/api/adminSubscriptions'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  CreditCard, CheckCircle2, XCircle, Clock, AlertTriangle,
  UserPlus, Ban, X,
} from 'lucide-react'
import { ConfirmModal } from '@/components/confirm-modal'

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string
  icon:  React.ReactNode
  pill:  string
}> = {
  active: {
    label: 'Activa',
    icon:  <CheckCircle2 className="h-3.5 w-3.5" />,
    pill:  'bg-green-100 text-green-700 border-green-200',
  },
  trialing: {
    label: 'Prueba',
    icon:  <Clock className="h-3.5 w-3.5" />,
    pill:  'bg-blue-100 text-blue-700 border-blue-200',
  },
  past_due: {
    label: 'Vencida',
    icon:  <AlertTriangle className="h-3.5 w-3.5" />,
    pill:  'bg-orange-100 text-orange-700 border-orange-200',
  },
  canceled: {
    label: 'Cancelada',
    icon:  <XCircle className="h-3.5 w-3.5" />,
    pill:  'bg-red-100 text-red-700 border-red-200',
  },
  incomplete: {
    label: 'Incompleta',
    icon:  <AlertTriangle className="h-3.5 w-3.5" />,
    pill:  'bg-gray-100 text-gray-600 border-gray-200',
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    icon:  <Clock className="h-3.5 w-3.5" />,
    pill:  'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-urwdin font-medium px-2.5 py-1 rounded-full border ${cfg.pill}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const PAGE_SIZE = 20
const STATUS_OPTIONS = [
  { value: '',          label: 'Todos los estados' },
  { value: 'active',   label: 'Activas'    },
  { value: 'trialing', label: 'En prueba'  },
  { value: 'past_due', label: 'Vencidas'   },
  { value: 'canceled', label: 'Canceladas' },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminSubscriptionsPage() {
  const { user }  = useAuth()
  const router    = useRouter()
  const isAdmin   = user?.roles?.includes('Admin') ?? user?.roles?.includes('SuperAdmin') ?? false

  const [subs,          setSubs]          = useState<SubscriptionAdminDto[]>([])
  const [total,         setTotal]         = useState(0)
  const [page,          setPage]          = useState(1)
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [searchInput,   setSearchInput]   = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [error,         setError]         = useState<string | null>(null)

  // Trial modal state
  const [trialTarget,   setTrialTarget]   = useState<SubscriptionAdminDto | null>(null)
  const [trialDays,     setTrialDays]     = useState(14)
  const [trialLoading,  setTrialLoading]  = useState(false)
  const [trialError,    setTrialError]    = useState<string | null>(null)
  const [trialSuccess,  setTrialSuccess]  = useState<string | null>(null)

  // Revoke confirm modal
  const [revokeTarget,  setRevokeTarget]  = useState<SubscriptionAdminDto | null>(null)

  // Redirect non-admin
  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard')
  }, [user, isAdmin, router])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getAdminSubscriptions(page, PAGE_SIZE, statusFilter || undefined, search || undefined)
      .then(res => {
        setSubs(res?.items ?? [])
        setTotal(res?.totalCount ?? 0)
      })
      .catch(err => {
        console.error(err)
        setError('No se pudo cargar la lista de suscripciones.')
        setSubs([])
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter, search])

  useEffect(() => { if (isAdmin) load() }, [load, isAdmin])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleAssignTrial = async () => {
    if (!trialTarget) return
    setTrialLoading(true); setTrialError(null); setTrialSuccess(null)
    try {
      const res = await assignTrial(trialTarget.userId, trialDays)
      setTrialSuccess(res.message)
      load()
    } catch (e: unknown) {
      setTrialError(e instanceof Error ? e.message : 'Error al asignar trial')
    } finally {
      setTrialLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    try {
      await revokeSubscription(revokeTarget.userId)
      setRevokeTarget(null)
      load()
    } catch (e: unknown) {
      setRevokeTarget(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (!user) return null
  if (!isAdmin) return null

  // ── Stats cards ────────────────────────────────────────────────────────────
  const activeCount   = subs.filter(s => s.status === 'active').length
  const canceledCount = subs.filter(s => s.status === 'canceled').length
  const trialingCount = subs.filter(s => s.status === 'trialing').length

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Suscripciones</h1>
          <p className="text-dark/50 text-sm font-urwdin mt-1">
            Panel de administración · {total} registros totales
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 btn-secondary text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: total,        color: 'text-dark',        bg: 'bg-secondary/10' },
          { label: 'Activas',    value: activeCount,   color: 'text-green-600',   bg: 'bg-green-50' },
          { label: 'En prueba',  value: trialingCount, color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Canceladas', value: canceledCount, color: 'text-red-600',     bg: 'bg-red-50' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl p-4 ${kpi.bg}`}>
            <p className="text-xs font-urwdin text-dark/50 uppercase tracking-widest">{kpi.label}</p>
            <p className={`font-melodrama text-3xl mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
              <input
                type="text"
                placeholder="Buscar por nombre o email…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-dark/15 text-sm font-urwdin focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <button type="submit" className="btn-primary px-4 text-sm">Buscar</button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
                className="btn-secondary px-3 text-sm"
              >
                ✕
              </button>
            )}
          </form>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl border border-dark/15 text-sm font-urwdin focus:outline-none focus:border-primary/50 bg-white min-w-[160px]"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/10 border-b border-secondary">
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Inicio</th>
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Vencimiento</th>
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Stripe</th>
                <th className="px-4 py-3 text-left font-melodrama text-dark/70 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/20">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-dark/10 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-dark/10 rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-dark/10 rounded-full w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-dark/10 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-dark/10 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-dark/10 rounded w-28" /></td>
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <CreditCard className="h-8 w-8 text-dark/20 mx-auto mb-2" />
                    <p className="font-urwdin text-dark/40">No se encontraron suscripciones</p>
                  </td>
                </tr>
              ) : (
                subs.map(s => (
                  <tr key={s.stripeSubscriptionId ?? s.userId} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-dark whitespace-nowrap">
                      {s.fullName || '—'}
                    </td>
                    <td className="px-4 py-3 text-dark/60 font-urwdin">{s.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-dark/60 font-urwdin whitespace-nowrap">
                      {fmtDate(s.currentPeriodStart)}
                    </td>
                    <td className="px-4 py-3 font-urwdin whitespace-nowrap">
                      <span className={
                        s.status === 'canceled' ? 'text-red-500 line-through' :
                        new Date(s.currentPeriodEnd) < new Date() ? 'text-orange-500' :
                        'text-dark/70'
                      }>
                        {fmtDate(s.currentPeriodEnd)}
                      </span>
                    </td>
                    {/* Columna Stripe → muestra subscription ID (sub_xxx) */}
                    <td className="px-4 py-3">
                      {s.stripeSubscriptionId ? (
                        <a
                          href={`https://dashboard.stripe.com/test/subscriptions/${s.stripeSubscriptionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.stripeSubscriptionId}
                          className="inline-flex items-center gap-1 text-xs font-urwdin text-primary hover:underline"
                        >
                          <CreditCard className="h-3 w-3" />
                          {s.stripeSubscriptionId.slice(0, 16)}…
                        </a>
                      ) : (
                        <span className="text-dark/30 text-xs font-urwdin">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setTrialTarget(s); setTrialDays(14); setTrialError(null); setTrialSuccess(null) }}
                          className="inline-flex items-center gap-1 text-xs font-urwdin px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <UserPlus className="h-3 w-3" /> Prueba
                        </button>
                        {(s.status === 'active' || s.status === 'trialing') && (
                          <button
                            onClick={() => setRevokeTarget(s)}
                            className="inline-flex items-center gap-1 text-xs font-urwdin px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                          >
                            <Ban className="h-3 w-3" /> Revocar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-secondary/20">
            <p className="text-xs text-dark/50 font-urwdin">
              Página {page} de {totalPages} · {total} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 w-8 rounded-lg border border-dark/15 flex items-center justify-center hover:bg-secondary/10 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 w-8 rounded-lg border border-dark/15 flex items-center justify-center hover:bg-secondary/10 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── Assign Trial Modal ─────────────────────────────────────────── */}
      {trialTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-melodrama text-xl text-dark">Asignar período de prueba</h3>
                <p className="text-sm text-dark/50 font-urwdin mt-0.5">{trialTarget.fullName || trialTarget.email}</p>
              </div>
              <button onClick={() => setTrialTarget(null)} className="p-1.5 rounded-lg hover:bg-dark/5 transition-colors">
                <X className="h-5 w-5 text-dark/50" />
              </button>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm font-urwdin text-blue-700">
              <p className="font-semibold mb-1">¿Cómo funciona el trial manual?</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>El usuario obtiene acceso inmediato por los días que definas</li>
                <li>No se requiere tarjeta de crédito ni Stripe</li>
                <li>Al vencer, el estado cambia a cancelado automáticamente</li>
                <li>Puedes revocar el acceso en cualquier momento</li>
              </ul>
            </div>

            {/* Days selector */}
            <div>
              <label className="block text-sm font-urwdin font-medium text-dark mb-2">
                Días de prueba
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1} max={365}
                  value={trialDays}
                  onChange={e => setTrialDays(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl border border-dark/20 text-center text-lg font-melodrama focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  {[7, 14, 30, 90].map(d => (
                    <button key={d} onClick={() => setTrialDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-urwdin transition-colors ${
                        trialDays === d
                          ? 'bg-primary text-white'
                          : 'bg-secondary/20 text-dark/60 hover:bg-secondary/40'
                      }`}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-dark/40 font-urwdin mt-1.5">
                Vence el {fmtDate(new Date(Date.now() + trialDays * 86400000).toISOString())}
              </p>
            </div>

            {/* Error / Success */}
            {trialError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-urwdin flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {trialError}
              </div>
            )}
            {trialSuccess && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-urwdin flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {trialSuccess}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setTrialTarget(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={handleAssignTrial}
                disabled={trialLoading || trialDays < 1}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {trialLoading
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Asignando…</>
                  : <><UserPlus className="h-4 w-4" /> Asignar {trialDays} días</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      <ConfirmModal
        isOpen={revokeTarget !== null}
        title="Revocar acceso"
        message={`¿Seguro que deseas revocar el acceso de ${revokeTarget?.fullName || revokeTarget?.email}? Su suscripción quedará cancelada inmediatamente.`}
        confirmText="Sí, revocar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  )
}
