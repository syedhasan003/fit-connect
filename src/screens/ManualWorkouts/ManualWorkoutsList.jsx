import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems } from "../../api/vault";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.lime, dim: T.limeDim, glow: T.limeGlow };

function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
    }}/>
  );
}

function parseWorkoutData(content) {
  try {
    const data = typeof content === "string" ? JSON.parse(content) : content;
    const days = data?.days || [];
    let exercises = 0, sets = 0;
    days.forEach(day =>
      (day.muscles || []).forEach(m =>
        (m.areas || []).forEach(a =>
          (a.exercises || []).forEach(ex => {
            exercises++;
            sets += (ex.sets || []).length;
          })
        )
      )
    );
    return { days: days.length, exercises, sets };
  } catch {
    return { days: 0, exercises: 0, sets: 0 };
  }
}

function WorkoutCard({ item, onClick }) {
  const [hover, setHover] = useState(false);
  const stats = parseWorkoutData(item.content);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 16, marginBottom: 10, cursor: "pointer",
        background: T.s2,
        border: `1px solid ${hover ? A.color + "44" : T.border}`,
        borderRadius: T.rad,
        transform: hover ? "scale(1.01)" : "scale(1)",
        boxShadow: hover ? `0 0 18px ${A.glow}` : "none",
        transition: "border-color .15s, transform .15s, box-shadow .15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: T.t1, margin: "0 0 3px", letterSpacing: "-0.2px" }}>
            {item.title || "Untitled Workout"}
          </p>
          <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>{relDate(item.created_at)}</p>
        </div>
        {item.pinned && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M9 1L13 5L8.5 9.5L7 13L1 7L4.5 5.5L9 1Z" fill={A.color} stroke={A.color} strokeWidth="1"/>
          </svg>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: `${stats.days} day${stats.days !== 1 ? "s" : ""}` },
          { label: `${stats.exercises} exercise${stats.exercises !== 1 ? "s" : ""}` },
          { label: `${stats.sets} set${stats.sets !== 1 ? "s" : ""}` },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "4px 9px", borderRadius: 6,
            background: i === 0 ? A.dim : T.s3,
            border: `1px solid ${i === 0 ? "rgba(122,222,0,.2)" : T.border2}`,
            fontSize: 10, fontWeight: 700,
            color: i === 0 ? A.color : T.t3,
          }}>{s.label}</div>
        ))}
      </div>
    </div>
  );
}

export default function ManualWorkoutsList() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [search, setSearch]     = useState("");
  const [focus, setFocus]       = useState(false);

  useEffect(() => {
    fetchVaultItems()
      .then(data => setWorkouts((data || []).filter(i => i.type === "workout" || i.source === "workout")))
      .catch(() => setWorkouts([]))
      .finally(() => setLoad(false));
  }, []);

  const filtered = workouts.filter(w =>
    !search || w.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.t1, paddingBottom: 90, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ padding: "56px 22px 0" }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={A.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 13, color: A.color, fontWeight: 600 }}>Vault</span>
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: A.dim,
            border: `1px solid rgba(122,222,0,.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M2 11H4M18 11H20M4 8H7V14H4V8ZM15 8H18V14H15V8Z" stroke={A.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11H15" stroke={A.color} strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: T.t1, margin: 0, letterSpacing: "-0.5px" }}>Workout Plans</p>
            <p style={{ fontSize: 12, color: T.t3, margin: "2px 0 0" }}>
              {loading ? "Loading…" : `${workouts.length} plan${workouts.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", margin: "14px 0 18px" }}>
          <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}
            width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke={T.t3} strokeWidth="1.4"/>
            <path d="M10.5 10.5L14 14" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text" placeholder="Search workouts…" value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{
              width: "100%", padding: "12px 14px 12px 36px",
              background: T.s2, border: `1px solid ${focus ? A.color : T.border}`,
              borderRadius: 14, fontSize: 14, color: T.t1,
              fontFamily: "'Inter',sans-serif", outline: "none",
              boxShadow: focus ? `0 0 0 3px ${A.dim}` : "none",
              transition: "border-color .15s, box-shadow .15s",
            }}
          />
        </div>

        {/* New plan CTA */}
        <button
          onClick={() => navigate("/workout-builder")}
          style={{
            width: "100%", padding: "13px", borderRadius: 14,
            background: "transparent",
            border: `1px dashed rgba(122,222,0,.3)`,
            color: A.color, fontSize: 14, fontWeight: 700, cursor: "pointer",
            marginBottom: 20, fontFamily: "'Inter',sans-serif",
          }}
        >+ Create New Workout Plan</button>
      </div>

      {/* List */}
      <div style={{ padding: "0 22px" }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: T.rad, padding: 16, marginBottom: 10 }}>
              <Skel w="70%" h={15} r={6} style={{ marginBottom: 10 }}/>
              <Skel w="35%" h={10} r={5} style={{ marginBottom: 14 }}/>
              <div style={{ display: "flex", gap: 8 }}>
                <Skel w={60} h={24} r={6}/>
                <Skel w={80} h={24} r={6}/>
                <Skel w={60} h={24} r={6}/>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: T.s2,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <path d="M2 11H4M18 11H20M4 8H7V14H4V8ZM15 8H18V14H15V8Z" stroke={T.border2} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11H15" stroke={T.border2} strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: T.t1, margin: "0 0 8px" }}>
              {search ? "No results" : "No workout plans yet"}
            </p>
            <p style={{ fontSize: 13, color: T.t3, margin: "0 0 24px" }}>
              {search ? "Try a different search" : "Build your first plan with the Workout Builder"}
            </p>
            {!search && (
              <button onClick={() => navigate("/workout-builder")} style={{
                padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg,${A.color},#2DCF10)`,
                color: "#000", fontSize: 14, fontWeight: 800,
              }}>Open Workout Builder</button>
            )}
          </div>
        ) : (
          filtered.map(item => (
            <WorkoutCard key={item.id} item={item} onClick={() => navigate(`/vault/workouts/${item.id}`)}/>
          ))
        )}
      </div>

      <BottomNav/>
      <style>{VAULT_CSS}</style>
    </div>
  );
}
