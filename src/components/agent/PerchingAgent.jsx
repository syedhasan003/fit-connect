/**
 * PerchingAgent.jsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable wrapper that makes any mascot "perch" on a card edge.
 *
 * Features:
 *   - Gentle idle bob animation (CSS, no rAF overhead)
 *   - Speech bubble appears on tap, auto-dismisses after 2.4s
 *   - Absolutely positioned — place this inside a `position:relative` wrapper
 *
 * Props:
 *   Mascot     {Component}  The mascot component to render (OrbiMascot, BlazeMascot, …)
 *   size       {number}     Width passed to Mascot (default 52)
 *   message    {string}     Text to show in speech bubble on tap
 *   style      {object}     Extra positioning styles (top/right/left/bottom/transform)
 *   mascotProps {object}    Extra props forwarded to Mascot (e.g. state="waving")
 */

import { useState, useEffect, useRef } from "react";

// ── CSS keyframes (injected once) ────────────────────────────────────────────
const PERCH_CSS = `
@keyframes perchBob {
  0%,100% { transform: translateY(0px)   }
  50%     { transform: translateY(-7px)  }
}
@keyframes perchBubbleIn {
  from { opacity: 0; transform: scale(0.7) translateY(6px) }
  to   { opacity: 1; transform: scale(1)   translateY(0px) }
}
@keyframes perchBubbleOut {
  from { opacity: 1; transform: scale(1)   translateY(0px) }
  to   { opacity: 0; transform: scale(0.75) translateY(4px) }
}
`;

let perchCSSInjected = false;

export default function PerchingAgent({
  Mascot,
  size = 52,
  message = "Hi! 👋",
  style = {},
  mascotProps = {},
}) {
  const [showBubble,   setShowBubble]   = useState(false);
  const [bubbleLeave,  setBubbleLeave]  = useState(false);
  const [flashState,   setFlashState]   = useState(false);
  const hideTimer = useRef(null);

  // Inject keyframes once
  useEffect(() => {
    if (perchCSSInjected) return;
    perchCSSInjected = true;
    const tag = document.createElement("style");
    tag.id = "perch-agent-styles";
    tag.textContent = PERCH_CSS;
    document.head.appendChild(tag);
  }, []);

  function handleTap() {
    // Flash the mascot
    setFlashState(true);
    setTimeout(() => setFlashState(false), 900);

    // Show bubble
    setBubbleLeave(false);
    setShowBubble(true);
    clearTimeout(hideTimer.current);

    // Start exit animation then hide
    hideTimer.current = setTimeout(() => {
      setBubbleLeave(true);
      setTimeout(() => setShowBubble(false), 300);
    }, 2400);
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const mascotState = flashState ? "flash" : (mascotProps.state || "idle");

  return (
    <div
      style={{
        position: "absolute",
        ...style,
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onClick={handleTap}
    >
      {/* Speech bubble */}
      {showBubble && (
        <div
          style={{
            position:       "absolute",
            bottom:         "calc(100% + 10px)",
            left:           "50%",
            transform:      "translateX(-50%)",
            background:     "#1A1A2E",
            border:         "1px solid rgba(255,255,255,0.12)",
            borderRadius:   12,
            padding:        "7px 13px",
            fontSize:       12,
            fontWeight:     600,
            color:          "rgba(255,255,255,0.9)",
            whiteSpace:     "nowrap",
            pointerEvents:  "none",
            zIndex:         20,
            animation:      bubbleLeave
              ? "perchBubbleOut 0.3s ease-in forwards"
              : "perchBubbleIn  0.22s ease-out forwards",
            boxShadow:      "0 6px 20px rgba(0,0,0,0.4)",
          }}
        >
          {message}
          {/* Tail */}
          <div style={{
            position:       "absolute",
            bottom:         -7,
            left:           "50%",
            transform:      "translateX(-50%)",
            width:          0,
            height:         0,
            borderLeft:     "6px solid transparent",
            borderRight:    "6px solid transparent",
            borderTop:      "7px solid rgba(255,255,255,0.12)",
          }}/>
          <div style={{
            position:       "absolute",
            bottom:         -6,
            left:           "50%",
            transform:      "translateX(-50%)",
            width:          0,
            height:         0,
            borderLeft:     "5px solid transparent",
            borderRight:    "5px solid transparent",
            borderTop:      "6px solid #1A1A2E",
          }}/>
        </div>
      )}

      {/* Mascot — gently bobbing */}
      <div style={{
        animation: "perchBob 3.8s ease-in-out infinite",
      }}>
        <Mascot
          size={size}
          {...mascotProps}
          state={mascotState}
          animate={true}
        />
      </div>
    </div>
  );
}
