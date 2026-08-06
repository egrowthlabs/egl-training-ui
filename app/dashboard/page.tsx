'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { ActiveProgramWidget } from '@/components/active-program-widget'
import { getAdminSubscriptions } from '@/lib/api/adminSubscriptions'
import { getWorkouts } from '@/lib/api/workouts'
import { getPrograms } from '@/lib/api/programs'
import {
  Users, Dumbbell, LayoutGrid, TrendingUp,
  ChevronRight, CheckCircle2, XCircle, Clock,
  Settings, Plus, FileText, BarChart3,
  Activity, DollarSign,
} from 'lucide-react'
import { ActivityStatsWidget } from '@/components/activity-stats-widget'
import { DailyClassWidget } from '@/components/daily-class-widget'

// ── Admin (Coach) Dashboard ────────────────────────────────────────────────────

interface AdminStat {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  color: string
  href: string
}

function StatCard({ stat }: { stat: AdminStat }) {
  return (
    <Link href={stat.href} className="card group hover:shadow-md transition-all p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
        {stat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-dark/50 font-urwdin">{stat.label}</p>
        <p className="font-melodrama text-3xl text-dark mt-0.5">{stat.value}</p>
        <p className="text-xs text-dark/40 font-urwdin mt-0.5">{stat.sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-dark/20 group-hover:text-primary transition-colors mt-1 shrink-0" />
    </Link>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    activeSubscriptions:       '-' as string | number,
    newSubscriptionsThisWeek:  '-' as string | number,
    totalSessions:             '-' as string | number,
    sessionsThisWeek:          '-' as string | number,
    totalWorkouts:             '-' as string | number,
    totalPrograms:             '-' as string | number,
    estimatedMonthlyRevenue:   '-' as string | number,
  })
  const [recentSubs, setRecentSubs] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('app-token') ?? ''
    const API   = process.env.NEXT_PUBLIC_API_URL

    Promise.all([
      fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      getWorkouts({ pageSize: 1 }),
      getPrograms({ pageSize: 1 }),
      getAdminSubscriptions(1, 5),
    ]).then(([adminStats, workouts, programs, subs]) => {
      setStats({
        activeSubscriptions:      adminStats.activeSubscriptions      ?? '-',
        newSubscriptionsThisWeek: adminStats.newSubscriptionsThisWeek ?? '-',
        totalSessions:            adminStats.totalSessions            ?? '-',
        sessionsThisWeek:         adminStats.sessionsThisWeek         ?? '-',
        totalWorkouts:            (workouts as any).totalCount        ?? '-',
        totalPrograms:            (programs as any).totalCount        ?? '-',
        estimatedMonthlyRevenue:  adminStats.estimatedMonthlyRevenue  ?? '-',
      })
      setRecentSubs(subs.items?.slice(0, 5) ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards: AdminStat[] = [
    {
      label: 'Suscriptores activos',
      value: stats.activeSubscriptions,
      sub:   'Con suscripción vigente',
      icon:  <Users className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50',
      href:  '/dashboard/subscriptions',
    },
    {
      label: 'Nuevos esta semana',
      value: stats.newSubscriptionsThisWeek,
      sub:   'Últimos 7 días',
      icon:  <TrendingUp className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10',
      href:  '/dashboard/subscriptions',
    },
    {
      label: 'Clases completadas',
      value: stats.totalSessions,
      sub:   `${stats.sessionsThisWeek} esta semana`,
      icon:  <Activity className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50',
      href:  '/dashboard/admin/historial',
    },
    {
      label: 'MRR estimado',
      value: typeof stats.estimatedMonthlyRevenue === 'number'
        ? `$${stats.estimatedMonthlyRevenue.toLocaleString('es-MX')} MXN`
        : stats.estimatedMonthlyRevenue,
      sub:   'Suscriptores × $450',
      icon:  <DollarSign className="h-5 w-5 text-amber-600" />,
      color: 'bg-amber-50',
      href:  '/dashboard/subscriptions',
    },
  ]

  const quickActions = [
    { label: 'Nueva clase',     href: '/dashboard/workouts/nuevo',    icon: <Plus className="h-4 w-4" />,      color: 'text-primary' },
    { label: 'Nuevo programa',  href: '/dashboard/programas/nuevo',   icon: <LayoutGrid className="h-4 w-4" />, color: 'text-purple-600' },
    { label: 'Suscripciones',   href: '/dashboard/admin/subscriptions', icon: <FileText className="h-4 w-4" />, color: 'text-green-600' },
    { label: 'Usuarios',        href: '/dashboard/admin/users',        icon: <Users className="h-4 w-4" />,      color: 'text-amber-600' },
    { label: 'Ejercicios',      href: '/dashboard/ejercicios',         icon: <Dumbbell className="h-4 w-4" />,   color: 'text-dark/60' },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Panel del Coach</h1>
          <p className="text-dark/60 font-urwdin mt-1">
            Vista general de tu plataforma re_line
          </p>
        </div>
        <Link
          href="/dashboard/workouts/nuevo"
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> Nueva clase
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* Main content — 2 columns on large */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent subscribers */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark/10">
            <h2 className="font-melodrama text-base text-dark flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Suscriptores recientes
            </h2>
            <Link href="/dashboard/admin/subscriptions" className="text-xs font-urwdin text-primary hover:underline">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-secondary/40 rounded-xl animate-pulse" />)}
            </div>
          ) : recentSubs.length === 0 ? (
            <div className="p-5 text-center py-10">
              <Users className="h-8 w-8 text-dark/20 mx-auto mb-2" />
              <p className="text-sm text-dark/40 font-urwdin">Sin suscriptores aún</p>
            </div>
          ) : (
            <div className="divide-y divide-dark/5">
              {recentSubs.map((sub, i) => {
                const isActive  = ['active', 'Active', 'trialing', 'Trialing'].includes(sub.status)
                const isTrialing = sub.status?.toLowerCase() === 'trialing'
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-melodrama text-sm text-primary">
                        {sub.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-urwdin text-sm font-medium text-dark truncate">{sub.fullName}</p>
                      <p className="text-xs text-dark/40 font-urwdin truncate">{sub.email}</p>
                    </div>
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 text-xs font-urwdin px-2 py-0.5 rounded-full border shrink-0
                      ${isTrialing
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {isActive
                        ? <CheckCircle2 className="h-3 w-3" />
                        : <XCircle className="h-3 w-3" />}
                      {isTrialing ? 'Prueba' : isActive ? 'Activo' : sub.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark/10">
            <h2 className="font-melodrama text-base text-dark flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Acciones rápidas
            </h2>
          </div>
          <div className="p-3 space-y-1">
            {quickActions.map(a => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/30 transition-colors group"
              >
                <span className={`${a.color} transition-transform group-hover:scale-110`}>{a.icon}</span>
                <span className="font-urwdin text-sm text-dark group-hover:text-primary transition-colors">{a.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-dark/20 group-hover:text-primary ml-auto transition-colors" />
              </Link>
            ))}
          </div>

          {/* Content summary */}
          <div className="mx-3 mb-3 p-4 bg-secondary/30 rounded-xl space-y-2">
            <p className="text-xs font-urwdin font-medium text-dark/60 uppercase tracking-wider">Contenido</p>
            <div className="space-y-1.5 text-sm font-urwdin">
              <Link href="/dashboard/workouts" className="flex justify-between text-dark/70 hover:text-primary transition-colors">
                <span>Clases</span>
                <span className="font-medium text-dark">{stats.totalWorkouts}</span>
              </Link>
              <Link href="/dashboard/programas" className="flex justify-between text-dark/70 hover:text-primary transition-colors">
                <span>Programas</span>
                <span className="font-medium text-dark">{stats.totalPrograms}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Customer Dashboard ─────────────────────────────────────────────────────────

function CustomerDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-melodrama text-3xl text-dark">Tu espacio re_line</h1>
        <p className="text-dark/60 font-urwdin mt-1">
          Accede a tus clases, programas y recursos.
        </p>
      </div>

      {/* KPIs de actividad */}
      <section>
        <h2 className="font-melodrama text-base text-dark mb-3">Mi actividad</h2>
        <ActivityStatsWidget compact={true} />
      </section>

      {/* Clase del día */}
      <section>
        <h2 className="font-melodrama text-base text-dark mb-3">Clase de hoy</h2>
        <DailyClassWidget />
      </section>

      <section>
        <h2 className="font-melodrama text-base text-dark mb-3">Tu programa</h2>
        <ActiveProgramWidget />
      </section>

      <section>
        <h2 className="font-melodrama text-base text-dark mb-3">Explorar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/workouts" className="card hover:shadow-md transition-shadow group flex items-center gap-4 p-5">
            <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-melodrama text-base text-dark group-hover:text-primary transition-colors">Clases</p>
              <p className="text-sm text-dark/50 font-urwdin">Explora todas las clases disponibles</p>
            </div>
            <ChevronRight className="h-4 w-4 text-dark/20 group-hover:text-primary ml-auto transition-colors" />
          </Link>

          <Link href="/dashboard/programas" className="card hover:shadow-md transition-shadow group flex items-center gap-4 p-5">
            <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-melodrama text-base text-dark group-hover:text-primary transition-colors">Programas</p>
              <p className="text-sm text-dark/50 font-urwdin">Planes de entrenamiento estructurados</p>
            </div>
            <ChevronRight className="h-4 w-4 text-dark/20 group-hover:text-primary ml-auto transition-colors" />
          </Link>
        </div>
      </section>
    </div>
  )
}

// ── Entry point — detecta rol ──────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const isAdmin = user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-secondary rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-secondary rounded-2xl" />)}
        </div>
        <div className="h-64 bg-secondary rounded-2xl" />
      </div>
    )
  }

  return isAdmin ? <AdminDashboard /> : <CustomerDashboard />
}
