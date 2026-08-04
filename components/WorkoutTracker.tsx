'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { startSession, logSet, completeSession, cancelSession } from '@/lib/api/sessions'
import { getExerciseStreamUrl } from '@/lib/api/exercises'
import { WorkoutBlock } from '@/lib/types/exercise'
import { useAuth } from '@/context/auth-context'
import {
  CheckCircle, Timer as TimerIcon, Play, Pause,
  RotateCcw, Plus, Minus, Dumbbell, Pencil, X, Clock, LogOut, AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LoggedSet {
  key: string          // `${blockIdx}-${roundIdx}-${exIdx}`
  blockName: string
  exerciseTitle: string
  exerciseId: number
  trackingType: string
  reps: number
  weight: number
  duration: number
  edited?: boolean
}

// ─── Persist helpers ──────────────────────────────────────────────────────────
const store = {
  key:   (uid: string, wid: number) => `ws-${uid}-${wid}`,
  save:  (uid: string, wid: number, d: object) => { try { localStorage.setItem(`ws-${uid}-${wid}`, JSON.stringify(d)) } catch {} },
  load:  (uid: string, wid: number) => { try { const s = localStorage.getItem(`ws-${uid}-${wid}`); return s ? JSON.parse(s) : null } catch { return null } },
  clear: (uid: string, wid: number) => { try { localStorage.removeItem(`ws-${uid}-${wid}`) } catch {} },
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────
function RestTimer({ label, seconds, onSkip }: { label: string; seconds: number; onSkip: () => void }) {
  const [left, setLeft]   = useState(seconds)
  const [run, setRun]     = useState(true)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (run && left > 0) {
      ref.current = setInterval(() => setLeft(p => {
        if (p <= 1) { clearInterval(ref.current!); setRun(false); return 0 }
        return p - 1
      }), 1000)
    } else { if (ref.current) clearInterval(ref.current) }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [run])

  useEffect(() => { if (left === 0) onSkip() }, [left])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="card text-center space-y-4 py-10">
      <p className="text-xs text-dark/40 font-urwdin uppercase tracking-widest">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <TimerIcon className="h-8 w-8 text-primary animate-pulse" />
        <span className="text-5xl font-bold font-mono text-primary tabular-nums">{mm}:{ss}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setRun(r => !r)} className="p-2 rounded-full border border-dark/20 hover:bg-dark/5">
          {run ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button onClick={onSkip} className="btn-secondary text-sm">Saltar →</button>
      </div>
    </div>
  )
}

