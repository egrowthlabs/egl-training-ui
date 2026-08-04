const fs = require('fs');

function updateEditarPage() {
  const file = 'app/dashboard/workouts/[id]/editar/page.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    "import { AddCatalogItemModal } from '@/components/AddCatalogItemModal'",
    "import { AddCatalogItemModal } from '@/components/AddCatalogItemModal'\nimport { saveWorkoutBlocks, getExercises, getWorkoutBlocks } from '@/lib/api/exercises'\nimport { Exercise } from '@/lib/types/exercise'"
  );

  content = content.replace(
    /defaultRounds:\s*\d+,[\s\S]*?defaultRestTimerSeconds:\s*\d+,/,
    ''
  );
  
  content = content.replace(
    /defaultRounds:\s*w\.defaultRounds[\s\S]*?defaultRestTimerSeconds:\s*w\.defaultRestTimerSeconds,/,
    ''
  );

  const blockState = `
  const [blocks, setBlocks] = useState<Array<{
    name: string;
    rounds: number;
    restTimerSeconds: number;
    exercises: Array<{
      exerciseId: number;
      exerciseTitle: string;
      exerciseThumbnailUrl?: string;
      trackingType: string;
      overrideReps?: number;
      overrideDurationSeconds?: number;
      overrideWeightLbs?: number;
      notes?: string;
    }>;
  }>>([]);
  const [exerciseSearch, setExerciseSearch] = useState<Record<number, string>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<number, Exercise[]>>({});
  
  const addBlock = () => setBlocks(prev => [...prev, { name: \`\${String.fromCharCode(65 + prev.length)} BLOCK\`, rounds: 3, restTimerSeconds: 60, exercises: [] }]);
  const removeBlock = (bi: number) => setBlocks(prev => prev.filter((_, i) => i !== bi));
  const updateBlock = (bi: number, field: string, value: any) => setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, [field]: value } : b));
  const removeExercise = (bi: number, ei: number) => setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== ei) } : b));
  const updateBlockExercise = (bi: number, ei: number, field: string, value: any) => setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e) } : b));
  const moveExercise = (bi: number, ei: number, dir: -1 | 1) => setBlocks(prev => prev.map((b, i) => {
    if (i !== bi) return b;
    const exs = [...b.exercises];
    [exs[ei], exs[ei + dir]] = [exs[ei + dir], exs[ei]];
    return { ...b, exercises: exs };
  }));
  const addExerciseToBlock = (bi: number, ex: Exercise) => {
    setBlocks(prev => prev.map((b, i) => i === bi ? {
      ...b,
      exercises: [...b.exercises, { exerciseId: ex.id, exerciseTitle: ex.title, exerciseThumbnailUrl: ex.thumbnailUrl, trackingType: ex.trackingType }]
    } : b));
    setExerciseSearch(prev => ({ ...prev, [bi]: '' }));
    setExerciseResults(prev => ({ ...prev, [bi]: [] }));
  };

  const searchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const searchExercises = (bi: number, query: string) => {
    setExerciseSearch(prev => ({ ...prev, [bi]: query }));
    clearTimeout(searchTimers.current[bi]);
    if (!query.trim()) { setExerciseResults(prev => ({ ...prev, [bi]: [] })); return; }
    searchTimers.current[bi] = setTimeout(async () => {
      const res = await getExercises({ search: query, pageSize: 8 });
      setExerciseResults(prev => ({ ...prev, [bi]: res.items || [] }));
    }, 300);
  };
`;

  content = content.replace(
    "const [error,            setError]            = useState('')",
    "const [error,            setError]            = useState('')\n" + blockState
  );

  content = content.replace(
    "setForm({",
    "const loadedBlocks = await getWorkoutBlocks(workoutId);\nsetBlocks(loadedBlocks.map(b => ({\nname: b.name,\nrounds: b.rounds,\nrestTimerSeconds: b.restTimerSeconds,\nexercises: b.exercises.map(e => ({\nexerciseId: e.exerciseId,\nexerciseTitle: e.exerciseTitle,\nexerciseThumbnailUrl: e.exerciseThumbnailUrl,\ntrackingType: e.trackingType,\noverrideReps: e.overrideReps,\noverrideDurationSeconds: e.overrideDurationSeconds,\noverrideWeightLbs: e.overrideWeightLbs,\nnotes: e.notes\n}))\n})));\nsetForm({"
  );

  content = content.replace(
    /setSuccess\(true\)\s*setTimeout\(\(\) => router\.push\('\/dashboard\/workouts'\), 2000\)/,
    `
      await saveWorkoutBlocks(workoutId, blocks.map((b, i) => ({
        name: b.name,
        rounds: b.rounds,
        order: i,
        restTimerSeconds: b.restTimerSeconds,
        exercises: b.exercises.map((e, j) => ({
          exerciseId: e.exerciseId,
          order: j,
          overrideReps: e.overrideReps,
          overrideDurationSeconds: e.overrideDurationSeconds,
          overrideWeightLbs: e.overrideWeightLbs,
          notes: e.notes,
        }))
      })));
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/workouts'), 2000)
    `
  );

  const defaultUIStart = content.indexOf('{/* Defaults para tracker */}');
  const defaultUIEnd = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', defaultUIStart) + 1) + 1) + 1) + 6;
  if (defaultUIStart !== -1) {
      content = content.substring(0, defaultUIStart) + content.substring(defaultUIEnd);
  }

  const blocksUI = `
        {/* Bloques */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-melodrama text-lg text-dark">Bloques de ejercicios</h3>
            <button type="button" onClick={addBlock} className="btn-primary text-sm px-4 py-2">+ Agregar bloque</button>
          </div>
          {blocks.map((block, bi) => (
            <div key={bi} className="border border-dark/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <input value={block.name} onChange={e => updateBlock(bi, 'name', e.target.value)} className="input-base flex-1 font-medium" placeholder="A BLOCK" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark/60 font-urwdin">Rounds</label>
                  <input type="number" min={1} max={10} value={block.rounds} onChange={e => updateBlock(bi, 'rounds', Number(e.target.value))} className="input-base w-16 text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark/60 font-urwdin">Rest (s)</label>
                  <input type="number" min={0} step={15} value={block.restTimerSeconds} onChange={e => updateBlock(bi, 'restTimerSeconds', Number(e.target.value))} className="input-base w-20 text-center" />
                </div>
                <button type="button" onClick={() => removeBlock(bi)} className="text-red-400 hover:text-red-600 p-1">✕</button>
              </div>
              <div className="space-y-2">
                {block.exercises.map((ex, ei) => (
                  <div key={ei} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-secondary/20 rounded-lg p-3">
                    {ex.exerciseThumbnailUrl && <img src={ex.exerciseThumbnailUrl} className="w-10 h-10 rounded object-cover" />}
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-sm font-medium text-dark truncate">{ex.exerciseTitle}</p>
                      <span className="text-xs text-primary/70">{ex.trackingType}</span>
                    </div>
                    {(ex.trackingType === 'reps' || ex.trackingType === 'reps_weight') && (
                      <input type="number" placeholder="reps" value={ex.overrideReps ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideReps', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" />
                    )}
                    {(ex.trackingType === 'time' || ex.trackingType === 'time_weight') && (
                      <input type="number" placeholder="seg" value={ex.overrideDurationSeconds ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideDurationSeconds', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" />
                    )}
                    {(ex.trackingType === 'reps_weight' || ex.trackingType === 'time_weight') && (
                      <input type="number" placeholder="lbs" value={ex.overrideWeightLbs ?? ''} onChange={e => updateBlockExercise(bi, ei, 'overrideWeightLbs', e.target.value ? Number(e.target.value) : undefined)} className="input-base w-20 text-center text-sm" />
                    )}
                    <input placeholder="notas" value={ex.notes ?? ''} onChange={e => updateBlockExercise(bi, ei, 'notes', e.target.value)} className="input-base w-28 text-sm" />
                    <button type="button" onClick={() => moveExercise(bi, ei, -1)} disabled={ei === 0} className="text-dark/40 hover:text-dark disabled:opacity-20">↑</button>
                    <button type="button" onClick={() => moveExercise(bi, ei, 1)} disabled={ei === block.exercises.length - 1} className="text-dark/40 hover:text-dark disabled:opacity-20">↓</button>
                    <button type="button" onClick={() => removeExercise(bi, ei)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input value={exerciseSearch[bi] ?? ''} onChange={e => searchExercises(bi, e.target.value)} placeholder="Buscar y agregar ejercicio..." className="input-base w-full" />
                {exerciseResults[bi] && exerciseResults[bi].length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-secondary rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {exerciseResults[bi].map(ex => (
                      <button key={ex.id} type="button" onClick={() => addExerciseToBlock(bi, ex)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-secondary/20 text-left">
                        {ex.thumbnailUrl && <img src={ex.thumbnailUrl} className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <p className="text-sm font-medium">{ex.title}</p>
                          <p className="text-xs text-dark/50">{ex.trackingType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
`;

  content = content.replace(
    '<button type="submit" disabled={submitting} className="btn-primary w-full">',
    blocksUI + '\n        <button type="submit" disabled={submitting} className="btn-primary w-full">'
  );

  fs.writeFileSync(file, content);
}

updateEditarPage();
