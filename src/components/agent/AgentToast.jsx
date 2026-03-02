/**
 * AgentToast.jsx
 * ==============
 * Global notification toast that renders agent events (nudges, morning briefs,
 * reminders, adaptations) as slide-in banners at the top of the screen.
 *
 * Mount once inside App.jsx. Listens for "agent:toast" CustomEvents dispatched
 * by showAgentToast() from useAgentSocket.
 *
 * Stacks up to 3 toasts. Auto-dismisses after `duration` ms.
 */

import { useEffect, useState, useCallback } from "react";

const TYPE_CONFIG = {
  morning_brief: { icon: "☀️", color: "#6366f1" },
  nudge:         { icon: "💡", color: "#10b981" },
  reminder:      { icon: "⏰", color: "#f59e0b" },
  adaptation:    { icon: "📊", color: "#8b5cf6" },
  insight:       { icon: "🔍", color: "#3b82f6" },
  info:          { icon: "ℹ️", color: "#6b7280" },
};

function Toast({ toast, onDismiss }) {
  const { icon, color } = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 350);
    }, toast.duration || 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast, onDismiss]);

  return (
    <div
      onClick={() => {
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 350);
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 14,
        background: "#1a1a2e",
        border: `1px solid ${color}44`,
        boxShadow: `0 4px 24px ${color}22, 0 1px 4px #0008`,
        cursor: "pointer",
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",
        maxWidth: 340,
        width: "100%",
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#f1f5f9",
            marginBottom: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {toast.title}
          </div>
        )}
        {toast.body && (
          <div style={{
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {toast.body}
          </div>
        )}
      </div>
      {/* Accent bar */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: "14px 0 0 14px",
        background: color,
      }} />
    </div>
  );
}

export default function AgentToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (evt) => {
      const toast = evt.detail;
      setToasts((prev) => {
        // Cap at 3 toasts
        const next = [...prev, toast];
        return next.length > 3 ? next.slice(-3) : next;
      });
    };
    window.addEventListener("agent:toast", handler);
    return () => window.removeEventListener("agent:toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      alignItems: "center",
      pointerEvents: "none",
      width: "min(calc(100vw - 32px), 360px)",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto", width: "100%", position: "relative" }}>
          <Toast toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
