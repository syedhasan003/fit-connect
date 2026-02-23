import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems, deleteVaultItem } from "../../api/vault";
import { getActiveDietPlan, activateDietPlan, deleteDietPlan } from "../../api/diet";

export default function DietPlansList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activating, setActivating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(location.state?.savedPlan ? `"${location.state.savedPlan}" saved!` : null);

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

  const handleSetActive = async (plan) => {
    const planId = plan.content?.planId;
    if (!planId) return;
    setActivating(plan.id);
    try {
      await activateDietPlan(planId);
      setActivePlanId(planId);
    } catch (err) {
      alert("Failed to set plan as active: " + (err.message || "Unknown error"));
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (plan) => {
    const confirmed = window.confirm(`Delete "${plan.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(plan.id);
    try {
      // Delete vault entry
      await deleteVaultItem(plan.id);
      // Also delete the underlying diet plan if we have its ID
      const planId = plan.content?.planId;
      if (planId) {
        try { await deleteDietPlan(planId); } catch (_) { /* non-fatal */ }
      }
      // Remove from list instantly
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
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
            Plans saved with the manual diet builder
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
                onSetActive={() => handleSetActive(plan)}
                onLog={() => navigate("/meal-logging")}
                onDelete={() => handleDelete(plan)}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function DietPlanCard({ plan, isActive, activating, deleting, onSetActive, onLog, onDelete }) {
  const [hover, setHover] = useState(false);
  const content = typeof plan.content === "string" ? JSON.parse(plan.content) : plan.content;
  const accentColor = "#ec4899";

  return (
    <div
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
      }}
    >
      {/* Active pill */}
      {isActive && (
        <div style={{
          position: "absolute", top: 14, right: 44,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.3)",
          fontSize: 11, fontWeight: 700, color: "#00ff88",
        }}>
          Active
        </div>
      )}

      {/* Delete button (top-right) */}
      <button
        onClick={onDelete}
        disabled={deleting}
        title="Delete plan"
        style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: deleting ? "default" : "pointer",
          color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "#ef4444"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
      >
        {deleting ? "…" : "✕"}
      </button>

      <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, paddingRight: 80 }}>
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

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {!isActive && (
          <button
            onClick={onSetActive}
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
            onClick={onLog}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
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
