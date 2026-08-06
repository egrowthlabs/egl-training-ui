export type WorkoutCategory = 'CardioConsciente' | 'FuerzaEstructurada' | 'ResistenciaFuncional' | 'PilatesReformer';
export type WorkoutLevel    = 'Principiante' | 'Intermedio' | 'Avanzado';
export type WorkoutIntensity = 'Baja' | 'Media' | 'Alta';
export type WorkoutEquipment = 'SinEquipo' | 'Mancuernas' | 'Bandas' | 'Reformer' | 'Esterilla';
export type WorkoutObjective = 'Tonificacion' | 'Cardio' | 'Flexibilidad' | 'Fuerza' | 'Relajacion';

export interface Workout {
  id: number;
  title: string;
  description?: string;
  videoProviderId?: string;
  category: WorkoutCategory;
  level: WorkoutLevel;
  objective: WorkoutObjective;
  thumbnailUrl?: string;
  durationMinutes?: number;
  isPublished: boolean;
  isCustom: boolean;
  isFree: boolean;
  featuredDate?: string | null; // 'YYYY-MM-DD'
  blocks?: import('./exercise').WorkoutBlock[];
}

export interface WorkoutFilters {
  category?: WorkoutCategory;
  level?: WorkoutLevel;
  intensity?: WorkoutIntensity;
  equipment?: WorkoutEquipment;
  objective?: WorkoutObjective;
  isFree?: boolean;
  isCustom?: boolean;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  CardioConsciente:    'Cardio Consciente',
  FuerzaEstructurada:  'Fuerza Estructurada',
  ResistenciaFuncional: 'Resistencia Funcional',
  PilatesReformer:     'Pilates Reformer',
};

export const LEVEL_LABELS: Record<WorkoutLevel, string> = {
  Principiante: 'Principiante',
  Intermedio:   'Intermedio',
  Avanzado:     'Avanzado',
};

export const INTENSITY_LABELS: Record<WorkoutIntensity, string> = {
  Baja:  'Baja',
  Media: 'Media',
  Alta:  'Alta',
};
