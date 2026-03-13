import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems, deleteVaultItem } from "../../api/vault";
import { getActiveDietPlan, activateDietPlan, deleteDietPlan, getDietPlanById, getPlanMeals } from "../../api/diet";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.diet, dim: T.dietDim, glow: T.dietGlow };   // green accent

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
    }}/>
  );
}

// ── Macro badge ───────────────────────────────────────────────────────────────
function MacroBadge({ label, color }) {
  return (
    <div style={{
      padding:"4px 10px", borderRadius:6,
      background:`${color}18`, border:`1px solid ${color}30`,
      fontSize:11, fontWeight:700, color,
    }}>{label}</div>
  );
}

// ── Meal detail block (inside detail sheet) ───────────────────────────────────
function MealDetailBlock({ meal }) {
  const foods = meal.foods || [];
  const raw = meal.meal_name || meal.meal_time || "Meal";
  const title = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div style={{
      marginBottom:12, borderRadius:12,
      background:T.s3, border:`1px solid ${T.border}`,
      overflow:"hidden",
    }}>
      {/* Meal header */}
      <div style={{
        padding:"11px 14px",
        background:`${A.color}0F`,
        borderBottom: foods.length > 0 ? `1px solid ${T.border}` : "none",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <p style={{ margin:0, fontSize:14, fontWeight:800, color:A.color }}>{title}</p>
        {meal.target_calories && (
          <span style={{ fontSize:11, color:T.t3, fontWeight:600 }}>{meal.target_calories} kcal</span>
        )}
      </div>

      {/* Foods */}
      {foods.length > 0 ? foods.map((food, fi) => (
        <div key={fi} style={{
          padding:"10px 14px",
          borderBottom: fi < foods.length - 1 ? `1px solid ${T.border}` : "none",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:T.t1 }}>{food.name}</p>
            {food.grams && <p style={{ margin:"2px 0 0", fontSize:11, color:T.t3 }}>{food.grams}g</p>}
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:A.color }}>{food.calories} kcal</p>
            <p style={{ margin:"2px 0 0", fontSize:10, color:T.t3 }}>
              P {food.protein}g · C {food.carbs}g · F {food.fats}g
            </p>
          </div>
        </div>
      )) : (
        <div style={{ padding:"12px 14px" }}>
          <p style={{ margin:0, fontSize:12, color:T.t3 }}>No foods in this meal</p>
        </div>
      )}
    </div>
  );
}

