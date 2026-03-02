/**
 * AgentContext.jsx
 * ─────────────────
 * Single source of truth for the agent's live state.
 *
 * Provides to any component:
 *   • isConnected  — WebSocket is live
 *   • lastEvent    — most recent agent event object { type, title, body, timestamp }
 *   • agentHistory — last 10 events (newest first)
 *
 * The WebSocket connection lives here so BottomNav, Home, and any other
 * screen can read agent state without opening extra sockets.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { showAgentToast } from "../hooks/useAgentSocket";
import { getPendingNotifications } from "../api/agent";
import { WS_BASE } from "../api/config.js";

const AgentContext = createContext({
  isConnected: false,
  lastEvent: null,
  agentHistory: [],
});

export function useAgent() {
  return useContext(AgentContext);
}

const MAX_HISTORY = 10;

const EVENT_META = {
  morning_brief: { icon: "☀️", label: "Morning Brief" },
  nudge:         { icon: "💡", label: "Nudge" },
  reminder:      { icon: "⏰", label: "Reminder" },
  adaptation:    { icon: "📊", label: "Weekly Adaptation" },
  insight:       { icon: "🔍", label: "Insight" },
};

export function AgentProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent]     = useState(null);
  const [agentHistory, setAgentHistory] = useState([]);

  const wsRef        = useRef(null);
  const pingRef      = useRef(null);
  const retryRef     = useRef(null);
  const retryDelay   = useRef(1000);
  const mountedRef   = useRef(true);

  // ── Push event into context state ──────────────────────────────────────
  const pushEvent = useCallback((raw) => {
    const meta = EVENT_META[raw.type] || { icon: "ℹ️", label: "Agent" };
    const event = {
      ...raw,
      icon:      meta.icon,
      label:     meta.label,
      timestamp: new Date(),
    };
    setLastEvent(event);
    setAgentHistory((prev) => [event, ...prev].slice(0, MAX_HISTORY));

    // Fire toast
    showAgentToast({
      title:    raw.title || meta.label,
      body:     raw.body  || raw.message || "",
      type:     raw.type  || "info",
      duration: raw.type === "reminder" ? 10000 : 7000,
    });
  }, []);

  // ── Connect WebSocket ───────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/agent?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      retryDelay.current = 1000;

      // Keepalive ping every 30s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 30000);
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(e.data);
        if (data.type === "pong" || data.type === "connected") return;
        pushEvent(data);
      } catch (_) {}
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      clearInterval(pingRef.current);

      // Exponential backoff reconnect (max 30s)
      retryRef.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
        connect();
      }, retryDelay.current);
    };

    ws.onerror = () => ws.close();
  }, [pushEvent]);

  // ── Drain pending offline notifications on login ────────────────────────
  const drainPending = useCallback(() => {
    getPendingNotifications()
      .then(({ notifications = [] }) => {
        notifications.forEach((n, i) => {
          setTimeout(() => {
            pushEvent({ type: n.type || "info", title: n.title, body: n.body });
          }, i * 1200);
        });
      })
      .catch(() => {});
  }, [pushEvent]);

  // ── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (isAuthenticated) {
      connect();
      drainPending();
    }
    return () => {
      mountedRef.current = false;
      clearInterval(pingRef.current);
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [isAuthenticated, connect, drainPending]);

  return (
    <AgentContext.Provider value={{ isConnected, lastEvent, agentHistory }}>
      {children}
    </AgentContext.Provider>
  );
}
