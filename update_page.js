const fs = require('fs');

function updateWorkoutPage() {
  const file = 'app/dashboard/workouts/[id]/page.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Add block API
  content = content.replace(
    "import { getWorkoutById, getWorkoutStreamUrl } from '@/lib/api/workouts'",
    "import { getWorkoutById, getWorkoutStreamUrl } from '@/lib/api/workouts'\nimport { getWorkoutBlocks } from '@/lib/api/exercises'\nimport { WorkoutBlock } from '@/lib/types/exercise'"
  );

  // Add state for blocks
  content = content.replace(
    "const [workout,    setWorkout]    = useState<Workout | null>(null)",
    "const [workout,    setWorkout]    = useState<Workout | null>(null)\n  const [blocks, setBlocks] = useState<WorkoutBlock[]>([])"
  );

  // Fetch blocks
  content = content.replace(
    "getWorkoutById(Number(id))\n      .then(setWorkout)\n      .catch(() => setError('Workout no encontrado'))\n      .finally(() => setLoading(false))",
    "Promise.all([\n      getWorkoutById(Number(id)),\n      getWorkoutBlocks(Number(id)).catch(() => [])\n    ])\n      .then(([w, b]) => { setWorkout(w); setBlocks(b); })\n      .catch(() => setError('Workout no encontrado'))\n      .finally(() => setLoading(false))"
  );

  // Update Tracker
  content = content.replace(
    /workout=\{\{[\s\S]*?\}\}/,
    "workoutId={workout.id}\n          workoutBlocks={blocks}"
  );

  // Remove reps info display and add blocks UI
  const infoStart = content.indexOf('{/* Info */}');
  
  const blocksUI = `
      {/* Bloques */}
      <div className="card space-y-4">
        <h2 className="font-melodrama text-xl text-dark">Ejercicios de la clase</h2>
        {blocks.length === 0 ? (
          <p className="text-dark/50 text-sm">Esta clase no tiene ejercicios configurados</p>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, i) => (
              <div key={i} className="border border-secondary rounded-xl overflow-hidden">
                <div className="bg-secondary/10 px-4 py-2 border-b border-secondary font-melodrama text-dark flex justify-between">
                  <span>{block.name}</span>
                  <span className="text-sm font-urwdin text-dark/70">{block.rounds} rounds</span>
                </div>
                <div className="divide-y divide-secondary/20">
                  {block.exercises.map((ex, j) => (
                    <div key={j} className="flex items-center gap-3 p-3 hover:bg-secondary/5">
                      {ex.exerciseThumbnailUrl ? (
                        <img src={ex.exerciseThumbnailUrl} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-dark/5 rounded flex items-center justify-center">
                          <Dumbbell className="h-5 w-5 text-dark/30" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Link href={\`/dashboard/historial/ejercicio/\${ex.exerciseId}\`} className="font-medium text-dark text-sm hover:text-primary">
                          {ex.exerciseTitle}
                        </Link>
                        <div className="flex gap-2 text-xs text-dark/60 mt-1">
                          {(ex.trackingType === 'reps' || ex.trackingType === 'reps_weight') && (
                            <span>{ex.effectiveReps} reps</span>
                          )}
                          {(ex.trackingType === 'time' || ex.trackingType === 'time_weight') && (
                            <span>{ex.effectiveDurationSeconds} seg</span>
                          )}
                          {(ex.trackingType === 'reps_weight' || ex.trackingType === 'time_weight') && ex.effectiveWeightLbs && (
                            <span>| {ex.effectiveWeightLbs} lbs</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

`;
  
  content = content.substring(0, infoStart) + blocksUI + content.substring(infoStart);

  fs.writeFileSync(file, content);
}

updateWorkoutPage();
