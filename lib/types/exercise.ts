export type TrackingType = 'reps' | 'reps_weight' | 'time' | 'time_weight';

export const TRACKING_LABELS: Record<TrackingType, string> = {
  reps:         'Solo repeticiones',
  reps_weight:  'Repeticiones + Peso',
  time:         'Solo tiempo',
  time_weight:  'Tiempo + Peso',
};

export interface Exercise {
  id: number;
  title: string;
  description?: string;
  videoProviderId?: string;
  thumbnailUrl?: string;
  trackingType: TrackingType;
  defaultRounds: number;
  defaultReps?: number;
  defaultDurationSeconds?: number;
  defaultWeightLbs?: number | null;
  defaultRestTimerSeconds: number;
  category: string;
  level: string;
  intensity: string;
  equipment: string;
  objective: string;
  isPublished: boolean;
}

export interface WorkoutBlockExercise {
  id: number;
  exerciseId: number;
  order: number;
  exerciseTitle: string;
  exerciseThumbnailUrl?: string;
  trackingType: TrackingType;
  overrideReps?: number;
  overrideDurationSeconds?: number;
  overrideWeightLbs?: number | null;
  defaultRestTimerSeconds?: number;
  notes?: string;
  effectiveRounds: number;
  effectiveReps?: number;
  effectiveDurationSeconds?: number;
  effectiveWeightLbs?: number | null;
  effectiveRestTimerSeconds: number;
}

export interface WorkoutBlock {
  id: number;
  name: string;
  rounds: number;
  order: number;
  restTimerSeconds: number;
  exercises: WorkoutBlockExercise[];
}
