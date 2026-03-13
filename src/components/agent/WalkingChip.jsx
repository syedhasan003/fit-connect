/**
 * WalkingChip.jsx — Chip walks across the top of the Home screen.
 * ─────────────────────────────────────────────────────────────────────────────
 * Walk cycle is 100% JavaScript-driven via requestAnimationFrame.
 * We set SVG `transform` attributes directly each frame — this bypasses all
 * CSS transform-box / transform-origin browser inconsistencies.
 *
 * Pivot geometry (viewBox 0 0 200 272):
 *   Left  leg  hip  : rotate(angle, 79.5,  217)
 *   Right leg  hip  : rotate(angle, 120.5, 217)
 *   Left  arm  shoulder : rotate(angle, 41.5, 168)
 *   Right arm  shoulder : rotate(angle, 144,  148) — arm base = −40°
 *
 * Walk rule:  sin(t) drives left-leg.  Right leg = −phase.
 *             Arms counter-swing: right arm matches left leg, left arm inverts.
 *
 * State machine (in s.current.action):
 *   "walking"  → legs / arms swing, walk bob, position advances
 *   "looking"  → legs reset to 0, idle wave + slow bob, faces camera
 *   "greeting" → same as looking + flash filter + speech bubble on tap
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Layout constants ──────────────────────────────────────────────────────────
const CHIP_H = 72;
const CHIP_W = Math.round(CHIP_H * (200 / 272)); // ≈ 53 px
const SPEED  = 0.68;   // px / frame @ 60 fps ≈ 41 px / s
const PAD    = 10;     // min distance from edge

// ── Animation speeds (radians / frame @ 60 fps) ───────────────────────────────
const WALK_SPEED     = (2 * Math.PI) / (0.58 * 60); // 0.58 s cycle
const IDLE_BOB_SPEED = (2 * Math.PI) / (3.90 * 60); // 3.9 s cycle
const WAVE_SPEED     = (2 * Math.PI) / (1.50 * 60); // 1.5 s wave

// ── Palette ───────────────────────────────────────────────────────────────────
const PURPLE  = "#A855F7";
const PD      = "#1C0A36";  // dark purple (body / limbs)
const LIME    = "#7ADE00";
const LIME_L  = "#E0FF80";
const BODYG0  = "#2C1158";
const BODYG1  = "#100523";
const EYE_O   = "#5B21B6";
const FLOOR   = "#030112";  // visor / chest inner

// ── CSS (injected once — blink, antenna, etc.) ────────────────────────────────
const CHIP_CSS = `
@keyframes wChipBlink {
  0%,88%,94%,100% { transform: scaleY(1);    }
  90%,92%         { transform: scaleY(0.06); }
}
@keyframes wChipAntPulse {
  0%,100% { opacity:.88; transform:scale(1);    }
  50%     { opacity:1;   transform:scale(1.22); }
}
@keyframes wChipRingP { 0%,100%{opacity:.12} 50%{opacity:.28} }
@keyframes wChipFlash {
  0%   { filter: brightness(3)    drop-shadow(0 0 16px #fff); }
  40%  { filter: brightness(2)    drop-shadow(0 0 10px #A855F7); }
  100% { filter: brightness(1)    drop-shadow(0 0 0px transparent); }
}
@keyframes wChipHi {
  0%   { opacity:0; transform:translateX(-50%) translateY(10px) scaleX(1); }
  100% { opacity:1; transform:translateX(-50%) translateY(0)    scaleX(1); }
}
@keyframes wChipDots {
  0%   { opacity:0; }
  100% { opacity:1; }
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const el = document.createElement("style");
  el.id = "walking-chip-css";
  el.textContent = CHIP_CSS;
  document.head.appendChild(el);
}

// ── Random pause interval (frames) ───────────────────────────────────────────
const nextPause = () => 260 + Math.floor(Math.random() * 200); // 4.3–7.7 s

// ── Component ─────────────────────────────────────────────────────────────────
export default function WalkingChip() {
  // ── DOM refs ────────────────────────────────────────────────────────────────
  const wrapRef    = useRef(null);  // outer container (for width measurement)
  const chipRef    = useRef(null);  // absolute div: left + scaleX direction flip
  const glowRef    = useRef(null);  // ground glow
  const svgBobRef  = useRef(null);  // div inside chipRef: receives translateY bob
  const svgRef     = useRef(null);  // the <svg> element (for flash filter)
  const gradId     = useRef(`wc_${Math.random().toString(36).slice(2, 7)}`);

  // SVG group refs — we call .setAttribute('transform', ...) directly each frame
  const leftArmG   = useRef(null);
  const rightArmG  = useRef(null);
  const leftLegG   = useRef(null);
  const rightLegG  = useRef(null);

  // ── Animation phase refs ────────────────────────────────────────────────────
  const walkPhase    = useRef(0);
  const idleBobPhase = useRef(0);
  const wavePhase    = useRef(Math.PI); // start arm at natural angle

  // ── Walk state (mutable, out of React state) ────────────────────────────────
  const s = useRef({
    x: PAD, dir: 1, steps: 0, nextPause: nextPause(), action: "walking",
  });

  // ── React state (only for rare action changes + bubble) ────────────────────
  const [action,   setAction]   = useState("walking");
  const [greeting, setGreeting] = useState(false);
  const pauseTimer = useRef(null);
  const greetTimer = useRef(null);
  const rafRef     = useRef(null);

  useEffect(() => { injectCSS(); }, []);

  // ── Enter "looking" ─────────────────────────────────────────────────────────
  const enterLooking = useCallback(() => {
    s.current.action = "looking";
    setAction("looking");
    // Face camera
    if (chipRef.current) chipRef.current.style.transform = "scaleX(1)";
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      if (s.current.action !== "looking") return;
      s.current.action = "walking";
      setAction("walking");
      if (chipRef.current) {
        chipRef.current.style.transform = `scaleX(${s.current.dir === -1 ? -1 : 1})`;
      }
    }, 1900 + Math.random() * 900);
  }, []);

  // ── rAF tick ─────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const action = s.current.action;

    // ── A. Position update (walking only) ────────────────────────────────────
    if (action === "walking") {
      const maxX = (wrapRef.current?.offsetWidth ?? 380) - CHIP_W - PAD;
      let { x, dir } = s.current;
      x += dir * SPEED;
      if (x >= maxX) { x = maxX; dir = -1; }
      else if (x <= PAD) { x = PAD; dir = 1; }
      s.current.x = x; s.current.dir = dir; s.current.steps++;

      if (chipRef.current) {
        chipRef.current.style.left      = `${x}px`;
        chipRef.current.style.transform = `scaleX(${dir === -1 ? -1 : 1})`;
      }
      if (glowRef.current) glowRef.current.style.left = `${x - 4}px`;

      if (s.current.steps >= s.current.nextPause) {
        s.current.steps = 0;
        s.current.nextPause = nextPause();
        enterLooking();
      }
    }

    // ── B. Limb animation ────────────────────────────────────────────────────
    if (action === "walking") {
      walkPhase.current = (walkPhase.current + WALK_SPEED) % (Math.PI * 2);
      const wt     = walkPhase.current;
      const legAng = Math.sin(wt) * 28;   // ±28° leg swing
      const armAng = Math.sin(wt) * 15;   // ±15° arm swing

      // Legs: left leads, right opposite
      leftLegG.current?.setAttribute( "transform", `rotate(${legAng.toFixed(1)},  79.5, 217)`);
      rightLegG.current?.setAttribute("transform", `rotate(${(-legAng).toFixed(1)}, 120.5, 217)`);

      // Arms: counter-swing.  Right arm base = −40° (raised), animate around it.
      leftArmG.current?.setAttribute( "transform", `rotate(${(-armAng * 0.8).toFixed(1)}, 41.5, 168)`);
      rightArmG.current?.setAttribute("transform", `rotate(${(-40 + armAng * 0.65).toFixed(1)}, 144, 148)`);

      // Walk bob: body rises at each heel-strike (double-hump per cycle)
      const bobY = (-Math.abs(Math.sin(wt)) * 5.5).toFixed(2);
      if (svgBobRef.current) svgBobRef.current.style.transform = `translateY(${bobY}px)`;

    } else {
      // Idle / greeting / looking
      // Reset legs to neutral
      leftLegG.current?.setAttribute( "transform", "rotate(0, 79.5,  217)");
      rightLegG.current?.setAttribute("transform", "rotate(0, 120.5, 217)");
      leftArmG.current?.setAttribute( "transform", "rotate(0, 41.5,  168)");

      // Slow idle bob
      idleBobPhase.current = (idleBobPhase.current + IDLE_BOB_SPEED) % (Math.PI * 2);
      const idleY = (Math.sin(idleBobPhase.current) * -4).toFixed(2);
      if (svgBobRef.current) svgBobRef.current.style.transform = `translateY(${idleY}px)`;

      // Right arm idle wave (oscillates from -50° → -30°)
      wavePhase.current = (wavePhase.current + WAVE_SPEED) % (Math.PI * 2);
      const waveAng = (-40 + Math.sin(wavePhase.current) * 10).toFixed(1);
      rightArmG.current?.setAttribute("transform", `rotate(${waveAng}, 144, 148)`);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [enterLooking]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(pauseTimer.current);
      clearTimeout(greetTimer.current);
    };
  }, [tick]);

  // ── Tap → greeting ──────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (s.current.action === "greeting") return;
    clearTimeout(pauseTimer.current);
    clearTimeout(greetTimer.current);

    s.current.action = "greeting";
    setAction("greeting");
    setGreeting(true);

    // Face camera + flash
    if (chipRef.current) chipRef.current.style.transform = "scaleX(1)";
    if (svgRef.current)  svgRef.current.style.animation  = "wChipFlash 1.4s ease-out forwards";

    greetTimer.current = setTimeout(() => {
      setGreeting(false);
      if (svgRef.current) svgRef.current.style.animation = "none";
      s.current.action = "walking";
      setAction("walking");
      if (chipRef.current) {
        chipRef.current.style.transform = `scaleX(${s.current.dir === -1 ? -1 : 1})`;
      }
    }, 2300);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  const gid = gradId.current;

  return (
    <div ref={wrapRef} style={{
      position: "relative", width: "100%", height: CHIP_H + 26,
      userSelect: "none", marginBottom: 4,
    }}>

      {/* Ground glow */}
      <div ref={glowRef} style={{
        position: "absolute", bottom: 4, left: PAD,
        width: CHIP_W + 10, height: 12,
        background: "radial-gradient(ellipse, rgba(168,85,247,0.22) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(6px)", pointerEvents: "none",
      }}/>

      {/* Chip container — receives direct left + scaleX updates */}
      <div ref={chipRef} onClick={handleClick} style={{
        position: "absolute", bottom: 10, left: PAD,
        transformOrigin: "center bottom", transform: "scaleX(1)",
        cursor: "pointer", willChange: "left, transform",
      }}>

        {/* Bob wrapper — receives direct translateY */}
        <div ref={svgBobRef} style={{ position: "relative" }}>

          {/* Speech bubble */}
          {greeting && (
            <div style={{
              position: "absolute", bottom: CHIP_H + 10, left: "50%",
              transform: "translateX(-50%)", whiteSpace: "nowrap",
              background: "rgba(14,4,30,0.92)", border: "1px solid rgba(168,85,247,0.5)",
              borderRadius: 18, padding: "6px 16px",
              fontSize: 15, fontWeight: 700, color: "#fff",
              backdropFilter: "blur(14px)",
              boxShadow: "0 6px 28px rgba(168,85,247,0.28)",
              animation: "wChipHi 0.25s ease-out both",
              pointerEvents: "none", zIndex: 20,
            }}>
              Hi! 👋
              <div style={{
                position:"absolute", bottom:-7, left:"50%",
                transform:"translateX(-50%)", width:0, height:0,
                borderLeft:"5px solid transparent",
                borderRight:"5px solid transparent",
                borderTop:"7px solid rgba(168,85,247,0.5)",
              }}/>
            </div>
          )}

          {/* "· · ·" when looking */}
          {action === "looking" && (
            <div style={{
              position:"absolute", bottom: CHIP_H + 8, left:"50%",
              transform:"translateX(-50%)",
              fontSize:11, fontWeight:700,
              color:"rgba(168,85,247,0.7)", letterSpacing:"0.14em",
              animation:"wChipDots 0.3s ease-out both",
              pointerEvents:"none",
            }}>· · ·</div>
          )}

          {/* ── The SVG ──────────────────────────────────────────────────── */}
          <svg
            ref={svgRef}
            viewBox="0 0 200 272"
            width={CHIP_W}
            height={CHIP_H}
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible", display: "block" }}
          >
            <defs>
              <radialGradient id={`${gid}_body`} cx="33%" cy="27%" r="73%">
                <stop offset="0%"   stopColor={BODYG0}/>
                <stop offset="100%" stopColor={BODYG1}/>
              </radialGradient>
              <radialGradient id={`${gid}_eye`} cx="43%" cy="36%" r="58%">
                <stop offset="0%"   stopColor="#ffffff"/>
                <stop offset="30%"  stopColor="#EDE9FE"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </radialGradient>
              <filter id={`${gid}_soft`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
              </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse cx="100" cy="265" rx="46" ry="7" fill={PURPLE} opacity="0.07"/>

            {/* ── Left arm group — ref for JS rotation around (41.5, 168) ── */}
            <g ref={leftArmG}>
              <rect x="28" y="168" width="27" height="44" rx="13.5"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
              <ellipse cx="41.5" cy="219" rx="17" ry="14"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
              <line x1="34" y1="213" x2="32" y2="207"
                stroke={PURPLE} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="41" y1="211" x2="41" y2="205"
                stroke={PURPLE} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="49" y1="213" x2="51" y2="207"
                stroke={PURPLE} strokeWidth="1.5" strokeLinecap="round"/>
            </g>

            {/* ── Right arm group — ref for JS rotation around (144, 148) ─
                 NOTE: NO baked-in transform here — JS sets rotate(-40,...) ── */}
            <g ref={rightArmG} transform="rotate(-40, 144, 148)">
              <rect x="144" y="148" width="26" height="46" rx="13"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
              <ellipse cx="176" cy="90" rx="20" ry="23"
                fill={PD} stroke={PURPLE} strokeWidth="2"/>
              <line x1="167" y1="75" x2="164" y2="66"
                stroke={PURPLE} strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="175" y1="72" x2="174" y2="63"
                stroke={PURPLE} strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="183" y1="75" x2="184" y2="66"
                stroke={PURPLE} strokeWidth="1.6" strokeLinecap="round"/>
            </g>

            {/* ── Head ─────────────────────────────────────────────────────── */}
            {/* Aura ring */}
            <circle cx="100" cy="98" r="82" fill="none"
              stroke={PURPLE} strokeWidth="1.2"
              style={{ animation:"wChipRingP 3s ease-in-out infinite" }}/>
            {/* Head fill */}
            <circle cx="100" cy="98" r="74"
              fill={`url(#${gid}_body)`} stroke={PURPLE} strokeWidth="2.6"/>
            {/* Sheen */}
            <path d="M 54 55 Q 74 38 96 36 Q 78 50 64 68 Z"
              fill="white" opacity="0.033"/>

            {/* ── Visor ───────────────────────────────────────────────────── */}
            <rect x="34" y="66" width="132" height="66" rx="33"
              fill={FLOOR} stroke={PURPLE} strokeWidth="1.2" strokeOpacity="0.36"/>

            {/* ── Eye L ───────────────────────────────────────────────────── */}
            <ellipse cx="68" cy="101" rx="24" ry="26"
              fill={PURPLE} filter={`url(#${gid}_soft)`} opacity="0.18"/>
            <ellipse cx="68" cy="101" rx="16.5" ry="19" fill={EYE_O}
              style={{ animation:"wChipBlink 5s ease-in-out infinite",
                       transformBox:"fill-box", transformOrigin:"center" }}/>
            <ellipse cx="68" cy="101" rx="11.5" ry="13.5"
              fill={`url(#${gid}_eye)`}
              style={{ animation:"wChipBlink 5s ease-in-out infinite",
                       transformBox:"fill-box", transformOrigin:"center" }}/>
            <circle cx="63" cy="94" r="4" fill="white" opacity="0.93"/>

            {/* ── Eye R ───────────────────────────────────────────────────── */}
            <ellipse cx="132" cy="101" rx="24" ry="26"
              fill={PURPLE} filter={`url(#${gid}_soft)`} opacity="0.18"/>
            <ellipse cx="132" cy="101" rx="16.5" ry="19" fill={EYE_O}
              style={{ animation:"wChipBlink 5s ease-in-out infinite 0.2s",
                       transformBox:"fill-box", transformOrigin:"center" }}/>
            <ellipse cx="132" cy="101" rx="11.5" ry="13.5"
              fill={`url(#${gid}_eye)`}
              style={{ animation:"wChipBlink 5s ease-in-out infinite 0.2s",
                       transformBox:"fill-box", transformOrigin:"center" }}/>
            <circle cx="127" cy="94" r="4" fill="white" opacity="0.93"/>

            {/* ── Blush ───────────────────────────────────────────────────── */}
            <ellipse cx="48"  cy="119" rx="15" ry="8.5" fill="#EC4899" opacity="0.19"/>
            <ellipse cx="152" cy="119" rx="15" ry="8.5" fill="#EC4899" opacity="0.19"/>

            {/* ── Smile ───────────────────────────────────────────────────── */}
            <path d="M 80 130 Q 100 144 120 130"
              stroke={PURPLE} strokeWidth="2.7" fill="none" strokeLinecap="round"/>

            {/* ── Antenna ─────────────────────────────────────────────────── */}
            <line x1="100" y1="24" x2="100" y2="38"
              stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="100" cy="17" r="9.5" fill={LIME}
              style={{ animation:"wChipAntPulse 2.2s ease-in-out infinite",
                       transformBox:"fill-box", transformOrigin:"center" }}/>
            <circle cx="100" cy="17" r="15"
              fill="none" stroke={LIME} strokeWidth="1.3" opacity="0.26"/>
            <circle cx="100" cy="17" r="5.5" fill={LIME_L}/>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <rect x="60" y="164" width="80" height="58" rx="30"
              fill={`url(#${gid}_body)`} stroke={PURPLE} strokeWidth="2"/>
            {/* Chest badge — lightning bolt */}
            <circle cx="100" cy="190" r="15"
              fill={FLOOR} stroke={PURPLE} strokeWidth="1.4"/>
            <path d="M 104 180 L 97 190 L 102 190 L 95 200 L 106 188 L 100 188 Z"
              fill={LIME} opacity="0.9"/>

            {/* ── Left leg + foot — ref for JS rotation around (79.5, 217) ─ */}
            <g ref={leftLegG}>
              <rect x="66" y="217" width="27" height="28" rx="13.5"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
              <ellipse cx="74" cy="250" rx="24" ry="13"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
            </g>

            {/* ── Right leg + foot — ref for JS rotation around (120.5, 217) */}
            <g ref={rightLegG}>
              <rect x="107" y="217" width="27" height="28" rx="13.5"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
              <ellipse cx="126" cy="250" rx="24" ry="13"
                fill={PD} stroke={PURPLE} strokeWidth="1.9"/>
            </g>
          </svg>
        </div>{/* /svgBobRef */}
      </div>{/* /chipRef */}
    </div>
  );
}
