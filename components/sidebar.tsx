'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  PlayCircle, LayoutDashboard, Users, LogOut,
  BookOpen, ChevronRight, Dumbbell, CreditCard, Settings, Clock, History, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    href:  '/dashboard',
    label: 'Dashboard',
    icon:  LayoutDashboard,
    adminOnly: false,
  },
  {
    href: '/dashboard/ejercicios',
    label: 'Ejercicios',
    icon: Dumbbell,
    adminOnly: true,
  },
  {
    href:  '/dashboard/workouts',
    label: 'Clases',
    icon:  PlayCircle,
    adminOnly: false,
  },
  {
    href:  '/dashboard/programas',
    label: 'Programas',
    icon:  BookOpen,
    adminOnly: false,
  },
  {
    href:  '/dashboard/historial',
    label: 'Historial',
    icon:  Clock,
    adminOnly:    false,
    hideForAdmin: true,
  },
  {
    href:  '/dashboard/progreso',
    label: 'Progreso',
    icon:  TrendingUp,
    adminOnly:    false,
    hideForAdmin: false,
  },
  {
    href:  '/dashboard/admin/historial',
    label: 'Historial usuarios',
    icon:  History,
    adminOnly:    true,
    hideForAdmin: false,
  },
  {
    href:  '/dashboard/usuarios',
    label: 'Usuarios',
    icon:  Users,
    adminOnly: true,
  },
  {
    href:  '/dashboard/subscriptions',
    label: 'Suscripciones',
    icon:  CreditCard,
    adminOnly: true,
  },
  {
    href: '/dashboard/suscripcion',
    label: 'Mi Suscripción',
    icon: CreditCard,
    adminOnly: false,
    hideForAdmin: true,   // Los admins no necesitan suscripción
  },
  {
    href: '/dashboard/catalogos',
    label: 'Catálogos',
    icon: Settings,
    adminOnly: true,
    hideForAdmin: false,
  },
];

export function Sidebar() {
  const pathname    = usePathname();
  const { user, logout } = useAuth();
  const isAdmin     = (user?.roles ?? []).some(r => r === 'Admin' || r === 'SuperAdmin');

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin)   return false;  // solo admin
    if (item.hideForAdmin && isAdmin) return false;  // oculto para admin
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-primary text-white">
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-8 border-b border-primary-700">
        <Image
          src="/images/logo-re-line-ligth.png"
          alt="re_line"
          width={120}
          height={40}
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {visibleItems.map((item) => {
          const Icon    = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-urwdin transition-all duration-200 group',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="px-3 py-4 border-t border-primary-700">
        {user && (
          <Link
            href="/dashboard/perfil"
            className="flex items-center gap-3 px-4 py-2 mb-1 rounded-lg hover:bg-white/10 transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="font-melodrama text-sm text-white">
                {(user.fullName ?? user.username ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-secondary transition-colors">
                {user.fullName ?? user.username}
              </p>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
        {/* Legal links */}
        <div className="flex gap-3 px-4 pt-2">
          <Link href="/terminos"   className="text-[11px] text-white/30 hover:text-white/60 font-urwdin transition-colors">Términos</Link>
          <span className="text-[11px] text-white/20">·</span>
          <Link href="/privacidad" className="text-[11px] text-white/30 hover:text-white/60 font-urwdin transition-colors">Privacidad</Link>
        </div>
      </div>
    </aside>
  );
}
