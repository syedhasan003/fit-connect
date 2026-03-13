import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchHealthTimeline } from "../../api/vault";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.blue, dim: T.blueDim, glow: T.blueGlow };   // blue accent for health

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

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY = {
  workout: {
    color: T.lime, label: "Workout",
    icon: (c) => (
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <path d="M2 11H4M18 11H20M4 8H7V14H4V8ZM15 8H18V14H15V8Z" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 11H15" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  diet: {
    color: T.diet, label: "Diet",
    icon: (c) => (
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <path d="M3 11H19M3 11C3 7.5 6.5 5 11 5C15.5 5 19 7.5 19 11M3 11V16C3 17.7 4.3 19 6 19H16C17.7 19 19 17.7 19 16V11"
          stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  meal: {
    color: T.diet, label: "Meal",
    icon: (c) => (
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <path d="M3 11H19M3 11C3 7.5 6.5 5 11 5C15.5 5 19 7.5 19 11M3 11V16C3 17.7 4.3 19 6 19H16C17.7 19 19 17.7 19 16V11"
          stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  reminder: {
    color: T.blue, label: "Reminder",
    icon: (c) => (
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke={c} strokeWidth="1.6"/>
        <path d="M11 7V11.5L14 14" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  ai_insight: {
    color: T.purple, label: "AI Insight",
    icon: (c) => (
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="4" fill={c} opacity=".9"/>
        <path d="M11 2V5M11 17V20M2 11H5M17 11H20" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  default: {
    color: T.t3, label: "Note",
    icon: (c) => (
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="4" stroke={c} strokeWidth="1.5"/>
        <path d="M7 8H15M7 11H13M7 14H11" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function getCat(category) {
  return CATEGORY[category] || CATEGORY.default;
}

// ── Single timeline entry ─────────────────────────────────────────────────────
function TimelineItem({ item }) {
  const cat = getCat(item.category);
  return (
    <div style={{
      padding:"12px 14px", borderRadius:12,
      background:`${cat.color}0F`, border:`1px solid ${cat.color}20`,
      marginBottom:8,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          {cat.icon(cat.color)}
          <span style={{ fontSize:10, fontWeight:800, color:cat.color, letterSpacing:"0.5px" }}>
            {cat.label.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize:11, color:T.t3 }}>
          {new Date(item.timestamp).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
        </span>
      </div>
      <p style={{ margin:0, fontSize:13, color:T.t2, lineHeight:1.5 }}>
        {item.content || item.description || "No details available"}
      </p>
    </div>
  );
}

// ── Day section ───────────────────────────────────────────────────────────────
function DaySection({ date, items, index }) {
  const [expanded, setExpanded] = useState(index === 0);

  const dayDate   = new Date(date);
  const now       = new Date();
  const daysDiff  = Math.floor((now - dayDate) / 86400000);
  const editable  = daysDiff <= 3;

  const workouts  = items.filter(i => i.category === "workout").length;
  const meals     = items.filter(i => i.category === "diet" || i.category === "meal").length;
  const reminders = items.filter(i => i.category === "reminder").length;
  const insights  = items.filter(i => i.category === "ai_insight").length;

  const dotColor  = editable ? T.warn : A.color;

  const statBadges = [
    workouts  > 0 && { label:`${workouts} workout${workouts !== 1 ? "s" : ""}`,    cat:"workout"    },
    meals     > 0 && { label:`${meals} meal${meals !== 1 ? "s" : ""}`,              cat:"diet"       },
    reminders > 0 && { label:`${reminders} reminder${reminders !== 1 ? "s" : ""}`, cat:"reminder"   },
    insights  > 0 && { label:`${insights} insight${insights !== 1 ? "s" : ""}`,    cat:"ai_insight" },
  ].filter(Boolean);

  return (
    <div style={{ position:"relative", marginBottom:18, paddingLeft:44 }}>
      {/* Timeline dot */}
      <div style={{
        position:"absolute", left:8, top:18,
        width:16, height:16, borderRadius:"50%",
        background:dotColor, border:`3px solid ${T.bg}`,
        boxShadow:`0 0 12px ${dotColor}66`,
        zIndex:1,
      }}/>

      {/* Day card */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          background:T.s2, border:`1px solid ${editable ? T.warn + "33" : T.border}`,
          borderRadius:T.rad, padding:16, cursor:"pointer",
          transition:"border-color .15s",
        }}
      >
        {/* Date + toggle */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 3px" }}>
              {dayDate.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              {editable ? (
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="5" width="10" height="8" rx="2" stroke={T.warn} strokeWidth="1.3"/>
                  <path d="M5 5V3C5 2 5.7 1 7 1C8.3 1 9 2 9 3V5" stroke={T.warn} strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="5" width="10" height="8" rx="2" stroke={T.t3} strokeWidth="1.3"/>
                  <path d="M5 5V3C5 1.5 6 1 7 1C8 1 9 1.5 9 3V5" stroke={T.t3} strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              )}
              <span style={{ fontSize:11, color: editable ? T.warn : T.t3, fontWeight:600 }}>
                {editable ? `Editable · ${3 - daysDiff}d left` : "Immutable"}
              </span>
            </div>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition:"transform .2s", flexShrink:0 }}
          >
            <path d="M2 4.5L7 9.5L12 4.5" stroke={T.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Stat badges */}
        {statBadges.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {statBadges.map((b, i) => {
              const c = getCat(b.cat).color;
              return (
                <div key={i} style={{
                  padding:"3px 9px", borderRadius:6,
                  background:`${c}15`, border:`1px solid ${c}30`,
                  fontSize:10, fontWeight:700, color:c,
                }}>{b.label}</div>
              );
            })}
          </div>
        )}

        {/* Expanded items */}
        {expanded && items.length > 0 && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
            {items.map((item, i) => <TimelineItem key={i} item={item}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div>
      {[1,2,3].map(i => (
        <div key={i} style={{ paddingLeft:44, marginBottom:18, position:"relative" }}>
          <div style={{
            position:"absolute", left:8, top:18, width:16, height:16,
            borderRadius:"50%", background:T.s3, border:`3px solid ${T.bg}`,
          }}/>
          <div style={{ background:T.s2, border:`1px solid ${T.border}`, borderRadius:T.rad, padding:16 }}>
            <Skel w="55%" h={15} r={6} style={{ marginBottom:8 }}/>
            <Skel w="30%" h={10} r={5} style={{ marginBottom:12 }}/>
            <div style={{ display:"flex", gap:6 }}>
              <Skel w={80} h={20} r={6}/><Skel w={70} h={20} r={6}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{
        width:64, height:64, borderRadius:20, background:T.s2,
        border:`1px solid ${T.border}`, display:"flex", alignItems:"center",
        justifyContent:"center", margin:"0 auto 20px",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M3 3V21M3 12H21M8 3V7M8 17V21M16 3V7M16 17V21"
            stroke={T.border2} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize:16, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>No Health Data Yet</p>
      <p style={{ fontSize:13, color:T.t3, margin:0, lineHeight:1.6 }}>
        Your timeline will populate as you log workouts, meals, and track progress.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HealthTimeline() {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadTimeline(); }, []);

  const loadTimeline = async () => {
    try {
      const data = await fetchHealthTimeline();
      setTimeline(Array.isArray(data) ? data : (data.items || []));
    } catch (e) {
      console.error("Failed to load timeline:", e);
    } finally {
      setLoading(false);
    }
  };

  // Group by date
  const groupedByDate = timeline.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
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
              <path d="M3 3V21M3 12H21M8 3V7M8 17V21M16 3V7M16 17V21"
                stroke={A.color} strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:22, fontWeight:900, color:T.t1, margin:0, letterSpacing:"-0.5px" }}>Health Memory</p>
            <p style={{ fontSize:12, color:T.t3, margin:"2px 0 0" }}>
              {loading ? "Loading…" : `${timeline.length} entr${timeline.length !== 1 ? "ies" : "y"}`}
            </p>
          </div>
        </div>

        {/* Lock notice */}
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"14px 16px", borderRadius:14,
          background:`${A.color}0D`, border:`1px solid ${A.color}28`,
          margin:"18px 0 22px",
        }}>
          <div style={{
            width:32, height:32, borderRadius:9, background:A.dim,
            border:`1px solid ${A.color}30`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="5" width="10" height="8" rx="2" stroke={A.color} strokeWidth="1.3"/>
              <path d="M5 5V3C5 1.5 6 1 7 1C8 1 9 1.5 9 3V5" stroke={A.color} strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:T.t1, margin:"0 0 2px" }}>Read-Only Timeline</p>
            <p style={{ fontSize:11, color:T.t3, margin:0 }}>
              Immutable after 3 days · Central AI can edit within 72 hours
            </p>
          </div>
        </div>

        {/* Timeline vertical line */}
        <div style={{ position:"relative" }}>
          {!loading && dates.length > 0 && (
            <div style={{
              position:"absolute", left:15, top:20, bottom:20,
              width:2, background:`linear-gradient(to bottom,${A.color}40,${A.color}10,transparent)`,
            }}/>
          )}

          {loading ? (
            <LoadingSkeleton/>
          ) : dates.length === 0 ? (
            <EmptyState/>
          ) : (
            dates.map((date, i) => (
              <DaySection key={date} date={date} items={groupedByDate[date]} index={i}/>
            ))
          )}
        </div>
      </div>

      <BottomNav/>
      <style>{VAULT_CSS}</style>
    </div>
  );
}
