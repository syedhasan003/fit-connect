/**
 * AgentStatusPill.jsx
 * ────────────────────
 * A persistent, always-visible strip on the Home screen that shows the
 * user their agent is alive and watching.
 *
 * Idle:     [Chip] Central is watching  ·  Last: Morning Brief · 3h ago  ›
 * On event: Chip flashes white → fades to purple. Text updates to "just now".
 * Expanded: Slide-down log of last 3 agent events with icons + timestamps.
 */

import { useState, useEffect, useRef } from "react";
import { useAgent } from "../../context/AgentContext";
import CentralMascot from "./CentralMascot";

// ── Keyframe injection ────────────────────────────────────────────────────────
const STYLES = `
@keyframes pillSlideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 10)  return "just now";
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AgentStatusPill() {
  const { isConnected, lastEvent, agentHistory } = useAgent();
  const [expanded, setExpanded]   = useState(false);
  const [flashing, setFlashing]   = useState(false);
  const [tick, setTick]           = useState(0); // forces timestamp re-render every minute
  const flashTimer                = useRef(null);
  const prevEventRef              = useRef(null);

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById("agent-pill-styles")) return;
    const tag = document.createElement("style");
    tag.id = "agent-pill-styles";
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }, []);

  // Flash orb on new event
  useEffect(() => {
    if (!lastEvent || lastEvent === prevEventRef.current) return;
    prevEventRef.current = lastEvent;
    setFlashing(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashing(false), 1400);
    return () => clearTimeout(flashTimer.current);
  }, [lastEvent]);

  // Re-render timestamps every 60s so "3m ago" stays accurate
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Status text
  const lastLabel = lastEvent
    ? `${lastEvent.label} · ${relativeTime(lastEvent.timestamp)}`
    : "No events yet";

  // Mascot state
  const mascotState = flashing ? "flash" : isConnected ? "idle" : "offline";

  return (
    <div style={{ margin: "0 0 14px 0" }}>
      {/* ── Pill ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(139,92,246,0.07)",
          border: "1px solid rgba(139,92,246,0.18)",
          borderRadius: expanded ? "12px 12px 0 0" : 12,
          padding: "6px 14px 6px 10px",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.2s, border-color 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.12)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(139,92,246,0.07)"}
      >
        {/* Chip mascot */}
        <CentralMascot size={34} state={mascotState} />

        {/* Labels */}
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: isConnected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
            whiteSpace: "nowrap",
          }}>
            {isConnected ? "Central is watching" : "Agent offline"}
          </span>
          {lastEvent && (
            <>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>·</span>
              <span style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {lastLabel}
              </span>
            </>
          )}
        </span>

        {/* Chevron */}
        <span style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s",
          flexShrink: 0,
        }}>
          ▾
        </span>
      </button>

      {/* ── Expanded activity log ─────────────────────────────────────── */}
      {expanded && (
        <div style={{
          background: "rgba(139,92,246,0.05)",
          border: "1px solid rgba(139,92,246,0.18)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "2px 0 6px",
          animation: "pillSlideDown 0.22s ease-out",
        }}>
          {agentHistory.length === 0 ? (
            <p style={{
              margin: 0,
              padding: "10px 14px",
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
            }}>
              No agent activity yet today.
            </p>
          ) : (
            agentHistory.slice(0, 3).map((evt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{evt.icon}</span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {evt.title || evt.label}
                  </p>
                  {evt.body && (
                    <p style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {evt.body}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  flexShrink: 0,
                }}>
                  {relativeTime(evt.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