// ─── Countdown circle ─────────────────────────────────────────────────────────
function CountdownTimer({ total, onComplete }: { total: number; onComplete: () => void }) {
  const [left, setLeft] = useState(total)
  const [run, setRun]   = useState(false)
  const [done, setDone] = useState(false)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setLeft(total); setRun(false); setDone(false) }, [total])
  useEffect(() => {
    if (run && left > 0) {
      ref.current = setInterval(() => setLeft(p => {
        if (p <= 1) { clearInterval(ref.current!); setRun(false); setDone(true); return 0 }
        return p - 1
      }), 1000)
    } else { if (ref.current) clearInterval(ref.current) }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [run])

  const r = 44; const c = 2 * Math.PI * r
  const str = Math.floor(left / 60) > 0 ? `${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}` : `${left}`
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative">
        <svg width="110" height="110" className="-rotate-90">
          <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-dark/10" />
          <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="6"
            className={done ? 'text-green-500' : 'text-primary'}
            strokeDasharray={`${c * (left / Math.max(total,1))} ${c}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s linear' }} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-2xl ${done ? 'text-green-600' : 'text-dark'}`}>
          {done ? '✓' : str}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {!done ? (
          <>
            <button type="button" onClick={() => { setLeft(total); setRun(false) }} className="p-2 rounded-full bg-dark/5 hover:bg-dark/10 text-dark/50"><RotateCcw className="h-4 w-4" /></button>
            <button type="button" onClick={() => setRun(r => !r)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-urwdin font-medium text-sm ${run ? 'bg-dark/10 text-dark' : 'bg-primary text-white hover:bg-primary/90'}`}>
              {run ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4 ml-0.5" /> Iniciar</>}
            </button>
          </>
        ) : (
          <button type="button" onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500 text-white font-urwdin font-medium text-sm hover:bg-green-600">
            <CheckCircle className="h-4 w-4" /> ¡Listo!
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-dark/40 mt-1">
        <button onClick={() => { if (!run) setLeft(v => Math.max(5, v - 5)) }} className="p-1 rounded-full bg-dark/5 hover:bg-dark/10"><Minus className="h-3 w-3" /></button>
        <span className="text-xs font-urwdin">{total}s</span>
        <button onClick={() => { if (!run) setLeft(v => v + 5) }} className="p-1 rounded-full bg-dark/5 hover:bg-dark/10"><Plus className="h-3 w-3" /></button>
      </div>
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ label, value, onChange, step = 1, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number
}) {
  return (
    <div className="flex-1 bg-secondary/10 rounded-xl p-4 text-center">
      <p className="text-xs text-dark/50 font-urwdin mb-2">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - step))} className="p-2 bg-white rounded-full shadow text-dark/60 hover:text-dark"><Minus className="h-4 w-4" /></button>
        <span className="text-4xl font-bold w-14 text-center tabular-nums">{value}</span>
        <button onClick={() => onChange(value + step)} className="p-2 bg-white rounded-full shadow text-dark/60 hover:text-dark"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

// ─── Timeout modal ────────────────────────────────────────────────────────────
function TimeoutModal({ elapsedMin, onConfirm }: { elapsedMin: number; onConfirm: (mins: number) => void }) {
  const [mins, setMins] = useState(elapsedMin)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <h3 className="font-melodrama text-xl">¿Sigues ahí?</h3>
        </div>
        <p className="text-sm text-dark/60 font-urwdin">
          Llevas mucho tiempo con la sesión abierta. ¿Cuánto duró tu clase?
        </p>
        <div className="flex items-center gap-3 bg-secondary/10 rounded-xl px-4 py-3">
          <button onClick={() => setMins(m => Math.max(1, m - 5))} className="p-1.5 bg-white rounded-full shadow"><Minus className="h-4 w-4" /></button>
          <span className="flex-1 text-center font-bold text-2xl tabular-nums">{mins} min</span>
          <button onClick={() => setMins(m => m + 5)} className="p-1.5 bg-white rounded-full shadow"><Plus className="h-4 w-4" /></button>
        </div>
        <button onClick={() => onConfirm(mins)} className="btn-primary w-full">Confirmar y cerrar clase</button>
      </div>
    </div>
  )
}

// ─── Review screen ────────────────────────────────────────────────────────────
function ReviewScreen({
  log, elapsedSec, weightUnit, submitting,
  onEditSet, onFinish,
}: {
  log: LoggedSet[]
  elapsedSec: number
  weightUnit: 'lbs' | 'kg'
  submitting: boolean
  onEditSet: (key: string, field: 'reps' | 'weight' | 'duration', val: number) => void
  onFinish: () => void
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const mm = Math.floor(elapsedSec / 60)
  const ss = String(elapsedSec % 60).padStart(2, '0')

  // Group by block
  const grouped: Record<string, LoggedSet[]> = {}
  log.forEach(s => {
    if (!grouped[s.blockName]) grouped[s.blockName] = []
    grouped[s.blockName].push(s)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card text-center py-8 space-y-2">
        <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
        <h3 className="font-melodrama text-2xl text-dark">¡Ejercicios completados!</h3>
        <div className="flex items-center justify-center gap-2 text-dark/50 font-urwdin text-sm">
          <Clock className="h-4 w-4" />
          <span>Tiempo: {mm}:{ss}</span>
        </div>
        <p className="text-xs text-dark/40 font-urwdin">Revisa y edita tus sets antes de cerrar</p>
      </div>

      {/* Sets by block */}
      {Object.entries(grouped).map(([blockName, sets]) => (
        <div key={blockName} className="card space-y-3">
          <h4 className="font-urwdin font-bold text-xs uppercase tracking-widest text-primary">{blockName}</h4>
          {sets.map(s => (
            <div key={s.key} className="border border-dark/8 rounded-xl overflow-hidden">
              {/* Row header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/5">
                <p className="text-sm font-medium text-dark truncate mr-2">{s.exerciseTitle}</p>
                <button onClick={() => setEditingKey(editingKey === s.key ? null : s.key)}
                  className={`p-1.5 rounded-full transition-colors shrink-0 ${editingKey === s.key ? 'bg-primary text-white' : 'bg-dark/5 text-dark/50 hover:bg-dark/10'}`}>
                  {editingKey === s.key ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Values summary */}
              <div className="px-4 py-2 flex gap-4 text-sm text-dark/60 font-urwdin">
                {s.trackingType.includes('reps') && <span>🔁 {s.reps} reps</span>}
                {s.trackingType.includes('time') && <span>⏱ {s.duration}s</span>}
                {s.trackingType.includes('weight') && <span>🏋️ {s.weight} {weightUnit}</span>}
                {s.edited && <span className="text-primary text-xs ml-auto">editado</span>}
              </div>

              {/* Inline editor */}
              {editingKey === s.key && (
                <div className="px-4 pb-4 pt-1 flex gap-3">
                  {s.trackingType.includes('reps') && (
                    <Stepper label="reps" value={s.reps} min={0}
                      onChange={v => onEditSet(s.key, 'reps', v)} />
                  )}
                  {s.trackingType.includes('time') && (
                    <Stepper label="seg" value={s.duration} step={5} min={5}
                      onChange={v => onEditSet(s.key, 'duration', v)} />
                  )}
                  {s.trackingType.includes('weight') && (
                    <Stepper label={weightUnit} value={s.weight} step={weightUnit === 'lbs' ? 5 : 2.5} min={0}
                      onChange={v => onEditSet(s.key, 'weight', v)} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Finish button */}
      <button onClick={onFinish} disabled={submitting}
        className="btn-primary w-full h-14 text-lg rounded-2xl sticky bottom-4 shadow-lg">
        {submitting ? 'Guardando...' : 'Completar clase 🏁'}
      </button>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  workoutId: number
  workoutBlocks: WorkoutBlock[]
  weightUnit: 'lbs' | 'kg'
  onSessionComplete: () => void
  onLogUpdate?: (log: LoggedSet[], isReviewing: boolean) => void
}

type Phase =
  | { type: 'exercise' }
  | { type: 'round-rest'; label: string; seconds: number }
  | { type: 'block-rest'; label: string; seconds: number }
  | { type: 'review' }

const TWO_HOURS = 2 * 60 * 60 * 1000

// ─── Main ─────────────────────────────────────────────────────────────────────
export function WorkoutTracker({ workoutId, workoutBlocks, weightUnit, onSessionComplete, onLogUpdate }: Props) {
  const { user } = useAuth()
  const userId = user?.id ?? user?.email ?? 'guest'

  const [sessionId,   setSessionId]   = useState<number | null>(null)
  const [started,     setStarted]     = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [startedAt,   setStartedAt]   = useState<number>(0)   // Date.now()
  const [elapsedSec,  setElapsedSec]  = useState(0)
  const [showTimeout, setShowTimeout] = useState(false)
  const [showCancel,  setShowCancel]  = useState(false)
  const [apiError,    setApiError]    = useState<string | null>(null)

  const [blockIdx, setBlockIdx] = useState(0)
  const [roundIdx, setRoundIdx] = useState(0)
  const [exIdx,    setExIdx]    = useState(0)
  const [phase,    setPhase]    = useState<Phase>({ type: 'exercise' })

  // Position history for back-navigation
  const [posHistory, setPosHistory] = useState<Array<{bi:number;ri:number;ei:number}>>([])

  // Current values (editable before completing)
  const [vals, setVals] = useState<Record<string, { reps: number; weight: number; duration: number }>>({})

  // Completed log (editable in review)
  const [log, setLog] = useState<LoggedSet[]>([])

  // Video
  const [streamUrl,  setStreamUrl]  = useState<string | null>(null)
  const [videoError, setVideoError] = useState(false)

  const block     = workoutBlocks[blockIdx]
  const exercise  = block?.exercises[exIdx]
  const isTime    = exercise?.trackingType.includes('time') ?? false
  const hasWeight = exercise?.trackingType.includes('weight') ?? false
  const posKey    = `${blockIdx}-${roundIdx}-${exIdx}`

  const defaults = useCallback((bi: number, ei: number) => {
    const ex = workoutBlocks[bi]?.exercises[ei]
    if (!ex) return { reps: 12, weight: 0, duration: 45 }
    return {
      reps:     ex.effectiveReps            ?? ex.overrideReps            ?? 12,
      weight:   ex.effectiveWeightLbs       ?? ex.overrideWeightLbs       ?? 0,
      duration: ex.effectiveDurationSeconds ?? ex.overrideDurationSeconds ?? 45,
    }
  }, [workoutBlocks])

  const getVal  = (bi: number, ri: number, ei: number) => vals[`${bi}-${ri}-${ei}`] ?? defaults(bi, ei)
  const curVals = getVal(blockIdx, roundIdx, exIdx)
  const setVal  = (field: 'reps' | 'weight' | 'duration', v: number) =>
    setVals(prev => ({ ...prev, [posKey]: { ...curVals, [field]: v } }))

  // Elapsed clock
  useEffect(() => {
    if (!started || phase.type === 'review') return
    const t = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt) / 1000)
      setElapsedSec(sec)
      if (Date.now() - startedAt > TWO_HOURS && !showTimeout) setShowTimeout(true)
    }, 1000)
    return () => clearInterval(t)
  }, [started, startedAt, phase, showTimeout])

  // Video
  useEffect(() => {
    if (!exercise?.exerciseId) return
    setStreamUrl(null); setVideoError(false)
    getExerciseStreamUrl(exercise.exerciseId)
      .then(url => setStreamUrl(url))
      .catch(() => setVideoError(true))
  }, [exercise?.exerciseId])

  // Persist
  useEffect(() => {
    if (!started || !sessionId) return
    store.save(userId, workoutId, { sessionId, blockIdx, roundIdx, exIdx, vals, log, phase: phase.type, startedAt })
  }, [started, sessionId, blockIdx, roundIdx, exIdx, vals, log, phase, startedAt])

  // Notify parent of log changes
  useEffect(() => {
    if (started) onLogUpdate?.(log, phase.type === 'review')
  }, [log, phase.type, started])

  // Restore
  useEffect(() => {
    const saved = store.load(userId, workoutId)
    if (!saved) return
    setSessionId(saved.sessionId)
    setBlockIdx(saved.blockIdx ?? 0)
    setRoundIdx(saved.roundIdx ?? 0)
    setExIdx(saved.exIdx ?? 0)
    setVals(saved.vals ?? {})
    setLog(saved.log ?? [])
    setStartedAt(saved.startedAt ?? Date.now())
    if (saved.phase === 'review') setPhase({ type: 'review' })
    setStarted(true)
  }, [workoutId])

  // Navigation guard
  useEffect(() => {
    if (!started) return
    const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [started])

  // Up next label
  const upNext = (): string | null => {
    if (!block) return null
    if (exIdx < block.exercises.length - 1) return block.exercises[exIdx + 1].exerciseTitle
    if (roundIdx < block.rounds - 1) return `Round ${roundIdx + 2} — ${block.exercises[0].exerciseTitle}`
    if (blockIdx < workoutBlocks.length - 1) {
      const nb = workoutBlocks[blockIdx + 1]
      return `${nb.name} — ${nb.exercises[0].exerciseTitle}`
    }
    return null
  }

  // ── Start ────────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    setSubmitting(true)
    try {
      const res = await startSession({ workoutId })
      const now = Date.now()
      setSessionId(res.id); setStartedAt(now); setStarted(true)
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  // ── Log set + advance ────────────────────────────────────────────────────────
  const handleCompleteSet = async (overrideDuration?: number) => {
    if (!sessionId || !exercise) return
    setSubmitting(true)
    setApiError(null)
    try {
      const v = curVals
      await logSet({
        sessionId, exerciseId: exercise.exerciseId,
        roundNumber:     roundIdx + 1,
        reps:            isTime ? 0 : v.reps,
        durationSeconds: isTime ? (overrideDuration ?? v.duration) : 0,
        weightLbs:       exercise.trackingType.includes('weight') ? v.weight : 0,
      })
      // Add to review log
      setLog(prev => [...prev, {
        key: posKey, blockName: block.name,
        exerciseTitle: exercise.exerciseTitle,
        exerciseId: exercise.exerciseId,
        trackingType: exercise.trackingType,
        reps: v.reps, weight: v.weight,
        duration: overrideDuration ?? v.duration,
      }])
      advance()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar set'
      if (msg === 'SESSION_NOT_FOUND') {
        // Sesión expirada o no existe — limpiar y reiniciar
        store.clear(userId, workoutId)
        setSessionId(null); setStarted(false)
        setBlockIdx(0); setRoundIdx(0); setExIdx(0)
        setLog([]); setVals({})
        setPhase({ type: 'exercise' })
        setApiError('La sesión expiró. Por favor inicia una nueva sesión.')
      } else {
        setApiError(msg)
        console.error(e)
      }
    }
    finally { setSubmitting(false) }
  }

  // ── Advance ──────────────────────────────────────────────────────────────────
  const advance = () => {
    // Push current position to history
    setPosHistory(h => [...h, { bi: blockIdx, ri: roundIdx, ei: exIdx }])

    if (exIdx < block.exercises.length - 1) {
      setExIdx(e => e + 1); return
    }
    if (roundIdx < block.rounds - 1) {
      const secs = exercise?.defaultRestTimerSeconds ?? 30
      setPhase({ type: 'round-rest', label: `Descanso — Round ${roundIdx + 2}`, seconds: secs }); return
    }
    if (blockIdx < workoutBlocks.length - 1) {
      const secs = block.restTimerSeconds ?? 60
      setPhase({ type: 'block-rest', label: 'Descanso entre bloques', seconds: secs }); return
    }
    // All done → review
    setPhase({ type: 'review' })
  }

  const afterRoundRest = () => { setRoundIdx(r => r + 1); setExIdx(0); setPhase({ type: 'exercise' }) }
  const afterBlockRest = () => { setBlockIdx(b => b + 1); setRoundIdx(0); setExIdx(0); setPhase({ type: 'exercise' }) }

  // ── Go back to previous set ───────────────────────────────────────────────
  const handleGoBack = () => {
    if (posHistory.length === 0) return
    const prev = posHistory[posHistory.length - 1]
    setPosHistory(h => h.slice(0, -1))
    // Remove last log entry for that position so user can re-enter
    const prevKey = `${prev.bi}-${prev.ri}-${prev.ei}`
    setLog(l => {
      const idx = [...l].reverse().findIndex(s => s.key === prevKey)
      if (idx === -1) return l
      const realIdx = l.length - 1 - idx
      return [...l.slice(0, realIdx), ...l.slice(realIdx + 1)]
    })
    setBlockIdx(prev.bi); setRoundIdx(prev.ri); setExIdx(prev.ei)
    setPhase({ type: 'exercise' })
  }

  // ── Edit a logged set ────────────────────────────────────────────────────────
  const handleEditSet = (key: string, field: 'reps' | 'weight' | 'duration', val: number) =>
    setLog(prev => prev.map(s => s.key === key ? { ...s, [field]: val, edited: true } : s))

  const handleFinish = async (customMins?: number) => {
    if (!sessionId) return
    setSubmitting(true)
    const durationSec = customMins ? customMins * 60 : elapsedSec
    try {
      await completeSession(sessionId, durationSec)
      store.clear(userId, workoutId)
      onSessionComplete()
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  // ── Cancel: borra la sesión completa de la BD ──────────────────────────────
  const handleCancel = async () => {
    if (!sessionId) { store.clear(userId, workoutId); onSessionComplete(); return }
    setSubmitting(true)
    try {
      await cancelSession(sessionId)
      store.clear(userId, workoutId)
      onSessionComplete()
    } catch (e) { console.error(e) }
    finally { setSubmitting(false); setShowCancel(false) }
  }

  // ── Cerrar: va a review con los sets ya completados ────────────────────────
  const handleCloseToReview = () => setPhase({ type: 'review' })

  // ── Renders ───────────────────────────────────────────────────────────────────
  if (workoutBlocks.length === 0)
    return <div className="card text-center p-8 text-dark/50">Esta clase no tiene ejercicios configurados.</div>

  if (!started) return (
    <div className="card text-center space-y-5 py-10">
      <Dumbbell className="h-14 w-14 text-primary mx-auto" />
      <div>
        <h3 className="font-melodrama text-2xl text-dark">¿Listo para empezar?</h3>
        <p className="text-dark/50 text-sm font-urwdin mt-1">
          {workoutBlocks.length} bloques · {workoutBlocks.reduce((a, b) => a + b.exercises.length, 0)} ejercicios
        </p>
      </div>
      <button onClick={handleStart} disabled={submitting} className="btn-primary px-10 py-3">
        {submitting ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
    </div>
  )

  // Timeout modal (2 hours)
  if (showTimeout) return (
    <TimeoutModal
      elapsedMin={Math.round(elapsedSec / 60)}
      onConfirm={mins => { setShowTimeout(false); handleFinish(mins) }}
    />
  )

  // ── Cancel confirmation modal (shown as overlay) ──────────────────────────
  const cancelModal = showCancel && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-melodrama text-xl text-dark">Cancelar clase</h3>
        </div>
        <p className="text-sm text-dark/70 font-urwdin leading-relaxed">
          Se borrarán <strong>todos los sets completados</strong> y la sesión será eliminada. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowCancel(false)} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-dark/20 text-dark font-urwdin text-sm hover:bg-dark/5">
            Volver
          </button>
          <button onClick={handleCancel} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-urwdin text-sm hover:bg-red-700 font-medium">
            {submitting ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Sticky action bar (always visible during active session) ──────────────
  const actionBar = (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-dark/8 mt-2">
      <button onClick={() => setShowCancel(true)}
        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-urwdin transition-colors">
        <X className="h-4 w-4" /> Cancelar clase
      </button>
      {phase.type !== 'review' && (
        <button onClick={handleCloseToReview}
          className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-dark font-urwdin transition-colors">
          <LogOut className="h-4 w-4" /> Cerrar clase
        </button>
      )}
    </div>
  )

  if (phase.type === 'round-rest') return (
    <div className="space-y-0">
      {cancelModal}
      <RestTimer label={phase.label} seconds={phase.seconds} onSkip={afterRoundRest} />
      <div className="card">{actionBar}</div>
    </div>
  )
  if (phase.type === 'block-rest') return (
    <div className="space-y-0">
      {cancelModal}
      <RestTimer label={phase.label} seconds={phase.seconds} onSkip={afterBlockRest} />
      <div className="card">{actionBar}</div>
    </div>
  )

  // Review screen
  if (phase.type === 'review') return (
    <div>
      {cancelModal}
      <ReviewScreen
        log={log}
        elapsedSec={elapsedSec}
        weightUnit={weightUnit}
        submitting={submitting}
        onEditSet={handleEditSet}
        onFinish={() => handleFinish()}
      />
      <div className="mt-3">{actionBar}</div>
    </div>
  )

  if (!block || !exercise) return (
    <div className="card text-center space-y-4 py-10">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <h3 className="font-melodrama text-xl">¡Clase completada!</h3>
      <button onClick={() => handleFinish()} disabled={submitting} className="btn-primary">Finalizar</button>
    </div>
  )

  // ── Exercise screen ───────────────────────────────────────────────────────────
  const elapsed = (() => {
    const s = elapsedSec; const m = Math.floor(s / 60)
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
  })()

  return (<>
    <div className="rounded-2xl overflow-hidden shadow border border-dark/8 bg-white">
      {/* Video */}
      <div className="aspect-video bg-dark relative">
        {streamUrl && !videoError
          ? <video key={streamUrl} src={streamUrl} controls className="w-full h-full object-cover" onError={() => setVideoError(true)} />
          : exercise.exerciseThumbnailUrl
            ? <img src={exercise.exerciseThumbnailUrl} alt={exercise.exerciseTitle} className="w-full h-full object-cover" />
            : <div className="absolute inset-0 flex items-center justify-center"><Dumbbell className="h-12 w-12 text-white/20" /></div>
        }
        <div className="absolute top-3 left-3">
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow">{block.name}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-black/50 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur-sm">Round {roundIdx + 1} / {block.rounds}</span>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm font-urwdin flex items-center gap-1">
            <Clock className="h-3 w-3" /> {elapsed}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm font-urwdin">{exIdx + 1} / {block.exercises.length}</span>
        </div>
      </div>

      {/* Title */}
      <div className="px-5 pt-4 pb-2 border-b border-dark/8">
        <h3 className="font-melodrama text-2xl text-dark leading-tight">{exercise.exerciseTitle}</h3>
        {exercise.notes && <p className="text-xs text-primary/80 font-urwdin mt-0.5">{exercise.notes}</p>}
        {/* Weight unit badge */}
        {hasWeight && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-urwdin text-dark/50 bg-secondary/30 px-2 py-0.5 rounded-full">
            <Dumbbell className="h-3 w-3" /> Peso en {weightUnit}
          </span>
        )}
      </div>


      {/* Inputs */}
      <div className="px-5 py-4">
        {isTime ? (
          <div className="space-y-3">
            <CountdownTimer total={curVals.duration} onComplete={() => handleCompleteSet(curVals.duration)} />
            <button onClick={() => handleCompleteSet(curVals.duration)} disabled={submitting}
              className="w-full py-2.5 rounded-xl border border-dark/20 text-dark/60 text-sm font-urwdin hover:bg-dark/5 transition-colors">
              Completar manualmente
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <Stepper label="reps" value={curVals.reps} min={0} onChange={v => setVal('reps', v)} />
              {hasWeight && (
                <Stepper label={weightUnit} value={curVals.weight} step={weightUnit === 'lbs' ? 5 : 2.5} min={0} onChange={v => setVal('weight', v)} />
              )}
            </div>
            {apiError && (
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-urwdin flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{apiError} — revisa que el backend esté corriendo y actualizado.</span>
              </div>
            )}
            <button onClick={() => handleCompleteSet()} disabled={submitting}
              className="btn-primary w-full h-14 text-lg rounded-2xl mt-4">
              {submitting ? 'Guardando...' : 'Completar Set'}
            </button>
          </>
        )}
      </div>

      {/* Two-sided navigation bar: ← prev  |  next → */}
      {(() => {
        const prevPos = posHistory.length > 0 ? posHistory[posHistory.length - 1] : null
        const prevName = prevPos
          ? workoutBlocks[prevPos.bi]?.exercises[prevPos.ei]?.exerciseTitle ?? null
          : null
        const nextName = upNext()
        if (!prevName && !nextName) return null
        return (
          <div className="border-t border-dark/8 grid grid-cols-2 divide-x divide-dark/8">
            <button
              onClick={prevName ? handleGoBack : undefined}
              disabled={!prevName}
              className={`flex items-center gap-2 px-4 py-3 text-left transition-colors min-w-0 ${
                prevName ? 'hover:bg-secondary/5 cursor-pointer' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="text-dark/40 text-sm shrink-0">←</span>
              <div className="min-w-0">
                <p className="text-xs text-dark/40 font-urwdin">Anterior</p>
                <p className="text-sm font-medium text-dark truncate">{prevName}</p>
              </div>
            </button>
            <div className={`flex items-center justify-end gap-2 px-4 py-3 min-w-0 ${
              nextName ? '' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="min-w-0 text-right">
                <p className="text-xs text-dark/40 font-urwdin">Siguiente</p>
                <p className="text-sm font-medium text-dark truncate">{nextName}</p>
              </div>
              <span className="text-dark/40 text-sm shrink-0">→</span>
            </div>
          </div>
        )
      })()}
    </div>

    {/* Action bar below the card */}
    <div className="card mt-3">{actionBar}</div>
    {cancelModal}
  </>
  )
}
