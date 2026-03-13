/**
 * OrbiMascot.jsx — Orbi, the Knowledge / Vault / Health sub-agent
 * ─────────────────────────────────────────────────────────────────
 * Indigo robot. Rounder, more compact than Chip.
 * Props:
 *   size    {number}   rendered width (height scales with viewBox ratio 180/220)
 *   state   {string}   "idle" | "thinking" | "flash" | "offline"
 *   animate {bool}     enable CSS animations (default true)
 */

import { useId, useEffect } from "react";

// ── CSS keyframes (injected once) ────────────────────────────────────────────
const ORBI_CSS = `
@keyframes orbiBlink {
  0%,86%,94%,100% { transform:scaleY(1) }
  89%,92%          { transform:scaleY(0.06) }
}
@keyframes orbiAntPulse {
  0%,100% { opacity:.88; transform:scale(1)   }
  50%     { opacity:1;   transform:scale(1.28) }
}
@keyframes orbiRingPulse {
  0%,100% { opacity:.1 }
  50%     { opacity:.28 }
}
@keyframes orbiMagFloat {
  0%,100% { transform:rotate(-5deg) }
  50%     { transform:rotate(5deg)  }
}
@keyframes orbiP1 { 0%,100%{opacity:.5;transform:translate(0,0)} 50%{opacity:.8;transform:translate(-3px,-6px)} }
@keyframes orbiP2 { 0%,100%{opacity:.55;transform:translate(0,0)} 50%{opacity:.85;transform:translate(4px,-5px)} }
@keyframes orbiP3 { 0%,100%{opacity:.3;transform:translate(0,0)}  50%{opacity:.55;transform:translate(-2px,5px)} }
@keyframes orbiP4 { 0%,100%{opacity:.38;transform:translate(0,0)} 50%{opacity:.65;transform:translate(3px,4px)} }
@keyframes orbiThink {
  0%,100% { transform:translateY(0)    }
  50%     { transform:translateY(-5px) }
}
@keyframes orbiFlash {
  0%  { filter: brightness(1) drop-shadow(0 0 0px rgba(99,102,241,0)) }
  20% { filter: brightness(2.2) drop-shadow(0 0 16px rgba(99,102,241,0.9)) }
  100%{ filter: brightness(1) drop-shadow(0 0 0px rgba(99,102,241,0)) }
}
`;

let orbiCSSInjected = false;

