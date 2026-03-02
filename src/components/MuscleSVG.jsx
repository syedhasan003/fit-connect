/**
 * MuscleSVG
 * ─────────
 * Shows a stylised front + back body diagram.
 * Highlights primary muscles (orange) and secondary muscles (yellow).
 *
 * Props:
 *   primaryMuscles   – string[]  e.g. ["Chest", "Triceps"]
 *   secondaryMuscles – string[]  e.g. ["Shoulders"]
 *   size             – number    width of EACH panel in px (default 140)
 */

const C = {
  bg:        "transparent",
  body:      "#2a2a34",       // inactive muscle fill
  outline:   "#3f3f52",       // body silhouette stroke
  primary:   "#f97316",       // orange  – primary muscles
  secondary: "#fbbf24",       // amber   – secondary muscles
  text:      "#6b7280",
};

// ── Muscle → normalised key map ───────────────────────────────────────────────
// Keys match the shape IDs below; values are all aliases that backends / seed data use.
const ALIASES = {
  chest:      ["chest", "pectorals", "pecs"],
  frontdelt:  ["front delts", "anterior deltoid", "front deltoid"],
  shoulder:   ["shoulders", "deltoids", "deltoid", "medial deltoid", "lateral deltoid"],
  reardelt:   ["rear delts", "posterior deltoid", "rear deltoid"],
  bicep:      ["biceps", "bicep", "brachialis"],
  tricep:     ["triceps", "tricep"],
  forearm:    ["forearms", "forearm", "wrist flexors"],
  trap:       ["traps", "trapezius", "upper trapezius"],
  lat:        ["lats", "latissimus dorsi", "latissimus"],
  midback:    ["middle back", "rhomboids", "rhomboid", "mid back"],
  lowerback:  ["lower back", "erector spinae", "spinal erectors", "erectors"],
  abs:        ["abs", "abdominals", "core", "rectus abdominis"],
  oblique:    ["obliques", "oblique"],
  glute:      ["glutes", "gluteus maximus", "gluteus medius", "gluteus"],
  quad:       ["quadriceps", "quads", "quad"],
  hamstring:  ["hamstrings", "hamstring"],
  calf:       ["calves", "calf", "gastrocnemius", "soleus"],
  adductor:   ["adductors", "inner thigh", "groin"],
  abductor:   ["abductors", "outer thigh"],
};

function resolveMuscles(list = []) {
  const keys = new Set();
  const lower = list.map((m) => m.toLowerCase());
  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (lower.some((m) => aliases.includes(m))) keys.add(key);
  }
  return keys;
}

