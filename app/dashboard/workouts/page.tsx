'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getWorkouts } from '@/lib/api/workouts';
import type { Workout, WorkoutFilters, WorkoutCategory, WorkoutLevel, WorkoutIntensity } from '@/lib/types/workout';
import { CATEGORY_LABELS, LEVEL_LABELS, INTENSITY_LABELS } from '@/lib/types/workout';
import { PaginatedResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, Search, X, Plus, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getSubscriptionStatus } from '@/lib/api/stripe';
import { PaywallCardBadge } from '@/components/paywall-overlay';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as WorkoutCategory[];
const LEVELS     = Object.keys(LEVEL_LABELS)     as WorkoutLevel[];
const INTENSITIES = Object.keys(INTENSITY_LABELS) as WorkoutIntensity[];

const LEVEL_COLORS: Record<WorkoutLevel, string> = {
  Principiante: 'bg-green-100 text-green-700',
  Intermedio:   'bg-yellow-100 text-yellow-700',
  Avanzado:     'bg-red-100 text-red-700',
};

export default function WorkoutsPage() {
  const [data,    setData]    = useState<PaginatedResponse<Workout> | null>(null);
  const [filters, setFilters] = useState<WorkoutFilters>({ pageNumber: 1, pageSize: 12 });
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.roles?.some(r => ['Admin','SuperAdmin'].includes(r)) ?? false;

  useEffect(() => {
    getSubscriptionStatus()
      .then(s => setHasSubscription(s.isActive))
      .catch(() => setHasSubscription(false))
  }, []);

  useEffect(() => {
    setLoading(true);
    getWorkouts(filters)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const setFilter = (key: keyof WorkoutFilters, value: WorkoutFilters[keyof WorkoutFilters] | undefined) =>
    setFilters(prev => ({ ...prev, [key]: value, pageNumber: 1 }));

  const clearFilters = () => setFilters({ pageNumber: 1, pageSize: 12 });
  const hasFilters = !!(filters.category || filters.level || filters.intensity || filters.search || filters.isFree !== undefined);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Clases</h1>
          <p className="text-dark/50 text-sm font-urwdin mt-0.5">
            {data?.totalCount ?? '—'} clases disponibles
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-dark font-urwdin transition-colors"
            >
              <X className="h-4 w-4" /> Limpiar filtros
            </button>
          )}
          {isAdmin && (
            <Link href="/dashboard/workouts/nueva" className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva Clase
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
        <input
          type="text"
          placeholder="Buscar clases…"
          value={filters.search ?? ''}
          onChange={e => setFilter('search', e.target.value || undefined)}
          className="input-base pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Category */}
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter('category', filters.category === cat ? undefined : cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-urwdin transition-all border',
              filters.category === cat
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-dark/70 border-secondary hover:border-primary hover:text-primary'
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}

        <div className="h-7 w-px bg-secondary mx-1" />

        {/* Level */}
        {LEVELS.map(lvl => (
          <button
            key={lvl}
            onClick={() => setFilter('level', filters.level === lvl ? undefined : lvl)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-urwdin transition-all border',
              filters.level === lvl
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-dark/70 border-secondary hover:border-primary hover:text-primary'
            )}
          >
            {LEVEL_LABELS[lvl]}
          </button>
        ))}

        <div className="h-7 w-px bg-secondary mx-1" />

        {/* Intensity */}
        {INTENSITIES.map(int => (
          <button
            key={int}
            onClick={() => setFilter('intensity', filters.intensity === int ? undefined : int)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-urwdin transition-all border',
              filters.intensity === int
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-dark/70 border-secondary hover:border-primary hover:text-primary'
            )}
          >
            {INTENSITY_LABELS[int]}
          </button>
        ))}

        <div className="h-7 w-px bg-secondary mx-1" />

        {/* Gratis filter */}
        <button
          onClick={() => setFilter('isFree', filters.isFree === true ? undefined : true)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-urwdin transition-all border flex items-center gap-1.5',
            filters.isFree === true
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-dark/70 border-secondary hover:border-emerald-500 hover:text-emerald-600'
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Gratis
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-video bg-secondary-200 rounded-lg mb-3" />
              <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-melodrama text-2xl text-dark/40">Sin resultados</p>
          <p className="text-sm text-dark/30 mt-2 font-urwdin">Prueba con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.items.map(workout => (
            <Link key={workout.id} href={`/dashboard/workouts/${workout.id}`} className="card group cursor-pointer block hover:-translate-y-1 transition-transform">
              {/* Thumbnail */}
              <div className="aspect-video bg-secondary-100 rounded-lg mb-3 overflow-hidden relative">
                {workout.thumbnailUrl ? (
                  <Image
                    src={workout.thumbnailUrl}
                    alt={workout.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-3xl">🏋️</span>
                  </div>
                )}
                {/* Badge FREE */}
                {workout.isFree && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-urwdin font-semibold px-2 py-0.5 rounded-full shadow">
                    <Sparkles className="h-3 w-3" />
                    Gratis
                  </div>
                )}
                {/* Paywall overlay: non-free + no subscription + not admin */}
                {!workout.isFree && !isAdmin && hasSubscription === false && (
                  <PaywallCardBadge />
                )}
              </div>

              {/* Info */}
              <h3 className="font-urwdin font-semibold text-dark text-sm leading-snug mb-2 group-hover:text-primary transition-colors">
                {workout.title}
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('badge text-xs', LEVEL_COLORS[workout.level as WorkoutLevel])}>
                  {LEVEL_LABELS[workout.level as WorkoutLevel]}
                </span>
              </div>

              <p className="text-xs text-dark/40 mt-2 font-urwdin">
                {CATEGORY_LABELS[workout.category as WorkoutCategory]}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
