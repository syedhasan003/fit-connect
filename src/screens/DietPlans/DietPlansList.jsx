import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems, deleteVaultItem } from "../../api/vault";
import { getActiveDietPlan, activateDietPlan, deleteDietPlan, getDietPlanById, getPlanMeals } from "../../api/diet";

export default function DietPlansList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activating, setActivating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(location.state?.savedPlan ? `"${location.state.savedPlan}" saved!` : null);

  // Detail sheet state
  const [selectedPlan, setSelectedPlan] = useState(null); // { ...plan, meals: [], _isActive: bool }
  const [loadingDetail, setLoadingDetail] = useState(null); // plan.id while loading

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [vaultData, activePlan] = await Promise.all([
        fetchVaultItems(),
        getActiveDietPlan().catch(() => null),
      ]);
      const dietItems = vaultData.filter(
        (item) => item.type === "diet" || item.source === "diet"
      );
      setPlans(dietItems);
      if (activePlan) setActivePlanId(activePlan.id);
    } catch (err) {
      console.error("Failed to load diet plans:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── View (tap to open detail sheet) ─────────────────────────────────────────
  const handleView = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) {
      // No planId — open sheet with just the summary info
      setSelectedPlan({ ...plan, meals: [], _isActive: plan.content?.planId === activePlanId });
      return;
    }
    setLoadingDetail(plan.id);
    try {
      const meals = await getPlanMeals(planId).catch(() => []);
      setSelectedPlan({ ...plan, meals, _isActive: planId === activePlanId });
    } catch (err) {
      console.error("Failed to load plan detail:", err);
      setSelectedPlan({ ...plan, meals: [], _isActive: planId === activePlanId });
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleSetActive = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) return;
    setActivating(plan.id);
    try {
      await activateDietPlan(planId);
      setActivePlanId(planId);
      // Update sheet if open
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(prev => ({ ...prev, _isActive: true }));
      }
    } catch (err) {
      alert("Failed to set plan as active: " + (err.message || "Unknown error"));
    } finally {
      setActivating(null);
    }
  };

  const handleEdit = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) {
      alert("Cannot edit this plan — plan ID not found.");
      return;
    }
    setEditing(plan.id);
    try {
      const [planData, meals] = await Promise.all([
        getDietPlanById(planId),
        getPlanMeals(planId).catch(() => []),
      ]);
      const editPayload = {
        name:    planData.name,
        goal:    planData.goal_type,
        daily_calories: planData.target_calories,
        daily_protein:  planData.target_protein,
        rest_day_calories:    planData.rest_day_calories,
        workout_day_calories: planData.workout_day_calories,
        meals: meals.map(m => ({
          name:   (m.meal_name || m.meal_time || '').charAt(0).toUpperCase() + (m.meal_name || m.meal_time || '').slice(1),
          foods:  m.foods || [],
          target_calories: m.target_calories,
          meal_time: m.meal_time,
        })),
      };
      setSelectedPlan(null); // close sheet before navigating
      navigate('/diet-builder', { state: { planData: editPayload, planId, vaultId: plan.id } });
    } catch (err) {
      alert("Failed to load plan for editing: " + (err.message || "Unknown error"));
    } finally {
      setEditing(null);
    }
  };

  const handleDelete = async (plan) => {
    const confirmed = window.confirm(`Delete "${plan.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(plan.id);
    try {
      await deleteVaultItem(plan.id);
      const planId = plan.content?.planId;
      if (planId) {
        try { await deleteDietPlan(planId); } catch (_) { /* non-fatal */ }
      }
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      if (selectedPlan?.id === plan.id) setSelectedPlan(null);
      setToast(`🗑️ "${plan.title}" deleted`);
    } catch (err) {
      alert("Failed to delete: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  const filtered = plans.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)", borderRadius: 14, padding: "12px 24px",
          fontSize: 14, fontWeight: 600, color: "#fff", zIndex: 1000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideDown 0.3s ease",
          whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      <div style={{ padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "transparent", border: "none", color: "#ec4899", fontSize: 28, cursor: "pointer", padding: 0, marginBottom: 8 }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: 0.3 }}>Diet Plans</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            Tap a plan to view its meals · swipe to manage
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: "#fff", fontSize: 15, outline: "none",
            }}
          />
        </div>

        {/* Create new */}
        <button
          onClick={() => navigate("/diet-builder")}
          style={{
            width: "100%", padding: 16, borderRadius: 18, border: "1px dashed rgba(236,72,153,0.3)",
            background: "rgba(236,72,153,0.05)", color: "#ec4899", fontSize: 15, fontWeight: 600,
            cursor: "pointer", marginBottom: 24, transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(236,72,153,0.1)"; e.currentTarget.style.borderColor = "rgba(236,72,153,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(236,72,153,0.05)"; e.currentTarget.style.borderColor = "rgba(236,72,153,0.3)"; }}
        >
          + Create New Diet Plan
        </button>

        {/* List */}
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onCreateNew={() => navigate("/diet-builder")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((plan) => (
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
                onDelete={() => handleDelete(plan)}
                onEdit={() => handleEdit(plan)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />

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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes sheetUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── Diet Plan Card ────────────────────────────────────────────────────────────
function DietPlanCard({ plan, isActive, activating, deleting, editing, loadingDetail, onView, onSetActive, onLog, onDelete, onEdit }) {
  const [hover, setHover] = useState(false);
  const content = typeof plan.content === "string" ? JSON.parse(plan.content) : plan.content;
  const accentColor = "#ec4899";

  return (
    <div
      onClick={onView}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", borderRadius: 18, padding: 20, overflow: "hidden",
        background: hover
          ? "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.08))"
          : "linear-gradient(135deg, rgba(17,24,39,0.5), rgba(31,41,55,0.3))",
        backdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        border: isActive
          ? "1px solid rgba(236,72,153,0.5)"
          : "1px solid rgba(255,255,255,0.06)",
        opacity: deleting ? 0.5 : 1,
        cursor: loadingDetail ? "wait" : "pointer",
      }}
    >
      {/* Active pill */}
      {isActive && (
        <div style={{
          position: "absolute", top: 14, right: 78,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.3)",
          fontSize: 11, fontWeight: 700, color: "#00ff88",
        }}>
          Active
        </div>
      )}

      {/* Edit button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        disabled={editing || deleting}
        title="Edit plan"
        style={{
          position: "absolute", top: 12, right: 46,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: (editing || deleting) ? "default" : "pointer",
          color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#818cf8"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
      >
        {editing ? "…" : "✎"}
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        disabled={deleting || editing}
        title="Delete plan"
        style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: (deleting || editing) ? "default" : "pointer",
          color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "#ef4444"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
      >
        {deleting ? "…" : "✕"}
      </button>

      <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, paddingRight: 116 }}>
        {plan.title || "Untitled Plan"}
      </h3>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
        {plan.summary || `Saved ${new Date(plan.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
      </p>

      {/* Macro chips */}
      {content && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {content.target_calories && (
            <StatBadge label={`${content.target_calories} kcal`} color={accentColor} />
          )}
          {content.target_protein && (
            <StatBadge label={`${content.target_protein}g protein`} color="#8b5cf6" />
          )}
          {content.goal && (
            <StatBadge label={content.goal} color="#6366f1" />
          )}
          {content.meals_per_day && (
            <StatBadge label={`${content.meals_per_day} meals/day`} color="#06b6d4" />
          )}
        </div>
      )}

      {/* "Tap to view" hint */}
      <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
        {loadingDetail ? "Loading meals…" : "Tap to view full meal plan"}
      </p>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetActive(); }}
            disabled={activating}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: activating ? "default" : "pointer",
              background: activating ? "rgba(236,72,153,0.4)" : `linear-gradient(135deg, ${accentColor}, #a855f7)`,
              color: "#fff", fontSize: 14, fontWeight: 700, opacity: activating ? 0.7 : 1, transition: "all 0.2s",
            }}
          >
            {activating ? "Activating..." : "Set as Active"}
          </button>
        )}
        {isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onLog(); }}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #00d4ff, #0099cc)",
              color: "#0a0a0a", fontSize: 14, fontWeight: 700, transition: "all 0.2s",
            }}
          >
            Log Today's Meals
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Diet Plan Detail Sheet ────────────────────────────────────────────────────
function DietPlanDetailSheet({ plan, activating, editing, onClose, onEdit, onSetActive, onLog }) {
  const content = typeof plan.content === "string" ? JSON.parse(plan.content) : plan.content;
  const isActive = plan._isActive;
  const accentColor = "#ec4899";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      />

      {/* Sheet */}
      <div style={{
        position: "relative",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        background: "linear-gradient(180deg, #111827 0%, #0a0a14 100%)",
        borderTop: "1px solid rgba(236,72,153,0.2)",
        maxHeight: "88vh",
        display: "flex", flexDirection: "column",
        animation: "sheetUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        {/* Drag handle */}
        <div style={{ padding: "14px 0 6px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: "8px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>{plan.title || "Diet Plan"}</h2>
              {isActive && (
                <span style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 20,
                  background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)",
                  fontSize: 11, fontWeight: 700, color: "#00ff88",
                }}>
                  ● Active Plan
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
                width: 32, height: 32, color: "rgba(255,255,255,0.6)",
                cursor: "pointer", fontSize: 16, flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Macro chips */}
          {content && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {content.target_calories && <StatBadge label={`${content.target_calories} kcal`} color={accentColor} />}
              {content.target_protein && <StatBadge label={`${content.target_protein}g protein`} color="#8b5cf6" />}
              {content.goal && <StatBadge label={content.goal} color="#6366f1" />}
              {content.meals_per_day && <StatBadge label={`${content.meals_per_day} meals/day`} color="#06b6d4" />}
              {content.rest_day_calories && <StatBadge label={`Rest: ${content.rest_day_calories} kcal`} color="#10b981" />}
              {content.workout_day_calories && <StatBadge label={`Training: ${content.workout_day_calories} kcal`} color="#f59e0b" />}
            </div>
          )}
        </div>

        {/* Meals */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 8px" }}>
          {plan.meals && plan.meals.length > 0 ? (
            <>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                Meal Plan · {plan.meals.length} meal{plan.meals.length !== 1 ? "s" : ""}
              </p>
              {plan.meals.map((meal, i) => (
                <MealDetailBlock key={i} meal={meal} />
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🍽️</span>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                No meal details saved — edit the plan to add meals.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: "16px 24px 36px",
          display: "flex", gap: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button
            onClick={onEdit}
            disabled={editing}
            style={{
              flex: 1, padding: "14px 0", borderRadius: 14,
              border: "1px solid rgba(99,102,241,0.4)",
              background: "rgba(99,102,241,0.1)", color: "#818cf8",
              fontSize: 15, fontWeight: 700, cursor: editing ? "default" : "pointer",
              opacity: editing ? 0.7 : 1,
            }}
          >
            {editing ? "Loading…" : "Edit Plan"}
          </button>

          {isActive ? (
            <button
              onClick={onLog}
              style={{
                flex: 2, padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #00d4ff, #0099cc)",
                color: "#0a0a0a", fontSize: 15, fontWeight: 700,
              }}
            >
              Log Today's Meals
            </button>
          ) : (
            <button
              onClick={onSetActive}
              disabled={activating}
              style={{
                flex: 2, padding: "14px 0", borderRadius: 14, border: "none",
                cursor: activating ? "default" : "pointer",
                background: activating
                  ? "rgba(236,72,153,0.4)"
                  : "linear-gradient(135deg, #ec4899, #a855f7)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                opacity: activating ? 0.7 : 1,
              }}
            >
              {activating ? "Activating..." : "Set as Active"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Meal Detail Block ─────────────────────────────────────────────────────────
function MealDetailBlock({ meal }) {
  const foods = meal.foods || [];
  const mealTitle = (meal.meal_name || meal.meal_time || "Meal");
  const displayTitle = mealTitle.charAt(0).toUpperCase() + mealTitle.slice(1);

  return (
    <div style={{
      marginBottom: 14,
      borderRadius: 16,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}>
      {/* Meal header */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(236,72,153,0.06)",
        borderBottom: foods.length > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f9a8d4" }}>{displayTitle}</h4>
        {meal.target_calories && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            {meal.target_calories} kcal target
          </span>
        )}
      </div>

      {/* Foods list */}
      {foods.length > 0 ? (
        foods.map((food, fi) => (
          <div
            key={fi}
            style={{
              padding: "10px 16px",
              borderBottom: fi < foods.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{food.name}</p>
              {food.grams && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                  {food.grams}g
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ec4899" }}>
                {food.calories} kcal
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                P {food.protein}g · C {food.carbs}g · F {food.fats}g
              </p>
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: "12px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>No foods in this meal</p>
        </div>
      )}
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────
function StatBadge({ label, color }) {
  return (
    <div style={{
      padding: "5px 12px", borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}30`,
      fontSize: 12, fontWeight: 600, color,
    }}>
      {label}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{
        width: 50, height: 50, margin: "0 auto 20px",
        border: "3px solid rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899",
        borderRadius: "50%", animation: "spin 1s linear infinite",
      }} />
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)" }}>Loading plans...</p>
    </div>
  );
}

function EmptyState({ searchQuery, onCreateNew }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <span style={{ fontSize: 56, display: "block", marginBottom: 20 }}>🍽️</span>
      <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600 }}>
        {searchQuery ? "No plans found" : "No diet plans yet"}
      </h3>
      <p style={{ margin: "0 0 24px", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
        {searchQuery ? "Try a different search" : "Build your first diet plan with the Manual Builder"}
      </p>
      {!searchQuery && (
        <button
          onClick={onCreateNew}
          style={{
            padding: "14px 28px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            color: "#fff", fontSize: 15, fontWeight: 700,
          }}
        >
          Create Diet Plan
        </button>
      )}
    </div>
  );
}
