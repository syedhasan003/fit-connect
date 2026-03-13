/**
 * BlazeMascot.jsx — Blaze, the Fitness / Diet / Discovery sub-agent
 * ─────────────────────────────────────────────────────────────────
 * Lime-green robot. Energetic, hyped — has a waving raised arm.
 * Props:
 *   size    {number}   rendered width (height scales with viewBox 180/220)
 *   state   {string}   "idle" | "waving" | "flash" | "offline"
 *   animate {bool}     enable CSS animations (default true)
 */

import { useId, useEffect } from "react";

// ── CSS keyframes (injected once) ────────────────────────────────────────────
const BLAZE_CSS = `
@keyframes blazeBlink {
  0%,86%,94%,100% { transform:scaleY(1)    }
  89%,92%          { transform:scaleY(0.06) }
}
@keyframes blazeAntPulse {
  0%,100% { opacity:.88; transform:scale(1)    }
  50%     { opacity:1;   transform:scale(1.28) }
}
@keyframes blazeRingPulse {
  0%,100% { opacity:.1  }
  50%     { opacity:.28 }
}
@keyframes blazeWave {
  0%,100% { transform:rotate(-5deg)  }
  50%     { transform:rotate(14deg)  }
}
@keyframes blazeWiggle {
  0%,100% { transform:rotate(0deg)  }
  25%     { transform:rotate(-3deg) }
  75%     { transform:rotate(3deg)  }
}
@keyframes blazeBoltPulse {
  0%,100% { opacity:.85; filter:drop-shadow(0 0 3px rgba(122,222,0,0.5)) }
  50%     { opacity:1;   filter:drop-shadow(0 0 8px rgba(122,222,0,0.9)) }
}
@keyframes blazeMotion {
  0%,100% { opacity:.28 }
  50%     { opacity:.55 }
}
@keyframes blazeP1 { 0%,100%{opacity:.5;transform:translate(0,0)} 50%{opacity:.8;transform:translate(-3px,-6px)} }
@keyframes blazeP2 { 0%,100%{opacity:.55;transform:translate(0,0)} 50%{opacity:.85;transform:translate(4px,-5px)} }
@keyframes blazeP3 { 0%,100%{opacity:.3;transform:translate(0,0)}  50%{opacity:.55;transform:translate(-2px,5px)} }
@keyframes blazeP4 { 0%,100%{opacity:.38;transform:translate(0,0)} 50%{opacity:.65;transform:translate(3px,4px)} }
@keyframes blazeFlash {
  0%  { filter: brightness(1) drop-shadow(0 0 0px rgba(122,222,0,0)) }
  20% { filter: brightness(2.2) drop-shadow(0 0 16px rgba(122,222,0,0.9)) }
  100%{ filter: brightness(1) drop-shadow(0 0 0px rgba(122,222,0,0)) }
}
`;

let blazeCSSInjected = false;

