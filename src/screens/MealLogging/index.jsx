import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchFoods,
  getPopularFoods,
  logMeal,
  getTodaysMeals,
  getActiveDietPlan,
  getPlanMeals,
  getYesterdaysMeals,
  getRecentFoods,
} from '../../api/diet';
import { getWaterToday, updateWaterToday } from '../../api/health';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const injectCSS = () => {
  if (document.getElementById('ml-styles')) return;
  const el = document.createElement('style');
  el.id = 'ml-styles';
  el.textContent = `
    @keyframes ml-spin { to { transform: rotate(360deg); } }
    @keyframes ml-pop  { 0%{transform:scale(0.88);opacity:0;} 60%{transform:scale(1.04);} 100%{transform:scale(1);opacity:1;} }
    @keyframes ml-ring { from { stroke-dashoffset: var(--full); } to { stroke-dashoffset: var(--target); } }
    @keyframes ml-fade { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
    @keyframes ml-complete-glow { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
    .ml-card { animation: ml-fade 0.35s ease both; }
  `;
  document.head.appendChild(el);
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#0a0a0c',
  surface:  '#141418',
  surface2: '#1c1c22',
  surface3: '#242430',
  border:   '#26262e',
  text:     '#f0f0f4',
  muted:    '#6b7280',
  muted2:   '#9ca3af',
  cal:      '#818cf8',   // indigo
  calDark:  '#4338ca',
  prot:     '#34d399',   // emerald
  protDark: '#059669',
  carb:     '#fbbf24',   // amber
  carbDark: '#d97706',
  fat:      '#f472b6',   // rose
  fatDark:  '#be185d',
  green:    '#22c55e',
  greenDim: 'rgba(34,197,94,0.10)',
};

