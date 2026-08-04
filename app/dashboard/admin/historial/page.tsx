'use client'

import { useEffect, useState, useCallback } from 'react'
import { getUsers } from '@/lib/api'
import { getUserHistory, WorkoutSessionRecord } from '@/lib/api/sessions'
import type { User } from '@/lib/types'
import {
  Search, Users, Clock, Calendar, Dumbbell,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  History, Timer, Weight, Repeat, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDuration(secs: number) {
  if (secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Session card (collapsed/expanded) ─────────────────────────────────────────

function SessionCard({ session, selectedUser }: { session: WorkoutSessionRecord; selectedUser?: User | null }) {
  const [open, setOpen] = useState(false)
  const totalReps   = session.sets.reduce((a, s) => a + s.reps, 0)
  const totalSecs   = session.sets.reduce((a, s) => a + (s.durationSeconds ?? 0), 0)
  const maxWeight   = session.sets.length > 0 ? Math.max(...session.sets.map(s => s.weightLbs)) : 0

  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 p-4 hover:bg-secondary/20 transition-colors text-left"
      >
        {/* Thumbnail */}
        {session.workoutThumbnailUrl && (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
            <Image src={session.workoutThumbnailUrl} alt={session.workoutTitle} fill className="object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-urwdin font-semibold text-dark text-sm truncate">{session.workoutTitle}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-dark/50 font-urwdin">
              <Calendar className="h-3 w-3" />
              {fmtDate(session.completedAt ?? session.startedAt)}
            </span>
            {(session.durationSeconds ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-dark/50 font-urwdin">
                <Clock className="h-3 w-3" />
                {fmtDuration(session.durationSeconds!)}
              </span>
            )}
          </div>
          {/* Stats row */}
          <div className="flex gap-4 mt-2">
            {totalReps > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary font-urwdin">
                <Repeat className="h-3 w-3" /> {totalReps} reps
              </span>
            )}
            {totalSecs > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary font-urwdin">
                <Timer className="h-3 w-3" /> {fmtDuration(totalSecs)}
              </span>
            )}
            {maxWeight > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary font-urwdin">
                <Weight className="h-3 w-3" /> {maxWeight} lbs
              </span>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-dark/40 shrink-0 mt-1" />
          : <ChevronDown className="h-4 w-4 text-dark/40 shrink-0 mt-1" />}
      </button>

      {/* Expanded sets */}
      {open && session.sets.length > 0 && (
        <div className="border-t border-dark/5 px-4 py-3 space-y-1.5">
          <p className="text-xs font-urwdin font-medium text-dark/40 uppercase tracking-wider mb-2">
            Series registradas
          </p>
          {session.sets.map((set, i) => (
            <div key={set.id} className="flex items-center justify-between text-sm font-urwdin text-dark/70 py-1.5 border-b border-dark/5 last:border-0">
              <span className="text-dark/40 text-xs w-6">#{i + 1}</span>
              {set.exerciseId ? (
                <Link
                  href={`/dashboard/historial/ejercicio/${set.exerciseId}?userId=${selectedUser?.id ?? ''}&userName=${encodeURIComponent(selectedUser?.fullName ?? selectedUser?.username ?? '')}`}
                  className="flex-1 text-xs text-dark/60 hover:text-primary transition-colors truncate mx-2"
                >
                  {set.exerciseTitle ?? '—'} →
                </Link>
              ) : (
                <span className="flex-1 text-xs text-dark/60 truncate mx-2">{set.exerciseTitle ?? '—'}</span>
              )}
              <div className="flex gap-3 text-xs shrink-0">
                {set.reps > 0 && <span>{set.reps} reps</span>}
                {set.durationSeconds > 0 && <span>{fmtDuration(set.durationSeconds)}</span>}
                {set.weightLbs > 0 && <span>{set.weightLbs} lbs</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── User Picker ───────────────────────────────────────────────────────────────

function UserPicker({
  onSelect,
}: {
  onSelect: (user: User) => void
}) {
  const [search, setSearch]   = useState('')
  const [users,  setUsers]    = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getUsers(1, 30, search)
      .then(res => {
        const list = res?.items ?? (Array.isArray(res) ? res : [])
        // Filter out admins
        setUsers(list.filter((u: User) => !u.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))))
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="card space-y-4">
      <h2 className="font-melodrama text-base text-dark flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" /> Seleccionar usuario
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="input-base pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-secondary/40 rounded-xl animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-dark/40 font-urwdin text-center py-4">
          {search ? 'No se encontraron usuarios' : 'Escribe para buscar'}
        </p>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/30 transition-colors text-left group"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-melodrama text-sm text-primary">
                  {(u.fullName ?? u.username)?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-urwdin text-sm font-medium text-dark truncate">
                  {u.fullName ?? u.username}
                </p>
                <p className="text-xs text-dark/40 font-urwdin truncate">{u.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-dark/20 group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export default function AdminHistorialPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [sessions,     setSessions]     = useState<WorkoutSessionRecord[]>([])
  const [totalCount,   setTotalCount]   = useState(0)
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const loadHistory = useCallback(async (user: User, p: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await getUserHistory(user.id, p, PAGE_SIZE)
      setSessions(res.items ?? [])
      setTotalCount(res.totalCount ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSelectUser(u: User) {
    setSelectedUser(u)
    setPage(1)
    setSessions([])
    setTotalCount(0)
    loadHistory(u, 1)
  }

  function handleChangePage(newPage: number) {
    setPage(newPage)
    if (selectedUser) loadHistory(selectedUser, newPage)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-melodrama text-2xl text-dark">Historial de usuarios</h1>
        <p className="text-sm text-dark/50 font-urwdin mt-0.5">
          Revisa el historial de entrenamiento de cada alumno
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: user picker */}
        <div className="lg:col-span-1">
          <UserPicker onSelect={handleSelectUser} />
        </div>

        {/* Right: history */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedUser ? (
            <div className="card text-center py-16 border border-dashed border-dark/15">
              <History className="h-10 w-10 text-dark/20 mx-auto mb-3" />
              <p className="font-melodrama text-dark/30">Selecciona un usuario para ver su historial</p>
            </div>
          ) : (
            <>
              {/* Selected user header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-melodrama text-sm text-primary">
                      {(selectedUser.fullName ?? selectedUser.username)?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-melodrama text-base text-dark">
                      {selectedUser.fullName ?? selectedUser.username}
                    </p>
                    <p className="text-xs text-dark/40 font-urwdin">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-melodrama text-2xl text-primary">{totalCount}</p>
                  <p className="text-xs text-dark/40 font-urwdin">sesiones totales</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {/* Sessions */}
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-20 bg-secondary/40 rounded-2xl animate-pulse" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="card text-center py-12">
                  <Dumbbell className="h-8 w-8 text-dark/20 mx-auto mb-2" />
                  <p className="text-sm text-dark/40 font-urwdin">
                    Este usuario aún no tiene sesiones registradas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => <SessionCard key={s.id} session={s} selectedUser={selectedUser} />)}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-xl border border-dark/15 hover:bg-secondary/40 transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-urwdin text-dark/60">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => handleChangePage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-xl border border-dark/15 hover:bg-secondary/40 transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
