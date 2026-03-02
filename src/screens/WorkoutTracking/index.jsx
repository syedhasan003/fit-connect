import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startWorkoutSession,
  getActiveSession,
  completeWorkoutSession,
  abandonWorkoutSession,
  getNextWorkoutDay,
  getPreviousSession,
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
    @keyframes wt-pop     { 0%{transform:scale(0.8);opacity:0;} 60%{transform:scale(1.08);} 100%{transform:scale(1);opacity:1;} }
    @keyframes wt-pr-pop  { 0%{transform:scale(0);opacity:0;} 70%{transform:scale(1.2);} 100%{transform:scale(1);opacity:1;} }
    @keyframes wt-shimmer { 0%{opacity:0;} 30%{opacity:1;} 70%{opacity:1;} 100%{opacity:0;} }
    @keyframes wt-rpe-in  { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
    .wt-set-done     { animation: wt-pop 0.3s ease forwards; }
    .wt-summary-card { animation: wt-fadeIn 0.5s ease both; }
    .wt-abandon-sheet{ animation: wt-slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
    .wt-pr-badge     { animation: wt-pr-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .wt-rpe-row      { animation: wt-rpe-in 0.25s ease forwards; }
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
  surface3:   '#2a2a34',
  border:     '#2a2a34',
  accent:     '#6366f1',
  accentGlow: 'rgba(99,102,241,0.22)',
  accentDim:  'rgba(99,102,241,0.14)',
  green:      '#22c55e',
  greenDim:   'rgba(34,197,94,0.10)',
  greenGlow:  'rgba(34,197,94,0.3)',
  gold:       '#f59e0b',
  goldDim:    'rgba(245,158,11,0.12)',
  goldGlow:   'rgba(245,158,11,0.35)',
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

// Check if a set is a PR vs previous data for this exercise
function isPR(exerciseName, weight, reps, prevData) {
  const prev = prevData[exerciseName];
  if (!prev || prev.length === 0) return false;
  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  if (w === 0) return false;
  const prevDoneSets = prev.filter(s => s.done && parseFloat(s.weight) > 0);
  if (prevDoneSets.length === 0) return false;
  const maxPrevWeight = Math.max(...prevDoneSets.map(s => parseFloat(s.weight) || 0));
  return w > maxPrevWeight;
}

// Build prev summary string for a set row: "Last: 80 × 8"
function prevSetLabel(exerciseName, setIdx, prevData) {
  const prev = prevData[exerciseName];
  if (!prev) return null;
  const s = prev[setIdx];
  if (!s || !s.done) {
    // fall back to any done set
    const any = prev.find(x => x.done && x.weight);
    if (!any) return null;
    return `${any.weight} × ${any.reps}`;
  }
  if (!s.weight) return null;
  return `${s.weight} × ${s.reps}`;
}

// ─── SVG Rest Timer ───────────────────────────────────────────────────────────
function CircularTimer({ seconds, total, onSkip }) {
  const R = 72, circ = 2 * Math.PI * R;
  const dash = total > 0 ? circ * (seconds / total) : 0;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)',
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

// ─── RPE Quick-Tap Row ────────────────────────────────────────────────────────
function RpeRow({ onSelect }) {
  const opts = [
    { label: 'Easy', val: 'easy', grad: 'linear-gradient(135deg,#059669,#10b981)' },
    { label: 'Hard', val: 'hard', grad: 'linear-gradient(135deg,#d97706,#f59e0b)' },
    { label: 'Max Effort', val: 'max', grad: 'linear-gradient(135deg,#dc2626,#ef4444)' },
  ];
  return (
    <div className="wt-rpe-row" style={{
      gridColumn: '1 / -1',
      display: 'flex', gap: 8, padding: '8px 16px 10px',
      background: `linear-gradient(90deg, ${C.surface2}, ${C.surface})`,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 10, color: C.muted, alignSelf: 'center', letterSpacing: 0.8, textTransform: 'uppercase', marginRight: 4 }}>Effort</span>
      {opts.map(o => (
        <button key={o.val} onClick={() => onSelect(o.val)} style={{
          flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: o.grad, color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
          transition: 'opacity 0.15s',
        }}>
          {o.label}
        </button>
      ))}
      <button onClick={() => onSelect(null)} style={{
        padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
        background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>
        Skip
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
          Your session is saved. Come back and it'll resume where you left off.
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

// ─── Summary Screen ───────────────────────────────────────────────────────────
function SummaryScreen({ session, setLogs, exercises, duration, prSet, onGoHome }) {
  const doneSets      = Object.values(setLogs).reduce((a, s) => a + s.filter(x => x.done).length, 0);
  const totalVolume   = Object.values(setLogs).reduce((a, s) =>
    a + s.filter(x => x.done).reduce((b, x) => b + (parseFloat(x.weight)||0)*(parseInt(x.reps)||0), 0), 0);
  const doneExercises = Object.values(setLogs).filter(s => s.some(x => x.done)).length;
  const prCount       = Object.keys(prSet).length;

  const musclesWorked = [...new Set(
    exercises
      .filter(ex => (setLogs[ex.id] || []).some(s => s.done))
      .map(ex => ex.muscle_group)
      .filter(Boolean)
  )];

  // Per-exercise breakdown: name + volume + sets done
  const exBreakdown = exercises.map(ex => {
    const sets  = (setLogs[ex.id] || []).filter(s => s.done);
    const vol   = sets.reduce((a, s) => a + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0);
    return { name: ex.name, sets: sets.length, vol: Math.round(vol) };
  }).filter(e => e.sets > 0);

  const headline = prCount > 0
    ? `${prCount} PR${prCount > 1 ? 's' : ''} set today`
    : totalVolume > 0
      ? `${Math.round(totalVolume).toLocaleString()} kg moved`
      : 'Session done';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 80px' }}>

      {/* Hero banner */}
      <div style={{
        width: '100%', padding: '56px 24px 36px',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #0d0d0f 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4338ca, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(99,102,241,0.5)',
          animation: 'wt-pop 0.5s ease',
        }}>
          <svg width={34} height={34} fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 17 12 24 29 7" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#818cf8', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            {session?.program_name} · {dayLabel(session?.day_number, session?.day_name)}
          </div>
          <h2 style={{ color: C.text, fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1 }}>
            {headline}
          </h2>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>

        {/* PRs callout */}
        {prCount > 0 && (
          <div className="wt-summary-card" style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 18, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
              Personal Records
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.values(prSet).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{p.exercise}</span>
                  <span style={{ fontSize: 13, color: C.gold, fontWeight: 800 }}>{p.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Volume — hero stat */}
          <div className="wt-summary-card" style={{
            background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
            border: '1px solid rgba(129,140,248,0.2)',
            borderRadius: 18, padding: '20px 16px',
          }}>
            <div style={{ color: '#818cf8', fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
              {Math.round(totalVolume).toLocaleString()}
              <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 3, color: '#a5b4fc' }}>kg</span>
            </div>
            <div style={{ color: 'rgba(165,180,252,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>Total Volume</div>
            <div style={{ color: 'rgba(165,180,252,0.4)', fontSize: 9, marginTop: 2, fontWeight: 500 }}>weight × reps per set</div>
          </div>

          {/* Duration */}
          <div className="wt-summary-card" style={{
            background: 'linear-gradient(135deg,#064e3b,#065f46)',
            border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 18, padding: '20px 16px',
          }}>
            <div style={{ color: '#34d399', fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
              {formatDuration(duration)}
            </div>
            <div style={{ color: 'rgba(52,211,153,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>Duration</div>
          </div>
        </div>

        {/* Secondary stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="wt-summary-card" style={{
            background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '16px',
          }}>
            <div style={{ color: C.text, fontSize: 22, fontWeight: 800 }}>{doneExercises}<span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>/{exercises.length}</span></div>
            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>Exercises</div>
          </div>
          <div className="wt-summary-card" style={{
            background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '16px',
          }}>
            <div style={{ color: C.text, fontSize: 22, fontWeight: 800 }}>{doneSets}</div>
            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>Total Sets</div>
          </div>
        </div>

        {/* Exercise breakdown */}
        {exBreakdown.length > 0 && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 18, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px 10px', fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              Exercise Breakdown
            </div>
            {exBreakdown.map((e, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 18px',
                borderTop: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{e.name}</span>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{e.sets} sets</span>
                  {e.vol > 0 && <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700 }}>{e.vol.toLocaleString()} kg</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Muscles worked */}
        {musclesWorked.length > 0 && (
          <div>
            <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px', fontWeight: 700 }}>Muscles Worked</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {musclesWorked.map(m => (
                <div key={m} style={{
                  padding: '7px 16px', borderRadius: 999,
                  background: C.accentDim, border: `1px solid ${C.accent}44`,
                  fontSize: 12, fontWeight: 700, color: '#a5b4fc',
                }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onGoHome} style={{
          width: '100%', padding: '17px 0', marginTop: 8,
          background: 'linear-gradient(135deg, #4338ca, #6366f1)',
          border: 'none', borderRadius: 100, color: '#fff',
          fontSize: 16, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
        }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── Rest Day Screen ──────────────────────────────────────────────────────────
function RestDayScreen({ programName, onGoHome }) {
  const todayWeekday = WEEKDAYS[new Date().getDay()];
  const tips = [
    { label: 'Stay hydrated',    sub: 'Aim for 2–3 L of water today',     grad: 'linear-gradient(135deg,#1e3a5f,#1e40af)' },
    { label: 'Prioritise sleep', sub: 'Muscle repair happens overnight',   grad: 'linear-gradient(135deg,#1c1b4b,#312e81)' },
    { label: 'Light movement',   sub: 'A walk or stretch is all you need', grad: 'linear-gradient(135deg,#064e3b,#065f46)' },
  ];
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', gap: 28,
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 48px rgba(99,102,241,0.3)',
        animation: 'wt-pop 0.6s ease',
      }}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none"
          stroke="#818cf8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <h2 style={{ color: C.text, fontSize: 28, fontWeight: 800, margin: '0 0 10px' }}>Rest Day</h2>
        <p style={{ color: C.muted2, fontSize: 15, lineHeight: 1.6, margin: '0 0 6px' }}>
          No workout scheduled for {todayWeekday}.
        </p>
        {programName && (
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            {programName} · Recovery is part of progress.
          </p>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tips.map(tip => (
          <div key={tip.label} style={{ background: tip.grad, borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{tip.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>{tip.sub}</div>
          </div>
        ))}
      </div>

      <button onClick={onGoHome} style={{
        padding: '15px 52px',
        background: `linear-gradient(135deg, #4338ca, #6366f1)`,
        border: 'none', borderRadius: 100, color: '#fff',
        fontSize: 16, fontWeight: 800, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
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

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [session,     setSession]     = useState(null);
  const [exercises,   setExercises]   = useState([]);
  const [setLogs,     setSetLogs]     = useState({});
  const [restDay,     setRestDay]     = useState(false);
  const [restDayInfo, setRestDayInfo] = useState(null);
  const [prevData,    setPrevData]    = useState({});  // exerciseName → [{weight, reps, done}]
  const [prSet,       setPrSet]       = useState({});  // key → {exercise, weight, reps}
  const [rpeCapture,  setRpeCapture]  = useState(null); // {exId, setIdx}
  const [exNotes,     setExNotes]     = useState({});  // exId → note string
  const [noteOpen,    setNoteOpen]    = useState({});  // exId → bool (input visible)
  const sessionLoaded = useRef(false);

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [phase,       setPhase]       = useState('workout');
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal,   setRestTotal]   = useState(0);
  const [showAbandon, setShowAbandon] = useState(false);
  const [abandoning,  setAbandoning]  = useState(false);
  const [completing,  setCompleting]  = useState(false);
  const [resumed,     setResumed]     = useState(false);
  const [sessionSec,  setSessionSec]  = useState(0);

  const sessionRef = useRef(null);
  const restRef    = useRef(null);
  const pillsRef   = useRef(null);
  const nextDayRef = useRef(null); // stores nextDay for use at complete time

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

  // RPE capture stays until user taps an option or Skip

  const loadWorkoutSession = async () => {
    try {
      setLoading(true); setError(null);
      let nextDay;
      try { nextDay = await getNextWorkoutDay(); }
      catch { setError('No active workout program. Set one as active in the Vault first.'); return; }

      nextDayRef.current = nextDay;

      if (nextDay.rest_day) {
        setRestDay(true);
        setRestDayInfo({ program_name: nextDay.program_name });
        return;
      }

      let activeSession = await getActiveSession();
      if (!activeSession) activeSession = await startWorkoutSession(nextDay.program_id, nextDay.day_number);

      setSession({ ...activeSession, program_name: nextDay.program_name, day_number: nextDay.day_number, day_name: nextDay.day_name });
      const exList = nextDay.exercises || [];
      setExercises(exList);

      // Fetch previous session data for this program+day
      getPreviousSession(nextDay.program_id, nextDay.day_number)
        .then(prev => {
          if (prev?.found && prev.exercises_data) {
            setPrevData(prev.exercises_data);
          }
        })
        .catch(() => {});

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

  const markSetDone = useCallback((exId, idx, restSec, exerciseName) => {
    setSetLogs(prev => {
      const updated = { ...prev, [exId]: prev[exId].map((s, i) => i === idx ? { ...s, done: true } : s) };
      // PR detection
      const set = updated[exId][idx];
      if (isPR(exerciseName, set.weight, set.reps, prevData)) {
        const key = `${exId}-${idx}`;
        setPrSet(p => ({ ...p, [key]: { exercise: exerciseName, weight: set.weight, reps: set.reps } }));
      }
      return updated;
    });
    setRestTotal(restSec); setRestSeconds(restSec); setPhase('rest');
    // Show RPE capture after rest screen closes (we show it immediately, user can interact)
    setRpeCapture({ exId, setIdx: idx });
  }, [prevData]);

  const skipRest = () => { clearInterval(restRef.current); setPhase('workout'); };

  // Build exercisesData payload for saving (keyed by exercise name, includes notes)
  const buildExercisesData = useCallback(() => {
    const data = {};
    exercises.forEach(ex => {
      data[ex.name] = {
        sets: (setLogs[ex.id] || []),
        note: exNotes[ex.id] || '',
      };
    });
    return data;
  }, [exercises, setLogs, exNotes]);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const nd = nextDayRef.current;
      await completeWorkoutSession(session.id, {
        exercises_data: buildExercisesData(),
        program_id: nd?.program_id || session.manual_workout_id,
        day_number: nd?.day_number || session.day_number,
      });
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
  const hasCustomDay = session?.day_name && !/^day\s*\d+$/i.test(session.day_name.trim());
  const displayDay = (hasCustomDay ? session.day_name : todayWeekday).toUpperCase();

  // Suggestion: find the max weight used in prev data for current exercise
  const currentExercise = exercises[currentIdx];
  const currentSets     = setLogs[currentExercise?.id] || [];
  const prevSetsForCurrent = currentExercise ? prevData[currentExercise.name] : null;
  const prevDoneSets = prevSetsForCurrent ? prevSetsForCurrent.filter(s => s.done && s.weight) : [];
  const maxPrevWeight = prevDoneSets.length > 0 ? Math.max(...prevDoneSets.map(s => parseFloat(s.weight) || 0)) : null;
  const prevReps = prevDoneSets.length > 0 ? prevDoneSets[0].reps : null;
  // Suggest 2.5kg more if prev data exists
  const suggestedWeight = maxPrevWeight ? (Math.round((maxPrevWeight + 2.5) * 2) / 2).toString() : null;

  const applySuggestion = () => {
    if (!suggestedWeight || !currentExercise) return;
    setSetLogs(prev => ({
      ...prev,
      [currentExercise.id]: prev[currentExercise.id].map(s => s.done ? s : { ...s, weight: suggestedWeight }),
    }));
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${C.surface2}`, borderTop: `4px solid ${C.accent}`, borderRadius: '50%', animation: 'wt-spin 0.8s linear infinite' }} />
      <p style={{ color: C.muted, fontSize: 14, letterSpacing: 0.5 }}>Loading workout...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, textAlign: 'center' }}>
      <p style={{ color: C.text, fontSize: 17, fontWeight: 600, maxWidth: 300, lineHeight: 1.5 }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ padding: '14px 36px', background: C.accent, border: 'none', borderRadius: 100, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Go Home
      </button>
    </div>
  );

  if (restDay) return (
    <RestDayScreen programName={restDayInfo?.program_name} onGoHome={() => navigate('/')} />
  );

  if (phase === 'summary') return (
    <SummaryScreen session={session} setLogs={setLogs} exercises={exercises} duration={sessionSec} prSet={prSet} onGoHome={() => navigate('/')} />
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', paddingBottom: 110 }}>

      {phase === 'rest' && <CircularTimer seconds={restSeconds} total={restTotal} onSkip={skipRest} />}
      {showAbandon && <AbandonModal onConfirm={handleAbandon} onCancel={() => setShowAbandon(false)} loading={abandoning} />}

      {/* RESUMED BANNER */}
      {resumed && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
          background: 'linear-gradient(135deg, #3730a3, #4338ca)',
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
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.accent, textTransform: 'uppercase' }}>
              {displayDay}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{
              fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              background: `linear-gradient(135deg, #818cf8, #a78bfa)`,
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
          <div style={{ height: 4, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #4338ca, #6366f1, #818cf8, #a78bfa)',
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
              isActive    ? 'linear-gradient(135deg,#4338ca,#6366f1)'  :
              st==='done' ? 'linear-gradient(135deg,#065f46,#059669)'  :
              st==='active'? 'linear-gradient(135deg,#3730a3,#4338ca)' :
              C.surface2;
            return (
              <button key={ex.id} className="wt-pill-btn" onClick={() => setCurrentIdx(i)} style={{
                flexShrink: 0, padding: '7px 15px', borderRadius: 100,
                background: bg, border: 'none',
                color: (st==='idle' && !isActive) ? C.muted2 : '#fff',
                fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 16px rgba(99,102,241,0.35)' : st==='done' ? '0 4px 12px rgba(5,150,105,0.3)' : 'none',
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

            {/* Gradient accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3730a3, #6366f1, #818cf8, #a78bfa, #ec4899)' }} />

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
                      <span style={{ padding: '3px 11px', background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 100, fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
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
                  {/* ℹ — view exercise detail in library */}
                  <button
                    onClick={() => navigate('/exercise-library', { state: { search: currentExercise.name } })}
                    title="Exercise info"
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: `1px solid rgba(99,102,241,0.3)`, color: '#818cf8', fontSize: 15, cursor: 'pointer', fontWeight: 700 }}>
                    ℹ
                  </button>
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

              {/* Stat chips */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {[
                  { label: 'Sets',  val: currentSets.length, grad: 'linear-gradient(135deg,#3730a3,#6366f1)' },
                  { label: 'Reps',  val: currentExercise.reps, grad: 'linear-gradient(135deg,#065f46,#059669)' },
                  { label: 'Rest',  val: `${currentExercise.rest_seconds||90}s`, grad: 'linear-gradient(135deg,#92400e,#d97706)' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '8px 14px', borderRadius: 10,
                    background: item.grad, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{item.val}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestion chip — only shows when prev data exists */}
            {maxPrevWeight && (
              <div style={{
                padding: '10px 16px',
                background: `linear-gradient(90deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))`,
                borderBottom: `1px solid rgba(245,158,11,0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 0.5 }}>LAST SESSION</span>
                  <span style={{ fontSize: 12, color: C.muted2, marginLeft: 8 }}>
                    {prevDoneSets.length} × {maxPrevWeight}kg
                    {prevReps ? ` × ${prevReps} reps` : ''}
                  </span>
                </div>
                <button onClick={applySuggestion} style={{
                  padding: '5px 12px', borderRadius: 8,
                  background: `linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))`,
                  border: `1px solid rgba(245,158,11,0.35)`,
                  color: C.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: 0.3,
                }}>
                  Try {suggestedWeight}kg →
                </button>
              </div>
            )}

            {/* Sets table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 44px', padding: '10px 16px', gap: 8, borderBottom: `1px solid ${C.border}` }}>
              {['SET', 'LAST', 'KG', 'REPS', ''].map(h => (
                <span key={h} style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1.2, textAlign: 'center' }}>{h}</span>
              ))}
            </div>

            {/* Set rows */}
            {currentSets.map((set, i) => {
              const isDone = set.done;
              const prKey = `${currentExercise.id}-${i}`;
              const isNewPR = !!prSet[prKey];
              const lastLabel = prevSetLabel(currentExercise.name, i, prevData);
              const isRpeTarget = rpeCapture?.exId === currentExercise.id && rpeCapture?.setIdx === i;

              return (
                <React.Fragment key={i}>
                  <div className={isDone ? 'wt-set-done' : ''} style={{
                    display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 44px',
                    padding: '9px 16px', gap: 8, alignItems: 'center',
                    background: isNewPR
                      ? `linear-gradient(90deg, rgba(245,158,11,0.08), transparent)`
                      : isDone ? C.greenDim : 'transparent',
                    borderBottom: `1px solid ${C.border}`, transition: 'background 0.3s',
                  }}>
                    {/* Set number badge */}
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, margin: '0 auto',
                      background: isDone
                        ? (isNewPR ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#065f46,#22c55e)')
                        : C.surface2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: isDone ? '#fff' : C.muted2,
                      boxShadow: isDone ? (isNewPR ? `0 2px 8px ${C.goldGlow}` : `0 2px 8px ${C.greenGlow}`) : 'none',
                    }}>{i + 1}</div>

                    {/* Last column */}
                    <div style={{ textAlign: 'center' }}>
                      {lastLabel ? (
                        <span style={{ fontSize: 11, color: C.muted2, fontWeight: 500 }}>{lastLabel}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: C.surface3 }}>—</span>
                      )}
                    </div>

                    {/* Weight input */}
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
                    {/* Reps input */}
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

                    {/* Check / PR badge */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button className="wt-check-btn"
                        onClick={() => !isDone && markSetDone(currentExercise.id, i, currentExercise.rest_seconds || 90, currentExercise.name)}
                        disabled={isDone}
                        style={{
                          width: 36, height: 36, borderRadius: 10, margin: '0 auto',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone
                            ? (isNewPR ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#065f46,#22c55e)')
                            : C.surface2,
                          border: `2px solid ${isDone ? (isNewPR ? C.gold : C.green) : C.border}`,
                          color: isDone ? '#fff' : C.muted, fontSize: 15,
                          cursor: isDone ? 'default' : 'pointer',
                          boxShadow: isDone ? (isNewPR ? `0 2px 10px ${C.goldGlow}` : `0 2px 10px ${C.greenGlow}`) : 'none',
                        }}>
                        ✓
                      </button>
                      {/* PR badge overlay */}
                      {isNewPR && isDone && (
                        <div className="wt-pr-badge" style={{
                          position: 'absolute', top: -8, right: -8,
                          background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                          borderRadius: 6, padding: '2px 5px',
                          fontSize: 8, fontWeight: 900, color: '#000',
                          letterSpacing: 0.5, boxShadow: `0 2px 8px ${C.goldGlow}`,
                        }}>
                          PR
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RPE Quick-Tap — inline below completed set */}
                  {isRpeTarget && isDone && phase === 'workout' && (
                    <RpeRow onSelect={() => setRpeCapture(null)} />
                  )}
                </React.Fragment>
              );
            })}

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => addSet(currentExercise.id, currentExercise.reps)} style={{
                width: '100%', padding: 11, background: 'transparent',
                border: `1px dashed ${C.border}`, borderRadius: 12,
                color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                + Add Set
              </button>

              {/* Notes toggle */}
              <button onClick={() => setNoteOpen(p => ({ ...p, [currentExercise.id]: !p[currentExercise.id] }))} style={{
                width: '100%', padding: '8px 0', background: 'none', border: 'none',
                color: exNotes[currentExercise.id] ? C.accent : C.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {exNotes[currentExercise.id] ? 'Edit note' : 'Add note'}
              </button>

              {noteOpen[currentExercise.id] && (
                <textarea
                  placeholder="How did this feel? Any form notes..."
                  value={exNotes[currentExercise.id] || ''}
                  onChange={e => setExNotes(p => ({ ...p, [currentExercise.id]: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', background: C.surface2,
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    color: C.text, fontSize: 13, lineHeight: 1.5, resize: 'none',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  autoFocus
                />
              )}
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
            background: totalSetsLog > 0 ? 'linear-gradient(135deg,#065f46,#059669,#22c55e)' : C.surface2,
            color: totalSetsLog > 0 ? '#fff' : C.muted,
            fontSize: 15, fontWeight: 800, letterSpacing: 0.3,
            cursor: (totalSetsLog > 0 && !completing) ? 'pointer' : 'not-allowed',
            opacity: completing ? 0.7 : 1,
            boxShadow: totalSetsLog > 0 ? `0 4px 20px rgba(5,150,105,0.35)` : 'none',
            transition: 'all 0.3s',
          }}>
          {completing ? 'Finishing...' : 'Finish Workout'}
        </button>
      </div>
    </div>
  );
}