// ── Diet plan card ────────────────────────────────────────────────────────────
function DietPlanCard({ plan, isActive, activating, deleting, editing, loadingDetail, onView, onSetActive, onLog, onDelete, onEdit }) {
  const [hover, setHover] = useState(false);
  const content = typeof plan.content === "string" ? JSON.parse(plan.content) : plan.content;

  return (
    <div
      onClick={onView}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:16, marginBottom:10, cursor: loadingDetail ? "wait" : "pointer",
        background:T.s2,
        border:`1px solid ${hover ? A.color + "44" : (isActive ? A.color + "33" : T.border)}`,
        borderRadius:T.rad,
        transform: hover ? "scale(1.01)" : "scale(1)",
        boxShadow: hover ? `0 0 18px ${A.glow}` : (isActive ? `0 0 10px ${A.glow}` : "none"),
        transition:"border-color .15s, transform .15s, box-shadow .15s",
        opacity: deleting ? .5 : 1,
      }}
    >
      {/* Top row: title + action icons */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ flex:1, paddingRight:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
            <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:0, letterSpacing:"-0.2px" }}>
              {plan.title || "Untitled Plan"}
            </p>
            {isActive && (
              <span style={{
                padding:"2px 8px", borderRadius:999,
                background:A.dim, border:`1px solid ${A.color}30`,
                fontSize:9, fontWeight:800, color:A.color, letterSpacing:"0.4px",
              }}>ACTIVE</span>
            )}
            {plan.pinned && (
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M9 1L13 5L8.5 9.5L7 13L1 7L4.5 5.5L9 1Z" fill={A.color} stroke={A.color} strokeWidth="1"/>
              </svg>
            )}
          </div>
          <p style={{ fontSize:11, color:T.t3, margin:0 }}>
            {plan.summary || relDate(plan.created_at)}
          </p>
        </div>

        {/* Edit + Delete icon buttons */}
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            disabled={editing || deleting}
            style={{
              width:30, height:30, borderRadius:8,
              background:T.s3, border:`1px solid ${T.border}`,
              cursor:(editing || deleting) ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {editing ? (
              <span style={{ fontSize:10, color:T.t3 }}>…</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke={T.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            disabled={deleting || editing}
            style={{
              width:30, height:30, borderRadius:8,
              background:T.s3, border:`1px solid ${T.border}`,
              cursor:(deleting || editing) ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {deleting ? (
              <span style={{ fontSize:10, color:T.t3 }}>…</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5H12M5 3.5V2H9V3.5M5.5 6V10.5M8.5 6V10.5M3 3.5L3.5 12H10.5L11 3.5"
                  stroke={T.red} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Macro chips */}
      {content && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
          {content.target_calories  && <MacroBadge label={`${content.target_calories} kcal`}    color={A.color}/>}
          {content.target_protein   && <MacroBadge label={`${content.target_protein}g protein`}  color={T.purple}/>}
          {content.goal             && <MacroBadge label={content.goal}                           color={T.blue}/>}
          {content.meals_per_day    && <MacroBadge label={`${content.meals_per_day} meals/day`}   color={T.t3}/>}
        </div>
      )}

      {/* Tap hint */}
      <p style={{ fontSize:10, color:T.t3, margin:"0 0 12px", fontStyle:"italic" }}>
        {loadingDetail ? "Loading meals…" : "Tap to view full meal plan"}
      </p>

      {/* Primary action */}
      <div onClick={e => e.stopPropagation()}>
        {!isActive ? (
          <button
            onClick={onSetActive}
            disabled={activating}
            style={{
              width:"100%", padding:"11px", borderRadius:10, border:"none",
              background: activating ? `${A.color}60` : A.color,
              color:"#000", fontSize:13, fontWeight:700,
              cursor: activating ? "default" : "pointer",
              opacity: activating ? .7 : 1,
              fontFamily:"'Inter',sans-serif",
            }}
          >{activating ? "Activating…" : "Set as Active"}</button>
        ) : (
          <button
            onClick={onLog}
            style={{
              width:"100%", padding:"11px", borderRadius:10, border:"none",
              background:T.blue, color:"#fff",
              fontSize:13, fontWeight:700, cursor:"pointer",
              fontFamily:"'Inter',sans-serif",
            }}
          >Log Today's Meals</button>
        )}
      </div>
    </div>
  );
}

// ── Detail bottom sheet ───────────────────────────────────────────────────────
function DietPlanDetailSheet({ plan, activating, editing, onClose, onEdit, onSetActive, onLog }) {
  const content = typeof plan.content === "string" ? JSON.parse(plan.content) : plan.content;
  const isActive = plan._isActive;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)" }}/>

      {/* Sheet */}
      <div style={{
        position:"relative",
        borderTopLeftRadius:22, borderTopRightRadius:22,
        background:T.s2, borderTop:`1px solid ${A.color}33`,
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",
        fontFamily:"'Inter',sans-serif",
      }}>
        {/* Drag handle */}
        <div style={{ padding:"14px 0 6px", display:"flex", justifyContent:"center" }}>
          <div style={{ width:36, height:4, background:T.border2, borderRadius:2 }}/>
        </div>

        {/* Header */}
        <div style={{ padding:"8px 22px 16px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1, paddingRight:14 }}>
              <p style={{ fontSize:20, fontWeight:900, color:T.t1, margin:"0 0 6px", letterSpacing:"-0.4px" }}>
                {plan.title || "Diet Plan"}
              </p>
              {isActive && (
                <span style={{
                  display:"inline-block", padding:"3px 9px", borderRadius:999,
                  background:A.dim, border:`1px solid ${A.color}30`,
                  fontSize:10, fontWeight:800, color:A.color, letterSpacing:"0.4px",
                }}>ACTIVE PLAN</span>
              )}
            </div>
            {/* Close */}
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:9,
              background:T.s3, border:`1px solid ${T.border}`,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke={T.t3} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Macro chips */}
          {content && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:14 }}>
              {content.target_calories       && <MacroBadge label={`${content.target_calories} kcal`}        color={A.color}/>}
              {content.target_protein        && <MacroBadge label={`${content.target_protein}g protein`}      color={T.purple}/>}
              {content.goal                  && <MacroBadge label={content.goal}                              color={T.blue}/>}
              {content.meals_per_day         && <MacroBadge label={`${content.meals_per_day} meals/day`}      color={T.t3}/>}
              {content.rest_day_calories     && <MacroBadge label={`Rest: ${content.rest_day_calories} kcal`} color={T.diet}/>}
              {content.workout_day_calories  && <MacroBadge label={`Training: ${content.workout_day_calories} kcal`} color={T.warn}/>}
            </div>
          )}
        </div>

        {/* Meals scroll area */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px 8px" }}>
          {plan.meals && plan.meals.length > 0 ? (
            <>
              <p style={{ margin:"0 0 12px", fontSize:11, color:T.t3, fontWeight:700, letterSpacing:"0.5px" }}>
                MEAL PLAN · {plan.meals.length} MEAL{plan.meals.length !== 1 ? "S" : ""}
              </p>
              {plan.meals.map((meal, i) => <MealDetailBlock key={i} meal={meal}/>)}
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"32px 20px" }}>
              <div style={{
                width:56, height:56, borderRadius:16, background:T.s3,
                border:`1px solid ${T.border}`, display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 16px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11H21M3 11C3 7 7 4 12 4C17 4 21 7 21 11M3 11V17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17V11"
                    stroke={T.border2} strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize:13, color:T.t3, margin:0 }}>No meal details saved. Edit the plan to add meals.</p>
            </div>
          )}
        </div>

        {/* Sheet action buttons */}
        <div style={{ padding:"16px 22px 36px", display:"flex", gap:10, borderTop:`1px solid ${T.border}` }}>
          <button
            onClick={onEdit}
            disabled={editing}
            style={{
              flex:1, padding:"13px 0", borderRadius:12,
              border:`1px solid ${T.purple}44`, background:`${T.purple}12`,
              color:T.purple, fontSize:14, fontWeight:700,
              cursor: editing ? "default" : "pointer",
              opacity: editing ? .7 : 1,
              fontFamily:"'Inter',sans-serif",
            }}
          >{editing ? "Loading…" : "Edit Plan"}</button>

          {isActive ? (
            <button onClick={onLog} style={{
              flex:2, padding:"13px 0", borderRadius:12, border:"none",
              background:T.blue, color:"#fff", fontSize:14, fontWeight:700,
              cursor:"pointer", fontFamily:"'Inter',sans-serif",
            }}>Log Today's Meals</button>
          ) : (
            <button
              onClick={onSetActive}
              disabled={activating}
              style={{
                flex:2, padding:"13px 0", borderRadius:12, border:"none",
                background: activating ? `${A.color}55` : A.color,
                color:"#000", fontSize:14, fontWeight:700,
                cursor: activating ? "default" : "pointer",
                opacity: activating ? .7 : 1,
                fontFamily:"'Inter',sans-serif",
              }}
            >{activating ? "Activating…" : "Set as Active"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation sheet ─────────────────────────────────────────────────
function DeleteSheet({ plan, onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:400 }}/>
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:T.s2, borderTop:`1px solid rgba(239,68,68,.3)`,
        borderTopLeftRadius:20, borderTopRightRadius:20,
        padding:"20px 20px 44px", zIndex:401,
        animation:"slideUp .25s ease-out", fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{ width:36, height:4, background:T.border2, borderRadius:2, margin:"0 auto 20px" }}/>
        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 6px" }}>Delete Diet Plan?</p>
        <p style={{ fontSize:13, color:T.t3, margin:"0 0 22px" }}>
          "{plan?.title}" will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:"13px", borderRadius:12,
            border:`1px solid ${T.border}`, background:"none",
            color:T.t1, fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:"13px", borderRadius:12,
            border:"none", background:T.red,
            color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
          }}>Delete</button>
        </div>
      </div>
    </>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ background:T.s2, border:`1px solid ${T.border}`, borderRadius:T.rad, padding:16 }}>
          <Skel w="65%" h={15} r={6} style={{ marginBottom:8 }}/>
          <Skel w="40%" h={10} r={5} style={{ marginBottom:14 }}/>
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            <Skel w={80} h={22} r={6}/><Skel w={90} h={22} r={6}/><Skel w={70} h={22} r={6}/>
          </div>
          <Skel w="100%" h={38} r={10}/>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ searchQuery, onCreateNew }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{
        width:64, height:64, borderRadius:20, background:T.s2,
        border:`1px solid ${T.border}`, display:"flex", alignItems:"center",
        justifyContent:"center", margin:"0 auto 20px",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M3 11H21M3 11C3 7 7 4 12 4C17 4 21 7 21 11M3 11V17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17V11"
            stroke={T.border2} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize:16, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>
        {searchQuery ? "No results" : "No diet plans yet"}
      </p>
      <p style={{ fontSize:13, color:T.t3, margin:"0 0 24px" }}>
        {searchQuery ? "Try a different search term" : "Build your first plan with the Diet Builder"}
      </p>
      {!searchQuery && (
        <button onClick={onCreateNew} style={{
          padding:"12px 28px", borderRadius:12, border:"none", cursor:"pointer",
          background:A.color, color:"#000", fontSize:14, fontWeight:800,
        }}>Create Diet Plan</button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DietPlansList() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [plans, setPlans]             = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [focus, setFocus]             = useState(false);
  const [activating, setActivating]   = useState(null);  // plan.id
  const [deleting, setDeleting]       = useState(null);   // plan.id
  const [editing, setEditing]         = useState(null);   // plan.id
  const [loadingDetail, setLoadingDetail] = useState(null); // plan.id

  // Detail sheet
  const [selectedPlan, setSelectedPlan] = useState(null); // { ...plan, meals:[], _isActive:bool }

  // Delete confirmation
  const [planToDelete, setPlanToDelete] = useState(null);

  // Toast
  const [toast, setToast] = useState(
    location.state?.savedPlan ? `"${location.state.savedPlan}" saved!` : null
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [vaultData, activePlan] = await Promise.all([
        fetchVaultItems(),
        getActiveDietPlan().catch(() => null),
      ]);
      const dietItems = vaultData.filter(i => i.type === "diet" || i.source === "diet");
      setPlans(dietItems);
      if (activePlan) setActivePlanId(activePlan.id);
    } catch (err) {
      console.error("Failed to load diet plans:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── View (open detail sheet) ──────────────────────────────────────────────
  const handleView = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) {
      setSelectedPlan({ ...plan, meals:[], _isActive: plan.content?.planId === activePlanId });
      return;
    }
    setLoadingDetail(plan.id);
    try {
      const meals = await getPlanMeals(planId).catch(() => []);
      setSelectedPlan({ ...plan, meals, _isActive: planId === activePlanId });
    } catch {
      setSelectedPlan({ ...plan, meals:[], _isActive: planId === activePlanId });
    } finally {
      setLoadingDetail(null);
    }
  };

  // ── Set active ────────────────────────────────────────────────────────────
  const handleSetActive = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) return;
    setActivating(plan.id);
    try {
      await activateDietPlan(planId);
      setActivePlanId(planId);
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(prev => ({ ...prev, _isActive: true }));
      }
    } catch (err) {
      showToast("Failed to activate: " + (err.message || "Unknown error"));
    } finally {
      setActivating(null);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) { showToast("Cannot edit — plan ID not found."); return; }
    setEditing(plan.id);
    try {
      const [planData, meals] = await Promise.all([
        getDietPlanById(planId),
        getPlanMeals(planId).catch(() => []),
      ]);
      const editPayload = {
        name:    planData.name,
        goal:    planData.goal_type,
        daily_calories:       planData.target_calories,
        daily_protein:        planData.target_protein,
        rest_day_calories:    planData.rest_day_calories,
        workout_day_calories: planData.workout_day_calories,
        meals: meals.map(m => ({
          name:   (m.meal_name || m.meal_time || "").charAt(0).toUpperCase() + (m.meal_name || m.meal_time || "").slice(1),
          foods:  m.foods || [],
          target_calories: m.target_calories,
          meal_time:       m.meal_time,
        })),
      };
      setSelectedPlan(null);
      navigate("/diet-builder", { state: { planData: editPayload, planId, vaultId: plan.id } });
    } catch (err) {
      showToast("Failed to load for editing: " + (err.message || "Unknown error"));
    } finally {
      setEditing(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const plan = planToDelete;
    if (!plan) return;
    setPlanToDelete(null);
    setDeleting(plan.id);
    try {
      await deleteVaultItem(plan.id);
      const planId = plan.content?.planId;
      if (planId) { try { await deleteDietPlan(planId); } catch {} }
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      if (selectedPlan?.id === plan.id) setSelectedPlan(null);
      showToast(`"${plan.title}" deleted`);
    } catch (err) {
      showToast("Failed to delete: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = plans.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          background:T.s2, border:`1px solid ${T.border}`,
          borderRadius:12, padding:"11px 22px",
          fontSize:13, fontWeight:700, color:T.t1, zIndex:1000,
          whiteSpace:"nowrap", animation:"slideDown .3s ease",
        }}>{toast}</div>
      )}

      <div style={{ padding:"56px 22px 0" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          marginBottom:16, display:"flex", alignItems:"center", gap:6,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={A.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:13, color:A.color, fontWeight:600 }}>Vault</span>
        </button>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <div style={{
            width:36, height:36, borderRadius:11, background:A.dim,
            border:`1px solid ${A.color}28`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 11H21M3 11C3 7 7 4 12 4C17 4 21 7 21 11M3 11V17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17V11"
                stroke={A.color} strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:22, fontWeight:900, color:T.t1, margin:0, letterSpacing:"-0.5px" }}>Meal Plans</p>
            <p style={{ fontSize:12, color:T.t3, margin:"2px 0 0" }}>
              {loading ? "Loading…" : `${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position:"relative", margin:"14px 0 18px" }}>
          <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }}
            width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke={T.t3} strokeWidth="1.4"/>
            <path d="M10.5 10.5L14 14" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text" placeholder="Search plans…" value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{
              width:"100%", padding:"12px 14px 12px 36px",
              background:T.s2, border:`1px solid ${focus ? A.color : T.border}`,
              borderRadius:14, fontSize:14, color:T.t1,
              fontFamily:"'Inter',sans-serif", outline:"none",
              boxShadow: focus ? `0 0 0 3px ${A.dim}` : "none",
              transition:"border-color .15s, box-shadow .15s",
            }}
          />
        </div>

        {/* Create new CTA */}
        <button
          onClick={() => navigate("/diet-builder")}
          style={{
            width:"100%", padding:"13px", borderRadius:14,
            background:"transparent", border:`1px dashed ${A.color}44`,
            color:A.color, fontSize:14, fontWeight:700, cursor:"pointer",
            marginBottom:20, fontFamily:"'Inter',sans-serif",
          }}
        >+ Create New Meal Plan</button>

      </div>

      {/* List */}
      <div style={{ padding:"0 22px" }}>
        {loading ? (
          <LoadingSkeleton/>
        ) : filtered.length === 0 ? (
          <EmptyState searchQuery={search} onCreateNew={() => navigate("/diet-builder")}/>
        ) : (
          filtered.map(plan => (
            <DietPlanCard
              key={plan.id}
              plan={plan}
              isActive={plan.content?.planId === activePlanId}
              activating={activating === plan.id}
              deleting={deleting === plan.id}
              editing={editing === plan.id}
              loadingDetail={loadingDetail === plan.id}
              onView={() => handleView(plan)}
              onSetActive={() => handleSetActive(plan)}
              onLog={() => navigate("/meal-logging")}
              onDelete={() => setPlanToDelete(plan)}
              onEdit={() => handleEdit(plan)}
            />
          ))
        )}
      </div>

      <BottomNav/>

      <style>{VAULT_CSS + `
        @keyframes slideDown {
          from { opacity:0; transform:translateX(-50%) translateY(-8px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Detail sheet */}
      {selectedPlan && (
        <DietPlanDetailSheet
          plan={selectedPlan}
          activating={activating === selectedPlan.id}
          editing={editing === selectedPlan.id}
          onClose={() => setSelectedPlan(null)}
          onEdit={() => handleEdit(selectedPlan)}
          onSetActive={() => handleSetActive(selectedPlan)}
          onLog={() => { setSelectedPlan(null); navigate("/meal-logging"); }}
        />
      )}

      {/* Delete confirmation */}
      {planToDelete && (
        <DeleteSheet
          plan={planToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPlanToDelete(null)}
        />
      )}
    </div>
  );
}
