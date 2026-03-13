import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems, fetchCollections } from "../../api/vault";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — Onyx  (#7ADE00 lime)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:        "#0A0A0A",
  s0:        "#0F0F0F",
  s1:        "#111111",
  s2:        "#1A1A1A",
  s3:        "#222222",
  border:    "#1E1E1E",
  border2:   "#2A2A2A",
  t1:        "#FFFFFF",
  t2:        "#9CA3AF",
  t3:        "#6B7280",
  lime:      "#7ADE00",
  limeDim:   "rgba(122,222,0,0.10)",
  limeGlow:  "rgba(122,222,0,0.22)",
  purple:    "#A855F7",
  purpleDim: "rgba(168,85,247,0.12)",
  purpleGlow:"rgba(168,85,247,0.28)",
  blue:      "#3B82F6",
  blueDim:   "rgba(59,130,246,0.12)",
  blueGlow:  "rgba(59,130,246,0.28)",
  diet:      "#22C55E",
  dietDim:   "rgba(34,197,94,0.12)",
  dietGlow:  "rgba(34,197,94,0.24)",
  rad:       18,
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG icons per section — no emojis
// ─────────────────────────────────────────────────────────────────────────────
function IconCentral({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="4" fill={color} opacity=".9"/>
      <path d="M11 2V5M11 17V20M2 11H5M17 11H20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4.9 4.9L7 7M15 15L17.1 17.1M4.9 17.1L7 15M15 7L17.1 4.9" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity=".5"/>
    </svg>
  );
}
function IconWorkout({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M2 11H4M18 11H20M4 8H7V14H4V8ZM15 8H18V14H15V8Z" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 11H15" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconMeal({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M7 2V8C7 9.7 8.3 11 10 11H12C13.7 11 15 9.7 15 8V2" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M11 11V20" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M4 20H18" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M11 2V6" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}
function IconHealthMemory({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M3 6H19M3 11H14M3 16H10" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="17" cy="15.5" r="3.5" stroke={color} strokeWidth="1.5"/>
      <path d="M15.8 15.5H17V14" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconHealthRecords({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="4" y="2" width="14" height="18" rx="3" stroke={color} strokeWidth="1.7"/>
      <path d="M8 8H14M8 12H14M8 16H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 6V10M9 8H13" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke={T.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconLock({ color = T.lime }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="8" width="12" height="9" rx="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M6 8V6C6 4.3 7.3 3 9 3C10.7 3 12 4.3 12 6V8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="12.5" r="1.5" fill={color}/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke={T.t3} strokeWidth="1.4"/>
      <path d="M10.5 10.5L14 14" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer
// ─────────────────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg, ${T.s2} 25%, ${T.s3} 50%, ${T.s2} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }}/>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Source card — the main building block
// ─────────────────────────────────────────────────────────────────────────────
function SourceCard({ icon, title, subtitle, count, accent, dim, glow, locked, comingSoon, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={comingSoon ? undefined : onClick}
      onMouseEnter={() => !comingSoon && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => !comingSoon && setHover(true)}
      onTouchEnd={() => setHover(false)}
      style={{
        position: "relative",
        background: T.s2,
        border: `1px solid ${hover ? accent + "44" : T.border}`,
        borderRadius: T.rad,
        padding: "18px 16px 16px",
        cursor: comingSoon ? "default" : "pointer",
        opacity: comingSoon ? 0.55 : 1,
        transform: hover ? "scale(1.02)" : "scale(1)",
        boxShadow: hover ? `0 0 20px ${glow}` : "none",
        transition: "border-color .15s, transform .15s, box-shadow .15s",
        overflow: "hidden",
        minHeight: 148,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top row: icon + badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        {/* Icon bubble */}
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: dim,
          border: `1px solid ${accent}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>

        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {locked && (
            <div style={{
              padding: "3px 8px", borderRadius: 20,
              background: T.limeDim, border: `1px solid rgba(122,222,0,.2)`,
              fontSize: 9, fontWeight: 800, color: T.lime,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>Locked</div>
          )}
          {comingSoon && (
            <div style={{
              padding: "3px 8px", borderRadius: 20,
              background: T.s3, border: `1px solid ${T.border2}`,
              fontSize: 9, fontWeight: 700, color: T.t3,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>Soon</div>
          )}
        </div>
      </div>

      {/* Title + subtitle */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: T.t1, margin: "0 0 3px", letterSpacing: "-0.2px" }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: T.t3, margin: 0, lineHeight: 1.4 }}>{subtitle}</p>
      </div>

      {/* Bottom: count + arrow */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <div style={{
          padding: "4px 10px", borderRadius: 20,
          background: dim, border: `1px solid ${accent}28`,
          fontSize: 11, fontWeight: 700, color: accent,
        }}>
          {typeof count === "number" ? `${count} item${count !== 1 ? "s" : ""}` : count}
        </div>
        {!comingSoon && <IconChevron/>}
      </div>

      {/* Hover glow edge */}
      {hover && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: T.rad, pointerEvents: "none",
          background: `radial-gradient(ellipse at top left, ${dim} 0%, transparent 70%)`,
        }}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Vault screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Vault() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [counts, setCounts]     = useState({ central: 0, workout: 0, diet: 0, collections: 0 });
  const [search, setSearch]     = useState("");
  const [searchFocus, setFocus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cols] = await Promise.all([
        fetchVaultItems(),
        fetchCollections().catch(() => []),
      ]);
      const items = data || [];
      setCounts({
        central:     items.filter(i => i.source === "central").length,
        workout:     items.filter(i => i.type === "workout").length,
        diet:        items.filter(i => i.type === "diet").length,
        collections: (cols || []).length,
      });
    } catch {
      setCounts({ central: 0, workout: 0, diet: 0, collections: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─ Source section config ─
  const SECTIONS = [
    {
      id:        "central",
      icon:      <IconCentral color={T.purple} size={20}/>,
      title:     "Central Answers",
      subtitle:  "AI-generated responses & insights",
      count:     loading ? "…" : counts.central,
      accent:    T.purple,
      dim:       T.purpleDim,
      glow:      T.purpleGlow,
      route:     "/vault/central",
    },
    {
      id:        "workout",
      icon:      <IconWorkout color={T.lime} size={20}/>,
      title:     "Workout Plans",
      subtitle:  "Programs from the workout builder",
      count:     loading ? "…" : counts.workout,
      accent:    T.lime,
      dim:       T.limeDim,
      glow:      T.limeGlow,
      route:     "/vault/workouts",
    },
    {
      id:        "diet",
      icon:      <IconMeal color={T.diet} size={20}/>,
      title:     "Meal Plans",
      subtitle:  "Diet plans & nutrition logs",
      count:     loading ? "…" : counts.diet,
      accent:    T.diet,
      dim:       T.dietDim,
      glow:      T.dietGlow,
      route:     "/vault/diets",
    },
    {
      id:        "health-memory",
      icon:      <IconHealthMemory color={T.blue} size={20}/>,
      title:     "Health Memory",
      subtitle:  "Immutable health timeline",
      count:     "∞",
      accent:    T.blue,
      dim:       T.blueDim,
      glow:      T.blueGlow,
      locked:    true,
      route:     "/vault/health-timeline",
    },
    {
      id:        "health-records",
      icon:      <IconHealthRecords color={T.blue} size={20}/>,
      title:     "Health Records",
      subtitle:  "Medical docs, labs & prescriptions",
      count:     0,
      accent:    T.blue,
      dim:       T.blueDim,
      glow:      T.blueGlow,
      comingSoon: true,
      route:     "/vault/health-records",
    },
  ];

  // Collections section (shown below the grid)
  const collectionsCard = {
    id:       "collections",
    icon: (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" stroke="#F97316" strokeWidth="1.6"/>
        <rect x="12" y="3" width="7" height="7" rx="2" stroke="#F97316" strokeWidth="1.6"/>
        <rect x="3" y="12" width="7" height="7" rx="2" stroke="#F97316" strokeWidth="1.6"/>
        <rect x="12" y="12" width="7" height="7" rx="2" stroke="#F97316" strokeWidth="1.6"/>
      </svg>
    ),
    title:    "Collections",
    subtitle: "Custom curated groups of vault items",
    count:    loading ? "…" : counts.collections,
    accent:   "#F97316",
    dim:      "rgba(249,115,22,0.12)",
    glow:     "rgba(249,115,22,0.24)",
    route:    "/vault/collections",
  };

  // Filter sections by search
  const filtered = SECTIONS.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.t1,
      paddingBottom: 90,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "56px 22px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, color: T.t1, letterSpacing: "-0.6px", margin: 0 }}>Vault</p>
            <p style={{ fontSize: 13, color: T.t3, marginTop: 3, marginBottom: 0 }}>
              Your personal fitness library
            </p>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: T.s2, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconLock/>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", margin: "16px 0 20px" }}>
          <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
            <IconSearch/>
          </div>
          <input
            type="text"
            placeholder="Search vault…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            style={{
              width: "100%",
              padding: "13px 14px 13px 36px",
              background: T.s2,
              border: `1px solid ${searchFocus ? T.lime : T.border}`,
              borderRadius: 14,
              fontSize: 14, color: T.t1,
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              boxShadow: searchFocus ? `0 0 0 3px ${T.limeDim}` : "none",
              transition: "border-color .15s, box-shadow .15s",
            }}
          />
        </div>
      </div>

      {/* ── Source grid ── */}
      <div style={{ padding: "0 22px" }}>

        {loading ? (
          // Skeleton grid
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                background: T.s2, border: `1px solid ${T.border}`,
                borderRadius: T.rad, padding: "18px 16px", minHeight: 148,
              }}>
                <Skel w={40} h={40} r={12} style={{ marginBottom: 14 }}/>
                <Skel w="70%" h={14} r={6} style={{ marginBottom: 8 }}/>
                <Skel w="90%" h={10} r={5} style={{ marginBottom: 20 }}/>
                <Skel w="50%" h={24} r={12}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map(s => (
              <SourceCard
                key={s.id}
                icon={s.icon}
                title={s.title}
                subtitle={s.subtitle}
                count={s.count}
                accent={s.accent}
                dim={s.dim}
                glow={s.glow}
                locked={s.locked}
                comingSoon={s.comingSoon}
                onClick={() => navigate(s.route)}
              />
            ))}
          </div>
        )}

        {/* ── Collections section ── */}
        {!loading && (
          <>
            <p style={{ fontSize:11, color:T.t3, fontWeight:700, letterSpacing:"0.5px", margin:"22px 0 10px" }}>
              COLLECTIONS
            </p>
            <SourceCard
              icon={collectionsCard.icon}
              title={collectionsCard.title}
              subtitle={collectionsCard.subtitle}
              count={collectionsCard.count}
              accent={collectionsCard.accent}
              dim={collectionsCard.dim}
              glow={collectionsCard.glow}
              onClick={() => navigate(collectionsCard.route)}
            />
          </>
        )}

        {/* ── Divider ── */}
        <div style={{ height: 1, background: T.border, margin: "24px 0 20px" }}/>

        {/* ── Storage note (subtle) ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: T.s1, border: `1px solid ${T.border}`,
          borderRadius: 14, marginBottom: 8,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: "0 0 2px" }}>
              Auto backup enabled
            </p>
            <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>
              Your data syncs every time you log
            </p>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 20,
            background: T.limeDim, border: `1px solid rgba(122,222,0,.2)`,
            fontSize: 11, fontWeight: 700, color: T.lime,
          }}>On</div>
        </div>

      </div>

      <BottomNav/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        input::placeholder { color: ${T.t3}; }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
