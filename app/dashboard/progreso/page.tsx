'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import { getMyProgramsSummary, getUserProgramsSummary,
  getProgramWorkoutProgress,
  ProgramSummary, ProgramWorkoutProgress,
} from '@/lib/api/progress'
import { getProgressData } from '@/lib/api/sessions'
import { getUserExerciseProgress } from '@/lib/api/progress'
import { getUsers } from '@/lib/api'
import type { User } from '@/lib/types'
import { ActivityStatsWidget } from '@/components/activity-stats-widget'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts'
import {
  Users, ChevronRight, ChevronLeft, CheckCircle2,
  Circle, TrendingUp, BarChart3, Search,
  Dumbbell, LayoutGrid, Calendar, Trophy,
  ArrowLeft, RefreshCw, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-dark/10 rounded-xl px-3 py-2 shadow-lg text-xs font-urwdin">
      <p className="text-dark/50 mb-1">{label}</p>
      <p className="text-primary font-semibold">{payload[0]?.value} {unit}</p>
    </div>
  )
}

// ── Progress Ring ──────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8edee" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#4a6063" strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s ease' }} />
    </svg>
  )
}

// ── User Picker (admin) ────────────────────────────────────────────────────────

function UserPicker({ onSelect }: { onSelect: (u: User) => void }) {
  const [search, setSearch] = useState('')
  const [users,  setUsers]  = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getUsers(1, 30, search)
      .then(res => {
        const list = res?.items ?? (Array.isArray(res) ? res : [])
        setUsers(list.filter((u: User) => !u.roles?.some(r => ['Admin','SuperAdmin'].includes(r))))
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  return (
    <div className="card max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/10 rounded-xl"><Users className="h-5 w-5 text-primary" /></div>
        <h2 className="font-melodrama text-lg text-dark">Selecciona un alumno</h2>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre..." className="input-base pl-9" />
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-secondary/40 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {users.map(u => (
            <button key={u.id} onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/30 transition-colors text-left group">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-melodrama text-sm text-primary">{(u.fullName??u.username)?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-urwdin text-sm font-medium text-dark truncate">{u.fullName??u.username}</p>
                <p className="text-xs text-dark/40 font-urwdin truncate">{u.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-dark/20 group-hover:text-primary transition-colors" />
            </button>
          ))}
          {users.length === 0 && !loading && (
            <p className="text-sm text-dark/40 font-urwdin text-center py-6">
              {search ? 'Sin resultados' : 'Escribe para buscar'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Programs Overview ──────────────────────────────────────────────────────────

function ProgramsOverview({
  programs, onSelect,
}: {
  programs: ProgramSummary[]
  onSelect: (p: ProgramSummary) => void
}) {
  if (programs.length === 0) {
    return (
      <div className="card text-center py-16 border border-dashed border-dark/15">
        <LayoutGrid className="h-10 w-10 text-dark/20 mx-auto mb-3" />
        <p className="font-melodrama text-dark/30 mb-2">Sin programas inscritos</p>
        <Link href="/dashboard/programas" className="btn-primary inline-flex text-sm mt-2">
          Explorar programas
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {programs.map(p => (
        <button key={p.programId} onClick={() => onSelect(p)}
          className="card hover:shadow-md transition-all text-left group p-0 overflow-hidden">
          {/* Cover */}
          {p.coverUrl && (
            <div className="relative h-32 overflow-hidden">
              <Image src={p.coverUrl} alt={p.programTitle} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-urwdin border
                  ${p.status === 'InProgress' ? 'bg-primary/80 text-white border-primary' : 'bg-white/80 text-dark border-white'}`}>
                  {p.status === 'InProgress' ? 'En curso' : p.status === 'Completed' ? '✓ Completado' : p.status}
                </span>
              </div>
            </div>
          )}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-melodrama text-base text-dark line-clamp-2 group-hover:text-primary transition-colors">
                {p.programTitle}
              </h3>
              <div className="relative shrink-0">
                <ProgressRing pct={p.progressPct} size={52} />
                <span className="absolute inset-0 flex items-center justify-center font-melodrama text-xs text-dark">
                  {Math.round(p.progressPct)}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-urwdin text-dark/50 mb-1.5">
                <span>{p.completedSlots}/{p.totalSlots} clases</span>
                <span>{p.totalWeeks} semanas</span>
              </div>
              <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${p.progressPct}%` }} />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Program Workouts Breakdown ─────────────────────────────────────────────────

function ProgramBreakdown({
  program, userId, onBack,
}: {
  program: ProgramSummary
  userId?: string
  onBack: () => void
}) {
  const [slots, setSlots]     = useState<ProgramWorkoutProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getProgramWorkoutProgress(program.programId, userId)
      .then(setSlots).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [program.programId, userId])

  const weeks = Array.from(new Set(slots.map(s => s.weekNumber))).sort((a,b)=>a-b)
  const completed = slots.filter(s => s.completed).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2 rounded-xl border border-dark/15 hover:bg-secondary/40 transition-colors">
          <ArrowLeft className="h-4 w-4 text-dark/60" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-melodrama text-lg text-dark truncate">{program.programTitle}</h2>
          <p className="text-xs text-dark/50 font-urwdin">
            {completed}/{slots.length} clases completadas · {program.totalWeeks} semanas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProgressRing pct={program.progressPct} size={56} />
          <span className="font-melodrama text-xl text-dark">{Math.round(program.progressPct)}%</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Completadas', value: completed, icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, color: 'bg-green-50' },
          { label: 'Pendientes', value: slots.length - completed, icon: <Circle className="h-4 w-4 text-dark/40" />, color: 'bg-secondary/30' },
          { label: 'Semanas', value: program.totalWeeks, icon: <Calendar className="h-4 w-4 text-primary" />, color: 'bg-primary/10' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="font-melodrama text-2xl text-dark">{s.value}</p>
            <p className="text-xs text-dark/50 font-urwdin">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Week-by-week breakdown */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-secondary/40 rounded-2xl animate-pulse"/>)}</div>
      ) : error ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map(week => {
            const weekSlots = slots.filter(s => s.weekNumber === week)
            const weekDone  = weekSlots.filter(s => s.completed).length
            const allDone   = weekDone === weekSlots.length
            return (
              <div key={week} className="card p-0 overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between
                  ${allDone ? 'bg-green-50 border-b border-green-100' : 'bg-secondary/20 border-b border-dark/5'}`}>
                  <div className="flex items-center gap-2">
                    {allDone
                      ? <Trophy className="h-4 w-4 text-green-600" />
                      : <Calendar className="h-4 w-4 text-dark/40" />}
                    <span className="font-melodrama text-sm text-dark">Semana {week}</span>
                  </div>
                  <span className="text-xs font-urwdin text-dark/50">{weekDone}/{weekSlots.length} clases</span>
                </div>
                <div className="divide-y divide-dark/5">
                  {weekSlots.sort((a,b)=>a.dayNumber-b.dayNumber || a.order-b.order).map((slot, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0
                        ${slot.completed ? 'bg-green-100' : 'bg-secondary/40'}`}>
                        {slot.completed
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <Circle className="h-4 w-4 text-dark/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-urwdin truncate ${slot.completed ? 'text-dark' : 'text-dark/60'}`}>
                          {slot.workoutTitle}
                        </p>
                        <p className="text-xs text-dark/40 font-urwdin">Día {slot.dayNumber}</p>
                      </div>
                      <Link href={`/dashboard/workouts/${slot.workoutId}`}
                        className="text-xs font-urwdin text-primary hover:underline shrink-0">
                        Ver clase →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type View = 'programs' | 'program-detail'

export default function ProgresoPage() {
  const { user, isLoading } = useAuth()
  const isAdmin = user?.roles?.some(r => ['Admin','SuperAdmin'].includes(r))

  const [selectedUser,    setSelectedUser]    = useState<User | null>(null)
  const [programs,        setPrograms]        = useState<ProgramSummary[]>([])
  const [selectedProgram, setSelectedProgram] = useState<ProgramSummary | null>(null)
  const [view,            setView]            = useState<View>('programs')
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [error,           setError]           = useState('')

  // For customer: load programs automatically
  useEffect(() => {
    if (!user || isAdmin) return
    setLoadingPrograms(true)
    getMyProgramsSummary()
      .then(setPrograms).catch(e => setError(e.message)).finally(() => setLoadingPrograms(false))
  }, [user, isAdmin])

  // For admin: load after selecting user
  async function handleSelectUser(u: User) {
    setSelectedUser(u)
    setLoadingPrograms(true)
    setError('')
    setPrograms([])
    setSelectedProgram(null)
    setView('programs')
    try {
      const data = await getUserProgramsSummary(u.id)
      setPrograms(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingPrograms(false)
    }
  }

  function handleSelectProgram(p: ProgramSummary) {
    setSelectedProgram(p)
    setView('program-detail')
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-secondary rounded-xl" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-52 bg-secondary rounded-2xl" />)}</div>
      </div>
    )
  }

  const targetUserId = isAdmin ? selectedUser?.id : undefined

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-melodrama text-3xl text-dark">
          {isAdmin ? 'Progreso de alumnos' : 'Mi progreso'}
        </h1>
        <p className="text-sm text-dark/50 font-urwdin mt-1">
          {isAdmin
            ? 'Selecciona un alumno para ver su avance por programa y clase'
            : 'Tu avance en programas y clases de entrenamiento'}
        </p>
      </div>

      {/* Admin: user picker */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Picker */}
          <div className="lg:col-span-1">
            <UserPicker onSelect={handleSelectUser} />
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {!selectedUser ? (
              <div className="card text-center py-20 border border-dashed border-dark/15">
                <TrendingUp className="h-10 w-10 text-dark/20 mx-auto mb-3" />
                <p className="font-melodrama text-dark/30">Selecciona un alumno para ver su progreso</p>
              </div>
            ) : (
              <AdminProgressContent
                user={selectedUser}
                programs={programs}
                loading={loadingPrograms}
                error={error}
                selectedProgram={selectedProgram}
                view={view}
                onSelectProgram={handleSelectProgram}
                onBack={() => { setView('programs'); setSelectedProgram(null) }}
              />
            )}
          </div>
        </div>
      )}

      {/* Customer: own progress */}
      {!isAdmin && (
        <CustomerProgressContent
          programs={programs}
          loading={loadingPrograms}
          error={error}
          selectedProgram={selectedProgram}
          view={view}
          onSelectProgram={handleSelectProgram}
          onBack={() => { setView('programs'); setSelectedProgram(null) }}
        />
      )}
    </div>
  )
}

// ── Admin progress wrapper ─────────────────────────────────────────────────────

function AdminProgressContent({
  user, programs, loading, error,
  selectedProgram, view, onSelectProgram, onBack,
}: {
  user: User
  programs: ProgramSummary[]
  loading: boolean
  error: string
  selectedProgram: ProgramSummary | null
  view: View
  onSelectProgram: (p: ProgramSummary) => void
  onBack: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Selected user header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-2xl">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="font-melodrama text-sm text-primary">
            {(user.fullName??user.username)?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-urwdin text-sm font-medium text-dark">{user.fullName??user.username}</p>
          <p className="text-xs text-dark/40 font-urwdin">{user.email}</p>
        </div>
        <span className="ml-auto text-xs font-urwdin text-primary">{programs.length} programa{programs.length!==1?'s':''}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-52 bg-secondary/40 rounded-2xl animate-pulse"/>)}</div>
      ) : view === 'programs' ? (
        <ProgramsOverview programs={programs} onSelect={onSelectProgram} />
      ) : selectedProgram ? (
        <ProgramBreakdown program={selectedProgram} userId={user.id} onBack={onBack} />
      ) : null}
    </div>
  )
}

// ── Customer progress wrapper ──────────────────────────────────────────────────

function CustomerProgressContent({
  programs, loading, error,
  selectedProgram, view, onSelectProgram, onBack,
}: {
  programs: ProgramSummary[]
  loading: boolean
  error: string
  selectedProgram: ProgramSummary | null
  view: View
  onSelectProgram: (p: ProgramSummary) => void
  onBack: () => void
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-urwdin">
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="h-52 bg-secondary/40 rounded-2xl animate-pulse"/>)}
        </div>
      ) : view === 'programs' ? (
        <>
          {/* KPIs de actividad */}
          <div className="space-y-1">
            <h2 className="font-melodrama text-base text-dark">Mi actividad</h2>
            <ActivityStatsWidget compact={false} />
          </div>

          <h2 className="font-melodrama text-base text-dark">Mis programas</h2>
          <ProgramsOverview programs={programs} onSelect={onSelectProgram} />
          {/* Link to workout/exercise history */}
          <div className="mt-6">
            <h2 className="font-melodrama text-base text-dark mb-3">Por clase y ejercicio</h2>
            <Link href="/dashboard/historial"
              className="card hover:shadow-md transition-shadow group flex items-center gap-4 p-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-melodrama text-sm text-dark group-hover:text-primary transition-colors">Historial por clase</p>
                <p className="text-xs text-dark/50 font-urwdin">Revisa tus sesiones y gráficas por ejercicio</p>
              </div>
              <ChevronRight className="h-4 w-4 text-dark/20 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </>
      ) : selectedProgram ? (
        <ProgramBreakdown program={selectedProgram} onBack={onBack} />
      ) : null}
    </div>
  )
}