// ─── Macro Header Card ────────────────────────────────────────────────────────
function MacroRings({ totals, targets }) {
  const calLogged = Math.round(totals.calories);
  const calTarget = targets.calories || 1;
  const calPct    = Math.min(1, calLogged / calTarget);
  const isOver    = calLogged > targets.calories && targets.calories > 0;
  const isComplete = calPct >= 0.9;

  // Donut ring for calories
  const R = 46, stroke = 10, circ = 2 * Math.PI * R;
  const dashOffset = circ * (1 - calPct);
  const ringColor  = isOver ? '#ef4444' : T.cal;

  const macros = [
    { label: 'Protein', current: Math.round(totals.protein),  target: targets.protein,  color: T.prot, dark: T.protDark },
    { label: 'Carbs',   current: Math.round(totals.carbs),    target: targets.carbs,    color: T.carb, dark: T.carbDark },
    { label: 'Fats',    current: Math.round(totals.fats),     target: targets.fats,     color: T.fat,  dark: T.fatDark  },
  ];

  return (
    <div style={{
      margin: '0 20px 24px',
      background: isComplete
        ? 'linear-gradient(135deg, rgba(67,56,202,0.22), rgba(99,102,241,0.10))'
        : 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(20,20,24,0.9))',
      border: isComplete
        ? '1px solid rgba(129,140,248,0.45)'
        : '1px solid rgba(99,102,241,0.15)',
      borderRadius: 24, padding: '22px 20px',
      transition: 'all 0.6s ease',
      boxShadow: isComplete ? '0 0 48px rgba(99,102,241,0.14)' : 'none',
    }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>

        {/* Single calorie donut */}
        <div style={{ position: 'relative', flexShrink: 0, width: 112, height: 112 }}>
          <svg width={112} height={112} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={56} cy={56} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
            {/* Progress */}
            <circle cx={56} cy={56} r={R} fill="none"
              stroke={ringColor} strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)',
                filter: `drop-shadow(0 0 6px ${ringColor}88)`,
              }}
            />
          </svg>
          {/* Center text — absolutely positioned so no SVG transform needed */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: isOver ? '#ef4444' : T.text, lineHeight: 1 }}>
              {calLogged.toLocaleString()}
            </span>
            <span style={{ fontSize: 9, color: T.muted, fontWeight: 600, marginTop: 3 }}>
              / {calTarget} kcal
            </span>
          </div>
        </div>

        {/* Macro bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {macros.map(m => {
            const pct  = m.target > 0 ? Math.min(100, (m.current / m.target) * 100) : 0;
            const over = m.current > m.target && m.target > 0;
            return (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: over ? '#ef4444' : T.text }}>
                    {m.current}
                    <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>/{m.target}g</span>
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: over ? '#ef4444' : `linear-gradient(90deg, ${m.dark}, ${m.color})`,
                    borderRadius: 4, transition: 'width 0.7s ease',
                    boxShadow: `0 0 6px ${m.color}55`,
                  }} />
                </div>
              </div>
            );
          })}
          {isComplete && (
            <div style={{
              fontSize: 10, color: T.cal, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
              animation: 'ml-complete-glow 2s ease infinite',
            }}>
              Target Reached
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Energy Capture Overlay ───────────────────────────────────────────────────
function EnergyCapture({ mealName, onSubmit }) {
  const [energy, setEnergy] = useState(null);
  const [hunger, setHunger] = useState(null);
  const canSubmit = energy && hunger;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.94)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, padding: 24,
    }}>
      <div style={{
        background: T.surface, borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 400,
        border: `1px solid rgba(99,102,241,0.2)`,
        boxShadow: '0 0 40px rgba(99,102,241,0.1)',
      }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, textAlign: 'center', marginBottom: 6, color: T.text }}>
          {mealName} logged
        </h2>
        <p style={{ fontSize: 14, color: T.muted, textAlign: 'center', marginBottom: 28 }}>Quick check-in</p>

        <p style={{ fontSize: 12, color: T.muted2, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Energy right now
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { l: 'Low',    v: 'low',    grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)' },
            { l: 'Normal', v: 'normal', grad: 'linear-gradient(135deg,#78350f,#d97706)' },
            { l: 'High',   v: 'high',   grad: 'linear-gradient(135deg,#1e3a5f,#2563eb)' },
          ].map((x) => (
            <button key={x.v} onClick={() => setEnergy(x.v)} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, color: '#fff',
              background: energy === x.v ? x.grad : T.surface2,
              transition: 'all 0.2s',
              boxShadow: energy === x.v ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
            }}>{x.l}</button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: T.muted2, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Fullness
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[
            { l: 'Hungry',    v: 'hungry',    grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)' },
            { l: 'Satisfied', v: 'satisfied', grad: 'linear-gradient(135deg,#064e3b,#059669)' },
            { l: 'Stuffed',   v: 'stuffed',   grad: 'linear-gradient(135deg,#4c1d95,#7c3aed)' },
          ].map((x) => (
            <button key={x.v} onClick={() => setHunger(x.v)} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, color: '#fff',
              background: hunger === x.v ? x.grad : T.surface2,
              transition: 'all 0.2s',
              boxShadow: hunger === x.v ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
            }}>{x.l}</button>
          ))}
        </div>

        <button onClick={() => canSubmit && onSubmit(energy, hunger)} disabled={!canSubmit} style={{
          width: '100%', padding: 15, borderRadius: 12, border: 'none',
          cursor: canSubmit ? 'pointer' : 'default',
          background: canSubmit ? 'linear-gradient(135deg,#4338ca,#6366f1)' : T.surface2,
          color: canSubmit ? '#fff' : T.muted,
          fontSize: 15, fontWeight: 700,
          boxShadow: canSubmit ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
        }}>Done</button>
        <button onClick={() => onSubmit(null, null)} style={{
          width: '100%', padding: '10px', marginTop: 10, background: 'none',
          border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer',
        }}>Skip</button>
      </div>
    </div>
  );
}

// ─── Food Search Modal ─────────────────────────────────────────────────────────
function FoodSearchModal({ mealName, initialBasket = [], onClose, onConfirm }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recents, setRecents] = useState([]);
  const [searching, setSearching] = useState(false);
  const [basket, setBasket] = useState(initialBasket);

  useEffect(() => {
    getPopularFoods(20).then(f => setPopular(f || [])).catch(() => {});
    getRecentFoods(12).then(f => setRecents(f || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setResults((await searchFoods(query, 25)) || []); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const addFood = (rawFood) => {
    const food = {
      id: rawFood.id,
      name: rawFood.name,
      cal100: rawFood.calories_per_100g ?? rawFood.calories ?? 0,
      p100:   rawFood.protein_per_100g  ?? rawFood.protein  ?? 0,
      c100:   rawFood.carbs_per_100g    ?? rawFood.carbs    ?? 0,
      f100:   rawFood.fats_per_100g     ?? rawFood.fats     ?? 0,
    };
    if (basket.find(b => b.food.id === food.id)) return;
    setBasket(prev => [...prev, { food, grams: rawFood.common_serving_grams || 100 }]);
    setQuery(''); setResults([]);
  };

  const remove   = (id)    => setBasket(b => b.filter(x => x.food.id !== id));
  const setGrams = (id, v) => setBasket(b => b.map(x => x.food.id === id ? { ...x, grams: v } : x));

  const total = basket.reduce((acc, { food, grams }) => {
    const m = parseFloat(grams || 0) / 100;
    return {
      cal: acc.cal + Math.round(food.cal100 * m),
      p:   acc.p   + Math.round(food.p100   * m),
      c:   acc.c   + Math.round(food.c100   * m),
      f:   acc.f   + Math.round(food.f100   * m),
    };
  }, { cal: 0, p: 0, c: 0, f: 0 });

  // What to show in the list
  const isSearching = query.trim().length >= 2;
  const listLabel   = isSearching ? null : recents.length > 0 ? 'Your Recents' : 'Popular';
  const listFoods   = isSearching ? results : recents.length > 0 ? recents : popular;
  const showPopularFallback = !isSearching && recents.length > 0 && popular.length > 0;

  const FoodRow = ({ food, inBasket, onAdd }) => {
    const cal = food.calories_per_100g ?? food.calories ?? '?';
    const p   = food.protein_per_100g  ?? food.protein  ?? '?';
    return (
      <div onClick={() => !inBasket && onAdd(food)} style={{
        padding: '12px 16px', borderRadius: 12, marginBottom: 6,
        cursor: inBasket ? 'default' : 'pointer',
        background: inBasket ? `rgba(34,197,94,0.06)` : T.surface2,
        border: inBasket ? '1px solid rgba(34,197,94,0.2)' : `1px solid ${T.border}`,
        opacity: inBasket ? 0.7 : 1, transition: 'all 0.15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {cal} kcal · P {p}g &nbsp;per 100g
            </div>
          </div>
          {inBasket
            ? <span style={{ fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 }}>Added</span>
            : <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.cal, fontSize: 18, fontWeight: 300, flexShrink: 0 }}>+</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1500 }} onClick={onClose}>
      <div style={{ backgroundColor: T.surface, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 600, maxHeight: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: `1px solid rgba(99,102,241,0.25)` }} onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: T.surface3, borderRadius: 2, margin: '12px auto 0' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: T.text }}>Add to {mealName}</h2>
            </div>
            <button onClick={onClose} style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.muted, fontSize: 16, cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <input
            type="text" placeholder="Search foods..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', padding: '13px 16px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, color: T.text, fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
            autoFocus
          />
        </div>

        {/* Basket */}
        {basket.length > 0 && (
          <div style={{ flexShrink: 0, padding: '0 20px 10px' }}>
            <p style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>In this meal</p>
            {basket.map(({ food, grams }) => {
              const m = parseFloat(grams || 0) / 100;
              const cal = Math.round(food.cal100 * m);
              return (
                <div key={food.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface2, borderRadius: 10, padding: '9px 12px', marginBottom: 6, border: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.text }}>{food.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{cal} kcal · P {Math.round(food.p100 * m)}g</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="number" value={grams} onChange={e => setGrams(food.id, e.target.value)}
                      style={{ width: 52, padding: '6px 8px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, fontWeight: 600, textAlign: 'center', outline: 'none' }} />
                    <span style={{ fontSize: 11, color: T.muted }}>g</span>
                    <button onClick={() => remove(food.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                  </div>
                </div>
              );
            })}
            {/* Macro totals */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: '8px 12px', background: `rgba(99,102,241,0.07)`, borderRadius: 10, border: `1px solid rgba(99,102,241,0.15)` }}>
              {[['kcal', total.cal, T.cal], ['P', `${total.p}g`, T.prot], ['C', `${total.c}g`, T.carb], ['F', `${total.f}g`, T.fat]].map(([l, v, c]) => (
                <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {listLabel && (
            <p style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>{listLabel}</p>
          )}
          {searching && <p style={{ color: T.muted, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Searching...</p>}
          {!searching && listFoods.map(food => (
            <FoodRow key={food.id} food={food} inBasket={!!basket.find(b => b.food.id === food.id)} onAdd={addFood} />
          ))}
          {/* Also show popular as a secondary section when recents are shown */}
          {showPopularFallback && !isSearching && (
            <>
              <p style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 10px', fontWeight: 700 }}>Popular</p>
              {popular.map(food => (
                <FoodRow key={`pop-${food.id}`} food={food} inBasket={!!basket.find(b => b.food.id === food.id)} onAdd={addFood} />
              ))}
            </>
          )}
        </div>

        {/* Confirm */}
        <div style={{ padding: '14px 20px 32px', flexShrink: 0 }}>
          <button onClick={() => basket.length > 0 && onConfirm(basket)} disabled={basket.length === 0} style={{
            width: '100%', padding: 16, borderRadius: 14, border: 'none',
            background: basket.length > 0 ? 'linear-gradient(135deg,#4338ca,#6366f1)' : T.surface2,
            color: basket.length > 0 ? '#fff' : T.muted,
            fontSize: 16, fontWeight: 700, cursor: basket.length > 0 ? 'pointer' : 'default',
            boxShadow: basket.length > 0 ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
          }}>
            {basket.length > 0 ? `Log ${basket.length} item${basket.length > 1 ? 's' : ''}` : 'Add foods above'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────
function MealCard({ mealTime, template, mealLog, yesterdayLog, onLogFromTemplate, onModify, onAddFreeForm, onRepeatYesterday }) {
  const displayName = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
  const isLogged = !!mealLog;
  const templateFoods = template?.foods || [];
  const loggedFoods = mealLog?.foods_eaten || [];
  const hasYesterday = !!yesterdayLog && !isLogged;

  // Subtle late timing indicator: if scheduled_time exists and we're 45+ min past it
  const isLate = (() => {
    if (!template?.scheduled_time || isLogged) return false;
    try {
      const [h, m] = template.scheduled_time.split(':').map(Number);
      const now = new Date();
      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);
      return (now - scheduled) > 45 * 60 * 1000 && now > scheduled;
    } catch { return false; }
  })();

  return (
    <div className="ml-card" style={{
      background: T.surface,
      borderRadius: 20, marginBottom: 14,
      border: isLogged
        ? '1px solid rgba(34,197,94,0.25)'
        : isLate
        ? '1px solid rgba(251,191,36,0.2)'
        : `1px solid ${T.border}`,
      overflow: 'hidden', transition: 'border-color 0.4s',
    }}>
      {/* Top accent line for logged */}
      {isLogged && (
        <div style={{ height: 2, background: 'linear-gradient(90deg, #059669, #22c55e, #34d399)' }} />
      )}

      {/* Card header */}
      <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: T.text }}>{displayName}</h3>
            {isLogged && (
              <span style={{ fontSize: 10, fontWeight: 800, color: T.green, background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: 20, letterSpacing: 0.3 }}>
                LOGGED
              </span>
            )}
            {isLate && !isLogged && (
              <span style={{ fontSize: 10, fontWeight: 700, color: T.carb, background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 20, letterSpacing: 0.3 }}>
                LATE
              </span>
            )}
            {template?.scheduled_time && !isLogged && (
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{template.scheduled_time}</span>
            )}
          </div>
          {isLogged ? (
            <p style={{ fontSize: 13, color: T.green, margin: '4px 0 0', fontWeight: 600 }}>
              {mealLog.total_calories} kcal · {Math.round(mealLog.total_protein || 0)}g protein
            </p>
          ) : templateFoods.length > 0 ? (
            <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0' }}>
              {templateFoods.slice(0, 3).map(f => f.food_name).join(', ')}{templateFoods.length > 3 ? ` +${templateFoods.length - 3}` : ''}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0' }}>No template set</p>
          )}
        </div>
        {/* Calorie target chip */}
        {template?.target_calories && !isLogged && (
          <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, fontWeight: 700, color: T.cal, flexShrink: 0 }}>
            {template.target_calories} kcal
          </div>
        )}
      </div>

      {/* Logged foods */}
      {isLogged && loggedFoods.length > 0 && (
        <div style={{ padding: '0 18px 12px' }}>
          {loggedFoods.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 10px', background: T.surface2, borderRadius: 10,
              marginBottom: 5, border: `1px solid ${T.border}`,
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name || item.food_name}</span>
                <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>{item.grams || item.serving_size_grams}g</span>
              </div>
              <span style={{ fontSize: 11, color: T.muted2 }}>{item.calories} kcal · P{Math.round(item.protein)}g</span>
            </div>
          ))}
        </div>
      )}

      {/* Template preview */}
      {!isLogged && templateFoods.length > 0 && (
        <div style={{ padding: '0 18px 12px' }}>
          {templateFoods.map((tf, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: T.muted2 }}>{tf.food_name}</span>
              <span style={{ fontSize: 11, color: T.muted }}>{tf.quantity_grams}g · {tf.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick-repeat from yesterday */}
      {hasYesterday && (
        <div style={{ padding: '0 18px 10px' }}>
          <button onClick={() => onRepeatYesterday(mealTime, yesterdayLog)} style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)',
            color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 11 }}>↩</span>
            Repeat from yesterday · {yesterdayLog.total_calories} kcal
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!isLogged ? (
        <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>
          {templateFoods.length > 0 ? (
            <>
              <button onClick={() => onLogFromTemplate(mealTime, template)} style={{
                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#4338ca,#6366f1)', color: '#fff', fontWeight: 700, fontSize: 14,
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}>Log This Meal</button>
              <button onClick={() => onModify(mealTime, template)} style={{
                padding: '12px 18px', borderRadius: 12, border: `1px solid ${T.border}`,
                background: 'transparent', color: T.muted2, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>Modify</button>
            </>
          ) : (
            <button onClick={() => onAddFreeForm(displayName)} style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: `1px dashed ${T.border}`,
              background: 'transparent', color: T.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>+ Add Food</button>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 18px 16px' }}>
          <button onClick={() => onAddFreeForm(displayName)} style={{
            padding: '8px 14px', borderRadius: 9, border: `1px solid ${T.border}`,
            background: 'transparent', color: T.muted, fontWeight: 500, fontSize: 12, cursor: 'pointer',
          }}>+ Add more</button>
        </div>
      )}
    </div>
  );
}

// ─── Calorie Timeline ─────────────────────────────────────────────────────────
function CalorieTimeline({ mealLogs }) {
  if (mealLogs.length === 0) return null;
  const logsWithTime = mealLogs.filter(l => l.logged_at);
  if (logsWithTime.length === 0) return null;

  const HOUR_START = 5, HOUR_END = 23;
  const totalHours = HOUR_END - HOUR_START;
  const DOT_COLORS = [T.cal, T.prot, T.carb, T.fat, '#a78bfa'];

  // Max calories for proportional dot sizing
  const maxCal = Math.max(...logsWithTime.map(l => l.total_calories || 0), 1);

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowPct  = Math.min(99, Math.max(1, ((nowHour - HOUR_START) / totalHours) * 100));
  const showNow = nowHour >= HOUR_START && nowHour <= HOUR_END;

  // Map each log to its local-time position
  const positioned = logsWithTime.map((log, i) => {
    const dt = new Date(log.logged_at);
    const hourFrac = dt.getHours() + dt.getMinutes() / 60;
    const pct  = Math.min(97, Math.max(2, ((hourFrac - HOUR_START) / totalHours) * 100));
    const cal  = log.total_calories || 0;
    // dot radius: 8–16 based on calories relative to max
    const dotR = 8 + Math.round((cal / maxCal) * 8);
    const color = DOT_COLORS[i % DOT_COLORS.length];
    const label = log.meal_name
      ? log.meal_name.charAt(0).toUpperCase() + log.meal_name.slice(1, 6)
      : 'Meal';
    const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return { log, pct, dotR, color, label, timeStr, cal };
  });

  const TRACK_TOP = 36; // px from top of container where the track line sits

  return (
    <div style={{ padding: '0 20px 28px' }}>
      <p style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px', fontWeight: 700 }}>
        Meal Timing
      </p>

      {/* Main timeline area — fixed layout zones:
            0–16px   : time label
            16–36px  : space above track
            36–38px  : track line
            38–58px  : space below track (dot hangs from center of track)
            58–90px  : meal name + kcal labels
      */}
      <div style={{ position: 'relative', height: 90 }}>

        {/* Track line at y=36 */}
        <div style={{
          position: 'absolute', top: TRACK_TOP, left: 0, right: 0, height: 2,
          background: T.surface3, borderRadius: 2,
        }} />

        {/* Hour markers — tick below track */}
        {[6, 9, 12, 15, 18, 21].map(h => {
          const pct = ((h - HOUR_START) / totalHours) * 100;
          const lbl = h === 12 ? '12p' : h > 12 ? `${h-12}p` : `${h}a`;
          return (
            <div key={h} style={{
              position: 'absolute', left: `${pct}%`, top: TRACK_TOP + 3,
              transform: 'translateX(-50%)',
            }}>
              <div style={{ width: 1, height: 5, background: T.surface3, margin: '0 auto' }} />
              <div style={{ fontSize: 8, color: T.muted, textAlign: 'center', marginTop: 1, whiteSpace: 'nowrap' }}>{lbl}</div>
            </div>
          );
        })}

        {/* Now indicator */}
        {showNow && (
          <div style={{
            position: 'absolute', left: `${nowPct}%`, top: TRACK_TOP - 8,
            transform: 'translateX(-50%)',
            width: 2, height: 18, background: 'rgba(99,102,241,0.5)', borderRadius: 2,
          }} />
        )}

        {/* Meal dots — each absolutely positioned, column layout relative to track */}
        {positioned.map(({ log, pct, dotR, color, label, timeStr, cal }) => (
          <div key={log.id} style={{
            position: 'absolute',
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            width: Math.max(dotR * 2, 42),
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            {/* Time label: fixed 16px zone, sits above track */}
            <div style={{
              height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: color, fontWeight: 800, whiteSpace: 'nowrap',
            }}>{timeStr}</div>

            {/* Spacer: pushes dot so its center aligns with TRACK_TOP (36px) */}
            {/* 16px used for time label, dot center should be at 36px → spacer = 36 - 16 - dotR */}
            <div style={{ height: Math.max(0, TRACK_TOP - 16 - dotR) }} />

            {/* Dot */}
            <div style={{
              width: dotR * 2, height: dotR * 2, borderRadius: '50%',
              background: color,
              border: '2px solid rgba(0,0,0,0.75)',
              boxShadow: `0 0 10px ${color}66`,
              flexShrink: 0,
            }} />

            {/* Meal name + kcal: 6px gap below dot */}
            <div style={{ height: 6 }} />
            <div style={{ fontSize: 9, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: T.muted2 }}>{label}</div>
              <div style={{ color: T.muted }}>{cal} kcal</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Water Tracker ────────────────────────────────────────────────────────────
function WaterTracker({ glasses, target, onTap }) {
  const GLASS_W = 28, GLASS_H = 34;
  return (
    <div style={{
      margin: '0 20px 20px',
      padding: '16px 18px',
      background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.04))',
      border: '1px solid rgba(14,165,233,0.15)',
      borderRadius: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'rgba(14,165,233,0.8)', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Hydration
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: glasses >= target ? '#22d3ee' : 'rgba(255,255,255,0.5)' }}>
          {glasses} <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>/ {target} glasses</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {Array.from({ length: target }).map((_, i) => {
          const filled = i < glasses;
          return (
            <button key={i} onClick={() => onTap(i + 1)} style={{
              width: GLASS_W, height: GLASS_H, border: 'none', padding: 0,
              cursor: 'pointer', background: 'none', flexShrink: 0,
            }}>
              <svg width={GLASS_W} height={GLASS_H} viewBox="0 0 28 34">
                {/* Glass outline */}
                <path d="M5 4 L23 4 L20 30 Q19.5 32 14 32 Q8.5 32 8 30 Z"
                  fill={filled ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)'}
                  stroke={filled ? '#22d3ee' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={1.5} strokeLinejoin="round" />
                {/* Water fill */}
                {filled && (
                  <clipPath id={`clip-${i}`}>
                    <path d="M5 4 L23 4 L20 30 Q19.5 32 14 32 Q8.5 32 8 30 Z" />
                  </clipPath>
                )}
                {filled && (
                  <rect x={0} y={14} width={28} height={20}
                    fill="url(#waterGrad)" clipPath={`url(#clip-${i})`} />
                )}
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
              </svg>
            </button>
          );
        })}
      </div>
      {glasses >= target && (
        <div style={{ fontSize: 10, color: '#22d3ee', fontWeight: 800, letterSpacing: 0.8, marginTop: 8, textTransform: 'uppercase' }}>
          Daily target reached
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MealLogging() {
  injectCSS();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [todayMealLogs, setTodayMealLogs] = useState([]);
  const [yesterdayLogs, setYesterdayLogs] = useState([]);

  const [foodModal, setFoodModal] = useState(null);
  const [energyCapture, setEnergyCapture] = useState(null);
  const [water, setWater] = useState({ glasses: 0, target_glasses: 8 });

  const totals = todayMealLogs.reduce((acc, l) => ({
    calories: acc.calories + (l.total_calories || 0),
    protein:  acc.protein  + (l.total_protein  || 0),
    carbs:    acc.carbs    + (l.total_carbs     || 0),
    fats:     acc.fats     + (l.total_fats      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const targets = {
    calories: plan?.target_calories || 2000,
    protein:  plan?.target_protein  || 150,
    carbs:    plan?.target_carbs    || 250,
    fats:     plan?.target_fats     || 65,
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const activePlan = await getActiveDietPlan();
      if (!activePlan) {
        navigate('/diet-builder', { state: { message: 'Create a diet plan to start logging meals.' } });
        return;
      }
      setPlan(activePlan);

      const [mealTemplates, todayData, yesterdayData] = await Promise.all([
        getPlanMeals(activePlan.id).catch(() => []),
        getTodaysMeals().catch(() => ({ meals: [] })),
        getYesterdaysMeals().catch(() => ({ meals: [] })),
      ]);

      setTemplates(mealTemplates || []);
      setTodayMealLogs(todayData?.meals || []);
      setYesterdayLogs(yesterdayData?.meals || []);
      getWaterToday().then(w => setWater(w)).catch(() => {});
    } catch (err) {
      console.error('MealLogging load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logForMeal = useCallback((mealTime) => {
    return todayMealLogs.find(l => l.meal_name?.toLowerCase() === mealTime?.toLowerCase()) || null;
  }, [todayMealLogs]);

  const yesterdayLogForMeal = useCallback((mealTime) => {
    return yesterdayLogs.find(l => l.meal_name?.toLowerCase() === mealTime?.toLowerCase()) || null;
  }, [yesterdayLogs]);

  const templateToBasket = (template) =>
    (template.foods || []).map((tf) => {
      const qg = tf.quantity_grams || 100;
      return {
        food: {
          id:    tf.food_id || `tf-${tf.id}`,
          name:  tf.food_name,
          cal100: Math.round((tf.calories / qg) * 100),
          p100:  parseFloat(((tf.protein / qg) * 100).toFixed(1)),
          c100:  parseFloat(((tf.carbs / qg) * 100).toFixed(1)),
          f100:  parseFloat(((tf.fats / qg) * 100).toFixed(1)),
        },
        grams: qg,
      };
    });

  const yesterdayLogToBasket = (log) =>
    (log.foods_eaten || []).map((f) => {
      const qg = f.grams || 100;
      return {
        food: {
          id:    f.food_id || `yest-${f.name}`,
          name:  f.name || f.food_name,
          cal100: qg > 0 ? Math.round((f.calories / qg) * 100) : 0,
          p100:  qg > 0 ? parseFloat(((f.protein / qg) * 100).toFixed(1)) : 0,
          c100:  qg > 0 ? parseFloat(((f.carbs / qg) * 100).toFixed(1)) : 0,
          f100:  qg > 0 ? parseFloat(((f.fats / qg) * 100).toFixed(1)) : 0,
        },
        grams: qg,
      };
    });

  const handleLogFromTemplate = (mealTime, template) => {
    setFoodModal({ mealTime, mealName: mealTime.charAt(0).toUpperCase() + mealTime.slice(1), initialBasket: templateToBasket(template), templateId: template.id, followedPlan: true });
  };

  const handleModify = (mealTime, template) => {
    setFoodModal({ mealTime, mealName: mealTime.charAt(0).toUpperCase() + mealTime.slice(1), initialBasket: templateToBasket(template), templateId: template.id, followedPlan: false });
  };

  const handleAddFreeForm = (mealName) => {
    setFoodModal({ mealTime: mealName.toLowerCase(), mealName, initialBasket: [], templateId: null, followedPlan: false });
  };

  const handleRepeatYesterday = (mealTime, yesterdayLog) => {
    const basket = yesterdayLogToBasket(yesterdayLog);
    if (basket.length === 0) { handleAddFreeForm(mealTime.charAt(0).toUpperCase() + mealTime.slice(1)); return; }
    setFoodModal({ mealTime, mealName: mealTime.charAt(0).toUpperCase() + mealTime.slice(1), initialBasket: basket, templateId: null, followedPlan: false });
  };

  const handleConfirmBasket = async (basket) => {
    const { mealTime, mealName, templateId, followedPlan } = foodModal;
    setFoodModal(null);

    const foodsEaten = basket.map(({ food, grams }) => {
      const m = parseFloat(grams || 100) / 100;
      return {
        name:     food.name,
        food_id:  typeof food.id === 'number' ? food.id : null,
        grams:    parseFloat(grams),
        calories: Math.round(food.cal100 * m),
        protein:  Math.round(food.p100   * m),
        carbs:    Math.round(food.c100   * m),
        fats:     Math.round(food.f100   * m),
      };
    });

    const payload = { meal_name: mealTime, meal_template_id: templateId, followed_plan: followedPlan, foods_eaten: foodsEaten };

    try {
      await logMeal(payload);
      const freshData = await getTodaysMeals().catch(() => null);
      if (freshData?.meals) setTodayMealLogs(freshData.meals);
      setEnergyCapture({ mealName });
    } catch (err) {
      console.error('logMeal error:', err);
      alert(`Could not save meal: ${err.message || 'Unknown error'}.\n\nMake sure you have an active diet plan set.`);
    }
  };

  const handleEnergySubmit = () => setEnergyCapture(null);

  const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];
  const templateMap = {};
  templates.forEach(t => { if (t.meal_time) templateMap[t.meal_time.toLowerCase()] = t; });

  const extraLoggedMeals = todayMealLogs
    .map(l => l.meal_name?.toLowerCase())
    .filter(n => n && !MEAL_ORDER.includes(n));
  const allMealTimes = [...MEAL_ORDER, ...[...new Set(extraLoggedMeals)]];

  // Day completion state
  const loggedCount = MEAL_ORDER.filter(mt => logForMeal(mt)).length;
  const templateCount = MEAL_ORDER.filter(mt => templateMap[mt]).length;
  const dayComplete = templateCount > 0 && loggedCount === templateCount;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.06)', borderTop: `3px solid ${T.cal}`, borderRadius: '50%', animation: 'ml-spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: dayComplete
        ? `linear-gradient(180deg, #0a0a14 0%, #0a0c10 100%)`
        : T.bg,
      color: T.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingBottom: 80,
      transition: 'background 1.2s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: T.cal, fontSize: 14, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, padding: 0 }}>
          ← Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Today's Nutrition</h1>
          {dayComplete && (
            <span style={{ fontSize: 11, fontWeight: 800, color: T.cal, letterSpacing: 0.5, animation: 'ml-complete-glow 2s ease infinite' }}>
              ALL MEALS LOGGED
            </span>
          )}
        </div>
        {plan && <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px' }}>{plan.name}</p>}
      </div>

      {/* Macro Rings */}
      <MacroRings totals={totals} targets={targets} />

      {/* Water Tracker */}
      <WaterTracker
        glasses={water.glasses}
        target={water.target_glasses}
        onTap={async (n) => {
          const newVal = n === water.glasses ? n - 1 : n; // tap same = decrement
          const updated = await updateWaterToday(Math.max(0, newVal)).catch(() => null);
          if (updated) setWater(updated);
        }}
      />

      {/* Meal cards */}
      <div style={{ padding: '0 20px' }}>
        {allMealTimes.map(mt => (
          <MealCard
            key={mt}
            mealTime={mt}
            template={templateMap[mt] || null}
            mealLog={logForMeal(mt)}
            yesterdayLog={yesterdayLogForMeal(mt)}
            onLogFromTemplate={handleLogFromTemplate}
            onModify={handleModify}
            onAddFreeForm={handleAddFreeForm}
            onRepeatYesterday={handleRepeatYesterday}
          />
        ))}

        <button onClick={() => handleAddFreeForm('Extra')} style={{
          width: '100%', padding: 15, borderRadius: 16, border: `1px dashed ${T.border}`,
          background: 'transparent', color: T.muted, fontSize: 14, cursor: 'pointer', marginTop: 4,
        }}>
          + Log something extra
        </button>
      </div>

      {/* Calorie Timeline */}
      <div style={{ marginTop: 24 }}>
        <CalorieTimeline mealLogs={todayMealLogs} />
      </div>

      {foodModal && (
        <FoodSearchModal
          mealName={foodModal.mealName}
          initialBasket={foodModal.initialBasket}
          onClose={() => setFoodModal(null)}
          onConfirm={handleConfirmBasket}
        />
      )}

      {energyCapture && (
        <EnergyCapture
          mealName={energyCapture.mealName}
          onSubmit={handleEnergySubmit}
        />
      )}
    </div>
  );
}
