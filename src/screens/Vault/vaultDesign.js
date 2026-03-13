// ─────────────────────────────────────────────────────────────────────────────
// Central — Vault shared design system
// Import this in every Vault sub-screen to stay consistent
// ─────────────────────────────────────────────────────────────────────────────

export const T = {
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
  red:       "#EF4444",
  redDim:    "rgba(239,68,68,0.12)",
  warn:      "#F97316",
  rad:       18,
};

// Section semantic colours
export const ACCENT = {
  central:  { color: "#A855F7", dim: "rgba(168,85,247,0.12)", glow: "rgba(168,85,247,0.28)" },
  workout:  { color: "#7ADE00", dim: "rgba(122,222,0,0.10)",  glow: "rgba(122,222,0,0.22)"  },
  diet:     { color: "#22C55E", dim: "rgba(34,197,94,0.12)",  glow: "rgba(34,197,94,0.24)"  },
  health:   { color: "#3B82F6", dim: "rgba(59,130,246,0.12)", glow: "rgba(59,130,246,0.28)" },
  collection:{ color: "#F97316", dim: "rgba(249,115,22,0.12)", glow: "rgba(249,115,22,0.24)" },
};

// Shared animation CSS — inject with <style>
export const VAULT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  input::placeholder { color: #6B7280; }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

// ── Shared helper: relative date
export function relDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hrs   < 24) return `${hrs}h ago`;
  if (days  <  7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