export default function OrbiMascot({ size = 80, state = "idle", animate = true }) {
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    if (orbiCSSInjected) return;
    orbiCSSInjected = true;
    const tag = document.createElement("style");
    tag.id = "orbi-mascot-styles";
    tag.textContent = ORBI_CSS;
    document.head.appendChild(tag);
  }, []);

  const height = Math.round(size * (220 / 180));

  // animation helpers
  const a = (name, dur, opts = "") =>
    animate ? `${name} ${dur} ease-in-out infinite ${opts}`.trim() : "none";

  const blinkAnim  = a("orbiBlink", "5s");
  const antAnim    = a("orbiAntPulse", "2.2s");
  const ringAnim   = a("orbiRingPulse", "3.2s");
  const magAnim    = a("orbiMagFloat", "3.5s");
  const p1Anim     = a("orbiP1", "5s");
  const p2Anim     = a("orbiP2", "6s");
  const p3Anim     = a("orbiP3", "4.2s");
  const p4Anim     = a("orbiP4", "7s");

  const isThinking = state === "thinking";
  const isFlash    = state === "flash";
  const isOffline  = state === "offline";

  // thinking: whole SVG bobs gently; flash: brightness spike
  const svgStyle = {
    display:    "block",
    overflow:   "visible",
    animation:  animate && isThinking
      ? "orbiThink 1.2s ease-in-out infinite"
      : animate && isFlash
        ? "orbiFlash 0.9s ease-out forwards"
        : "none",
    opacity: isOffline ? 0.35 : 1,
    transition: "opacity 0.4s",
  };

  const gradId  = `oGrad_${uid}`;
  const eyeId   = `oEye_${uid}`;
  const softId  = `oSoft_${uid}`;

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
          <stop offset="0%"   stopColor="#2D1A72"/>
          <stop offset="100%" stopColor="#0D0828"/>
        </radialGradient>
        <radialGradient id={eyeId} cx="44%" cy="36%" r="58%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="30%"  stopColor="#E0E7FF"/>
          <stop offset="100%" stopColor="#4F46E5"/>
        </radialGradient>
        <filter id={softId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
        </filter>
      </defs>

      {/* Outer aura ring */}
      <circle
        cx="90" cy="96" r="80"
        fill="none" stroke="#6366F1" strokeWidth="1.3"
        style={{ animation: ringAnim }}
      />

      {/* LEFT ARM */}
      <rect x="10" y="152" width="24" height="42" rx="12"
        fill="#180E3A" stroke="#6366F1" strokeWidth="1.7"/>
      {/* Left hand */}
      <circle cx="22" cy="201" r="13"
        fill="#180E3A" stroke="#6366F1" strokeWidth="1.7"/>

      {/* MAGNIFYING GLASS */}
      <g style={{
        animation:       animate ? magAnim : "none",
        transformBox:    "view-box",
        transformOrigin: "152px 148px",
      }}>
        <circle cx="16" cy="178" r="13" fill="none" stroke="#818CF8" strokeWidth="2.2"/>
        <circle cx="16" cy="178" r="8"  fill="#6366F1" opacity="0.15"/>
        <circle cx="16" cy="178" r="4"  fill="#818CF8" opacity="0.3"/>
        <line x1="25" y1="187" x2="32" y2="195"
          stroke="#818CF8" strokeWidth="2.8" strokeLinecap="round"/>
      </g>

      {/* RIGHT ARM (raised/thinking pose) */}
      <rect x="148" y="148" width="24" height="40" rx="12"
        fill="#180E3A" stroke="#6366F1" strokeWidth="1.7"
        transform="rotate(-30 148 148)"/>
      {/* Right hand */}
      <circle cx="162" cy="118" r="13"
        fill="#180E3A" stroke="#6366F1" strokeWidth="1.7"/>

      {/* HEAD */}
      <circle cx="90" cy="96" r="76"
        fill={`url(#${gradId})`} stroke="#6366F1" strokeWidth="2.4"/>
      {/* Sheen */}
      <path d="M 50 54 Q 70 38 94 36 Q 74 50 60 68 Z" fill="white" opacity="0.03"/>

      {/* VISOR */}
      <rect x="22" y="66" width="136" height="62" rx="31"
        fill="#040118" stroke="#6366F1" strokeWidth="1.2" strokeOpacity="0.35"/>

      {/* Data-glass lines */}
      <line x1="28" y1="83" x2="46" y2="83"
        stroke="#6366F1" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round"/>
      <line x1="28" y1="88" x2="40" y2="88"
        stroke="#6366F1" strokeWidth="1" strokeOpacity="0.2" strokeLinecap="round"/>
      <line x1="136" y1="83" x2="154" y2="83"
        stroke="#6366F1" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round"/>
      <line x1="142" y1="88" x2="154" y2="88"
        stroke="#6366F1" strokeWidth="1" strokeOpacity="0.2" strokeLinecap="round"/>

      {/* EYE L */}
      <ellipse cx="62" cy="99" rx="22" ry="24"
        fill="#6366F1" filter={`url(#${softId})`} opacity="0.18"/>
      <ellipse cx="62" cy="99" rx="14" ry="15.5" fill="#4338CA"
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <ellipse cx="62" cy="99" rx="9.5" ry="11" fill={`url(#${eyeId})`}
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <circle cx="57" cy="93" r="3.5" fill="white" opacity="0.94"/>
      <circle cx="69" cy="94" r="1.5" fill="white" opacity="0.5"/>

      {/* EYE R */}
      <ellipse cx="118" cy="99" rx="22" ry="24"
        fill="#6366F1" filter={`url(#${softId})`} opacity="0.18"/>
      <ellipse cx="118" cy="99" rx="14" ry="15.5" fill="#4338CA"
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <ellipse cx="118" cy="99" rx="9.5" ry="11" fill={`url(#${eyeId})`}
        style={{ animation: blinkAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <circle cx="113" cy="93" r="3.5" fill="white" opacity="0.94"/>
      <circle cx="125" cy="94" r="1.5" fill="white" opacity="0.5"/>

      {/* Blush */}
      <ellipse cx="42"  cy="116" rx="14" ry="8" fill="#818CF8" opacity="0.16"/>
      <ellipse cx="138" cy="116" rx="14" ry="8" fill="#818CF8" opacity="0.16"/>

      {/* Mouth */}
      <path d="M 70 124 Q 90 135 110 124"
        stroke="#6366F1" strokeWidth="2.4" fill="none" strokeLinecap="round"/>

      {/* ANTENNA */}
      <line x1="90" y1="20" x2="90" y2="33"
        stroke="#6366F1" strokeWidth="2.3" strokeLinecap="round"/>
      <circle cx="90" cy="26" r="2" fill="#818CF8" opacity="0.4"/>
      <circle cx="90" cy="14" r="8.5" fill="#818CF8"
        style={{ animation: antAnim, transformBox:"fill-box", transformOrigin:"center" }}/>
      <circle cx="90" cy="14" r="14" fill="none" stroke="#818CF8" strokeWidth="1.3" opacity="0.22"/>
      <circle cx="90" cy="14" r="5"  fill="#E0E7FF"/>

      {/* BODY */}
      <ellipse cx="90" cy="188" rx="42" ry="26"
        fill={`url(#${gradId})`} stroke="#6366F1" strokeWidth="1.9"/>
      <circle cx="90" cy="188" r="13"
        fill="#040118" stroke="#6366F1" strokeWidth="1.3"/>
      {/* Circuit dots */}
      <circle cx="90" cy="184" r="2" fill="#818CF8" opacity="0.7"/>
      <circle cx="86" cy="190" r="2" fill="#818CF8" opacity="0.5"/>
      <circle cx="94" cy="190" r="2" fill="#818CF8" opacity="0.5"/>
      <circle cx="90" cy="196" r="2" fill="#818CF8" opacity="0.3"/>

      {/* FEET */}
      <ellipse cx="68"  cy="212" rx="22" ry="12" fill="#100830" stroke="#6366F1" strokeWidth="1.7"/>
      <ellipse cx="112" cy="212" rx="22" ry="12" fill="#100830" stroke="#6366F1" strokeWidth="1.7"/>

      {/* Floating data particles */}
      <circle cx="8"   cy="54"  r="3"   fill="#6366F1" opacity="0.5"  style={{ animation: p1Anim }}/>
      <circle cx="174" cy="48"  r="2.2" fill="#818CF8" opacity="0.6"  style={{ animation: p2Anim }}/>
      <circle cx="5"   cy="130" r="2"   fill="#6366F1" opacity="0.38" style={{ animation: p3Anim }}/>
      <circle cx="176" cy="136" r="2.5" fill="#818CF8" opacity="0.44" style={{ animation: p4Anim }}/>
      <circle cx="22"  cy="8"   r="1.5" fill="#818CF8" opacity="0.35" style={{ animation: p3Anim }}/>
      <circle cx="160" cy="12"  r="1.5" fill="#6366F1" opacity="0.4"  style={{ animation: p1Anim }}/>
    </svg>
  );
}