function muscleColor(id, primary, secondary) {
  if (primary.has(id))   return C.primary;
  if (secondary.has(id)) return C.secondary;
  return C.body;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
function Ell({ id, cx, cy, rx, ry, primary, secondary, transform }) {
  return (
    <ellipse
      cx={cx} cy={cy} rx={rx} ry={ry}
      fill={muscleColor(id, primary, secondary)}
      stroke={C.outline} strokeWidth="0.5"
      transform={transform}
    />
  );
}

function Rect({ id, x, y, w, h, rx: rr = 2, primary, secondary }) {
  return (
    <rect
      x={x} y={y} width={w} height={h} rx={rr}
      fill={muscleColor(id, primary, secondary)}
      stroke={C.outline} strokeWidth="0.5"
    />
  );
}

// ── Front-view panel (viewBox 0 0 100 240) ───────────────────────────────────
function FrontBody({ primary, secondary }) {
  return (
    <svg viewBox="0 0 100 240" style={{ overflow: "visible" }}>
      {/* ── Body silhouette outline ── */}
      <g stroke={C.outline} strokeWidth="1" fill="none">
        {/* Head */}
        <ellipse cx="50" cy="15" rx="11" ry="13" fill="#222228" />
        {/* Torso */}
        <path d="M30 38 Q28 70 28 110 Q28 125 38 130 Q50 135 62 130 Q72 125 72 110 Q72 70 70 38 Z"
              fill="#222228" />
        {/* Left upper arm */}
        <path d="M30 42 Q18 50 16 80 Q18 85 24 84 Q26 85 28 80 Q28 60 32 44 Z"
              fill="#222228" />
        {/* Right upper arm */}
        <path d="M70 42 Q82 50 84 80 Q82 85 76 84 Q74 85 72 80 Q72 60 68 44 Z"
              fill="#222228" />
        {/* Left forearm */}
        <path d="M16 80 Q12 105 14 118 Q18 122 22 120 Q24 118 24 115 Q24 104 24 84 Z"
              fill="#222228" />
        {/* Right forearm */}
        <path d="M84 80 Q88 105 86 118 Q82 122 78 120 Q76 118 76 115 Q76 104 76 84 Z"
              fill="#222228" />
        {/* Left leg */}
        <path d="M38 130 Q34 160 33 185 Q34 195 40 195 Q46 195 46 185 Q46 160 44 130 Z"
              fill="#222228" />
        {/* Right leg */}
        <path d="M62 130 Q66 160 67 185 Q66 195 60 195 Q54 195 54 185 Q54 160 56 130 Z"
              fill="#222228" />
        {/* Left calf */}
        <path d="M33 185 Q31 205 33 218 Q36 222 40 221 Q44 222 44 218 Q44 205 46 185 Z"
              fill="#222228" />
        {/* Right calf */}
        <path d="M67 185 Q69 205 67 218 Q64 222 60 221 Q56 222 56 218 Q56 205 54 185 Z"
              fill="#222228" />
      </g>

      {/* ── Neck ── */}
      <Ell id="trap" cx="50" cy="33" rx="7" ry="5" primary={primary} secondary={secondary} />

      {/* ── Chest (two halves) ── */}
      <Ell id="chest" cx="41" cy="68" rx="10" ry="12" primary={primary} secondary={secondary} />
      <Ell id="chest" cx="59" cy="68" rx="10" ry="12" primary={primary} secondary={secondary} />

      {/* ── Front delts ── */}
      <Ell id="frontdelt" cx="30" cy="52" rx="7" ry="9" primary={primary} secondary={secondary} />
      <Ell id="frontdelt" cx="70" cy="52" rx="7" ry="9" primary={primary} secondary={secondary} />

      {/* ── Shoulder (medial) small cap ── */}
      <Ell id="shoulder" cx="30" cy="44" rx="6" ry="5" primary={primary} secondary={secondary} />
      <Ell id="shoulder" cx="70" cy="44" rx="6" ry="5" primary={primary} secondary={secondary} />

      {/* ── Biceps ── */}
      <Ell id="bicep" cx="20" cy="72" rx="5" ry="9" primary={primary} secondary={secondary} />
      <Ell id="bicep" cx="80" cy="72" rx="5" ry="9" primary={primary} secondary={secondary} />

      {/* ── Forearms ── */}
      <Ell id="forearm" cx="17" cy="97" rx="4" ry="10" primary={primary} secondary={secondary} />
      <Ell id="forearm" cx="83" cy="97" rx="4" ry="10" primary={primary} secondary={secondary} />

      {/* ── Abs (3 pairs) ── */}
      <Rect id="abs" x="44" y="84" w="5" h="7" rr="2" primary={primary} secondary={secondary} />
      <Rect id="abs" x="51" y="84" w="5" h="7" rr="2" primary={primary} secondary={secondary} />
      <Rect id="abs" x="44" y="94" w="5" h="7" rr="2" primary={primary} secondary={secondary} />
      <Rect id="abs" x="51" y="94" w="5" h="7" rr="2" primary={primary} secondary={secondary} />
      <Rect id="abs" x="44" y="104" w="5" h="6" rr="2" primary={primary} secondary={secondary} />
      <Rect id="abs" x="51" y="104" w="5" h="6" rr="2" primary={primary} secondary={secondary} />

      {/* ── Obliques ── */}
      <Ell id="oblique" cx="37" cy="100" rx="5" ry="12" primary={primary} secondary={secondary} />
      <Ell id="oblique" cx="63" cy="100" rx="5" ry="12" primary={primary} secondary={secondary} />

      {/* ── Adductors ── */}
      <Ell id="adductor" cx="43" cy="148" rx="4" ry="10" primary={primary} secondary={secondary} />
      <Ell id="adductor" cx="57" cy="148" rx="4" ry="10" primary={primary} secondary={secondary} />

      {/* ── Quads ── */}
      <Ell id="quad" cx="38" cy="163" rx="8" ry="20" primary={primary} secondary={secondary} />
      <Ell id="quad" cx="62" cy="163" rx="8" ry="20" primary={primary} secondary={secondary} />

      {/* ── Calves (front visible) ── */}
      <Ell id="calf" cx="38" cy="204" rx="6" ry="12" primary={primary} secondary={secondary} />
      <Ell id="calf" cx="62" cy="204" rx="6" ry="12" primary={primary} secondary={secondary} />

      {/* ── Label ── */}
      <text x="50" y="235" textAnchor="middle" fontSize="7" fill={C.text} fontFamily="sans-serif">Front</text>
    </svg>
  );
}

// ── Back-view panel (viewBox 0 0 100 240) ────────────────────────────────────
function BackBody({ primary, secondary }) {
  return (
    <svg viewBox="0 0 100 240" style={{ overflow: "visible" }}>
      {/* ── Body silhouette outline ── */}
      <g stroke={C.outline} strokeWidth="1" fill="none">
        <ellipse cx="50" cy="15" rx="11" ry="13" fill="#222228" />
        <path d="M30 38 Q28 70 28 110 Q28 125 38 130 Q50 135 62 130 Q72 125 72 110 Q72 70 70 38 Z"
              fill="#222228" />
        <path d="M30 42 Q18 50 16 80 Q18 85 24 84 Q26 85 28 80 Q28 60 32 44 Z" fill="#222228" />
        <path d="M70 42 Q82 50 84 80 Q82 85 76 84 Q74 85 72 80 Q72 60 68 44 Z" fill="#222228" />
        <path d="M16 80 Q12 105 14 118 Q18 122 22 120 Q24 118 24 115 Q24 104 24 84 Z" fill="#222228" />
        <path d="M84 80 Q88 105 86 118 Q82 122 78 120 Q76 118 76 115 Q76 104 76 84 Z" fill="#222228" />
        <path d="M38 130 Q34 160 33 185 Q34 195 40 195 Q46 195 46 185 Q46 160 44 130 Z" fill="#222228" />
        <path d="M62 130 Q66 160 67 185 Q66 195 60 195 Q54 195 54 185 Q54 160 56 130 Z" fill="#222228" />
        <path d="M33 185 Q31 205 33 218 Q36 222 40 221 Q44 222 44 218 Q44 205 46 185 Z" fill="#222228" />
        <path d="M67 185 Q69 205 67 218 Q64 222 60 221 Q56 222 56 218 Q56 205 54 185 Z" fill="#222228" />
      </g>

      {/* ── Traps ── */}
      <Ell id="trap" cx="50" cy="47" rx="16" ry="8" primary={primary} secondary={secondary} />

      {/* ── Rear delts ── */}
      <Ell id="reardelt" cx="31" cy="48" rx="7" ry="8" primary={primary} secondary={secondary} />
      <Ell id="reardelt" cx="69" cy="48" rx="7" ry="8" primary={primary} secondary={secondary} />

      {/* ── Shoulder (overall) ── */}
      <Ell id="shoulder" cx="30" cy="44" rx="6" ry="5" primary={primary} secondary={secondary} />
      <Ell id="shoulder" cx="70" cy="44" rx="6" ry="5" primary={primary} secondary={secondary} />

      {/* ── Lats ── */}
      <Ell id="lat" cx="35" cy="82" rx="8" ry="20" primary={primary} secondary={secondary} />
      <Ell id="lat" cx="65" cy="82" rx="8" ry="20" primary={primary} secondary={secondary} />

      {/* ── Mid back / Rhomboids ── */}
      <Ell id="midback" cx="50" cy="67" rx="9" ry="8" primary={primary} secondary={secondary} />

      {/* ── Lower back / Erectors ── */}
      <Rect id="lowerback" x="43" y="100" w="6" h="22" rr="3" primary={primary} secondary={secondary} />
      <Rect id="lowerback" x="51" y="100" w="6" h="22" rr="3" primary={primary} secondary={secondary} />

      {/* ── Triceps ── */}
      <Ell id="tricep" cx="20" cy="68" rx="5" ry="11" primary={primary} secondary={secondary} />
      <Ell id="tricep" cx="80" cy="68" rx="5" ry="11" primary={primary} secondary={secondary} />

      {/* ── Forearms ── */}
      <Ell id="forearm" cx="17" cy="97" rx="4" ry="10" primary={primary} secondary={secondary} />
      <Ell id="forearm" cx="83" cy="97" rx="4" ry="10" primary={primary} secondary={secondary} />

      {/* ── Glutes ── */}
      <Ell id="glute" cx="40" cy="133" rx="10" ry="10" primary={primary} secondary={secondary} />
      <Ell id="glute" cx="60" cy="133" rx="10" ry="10" primary={primary} secondary={secondary} />

      {/* ── Hamstrings ── */}
      <Ell id="hamstring" cx="38" cy="162" rx="8" ry="20" primary={primary} secondary={secondary} />
      <Ell id="hamstring" cx="62" cy="162" rx="8" ry="20" primary={primary} secondary={secondary} />

      {/* ── Calves ── */}
      <Ell id="calf" cx="38" cy="204" rx="6" ry="13" primary={primary} secondary={secondary} />
      <Ell id="calf" cx="62" cy="204" rx="6" ry="13" primary={primary} secondary={secondary} />

      {/* ── Abductors ── */}
      <Ell id="abductor" cx="30" cy="145" rx="4" ry="8" primary={primary} secondary={secondary} />
      <Ell id="abductor" cx="70" cy="145" rx="4" ry="8" primary={primary} secondary={secondary} />

      {/* ── Label ── */}
      <text x="50" y="235" textAnchor="middle" fontSize="7" fill={C.text} fontFamily="sans-serif">Back</text>
    </svg>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ hasPrimary, hasSecondary }) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6, flexWrap: "wrap" }}>
      {hasPrimary && (
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ca3af" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.primary, display: "inline-block" }} />
          Primary
        </span>
      )}
      {hasSecondary && (
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ca3af" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.secondary, display: "inline-block" }} />
          Secondary
        </span>
      )}
      {!hasPrimary && !hasSecondary && (
        <span style={{ fontSize: 11, color: "#4b5563" }}>No muscle data</span>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MuscleSVG({ primaryMuscles = [], secondaryMuscles = [], size = 140 }) {
  const primary   = resolveMuscles(primaryMuscles);
  const secondary = resolveMuscles(secondaryMuscles);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <div style={{ width: size }}>
          <FrontBody primary={primary} secondary={secondary} />
        </div>
        <div style={{ width: size }}>
          <BackBody primary={primary} secondary={secondary} />
        </div>
      </div>
      <Legend hasPrimary={primary.size > 0} hasSecondary={secondary.size > 0} />
    </div>
  );
}
