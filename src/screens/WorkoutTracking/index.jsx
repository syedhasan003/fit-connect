import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startWorkoutSession,
  getActiveSession,
  completeWorkoutSession,
  abandonWorkoutSession,
  getNextWorkoutDay,
} from '../../api/workout';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const injectCSS = () => {
  if (document.getElementById('wt-styles')) return;
  const el = document.createElement('style');
  el.id = 'wt-styles';
  el.textContent = `
    @keyframes wt-spin    { to { transform: rotate(360deg); } }
    @keyframes wt-fadeIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes wt-slideUp { from { opacity:0; transform:translateY(60px); } to { opacity:1; transform:translateY(0); } }
    @keyframes wt-pop     { 0%{transform:scale(0.8);opacity:0;} 60%{transform:scale(1.06);} 100%{transform:scale(1);opacity:1;} }
    @keyframes wt-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .wt-set-done     { animation: wt-pop 0.3s ease forwards; }
    .wt-summary-card { animation: wt-fadeIn 0.5s ease both; }
    .wt-abandon-sheet{ animation: wt-slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
    .wt-pills::-webkit-scrollbar { display:none; }
    .wt-num-input::-webkit-inner-spin-button,
    .wt-num-input::-webkit-outer-spin-button { -webkit-appearance:none; }
    .wt-num-input { -moz-appearance:textfield; }
    .wt-pill-btn  { transition:all 0.2s; }
    .wt-pill-btn:active  { transform:scale(0.94); }
    .wt-check-btn { transition:all 0.2s; }
    .wt-check-btn:active { transform:scale(0.9); }
  `;
  document.head.appendChild(el);
};

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg:         '#0d0d0f',
  surface:    '#18181c',
  surface2:   '#222228',
  border:     '#2a2a34',
  accent:     '#6366f1',
  accentGlow: 'rgba(99,102,241,0.22)',
  accentDim:  'rgba(99,102,241,0.14)',
  green:      '#22c55e',
  greenDim:   'rgba(34,197,94,0.13)',
  greenGlow:  'rgba(34,197,94,0.3)',
  orange:     '#f97316',
  red:        '#ef4444',
  redDim:     'rgba(239,68,68,0.13)',
  text:       '#f1f1f3',
  muted:      '#6b7280',
  muted2:     '#9ca3af',
};

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const lsKey = (sid) => `wt_progress_${sid}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function buildInitialSets(exercises) {
  const map = {};
  exercises.forEach((ex) => {
    map[ex.id] = Array.from({ length: ex.sets || 3 }, (_, i) => ({
      setIdx: i, weight: '', reps: String(ex.reps || ''), done: false,
    }));
  });
  return map;
}

function dayLabel(dayNumber, dayName) {
  const isGeneric = !dayName || /^day\s*\d+$/i.test(dayName.trim());
  return isGeneric ? `Day ${dayNumber}` : dayName;
}

// ─── SVG Rest Timer ───────────────────────────────────────────────────────────
function CircularTimer({ seconds, total, onSkip }) {
  const R = 72, circ = 2 * Math.PI * R;
  const dash = total > 0 ? circ * (seconds / total) : 0;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
    }}>
      <p style={{ color: C.muted2, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>Rest</p>
      <svg width={184} height={184} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={92} cy={92} r={R} fill="none" stroke={C.surface2} strokeWidth={9} />
        <circle cx={92} cy={92} r={R} fill="none" stroke={C.orange} strokeWidth={9}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear' }} />
        <g transform="rotate(90,92,92)">
          <text x={92} y={80} textAnchor="middle" dominantBaseline="middle"
            fill={C.text} fontSize={44} fontWeight="800" fontFamily="system-ui">
            {seconds}
          </text>
          <text x={92} y={116} textAnchor="middle" dominantBaseline="middle"
            fill={C.muted} fontSize={13} fontFamily="system-ui">
            seconds
          </text>
        </g>
      </svg>
      <button onClick={onSkip} style={{
        padding: '13px 44px', background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: 100, color: C.text, fontSize: 15, fontWeight: 600, cursor: 'pointer',
      }}>
        Skip Rest
      </button>
    </div>
  );
}

// ─── Abandon Modal ────────────────────────────────────────────────────────────
function AbandonModal({ onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div className="wt-abandon-sheet" style={{
        width: '100%', background: C.surface, borderRadius: '24px 24px 0 0',
        padding: '28px 20px 44px', border: `1px solid ${C.border}`,
        borderBottom: 'none', boxSizing: 'border-box',
      }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 24px' }} />
        <h3 style={{ color: C.text, fontSize: 21, fontWeight: 800, margin: '0 0 8px' }}>Abandon Workout?</h3>
        <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
          Your session is saved. Come back and it'll resume right where you left off.
        </p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)..." rows={3}
          style={{
            width: '100%', padding: 14, borderRadius: 12, background: C.surface2,
            border: `1px solid ${C.border}`, color: C.text, fontSize: 14, resize: 'none',
            boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit', outline: 'none', lineHeight: 1.5,
          }}
        />
        <button onClick={() => onConfirm(reason)} disabled={loading} style={{
          width: '100%', padding: 16, background: C.red, border: 'none', borderRadius: 14,
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          marginBottom: 10, opacity: loading ? 0.65 : 1,
        }}>
          {loading ? 'Abandoning...' : 'Yes, Abandon'}
        </button>
        <button onClick={onCancel} style={{
          width: '100%', padding: 16, background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 14, color: C.text, fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>
          Keep Going
        </button>
      </div>
    </div>
  );
}

// ─── Summary Screen (no emojis, gradient cards) ───────────────────────────────
function SummaryScreen({ session, setLogs, exercises, duration, onGoHome }) {
  const doneSets     = Object.values(setLogs).reduce((a, s) => a + s.filter(x => x.done).length, 0);
  const totalVolume  = Object.values(setLogs).reduce((a, s) =>
    a + s.filter(x => x.done).reduce((b, x) => b + (parseFloat(x.weight)||0)*(parseInt(x.reps)||0), 0), 0);
  const doneExercises = Object.values(setLogs).filter(s => s.some(x => x.done)).length;

  const stats = [
    { label: 'Duration',   value: formatDuration(duration), gradient: 'linear-gradient(135deg,#6366f1,#818cf8)', unit: '' },
    { label: 'Exercises',  value: `${doneExercises}/${exercises.length}`, gradient: 'linear-gradient(135deg,#059669,#10b981)', unit: '' },
    { label: 'Total Sets', value: doneSets, gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', unit: '' },
    { label: 'Volume',     value: Math.round(totalVolume).toLocaleString(), gradient: 'linear-gradient(135deg,#be185d,#ec4899)', unit: 'kg' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', gap: 28,
    }}>
      {/* Gradient badge instead of trophy emoji */}
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #818cf8, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 48px rgba(99,102,241,0.5)',
        animation: 'wt-pop 0.6s ease',
      }}>
        <svg width={36} height={36} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 18 12 24 30 6" />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: C.text, fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Workout Complete</h2>
        <p style={{ color: C.muted2, fontSize: 14, margin: 0 }}>
          {session?.program_name} · {dayLabel(session?.day_number, session?.day_name)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 380 }}>
        {stats.map((s, i) => (
          <div key={s.label} className="wt-summary-card" style={{
            animationDelay: `${i * 0.1}s`,
            background: s.gradient,
            borderRadius: 18, padding: '22px 16px', textAlign: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
              {s.value}{s.unit ? <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 3 }}>{s.unit}</span> : null}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <button onClick={onGoHome} style={{
        padding: '16px 52px',
        background: `linear-gradient(135deg, ${C.accent}, #818cf8)`,
        border: 'none', borderRadius: 100, color: '#fff',
        fontSize: 17, fontWeight: 800, cursor: 'pointer',
        boxShadow: `0 8px 32px ${C.accentGlow}`,
      }}>
        Back to Home
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorkoutTracking() {
  injectCSS();
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [session,   setSession]   = useState(null);
  const [exercises, setExercises] = useState([]);
  const [setLogs,   setSetLogs]   = useState({});
  const sessionLoaded = useRef(false);

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [phase,       setPhase]       = useState('workout');
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal,   setRestTotal]   = useState(0);
  const [showAbandon, setShowAbandon] = useState(false);
  const [abandoning,  setAbandoning]  = useState(false);
  const [completing,  setCompleting]  = useState(false);
  const [resumed,     setResumed]     = useState(false);

  const [sessionSec, setSessionSec] = useState(0);
  const sessionRef = useRef(null);
  const restRef    = useRef(null);
  const pillsRef   = useRef(null);

  useEffect(() => { loadWorkoutSession(); }, []);
  useEffect(() => {
    sessionRef.current = setInterval(() => setSessionSec(s => s + 1), 1000);
    return () => clearInterval(sessionRef.current);
  }, []);
  useEffect(() => {
    if (phase !== 'rest') return;
    restRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) { clearInterval(restRef.current); setPhase('workout'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [phase]);
  useEffect(() => {
    if (!pillsRef.current) return;
    const pill = pillsRef.current.children[currentIdx];
    if (pill) pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIdx]);
  useEffect(() => {
    if (!sessionLoaded.current || !session?.id || Object.keys(setLogs).length === 0) return;
    localStorage.setItem(lsKey(session.id), JSON.stringify(setLogs));
  }, [setLogs, session?.id]);

  const loadWorkoutSession = async () => {
    try {
      setLoading(true); setError(null);
      let nextDay;
      try { nextDay = await getNextWorkoutDay(); }
      catch { setError('No active workout program. Please set one in the Vault first.'); return; }

      let activeSession = await getActiveSession();
      if (!activeSession) activeSession = await startWorkoutSession(nextDay.program_id, nextDay.day_number);

      setSession({ ...activeSession, program_name: nextDay.program_name, day_number: nextDay.day_number, day_name: nextDay.day_name });
      const exList = nextDay.exercises || [];
      setExercises(exList);

      const saved = localStorage.getItem(lsKey(activeSession.id));
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (exList.some(ex => parsed[ex.id] !== undefined)) {
            setSetLogs(parsed); setResumed(true); setTimeout(() => setResumed(false), 3500);
          } else { setSetLogs(buildInitialSets(exList)); }
        } catch { setSetLogs(buildInitialSets(exList)); }
      } else { setSetLogs(buildInitialSets(exList)); }

      sessionLoaded.current = true;
    } catch (err) {
      setError(err.message || 'Failed to load workout session');
    } finally { setLoading(false); }
  };

  const clearSaved = () => { if (session?.id) localStorage.removeItem(lsKey(session.id)); };

  const updateSet = useCallback((exId, idx, field, value) => {
    setSetLogs(prev => ({ ...prev, [exId]: prev[exId].map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  }, []);
  const addSet = useCallback((exId, targetReps) => {
    setSetLogs(prev => ({ ...prev, [exId]: [...prev[exId], { setIdx: prev[exId].length, weight: '', reps: String(targetReps || ''), done: false }] }));
  }, []);
  const markSetDone = useCallback((exId, idx, restSec) => {
    setSetLogs(prev => ({ ...prev, [exId]: prev[exId].map((s, i) => i === idx ? { ...s, done: true } : s) }));
    setRestTotal(restSec); setRestSeconds(restSec); setPhase('rest');
  }, []);
  const skipRest = () => { clearInterval(restRef.current); setPhase('workout'); };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await completeWorkoutSession(session.id);
      clearSaved(); clearInterval(sessionRef.current); setPhase('summary');
    } catch (err) { alert(err.message || 'Failed to complete workout'); }
    finally { setCompleting(false); }
  };

  const handleAbandon = async (reason) => {
    try {
      setAbandoning(true);
      await abandonWorkoutSession(session.id, reason);
      clearSaved(); clearInterval(sessionRef.current); navigate('/');
    } catch (err) { alert(err.message || 'Failed to abandon session'); setAbandoning(false); }
  };

  const exerciseStatus = (exId) => {
    const sets = setLogs[exId] || [];
    const done = sets.filter(s => s.done).length;
    if (done === 0) return 'idle';
    if (done >= sets.length) return 'done';
    return 'active';
  };

  const totalDone    = exercises.filter(ex => exerciseStatus(ex.id) === 'done').length;
  const progress     = exercises.length ? Math.round((totalDone / exercises.length) * 100) : 0;
  const totalSetsLog = Object.values(setLogs).reduce((a, s) => a + s.filter(x => x.done).length, 0);
  const todayWeekday = WEEKDAYS[new Date().getDay()].toUpperCase();
  const cleanDayLabel = dayLabel(session?.day_number, session?.day_name);
  // Show ONLY the assigned day name if one exists, otherwise fall back to today's real weekday
  const hasCustomDay = session?.day_name && !/^day\s*\d+$/i.test(session.day_name.trim());
  const displayDay = (hasCustomDay ? session.day_name : todayWeekday).toUpperCase();

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${C.surface2}`, borderTop: `4px solid ${C.accent}`, borderRadius: '50%', animation: 'wt-spin 0.8s linear infinite' }} />
      <p style={{ color: C.muted, fontSize: 14, letterSpacing: 0.5 }}>Loading workout...</p>
    </div>
  );

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, textAlign: 'center' }}>
      <p style={{ color: C.text, fontSize: 17, fontWeight: 600, maxWidth: 300, lineHeight: 1.5 }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ padding: '14px 36px', background: C.accent, border: 'none', borderRadius: 100, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Go Home
      </button>
    </div>
  );

  // ─── Summary ────────────────────────────────────────────────────────────────
  if (phase === 'summary') return (
    <SummaryScreen session={session} setLogs={setLogs} exercises={exercises} duration={sessionSec} onGoHome={() => navigate('/')} />
  );

  const currentExercise = exercises[currentIdx];
  const currentSets     = setLogs[currentExercise?.id] || [];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', paddingBottom: 110 }}>

      {phase === 'rest' && <CircularTimer seconds={restSeconds} total={restTotal} onSkip={skipRest} />}
      {showAbandon && <AbandonModal onConfirm={handleAbandon} onCancel={() => setShowAbandon(false)} loading={abandoning} />}

      {/* RESUMED BANNER */}
      {resumed && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
          background: 'linear-gradient(135deg, #4338ca, #6366f1)',
          padding: '10px 20px', textAlign: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
          animation: 'wt-fadeIn 0.4s ease',
        }}>
          Session resumed — continuing where you left off
        </div>
      )}

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: `${C.bg}ee`, backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 20px', marginTop: resumed ? 40 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
              ← Back
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{session?.program_name || 'Workout'}</span>
            {/* Single coloured label: assigned day name OR today's weekday — never both */}
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.accent, textTransform: 'uppercase' }}>
              {displayDay}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* Live timer with gradient text */}
            <span style={{
              fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              background: `linear-gradient(135deg, ${C.accent}, #818cf8)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1,
            }}>
              {formatDuration(sessionSec)}
            </span>
            <button onClick={() => setShowAbandon(true)} style={{
              padding: '4px 12px', background: C.redDim, border: `1px solid ${C.red}44`,
              borderRadius: 100, color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.8,
            }}>
              ABANDON
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 5, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)',
              borderRadius: 3, transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, color: C.muted }}>{progress}% complete</span>
            <span style={{ fontSize: 11, color: C.muted }}>{totalSetsLog} sets logged</span>
          </div>
        </div>
      </div>

      {/* ── EXERCISE PILLS ── */}
      <div style={{ padding: '16px 20px 4px' }}>
        <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px' }}>Exercises</p>
        <div ref={pillsRef} className="wt-pills" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {exercises.map((ex, i) => {
            const st = exerciseStatus(ex.id);
            const isActive = i === currentIdx;
            const bg =
              isActive    ? C.accent  :
              st==='done' ? C.green   :
              st==='active'? '#4338ca':
              C.surface2;
            return (
              <button key={ex.id} className="wt-pill-btn" onClick={() => setCurrentIdx(i)} style={{
                flexShrink: 0, padding: '7px 15px', borderRadius: 100,
                background: bg, border: `2px solid ${isActive ? C.accent : 'transparent'}`,
                color: (st==='idle' && !isActive) ? C.muted2 : '#fff',
                fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                boxShadow: isActive ? `0 0 14px ${C.accentGlow}` : st==='done' ? `0 0 10px ${C.greenGlow}` : 'none',
              }}>
                {st === 'done' ? '✓ ' : ''}{ex.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EXERCISE CARD ── */}
      {currentExercise && (
        <div style={{ padding: '14px 20px' }}>
          <div style={{ background: C.surface, borderRadius: 22, border: `1px solid ${C.border}`, overflow: 'hidden' }}>

            {/* Card header with gradient accent bar */}
            <div style={{
              height: 3,
              background: 'linear-gradient(90deg, #6366f1, #818cf8, #a78bfa, #ec4899)',
            }} />

            <div style={{
              padding: '20px 20px 16px',
              background: `linear-gradient(135deg, ${C.surface2} 0%, ${C.surface} 100%)`,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 8px', color: C.text }}>{currentExercise.name}</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {currentExercise.muscle_group && (
                      <span style={{ padding: '3px 11px', background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 100, fontSize: 11, color: C.accent, fontWeight: 600 }}>
                        {currentExercise.muscle_group}
                      </span>
                    )}
                    {currentExercise.area && (
                      <span style={{ padding: '3px 11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 100, fontSize: 11, color: C.muted2 }}>
                        {currentExercise.area}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                    style={{ width: 36, height: 36, borderRadius: 10, background: C.surface2, border: `1px solid ${C.border}`, color: currentIdx === 0 ? C.border : C.text, fontSize: 16, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}>
                    ←
                  </button>
                  <button onClick={() => setCurrentIdx(Math.min(exercises.length - 1, currentIdx + 1))} disabled={currentIdx === exercises.length - 1}
                    style={{ width: 36, height: 36, borderRadius: 10, background: C.surface2, border: `1px solid ${C.border}`, color: currentIdx === exercises.length - 1 ? C.border : C.text, fontSize: 16, cursor: currentIdx === exercises.length - 1 ? 'not-allowed' : 'pointer' }}>
                    →
                  </button>
                </div>
              </div>

              {/* Stat chips with gradient colors */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {[
                  { label: 'Sets',  val: currentSets.length, grad: 'linear-gradient(135deg,#6366f1,#818cf8)' },
                  { label: 'Reps',  val: currentExercise.reps, grad: 'linear-gradient(135deg,#059669,#10b981)' },
                  { label: 'Rest',  val: `${currentExercise.rest_seconds||90}s`, grad: 'linear-gradient(135deg,#d97706,#f59e0b)' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '8px 14px', borderRadius: 10,
                    background: item.grad, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{item.val}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sets table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr 42px', padding: '10px 16px', gap: 8, borderBottom: `1px solid ${C.border}` }}>
              {['SET', 'PREV', 'KG', 'REPS', ''].map(h => (
                <span key={h} style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1.2, textAlign: 'center' }}>{h}</span>
              ))}
            </div>

            {/* Set rows */}
            {currentSets.map((set, i) => {
              const isDone = set.done;
              return (
                <div key={i} className={isDone ? 'wt-set-done' : ''} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr 42px',
                  padding: '9px 16px', gap: 8, alignItems: 'center',
                  background: isDone ? C.greenDim : 'transparent',
                  borderBottom: `1px solid ${C.border}`, transition: 'background 0.3s',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, margin: '0 auto',
                    background: isDone ? 'linear-gradient(135deg,#22c55e,#16a34a)' : C.surface2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: isDone ? '#fff' : C.muted2,
                    boxShadow: isDone ? `0 2px 8px ${C.greenGlow}` : 'none',
                  }}>{i + 1}</div>

                  <div style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>—</div>

                  <input className="wt-num-input" type="number" placeholder="0" value={set.weight}
                    onChange={e => updateSet(currentExercise.id, i, 'weight', e.target.value)}
                    disabled={isDone}
                    style={{
                      padding: '8px 4px', borderRadius: 10, textAlign: 'center',
                      background: isDone ? 'transparent' : C.surface2,
                      border: `1px solid ${isDone ? 'transparent' : C.border}`,
                      color: isDone ? C.muted : C.text, fontSize: 15, fontWeight: 700,
                      width: '100%', boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                  <input className="wt-num-input" type="number" placeholder="0" value={set.reps}
                    onChange={e => updateSet(currentExercise.id, i, 'reps', e.target.value)}
                    disabled={isDone}
                    style={{
                      padding: '8px 4px', borderRadius: 10, textAlign: 'center',
                      background: isDone ? 'transparent' : C.surface2,
                      border: `1px solid ${isDone ? 'transparent' : C.border}`,
                      color: isDone ? C.muted : C.text, fontSize: 15, fontWeight: 700,
                      width: '100%', boxSizing: 'border-box', outline: 'none',
                    }}
                  />

                  <button className="wt-check-btn"
                    onClick={() => !isDone && markSetDone(currentExercise.id, i, currentExercise.rest_seconds || 90)}
                    disabled={isDone}
                    style={{
                      width: 36, height: 36, borderRadius: 10, margin: '0 auto',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'linear-gradient(135deg,#22c55e,#16a34a)' : C.surface2,
                      border: `2px solid ${isDone ? C.green : C.border}`,
                      color: isDone ? '#fff' : C.muted, fontSize: 17,
                      cursor: isDone ? 'default' : 'pointer',
                      boxShadow: isDone ? `0 2px 10px ${C.greenGlow}` : 'none',
                    }}>
                    ✓
                  </button>
                </div>
              );
            })}

            <div style={{ padding: '12px 16px' }}>
              <button onClick={() => addSet(currentExercise.id, currentExercise.reps)} style={{
                width: '100%', padding: 11, background: 'transparent',
                border: `1px dashed ${C.border}`, borderRadius: 12,
                color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                + Add Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: `${C.bg}f2`, backdropFilter: 'blur(18px)',
        borderTop: `1px solid ${C.border}`, padding: '12px 20px 30px', display: 'flex', gap: 10,
      }}>
        {currentIdx < exercises.length - 1 && (
          <button onClick={() => setCurrentIdx(currentIdx + 1)} style={{
            flex: 1, padding: 15, background: C.surface2,
            border: `1px solid ${C.border}`, borderRadius: 14,
            color: C.text, fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            Next →
          </button>
        )}
        <button onClick={handleComplete} disabled={completing || totalSetsLog === 0}
          style={{
            flex: 2, padding: 15, border: 'none', borderRadius: 14,
            background: totalSetsLog > 0 ? 'linear-gradient(135deg,#22c55e,#16a34a)' : C.surface2,
            color: totalSetsLog > 0 ? '#fff' : C.muted,
            fontSize: 15, fontWeight: 800, letterSpacing: 0.3,
            cursor: (totalSetsLog > 0 && !completing) ? 'pointer' : 'not-allowed',
            opacity: completing ? 0.7 : 1,
            boxShadow: totalSetsLog > 0 ? `0 4px 20px ${C.greenGlow}` : 'none',
            transition: 'all 0.3s',
          }}>
          {completing ? 'Finishing...' : 'Finish Workout'}
        </button>
      </div>
    </div>
  );
}