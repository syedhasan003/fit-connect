/**
 * Profile/index.jsx
 * ─────────────────
 * Onyx Design System — Profile screen
 *
 * Accent: amber #F59E0B — the "you" color; distinct from every other screen.
 *
 * Sections:
 *   1. Hero     — avatar orb (initials), name, email, member since
 *   2. Stats    — streak / weekly adherence / current weight
 *   3. Active programs — workout + diet plan side-by-side
 *   4. Settings groups — Account / App / Danger Zone
 *   5. BottomNav
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getCurrentUser } from "../../api/user";
import { getWeekAdherence, getWeightHistory } from "../../api/health";
import { T, VAULT_CSS } from "../Vault/vaultDesign";
import BottomNav from "../../components/navigation/BottomNav";

// ── Amber accent ──────────────────────────────────────────────────────────────
const A = {
  color: "#F59E0B",
  dim:   "rgba(245,158,11,0.10)",
  glow:  "rgba(245,158,11,0.20)",
};

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Ico = {
  user: (c = T.t2) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  gym: (c = T.t2) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4"/>
    </svg>
  ),
  bell: (c = T.t2) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  units: (c = T.t2) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  info: (c = T.t2) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  logout: (c = T.red) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  chevron: (c = T.t3) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  dumbbell: (c = T.lime) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4"/>
    </svg>
  ),
  leaf: (c = T.diet) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  ),
  flame: (c = "#F97316") => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  check: (c = T.lime) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  scale: (c = T.blue) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>
    </svg>
  ),
  calendar: (c = T.t3) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// ── Skeleton shimmer ───────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: `linear-gradient(90deg, ${T.s2} 25%, ${T.s3} 50%, ${T.s2} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Setting row ────────────────────────────────────────────────────────────────
function SettingRow({ icon, label, value, danger, onClick, isLast }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 13,
        padding: "13px 16px",
        borderBottom: isLast ? "none" : `1px solid ${T.border}`,
        cursor: onClick ? "pointer" : "default",
        background: hov && onClick ? T.s2 : "transparent",
        transition: "background 0.15s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: danger ? T.red : T.t1 }}>
        {label}
      </span>
      {value && <span style={{ fontSize: 13, color: T.t3, marginRight: 4 }}>{value}</span>}
      {onClick && !danger && Ico.chevron()}
    </div>
  );
}

// ── Settings group card ────────────────────────────────────────────────────────
function SettingGroup({ title, rows }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{
        margin: "0 0 8px 4px",
        fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
        color: T.t3, textTransform: "uppercase",
      }}>
        {title}
      </p>
      <div style={{
        background: T.s1, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        {rows.map((row, i) => (
          <SettingRow key={row.label} {...row} isLast={i === rows.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ── Active program card ────────────────────────────────────────────────────────
function ProgramCard({ typeLabel, name, icon, accent, dim, onClick }) {
  const [hov, setHov] = useState(false);
  const isEmpty = !name;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: "13px 14px 12px",
        background: hov ? dim : T.s1,
        border: `1px solid ${hov ? accent + "44" : T.border}`,
        borderRadius: 16, cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 7,
          background: dim, border: `1px solid ${accent}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: "0.08em" }}>
          {typeLabel}
        </span>
      </div>
      <p style={{
        margin: 0, fontSize: 13, fontWeight: isEmpty ? 400 : 600,
        color: isEmpty ? T.t3 : T.t1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {name || "None set"}
      </p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user,      setUser]      = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [weight,    setWeight]    = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getCurrentUser(),
      getWeekAdherence(),
      getWeightHistory(1),
    ]).then(([u, adh, wh]) => {
      if (u.status   === "fulfilled") setUser(u.value);
      if (adh.status === "fulfilled") setAdherence(adh.value);
      if (wh.status  === "fulfilled") {
        const latest = Array.isArray(wh.value) ? wh.value[0] : null;
        if (latest) setWeight(latest.weight_kg ?? latest.value ?? null);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const rawName  = user?.full_name || user?.username || user?.email?.split("@")[0] || "You";
  const initials = rawName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const email    = user?.email || "";

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : null;

  const streak = user?.current_streak ?? user?.streak ?? 0;

  const adherencePct =
    adherence?.percentage     != null ? `${Math.round(adherence.percentage)}%`     :
    adherence?.adherence_pct  != null ? `${Math.round(adherence.adherence_pct)}%`  :
    adherence?.pct            != null ? `${Math.round(adherence.pct)}%`             : "—";

  const weightDisplay = weight != null ? `${weight} kg` : "—";

  const activeWorkout = user?.active_workout_name || null;
  const activeDiet    = user?.active_diet_name    || null;

  // ── Settings definition ─────────────────────────────────────────────────────
  const settingsGroups = [
    {
      title: "Account",
      rows: [
        {
          icon:    Ico.user(),
          label:   "Edit Profile",
          onClick: () => {},           // shell — wire up later
        },
        {
          icon:    Ico.gym(),
          label:   "My Gym",
          value:   user?.gym_name || undefined,
          onClick: () => navigate("/discover"),
        },
        {
          icon:    Ico.bell(),
          label:   "Notifications",
          onClick: () => {},           // shell
        },
      ],
    },
    {
      title: "App",
      rows: [
        {
          icon:    Ico.units(),
          label:   "Units",
          value:   "kg · km",
          onClick: () => {},           // shell
        },
        {
          icon:    Ico.info(),
          label:   "About Central",
          onClick: () => {},           // shell
        },
      ],
    },
    {
      title: "Danger Zone",
      rows: [
        {
          icon:    Ico.logout(),
          label:   "Sign Out",
          danger:  true,
          onClick: () => { logout(); navigate("/login"); },
        },
      ],
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", paddingBottom: 88,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{VAULT_CSS + `
        @keyframes amberPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(245,158,11,0.14); }
          50%       { box-shadow: 0 0 0 7px rgba(245,158,11,0.08); }
        }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 52, paddingBottom: 30,
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: A.dim,
            border: `2px solid ${A.color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            fontSize: 22, fontWeight: 800, color: A.color, letterSpacing: "0.02em",
            animation: loading ? "none" : "amberPulse 3s ease-in-out infinite",
            transition: "all 0.3s",
          }}>
            {loading ? "" : initials}
          </div>

          {/* Name */}
          {loading
            ? <Skel w={140} h={20} r={8} />
            : <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.t1, letterSpacing: "-0.02em" }}>
                {rawName}
              </h1>
          }

          {/* Email */}
          <div style={{ marginTop: 5 }}>
            {loading
              ? <Skel w={190} h={14} r={6} />
              : <p style={{ margin: 0, fontSize: 13, color: T.t3 }}>{email}</p>
            }
          </div>

          {/* Member since */}
          {!loading && memberSince && (
            <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 5 }}>
              {Ico.calendar()}
              <span style={{ fontSize: 12, color: T.t3 }}>Member since {memberSince}</span>
            </div>
          )}
        </div>

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1, background: T.border,
          border: `1px solid ${T.border}`,
          borderRadius: 16, overflow: "hidden",
          marginBottom: 28,
        }}>
          {[
            { icon: Ico.flame(),  label: "Streak",    value: loading ? null : `${streak}d`      },
            { icon: Ico.check(),  label: "Adherence", value: loading ? null : adherencePct      },
            { icon: Ico.scale(),  label: "Weight",    value: loading ? null : weightDisplay     },
          ].map((stat, i) => (
            <div key={i} style={{
              background: T.s1,
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "15px 8px", gap: 5,
            }}>
              {stat.value === null
                ? <Skel w={44} h={20} r={6} />
                : <span style={{ fontSize: 18, fontWeight: 800, color: T.t1 }}>{stat.value}</span>
              }
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {stat.icon}
                <span style={{ fontSize: 11, color: T.t3, fontWeight: 500 }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active programs ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            margin: "0 0 8px 4px",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            color: T.t3, textTransform: "uppercase",
          }}>
            Active Programs
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <ProgramCard
              typeLabel="WORKOUT"
              name={loading ? undefined : activeWorkout}
              icon={Ico.dumbbell()}
              accent={T.lime}
              dim={T.limeDim}
              onClick={() => navigate("/vault")}
            />
            <ProgramCard
              typeLabel="DIET"
              name={loading ? undefined : activeDiet}
              icon={Ico.leaf()}
              accent={T.diet}
              dim={T.dietDim}
              onClick={() => navigate("/vault")}
            />
          </div>
        </div>

        {/* ── Settings groups ───────────────────────────────────────────────── */}
        {settingsGroups.map(group => (
          <SettingGroup key={group.title} {...group} />
        ))}

        {/* ── Footer version tag ────────────────────────────────────────────── */}
        <p style={{
          textAlign: "center", fontSize: 11, color: T.t3,
          margin: "4px 0 20px", letterSpacing: "0.04em",
        }}>
          Central v1.0 · Bengaluru-first fitness
        </p>

      </div>

      <BottomNav />
    </div>
  );
}
