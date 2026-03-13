/**
 * CentralMascot.jsx — Chip
 * ──────────────────────────────────────────────────────────────────────────────
 * Reusable animated SVG mascot for the Central agent.
 *
 * Props:
 *   size     {number}  Height in px (width auto-scales from 200:272 viewBox)
 *   state    {string}  "idle" | "flash" | "offline" | "thinking"
 *   animate  {bool}    Toggle all animations on/off (default true)
 *   walking  {bool}    Activates full walk cycle — leg/arm swing + walk bob
 *
 * Walk cycle geometry (viewBox 0 0 200 272):
 *   Left  leg  hip pivot : (79.5,  217)   Right leg  hip pivot : (120.5, 217)
 *   Left  arm  shoulder  : (41.5,  168)   Right arm  shoulder  : (144,   162)
 *
 * Walk rule:  left-leg-forward ↔ right-arm-forward  (standard counter-swing)
 */

import { useId, useEffect } from "react";

// ── Keyframes (injected once) ─────────────────────────────────────────────────
const CHIP_CSS = `
/* ─── idle ─────────────────────────────────────────────────────── */
@keyframes chipBob      { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-8px)} }
@keyframes chipRingP    { 0%,100%{opacity:.15}               50%{opacity:.35}  }
@keyframes chipAntPulse { 0%,100%{opacity:.88;transform:scale(1)} 50%{opacity:1;transform:scale(1.22)} }
@keyframes chipWave     { 0%,100%{transform:rotate(-6deg)}   50%{transform:rotate(14deg)} }
@keyframes chipBlink    { 0%,88%,94%,100%{transform:scaleY(1)} 90%,92%{transform:scaleY(0.06)} }
@keyframes chipDrift1   { 0%,100%{opacity:.5;transform:translate(0,0)}  50%{opacity:.8;transform:translate(-3px,-6px)} }
@keyframes chipDrift2   { 0%,100%{opacity:.6;transform:translate(0,0)}  50%{opacity:.9;transform:translate(4px,-5px)}  }

/* ─── state overlays ────────────────────────────────────────────── */
@keyframes chipFlash {
  0%   { filter: brightness(3)    drop-shadow(0 0 14px #fff); }
  45%  { filter: brightness(1.8)  drop-shadow(0 0 10px #A855F7); }
  100% { filter: brightness(1)    drop-shadow(0 0 0px  transparent); }
}
@keyframes chipThink {
  0%,100% { filter: brightness(1)    drop-shadow(0 0 4px  rgba(168,85,247,0.25)); }
  50%     { filter: brightness(1.35) drop-shadow(0 0 12px rgba(168,85,247,0.75)); }
}

/* ─── walk cycle  (0.58 s = 1 full gait) ────────────────────────── */
/*  Double-hump bob: rises at each heel-strike (25 % & 75 %), dips between */
@keyframes chipWalkBob {
  0%,100% { transform: translateY(0);    }
  25%,75% { transform: translateY(-5px); }
  50%     { transform: translateY(2px);  }
}

/* Left  leg  — pivot (79.5, 217)  forward=+CW, back=−CCW */
@keyframes chipWalkLegL {
  0%,100% { transform: rotate(0deg);   }
  25%     { transform: rotate(30deg);  }
  50%     { transform: rotate(0deg);   }
  75%     { transform: rotate(-24deg); }
}

/* Right leg  — pivot (120.5, 217) opposite phase */
@keyframes chipWalkLegR {
  0%,100% { transform: rotate(0deg);   }
  25%     { transform: rotate(-24deg); }
  50%     { transform: rotate(0deg);   }
  75%     { transform: rotate(30deg);  }
}

/* Left arm  — pivot (41.5, 168)  counter-swing to left leg */
@keyframes chipWalkArmL {
  0%,100% { transform: rotate(0deg);   }
  25%     { transform: rotate(-22deg); }
  50%     { transform: rotate(0deg);   }
  75%     { transform: rotate(20deg);  }
}

/* Right arm — pivot (144, 162)   counter-swing to right leg */
@keyframes chipWalkArmR {
  0%,100% { transform: rotate(0deg);  }
  25%     { transform: rotate(16deg); }
  50%     { transform: rotate(0deg);  }
  75%     { transform: rotate(-13deg);}
}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CentralMascot({
  size    = 64,
  state   = "idle",
  animate = true,
  walking = false,
}) {
  const uid = useId().replace(/:/g, "_");

  useEffect(() => {
    if (document.getElementById("central-mascot-styles")) return;
    const tag = document.createElement("style");
    tag.id = "central-mascot-styles";
    tag.textContent = CHIP_CSS;
    document.head.appendChild(tag);
  }, []);

  // ── Derived flags ──────────────────────────────────────────────────────────
  const offline  = state === "offline";
  const flashing = state === "flash";
  const thinking = state === "thinking";
  const animOn   = animate && !offline;
  const doWalk   = animOn && walking;

  // ── Colour palette ─────────────────────────────────────────────────────────
  const C = offline
    ? {
        purple:     "#4b5563", purpleDark: "#1f2937", purpleDarker: "#111827",
        bodyG0:     "#1a1a1a", bodyG1:     "#0a0a0a",
        eyeOuter:   "#374151",
        lime:       "#6b7280", limeLight:  "#9ca3af",
        blushOp:    0,
      }
    : {
        purple:     "#A855F7", purpleDark: "#1C0A36", purpleDarker: "#100523",
        bodyG0:     "#2C1158", bodyG1:     "#100523",
        eyeOuter:   "#5B21B6",
        lime:       "#7ADE00", limeLight:  "#E0FF80",
        blushOp:    0.19,
      };

  // ── SVG-level filter / animation ───────────────────────────────────────────
  const svgAnim = animate
    ? flashing ? "chipFlash 1.4s ease-out forwards"
      : thinking ? "chipThink 2s ease-in-out infinite"
      : "none"
    : "none";

  const svgFilter = offline && animate ? "grayscale(0.5) brightness(0.6)" : undefined;

  // Wrapper bob — fast double-hump when walking, slow sine when idle
  const wrapperAnim = animOn
    ? doWalk
      ? "chipWalkBob 0.58s ease-in-out infinite"
      : "chipBob 3.9s ease-in-out infinite"
    : "none";

  // Walk cycle animation shorthand helper
  const WALK_DUR = "0.58s ease-in-out infinite";

  const width = Math.round(size * (200 / 272));

  // ── Shared inline style builders ──────────────────────────────────────────
  const legStyle = (side) => doWalk
    ? {
        animation:       side === "L" ? `chipWalkLegL ${WALK_DUR}` : `chipWalkLegR ${WALK_DUR}`,
        transformBox:    "view-box",
        transformOrigin: side === "L" ? "79.5px 217px" : "120.5px 217px",
      }
    : {};

  // Left arm: only shown walking (otherwise static)
  const armLStyle = doWalk
    ? {
        animation:       `chipWalkArmL ${WALK_DUR}`,
        transformBox:    "view-box",
        transformOrigin: "41.5px 168px",
      }
    : {};

  // Right arm: wave when idle, walk-swing when walking
  const armRStyle = animOn
    ? doWalk
      ? {
          animation:       `chipWalkArmR ${WALK_DUR}`,
          transformBox:    "view-box",
          transformOrigin: "144px 162px",
        }
      : {
          animation:       "chipWave 1.5s ease-in-out infinite",
          transformBox:    "view-box",
          transformOrigin: "144px 162px",
        }
    : {};

  return (
    <div style={{
      display:        "inline-flex",
      alignItems:     "center",
      justifyContent: "center",
      animation:      wrapperAnim,
      opacity:        offline ? 0.5 : 1,
      transition:     "opacity 0.4s",
      flexShrink:     0,
    }}>
      <svg
        viewBox="0 0 200 272"
        width={width}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible", animation: svgAnim, filter: svgFilter }}
      >
        <defs>
          <radialGradient id={`cGrad_${uid}`} cx="33%" cy="27%" r="73%">
            <stop offset="0%"   stopColor={C.bodyG0}/>
            <stop offset="100%" stopColor={C.bodyG1}/>
          </radialGradient>
          <radialGradient id={`cEye_${uid}`} cx="43%" cy="36%" r="58%">
            <stop offset="0%"   stopColor="#ffffff"/>
            <stop offset="30%"  stopColor="#EDE9FE"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </radialGradient>
          <filter id={`cSoft_${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
          </filter>
        </defs>

        {/* Ground shadow — shrinks/grows with walk bob */}
        <ellipse cx="100" cy="265" rx="46" ry="7" fill={C.purple} opacity="0.07"/>

        {/* ── Left arm — wrapped so walk-swing can pivot at shoulder ─────── */}
        <g style={armLStyle}>
          <rect x="28" y="168" width="27" height="44" rx="13.5"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"/>
          <ellipse cx="41.5" cy="219" rx="17" ry="14"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"/>
          <line x1="34" y1="213" x2="32" y2="207" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="41" y1="211" x2="41" y2="205" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="49" y1="213" x2="51" y2="207" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round"/>
        </g>

        {/* ── Right arm — wave (idle) / walk-swing (walking) ─────────────── */}
        <g style={armRStyle}>
          <rect x="144" y="148" width="26" height="46" rx="13"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"
            transform="rotate(-40 144 148)"/>
          <ellipse cx="176" cy="90" rx="20" ry="23"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="2"/>
          <line x1="167" y1="75" x2="164" y2="66" stroke={C.purple} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="175" y1="72" x2="174" y2="63" stroke={C.purple} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="183" y1="75" x2="184" y2="66" stroke={C.purple} strokeWidth="1.6" strokeLinecap="round"/>
        </g>

        {/* ── Head ──────────────────────────────────────────────────────── */}
        <circle cx="100" cy="98" r="82" fill="none" stroke={C.purple} strokeWidth="1.2"
          style={animOn ? { animation: "chipRingP 3s ease-in-out infinite" } : {}}/>
        <circle cx="100" cy="98" r="74"
          fill={`url(#cGrad_${uid})`} stroke={C.purple} strokeWidth="2.6"/>
        <path d="M 54 55 Q 74 38 96 36 Q 78 50 64 68 Z" fill="white" opacity="0.033"/>

        {/* ── Visor ─────────────────────────────────────────────────────── */}
        <rect x="34" y="66" width="132" height="66" rx="33"
          fill="#030112" stroke={C.purple} strokeWidth="1.2" strokeOpacity="0.36"/>

        {/* ── Eye L ─────────────────────────────────────────────────────── */}
        <ellipse cx="68" cy="101" rx="24" ry="26"
          fill={C.purple} filter={`url(#cSoft_${uid})`} opacity="0.18"/>
        <ellipse cx="68" cy="101" rx="16.5" ry="19" fill={C.eyeOuter}
          style={animOn ? { animation:"chipBlink 5s ease-in-out infinite",    transformBox:"fill-box", transformOrigin:"center" } : {}}/>
        <ellipse cx="68" cy="101" rx="11.5" ry="13.5" fill={`url(#cEye_${uid})`}
          style={animOn ? { animation:"chipBlink 5s ease-in-out infinite",    transformBox:"fill-box", transformOrigin:"center" } : {}}/>
        <circle cx="63" cy="94" r="4" fill="white" opacity="0.93"/>

        {/* ── Eye R ─────────────────────────────────────────────────────── */}
        <ellipse cx="132" cy="101" rx="24" ry="26"
          fill={C.purple} filter={`url(#cSoft_${uid})`} opacity="0.18"/>
        <ellipse cx="132" cy="101" rx="16.5" ry="19" fill={C.eyeOuter}
          style={animOn ? { animation:"chipBlink 5s ease-in-out infinite 0.18s", transformBox:"fill-box", transformOrigin:"center" } : {}}/>
        <ellipse cx="132" cy="101" rx="11.5" ry="13.5" fill={`url(#cEye_${uid})`}
          style={animOn ? { animation:"chipBlink 5s ease-in-out infinite 0.18s", transformBox:"fill-box", transformOrigin:"center" } : {}}/>
        <circle cx="127" cy="94" r="4" fill="white" opacity="0.93"/>

        {/* ── Blush ─────────────────────────────────────────────────────── */}
        <ellipse cx="48"  cy="119" rx="15" ry="8.5" fill="#EC4899" opacity={C.blushOp}/>
        <ellipse cx="152" cy="119" rx="15" ry="8.5" fill="#EC4899" opacity={C.blushOp}/>

        {/* ── Smile ─────────────────────────────────────────────────────── */}
        <path d="M 80 130 Q 100 144 120 130"
          stroke={C.purple} strokeWidth="2.7" fill="none" strokeLinecap="round"/>

        {/* ── Antenna ───────────────────────────────────────────────────── */}
        <line x1="100" y1="24" x2="100" y2="38"
          stroke={C.purple} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="100" cy="17" r="9.5" fill={C.lime}
          style={animOn ? { animation:"chipAntPulse 2.2s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center" } : {}}/>
        <circle cx="100" cy="17" r="15"
          fill="none" stroke={C.lime} strokeWidth="1.3" opacity="0.26"/>
        <circle cx="100" cy="17" r="5.5" fill={C.limeLight}/>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <rect x="60" y="164" width="80" height="58" rx="30"
          fill={`url(#cGrad_${uid})`} stroke={C.purple} strokeWidth="2"/>
        <circle cx="100" cy="190" r="15" fill="#050012" stroke={C.purple} strokeWidth="1.4"/>
        <path d="M 104 180 L 97 190 L 102 190 L 95 200 L 106 188 L 100 188 Z"
          fill={C.lime} opacity="0.9"/>

        {/* ── Left leg + foot — wrapped for walk pivot ──────────────────── */}
        <g style={legStyle("L")}>
          <rect x="66" y="217" width="27" height="28" rx="13.5"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"/>
          <ellipse cx="74" cy="250" rx="24" ry="13"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"/>
        </g>

        {/* ── Right leg + foot — wrapped for walk pivot ─────────────────── */}
        <g style={legStyle("R")}>
          <rect x="107" y="217" width="27" height="28" rx="13.5"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"/>
          <ellipse cx="126" cy="250" rx="24" ry="13"
            fill={C.purpleDark} stroke={C.purple} strokeWidth="1.9"/>
        </g>

        {/* ── Floating data particles (idle only — hide while walking) ──── */}
        {!doWalk && <>
          <circle cx="13"  cy="52"  r="3"   fill={C.purple} opacity="0.5"
            style={animOn ? { animation:"chipDrift1 5.5s ease-in-out infinite" } : {}}/>
          <circle cx="187" cy="44"  r="2.2" fill={C.lime}   opacity="0.6"
            style={animOn ? { animation:"chipDrift2 6.2s ease-in-out infinite" } : {}}/>
          <circle cx="9"   cy="122" r="2"   fill={C.purple} opacity="0.38"
            style={animOn ? { animation:"chipDrift1 4.8s ease-in-out infinite" } : {}}/>
          <circle cx="191" cy="126" r="2.5" fill={C.lime}   opacity="0.44"
            style={animOn ? { animation:"chipDrift2 7.1s ease-in-out infinite" } : {}}/>
        </>}
      </svg>
    </div>
  );
}
