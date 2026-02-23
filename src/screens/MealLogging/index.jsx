import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchFoods,
  getPopularFoods,
  logMeal,
  getTodaysMeals,
  getActiveDietPlan,
  getPlanMeals,
} from '../../api/diet';

// ─── MACRO BAR ────────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const over = current > target && target > 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: over ? '#ff6b6b' : '#fff' }}>
          {current}{label !== 'Kcal' ? 'g' : ''} / {target}{label !== 'Kcal' ? 'g' : ' kcal'}
        </span>
      </div>
      <div style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, backgroundColor: over ? '#ff6b6b' : color,
          borderRadius: 4, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// ─── ENERGY CAPTURE OVERLAY ───────────────────────────────────────────────────
function EnergyCapture({ mealName, onSubmit }) {
  const [energy, setEnergy] = useState(null);
  const [hunger, setHunger] = useState(null);
  const canSubmit = energy && hunger;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.93)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, padding: 24,
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 400, border: '1px solid #2a2a2a',
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
          {mealName} logged!
        </h2>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
          Quick check-in — 5 seconds
        </p>

        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 10, fontWeight: 600 }}>
          Energy level right now?
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[{ l: 'Low', v: 'low', c: '#ff6b6b' }, { l: 'Normal', v: 'normal', c: '#ffd93d' }, { l: 'High', v: 'high', c: '#00d4ff' }].map((x) => (
            <button key={x.v} onClick={() => setEnergy(x.v)} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              backgroundColor: energy === x.v ? x.c : '#2a2a2a',
              color: energy === x.v ? '#0a0a0a' : '#aaa', transition: 'all 0.2s',
            }}>{x.l}</button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 10, fontWeight: 600 }}>
          How full are you?
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {[{ l: 'Hungry', v: 'hungry', c: '#ff6b6b' }, { l: 'Satisfied', v: 'satisfied', c: '#00ff88' }, { l: 'Stuffed', v: 'stuffed', c: '#ffd93d' }].map((x) => (
            <button key={x.v} onClick={() => setHunger(x.v)} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              backgroundColor: hunger === x.v ? x.c : '#2a2a2a',
              color: hunger === x.v ? '#0a0a0a' : '#aaa', transition: 'all 0.2s',
            }}>{x.l}</button>
          ))}
        </div>

        <button onClick={() => canSubmit && onSubmit(energy, hunger)} disabled={!canSubmit} style={{
          width: '100%', padding: 16, borderRadius: 12, border: 'none',
          cursor: canSubmit ? 'pointer' : 'default',
          backgroundColor: canSubmit ? '#00d4ff' : '#2a2a2a',
          color: canSubmit ? '#0a0a0a' : '#555', fontSize: 16, fontWeight: 700,
        }}>Done</button>
        <button onClick={() => onSubmit(null, null)} style={{
          width: '100%', padding: '10px', marginTop: 10, background: 'none',
          border: 'none', color: '#555', fontSize: 13, cursor: 'pointer',
        }}>Skip</button>
      </div>
    </div>
  );
}