export default function BlazeMascot({ size = 80, state = "idle", animate = true }) {
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    if (blazeCSSInjected) return;
    blazeCSSInjected = true;
    const tag = document.createElement("style");
    tag.id = "blaze-mascot-styles";
    tag.textContent = BLAZE_CSS;
    document.head.appendChild(tag);
  }, []);

  const height = Math.round(size * (220 / 180));

  const a = (name, dur, opts = "") =>
    animate ? `${name} ${dur} ease-in-out infinite ${opts}`.trim() : "none";

  const blinkAnim  = a("blazeBlink", "5s");
  const antAnim    = a("blazeAntPulse", "2.2s");
  const ringAnim   = a("blazeRingPulse", "3.2s");
  const waveAnim   = a("blazeWave", "1.6s");
  const wiggleAnim = a("blazeWiggle", "2.8s");
  const boltAnim   = a("blazeBoltPulse", "1.8s");
  const motAnim    = a("blazeMotion", "1.4s");
  const p1Anim     = a("blazeP1", "5s");
  const p2Anim     = a("blazeP2", "6s");
  const p3Anim     = a("blazeP3", "4.2s");
  const p4Anim     = a("blazeP4", "7s");

  const isFlash   = state === "flash";
  const isOffline = state === "offline";

  const svgStyle = {
    display:    "block",
    overflow:   "visible",
    animation:  animate && isFlash
      ? "blazeFlash 0.9s ease-out forwards"
      : "none",
    opacity: isOffline ? 0.35 : 1,
    transition: "opacity 0.4s",
  };

  const gradId = `bGrad_${uid}`;
  const eyeId  = `bEye_${uid}`;
  const softId = `bSoft_${uid}`;
  const glowId = `bGlow_${uid}`;

  return (
    <svg
      viewBox="0 0 180 220"
      width={size}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={svgStyle}
    >
      <defs>
        <radialGradient id={gradId} cx="34%" cy="27%" r="72%">
          <stop offset="0%"   stopColor="#172910"/>
          <stop offset="100%" stopColor="#070E04"/>
        </radialGradient>
        <radialGradient id={eyeId} cx="44%" cy="36%" r="58%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="30%"  stopColor="#ECFCCB"/>
          <stop offset="100%" stopColor="#4D7C0F"/>
        </radialGradient>
        <filter id={softId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
        </filter>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Motion lines */}
      <line x1="4"  y1="96"  x2="22" y2="96"  stroke="#7ADE00" strokeWidth="2"   strokeLinecap="round" opacity="0.35"
        style={{ animation: motAnim }}/>
      <line x1="4"  y1="108" x2="18" y2="108" stroke="#7ADE00" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"
        style={{ animation: motAnim }}/>
      <line x1="4"  y1="120" x2="14" y2="120" stroke="#7ADE00" strokeWidth="1"   strokeLinecap="round" opacity="0.18"
        style={{ animation: motAnim }}/>

      {/* LEFT ARM */}
      <rect x="12" y="164" width="24" height="42" rx="12"
        fill="#0E1808" stroke="#7ADE00" strokeWidth="1.7"/>
      <circle cx="24" cy="213" r="13"
        fill="#0E1808" stroke="#7ADE00" strokeWidth="1.7"/>

      {/* MINI DUMBBELL */}
      <rect x="6" y="202" width="22" height="6" rx="3"
        fill="#070E04" stroke="#7ADE00" strokeWidth="1.4"/>
      <circle cx="8"  cy="205" r="6" fill="#070E04" stroke="#7ADE00" strokeWidth="1.4"/>
      <circle cx="26" cy="205" r="6" fill="#070E04" stroke="#7ADE00" strokeWidth="1.4"/>

      {/* RIGHT ARM (raised, waving) */}
      <g style={{
        animation:       animate ? waveAnim : "none",
        transformBox:    "view-box",
        transformOrigin: "152px 168px",
      }}>
        <rect x="148" y="148" width="24" height="44" rx="12"
          fill="#0E1808" stroke="#7ADE00" strokeWidth="1.7"
          transform="rotate(-40 148 148)"/>
        <ellipse cx="172" cy="92" rx="18" ry="21"
          fill="#0E1808" stroke="#7ADE00" strokeWidth="1.9"/>
        <line x1="164" y1="78" x2="161" y2="69"
          stroke="#7ADE00" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="171" y1="75" x2="170" y2="66"
          stroke="#7ADE00" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="179" y1="77" x2="180" y2="68"
          stroke="#7ADE00" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* HEAD ring + fill */}
      <circle cx="90" cy="96" r="80"
        fill="none" stroke="#7ADE00" strokeWidth="1.3"
        style={{ animation: ringAnim }}/>
      <circle cx="90" cy="96" r="76"
        fill={`url(#${gradId})`} stroke="#7ADE00" strokeWidth="2.4"/>
      {/* Sheen */}
      <path d="M 50 54 Q 70 38 94 36 Q 74 50 60 68 Z" fill="white" opacity="0.03"/>

      {/* LIGHTNING BOLT forehead */}
      <path
        d="M 96 22 L 84 44 L 92 44 L 80 68 L 100 42 L 91 42 Z"
        fill="#7ADE00"
        style={{ animation: boltAnim }}
      />
      <path
        d="M 96 22 L 84 44 L 92 44 L 80 68 L 100 42 L 91 42 Z"
        fill="none" stroke="#C8FF60" strokeWidth="1" opacity="0.55"
      />

      {/* VISOR */}
      <rect x="22" y="66" width="136" height="62" rx="31"
        fill="#020802" stroke="#7ADE00" strokeWidth="1.2" strokeOpacity="0.35"/>

      {/* EYE L */}
      <ellipse cx="62" cy="99" rx="22" ry="24"
        fill="#7ADE00" filter={`url(#${softId})`} opacity="0.17"/>
      <ellipse cx="62" cy="99" rx="15" ry="17" fill="#365314"
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <ellipse cx="62" cy="99" rx="10" ry="12" fill={`url(#${eyeId})`}
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <circle cx="57" cy="93" r="3.8" fill="white" opacity="0.94"/>

      {/* EYE R */}
      <ellipse cx="118" cy="99" rx="22" ry="24"
        fill="#7ADE00" filter={`url(#${softId})`} opacity="0.17"/>
      <ellipse cx="118" cy="99" rx="15" ry="17" fill="#365314"
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <ellipse cx="118" cy="99" rx="10" ry="12" fill={`url(#${eyeId})`}
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <circle cx="113" cy="93" r="3.8" fill="white" opacity="0.94"/>

      {/* Blush — flushed from workout */}
      <ellipse cx="40"  cy="117" rx="15" ry="8.5" fill="#84CC16" opacity="0.18"/>
      <ellipse cx="140" cy="117" rx="15" ry="8.5" fill="#84CC16" opacity="0.18"/>

      {/* Mouth — big grin */}
      <path d="M 62 126 Q 90 146 118 126"
        stroke="#7ADE00" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      <path d="M 74 130 Q 90 140 106 130"
        stroke="#7ADE00" strokeWidth="1" fill="rgba(122,222,0,0.15)" strokeLinecap="round"/>

      {/* ANTENNA */}
      <line x1="90" y1="20" x2="90" y2="33"
        stroke="#7ADE00" strokeWidth="2.3" strokeLinecap="round"/>
      <circle cx="90" cy="13" r="9" fill="#7ADE00"
        style={{ animation: antAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <circle cx="90" cy="13" r="14" fill="none" stroke="#7ADE00" strokeWidth="1.3" opacity="0.22"/>
      <circle cx="90" cy="13" r="5.5" fill="#DDFF70"/>

      {/* BODY */}
      <ellipse cx="90" cy="188" rx="42" ry="26"
        fill={`url(#${gradId})`} stroke="#7ADE00" strokeWidth="1.9"/>
      {/* Heart-rate chest panel */}
      <rect x="64" y="180" width="52" height="16" rx="8"
        fill="#020802" stroke="#7ADE00" strokeWidth="1.2"/>
      <polyline
        points="68,188 73,188 77,182 82,194 87,188 93,188 97,185 102,191 107,188 112,188"
        fill="none" stroke="#7ADE00" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>

      {/* FEET — slightly apart */}
      <ellipse cx="65"  cy="212" rx="23" ry="12"
        fill="#080E04" stroke="#7ADE00" strokeWidth="1.7" transform="rotate(-4 65 212)"/>
      <ellipse cx="115" cy="212" rx="23" ry="12"
        fill="#080E04" stroke="#7ADE00" strokeWidth="1.7" transform="rotate(4 115 212)"/>

      {/* Sweat drops */}
      <path d="M 148 54 Q 151 48 154 54 Q 154 58 151 58 Q 148 58 148 54 Z" fill="#7ADE00" opacity="0.4"/>
      <path d="M 156 44 Q 158 40 160 44 Q 160 47 158 47 Q 156 47 156 44 Z" fill="#7ADE00" opacity="0.3"/>

      {/* Floating lime particles */}
      <circle cx="8"   cy="54"  r="3"   fill="#7ADE00" opacity="0.5"  style={{ animation: p1Anim }}/>
      <circle cx="174" cy="48"  r="2.2" fill="#7ADE00" opacity="0.6"  style={{ animation: p2Anim }}/>
      <circle cx="5"   cy="132" r="2"   fill="#A855F7" opacity="0.38" style={{ animation: p3Anim }}/>
      <circle cx="176" cy="138" r="2.5" fill="#7ADE00" opacity="0.44" style={{ animation: p4Anim }}/>
    </svg>
  );
}
