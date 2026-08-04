'use client';

import { useAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';
import { Dumbbell } from 'lucide-react';

const BREADCRUMBS: Record<string, string> = {
  '/dashboard':           'Dashboard',
  '/dashboard/workouts':  'Clases',
  '/dashboard/programas': 'Programas',
  '/dashboard/usuarios':  'Usuarios',
};

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const title    = BREADCRUMBS[pathname] ?? 'Dashboard';

  return (
    <header className="h-16 bg-white border-b border-secondary flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-dark/40 font-urwdin">re_line</span>
        <span className="text-dark/30">/</span>
        <span className="text-sm font-medium text-dark font-urwdin">{title}</span>
      </div>

      {/* User Pill */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-dark leading-none">
              {user.fullName ?? user.username}
            </p>
            <p className="text-xs text-dark/50 mt-0.5">{user.roles[0]}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
            {(user.fullName ?? user.username).charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}