// ─── FOOD SEARCH MODAL ────────────────────────────────────────────────────────
function FoodSearchModal({ mealName, initialBasket = [], onClose, onConfirm }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [searching, setSearching] = useState(false);
  // basket item: { food: {id, name, cal100, p100, c100, f100}, grams }
  const [basket, setBasket] = useState(initialBasket);

  useEffect(() => {
    getPopularFoods(20).then((f) => setPopular(f || [])).catch(() => {});
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
    // rawFood from search: calories_per_100g, protein_per_100g, etc.
    // Normalize to our basket food shape
    const food = {
      id: rawFood.id,
      name: rawFood.name,
      cal100: rawFood.calories_per_100g ?? rawFood.calories ?? 0,
      p100: rawFood.protein_per_100g ?? rawFood.protein ?? 0,
      c100: rawFood.carbs_per_100g ?? rawFood.carbs ?? 0,
      f100: rawFood.fats_per_100g ?? rawFood.fats ?? 0,
    };
    if (basket.find((b) => b.food.id === food.id)) return;
    setBasket((prev) => [...prev, { food, grams: rawFood.common_serving_grams || 100 }]);
    setQuery(''); setResults([]);
  };

  const remove = (id) => setBasket((b) => b.filter((x) => x.food.id !== id));
  const setGrams = (id, v) => setBasket((b) => b.map((x) => x.food.id === id ? { ...x, grams: v } : x));

  const total = basket.reduce((acc, { food, grams }) => {
    const m = parseFloat(grams || 0) / 100;
    return {
      cal: acc.cal + Math.round(food.cal100 * m),
      p: acc.p + Math.round(food.p100 * m),
      c: acc.c + Math.round(food.c100 * m),
      f: acc.f + Math.round(food.f100 * m),
    };
  }, { cal: 0, p: 0, c: 0, f: 0 });

  const list = query.trim().length >= 2 ? results : popular;
  const listLabel = query.trim().length >= 2 ? null : 'Popular';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1500 }} onClick={onClose}>
      <div style={{ backgroundColor: '#141414', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 600, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add to {mealName}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 22, cursor: 'pointer' }}>✕</button>
          </div>
          <input
            type="text" placeholder="Search roti, dal, chicken..." value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '13px 16px', backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' }}
            autoFocus
          />
        </div>

        {/* Basket */}
        {basket.length > 0 && (
          <div style={{ flexShrink: 0, padding: '0 20px 10px' }}>
            <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>In this meal</p>
            {basket.map(({ food, grams }) => {
              const m = parseFloat(grams || 0) / 100;
              const cal = Math.round(food.cal100 * m);
              return (
                <div key={food.id} style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', borderRadius: 10, padding: '9px 12px', marginBottom: 6, border: '1px solid #2a2a2a' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{cal} kcal · P {Math.round(food.p100 * m)}g</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="number" value={grams} onChange={(e) => setGrams(food.id, e.target.value)}
                      style={{ width: 56, padding: '6px 8px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }} />
                    <span style={{ fontSize: 12, color: '#555' }}>g</span>
                    <button onClick={() => remove(food.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>✕</button>
                  </div>
                </div>
              );
            })}
            {/* Total row */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, padding: '7px 12px', backgroundColor: 'rgba(0,212,255,0.07)', borderRadius: 10, border: '1px solid rgba(0,212,255,0.14)' }}>
              {[['Kcal', total.cal], ['P', `${total.p}g`], ['C', `${total.c}g`], ['F', `${total.f}g`]].map(([l, v]) => (
                <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00d4ff' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {listLabel && <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{listLabel}</p>}
          {searching && <p style={{ color: '#888', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Searching...</p>}
          {!searching && list.map((food) => {
            const inBasket = !!basket.find((b) => b.food.id === food.id);
            const cal = food.calories_per_100g ?? food.calories ?? '?';
            const p = food.protein_per_100g ?? food.protein ?? '?';
            const c = food.carbs_per_100g ?? food.carbs ?? '?';
            const f = food.fats_per_100g ?? food.fats ?? '?';
            return (
              <div key={food.id} onClick={() => !inBasket && addFood(food)} style={{
                padding: 12, borderRadius: 10, marginBottom: 8,
                cursor: inBasket ? 'default' : 'pointer',
                backgroundColor: inBasket ? 'rgba(0,255,136,0.05)' : '#1a1a1a',
                border: inBasket ? '1px solid rgba(0,255,136,0.18)' : '1px solid #2a2a2a',
                opacity: inBasket ? 0.7 : 1, transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{food.name}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                      {cal} kcal · P {p}g · C {c}g · F {f}g per 100g
                    </div>
                  </div>
                  {inBasket
                    ? <span style={{ fontSize: 12, color: '#00ff88', fontWeight: 600 }}>Added</span>
                    : <span style={{ fontSize: 20, color: '#555' }}>+</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm */}
        <div style={{ padding: 20, flexShrink: 0 }}>
          <button onClick={() => basket.length > 0 && onConfirm(basket)} disabled={basket.length === 0} style={{
            width: '100%', padding: 16, borderRadius: 14, border: 'none',
            backgroundColor: basket.length > 0 ? '#00d4ff' : '#2a2a2a',
            color: basket.length > 0 ? '#0a0a0a' : '#555',
            fontSize: 16, fontWeight: 700, cursor: basket.length > 0 ? 'pointer' : 'default',
          }}>
            {basket.length > 0 ? `Log ${basket.length} item${basket.length > 1 ? 's' : ''}` : 'Add foods above'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MEAL CARD ────────────────────────────────────────────────────────────────
function MealCard({ mealTime, template, mealLog, onLogFromTemplate, onModify, onAddFreeForm }) {
  const displayName = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
  const isLogged = !!mealLog;
  const templateFoods = template?.foods || [];
  const loggedFoods = mealLog?.foods_eaten || [];

  return (
    <div style={{
      backgroundColor: '#141414', borderRadius: 20, marginBottom: 16,
      border: isLogged ? '1px solid rgba(0,255,136,0.2)' : '1px solid #1e1e1e',
      overflow: 'hidden', transition: 'border-color 0.3s',
    }}>
      <div style={{ padding: '18px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{displayName}</h3>
            {isLogged && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                Logged
              </span>
            )}
          </div>
          {isLogged ? (
            <p style={{ fontSize: 13, color: '#00ff88', margin: '4px 0 0', fontWeight: 600 }}>
              {mealLog.total_calories} kcal eaten
            </p>
          ) : templateFoods.length > 0 ? (
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
              Planned: {templateFoods.slice(0, 3).map((f) => f.food_name).join(', ')}
              {templateFoods.length > 3 ? ` +${templateFoods.length - 3} more` : ''}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#555', margin: '4px 0 0' }}>No template set</p>
          )}
        </div>
      </div>

      {/* Logged foods */}
      {isLogged && loggedFoods.length > 0 && (
        <div style={{ padding: '0 18px 14px' }}>
          {loggedFoods.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 10px', backgroundColor: '#1a1a1a', borderRadius: 10,
              marginBottom: 5, border: '1px solid #222',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name || item.food_name}</span>
                <span style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>{item.grams || item.serving_size_grams}g</span>
              </div>
              <span style={{ fontSize: 12, color: '#aaa' }}>{item.calories} kcal · P{Math.round(item.protein)}g</span>
            </div>
          ))}
        </div>
      )}

      {/* Template preview (not yet logged) */}
      {!isLogged && templateFoods.length > 0 && (
        <div style={{ padding: '0 18px 14px' }}>
          {templateFoods.map((tf, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: '#bbb' }}>{tf.food_name}</span>
              <span style={{ fontSize: 12, color: '#555' }}>{tf.quantity_grams}g · {tf.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!isLogged ? (
        <div style={{ padding: '0 18px 18px', display: 'flex', gap: 10 }}>
          {templateFoods.length > 0 ? (
            <>
              <button onClick={() => onLogFromTemplate(mealTime, template)} style={{
                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                backgroundColor: '#00d4ff', color: '#0a0a0a', fontWeight: 700, fontSize: 14,
              }}>Log This Meal</button>
              <button onClick={() => onModify(mealTime, template)} style={{
                padding: '12px 20px', borderRadius: 12, border: '1px solid #2a2a2a',
                backgroundColor: 'transparent', color: '#aaa', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Modify</button>
            </>
          ) : (
            <button onClick={() => onAddFreeForm(displayName)} style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: '1px dashed #333',
              backgroundColor: 'transparent', color: '#888', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>+ Add Food</button>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 18px 18px' }}>
          <button onClick={() => onAddFreeForm(displayName)} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid #2a2a2a',
            backgroundColor: 'transparent', color: '#666', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>+ Add more</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MealLogging() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [templates, setTemplates] = useState([]);
  // todayMealLogs: array of MealLog objects from the backend
  // Each has: { id, meal_name, foods_eaten, total_calories, total_protein, total_carbs, total_fats, ... }
  const [todayMealLogs, setTodayMealLogs] = useState([]);

  const [foodModal, setFoodModal] = useState(null);
  const [energyCapture, setEnergyCapture] = useState(null);

  // Derived totals from today's logs
  const totals = todayMealLogs.reduce((acc, l) => ({
    calories: acc.calories + (l.total_calories || 0),
    protein: acc.protein + (l.total_protein || 0),
    carbs: acc.carbs + (l.total_carbs || 0),
    fats: acc.fats + (l.total_fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const targets = {
    calories: plan?.target_calories || 2000,
    protein: plan?.target_protein || 150,
    carbs: plan?.target_carbs || 250,
    fats: plan?.target_fats || 65,
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

      const [mealTemplates, todayData] = await Promise.all([
        getPlanMeals(activePlan.id).catch(() => []),
        getTodaysMeals().catch(() => ({ meals: [] })),
      ]);

      setTemplates(mealTemplates || []);
      setTodayMealLogs(todayData?.meals || []);
    } catch (err) {
      console.error('MealLogging load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get the MealLog for a given meal_time (first one today, if multiple we sum later)
  const logForMeal = useCallback((mealTime) => {
    return todayMealLogs.find((l) => l.meal_name?.toLowerCase() === mealTime?.toLowerCase()) || null;
  }, [todayMealLogs]);

  // ── Build basket from template (per-serving macros → per-100g for modal) ──
  const templateToBasket = (template) =>
    (template.foods || []).map((tf) => {
      const qg = tf.quantity_grams || 100;
      return {
        food: {
          id: tf.food_id || `tf-${tf.id}`,
          name: tf.food_name,
          cal100: Math.round((tf.calories / qg) * 100),
          p100: parseFloat(((tf.protein / qg) * 100).toFixed(1)),
          c100: parseFloat(((tf.carbs / qg) * 100).toFixed(1)),
          f100: parseFloat(((tf.fats / qg) * 100).toFixed(1)),
        },
        grams: qg,
      };
    });

  const handleLogFromTemplate = (mealTime, template) => {
    const basket = templateToBasket(template);
    setFoodModal({
      mealTime,
      mealName: mealTime.charAt(0).toUpperCase() + mealTime.slice(1),
      initialBasket: basket,
      templateId: template.id,
      followedPlan: true,
    });
  };

  const handleModify = (mealTime, template) => {
    const basket = templateToBasket(template);
    setFoodModal({
      mealTime,
      mealName: mealTime.charAt(0).toUpperCase() + mealTime.slice(1),
      initialBasket: basket,
      templateId: template.id,
      followedPlan: false,
    });
  };

  const handleAddFreeForm = (mealName) => {
    setFoodModal({
      mealTime: mealName.toLowerCase(),
      mealName,
      initialBasket: [],
      templateId: null,
      followedPlan: false,
    });
  };

  // Confirm basket from modal → send ONE MealLog with all foods
  const handleConfirmBasket = async (basket) => {
    const { mealTime, mealName, templateId, followedPlan } = foodModal;
    setFoodModal(null);

    const foodsEaten = basket.map(({ food, grams }) => {
      const m = parseFloat(grams || 100) / 100;
      return {
        name: food.name,
        food_id: typeof food.id === 'number' ? food.id : null,
        grams: parseFloat(grams),
        calories: Math.round(food.cal100 * m),
        protein: Math.round(food.p100 * m),
        carbs: Math.round(food.c100 * m),
        fats: Math.round(food.f100 * m),
      };
    });

    const payload = {
      meal_name: mealTime,
      meal_template_id: templateId,
      followed_plan: followedPlan,
      foods_eaten: foodsEaten,
    };

    try {
      await logMeal(payload);
      // Re-fetch from backend so state exactly matches what was persisted
      const freshData = await getTodaysMeals().catch(() => null);
      if (freshData?.meals) {
        setTodayMealLogs(freshData.meals);
      }
      setEnergyCapture({ mealName });
    } catch (err) {
      console.error('logMeal error:', err);
      alert(`Could not save meal: ${err.message || 'Unknown error'}.\n\nMake sure you have an active diet plan set.`);
    }
  };

  const handleEnergySubmit = () => setEnergyCapture(null);

  // Build card list: standard order + extra logged meals
  const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];
  const templateMap = {};
  templates.forEach((t) => { if (t.meal_time) templateMap[t.meal_time.toLowerCase()] = t; });

  const extraLoggedMeals = todayMealLogs
    .map((l) => l.meal_name?.toLowerCase())
    .filter((n) => n && !MEAL_ORDER.includes(n));
  const uniqueExtra = [...new Set(extraLoggedMeals)];

  const allMealTimes = [...MEAL_ORDER, ...uniqueExtra];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ color: '#555', textAlign: 'center', marginTop: 16, fontSize: 14 }}>Loading meals...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#00d4ff', fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>
          ← Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Today's Nutrition</h1>
        </div>
        {plan && <p style={{ fontSize: 14, color: '#555', margin: '0 0 20px' }}>{plan.name}</p>}
      </div>

      {/* Macro progress */}
      <div style={{
        margin: '0 20px 20px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20, padding: 20,
      }}>
        <MacroBar label="Kcal" current={Math.round(totals.calories)} target={targets.calories} color="#6366f1" />
        <MacroBar label="Protein" current={Math.round(totals.protein)} target={targets.protein} color="#00ff88" />
        <MacroBar label="Carbs" current={Math.round(totals.carbs)} target={targets.carbs} color="#ffd93d" />
        <MacroBar label="Fats" current={Math.round(totals.fats)} target={targets.fats} color="#ff9f43" />
      </div>

      {/* Meal cards */}
      <div style={{ padding: '0 20px' }}>
        {allMealTimes.map((mt) => (
          <MealCard
            key={mt}
            mealTime={mt}
            template={templateMap[mt] || null}
            mealLog={logForMeal(mt)}
            onLogFromTemplate={handleLogFromTemplate}
            onModify={handleModify}
            onAddFreeForm={handleAddFreeForm}
          />
        ))}

        <button onClick={() => handleAddFreeForm('Extra')} style={{
          width: '100%', padding: 16, borderRadius: 16, border: '1px dashed #2a2a2a',
          backgroundColor: 'transparent', color: '#555', fontSize: 14, cursor: 'pointer', marginTop: 4,
        }}>
          + Log something extra
        </button>
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

// Inject keyframe
const _ss = document.createElement('style');
_ss.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(_ss);
