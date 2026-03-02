/**
 * useAgentSocket.js
 * =================
 * NOTE: The WebSocket connection now lives in AgentContext.jsx.
 * This file is kept only to export `showAgentToast`, which dispatches
 * a custom DOM event consumed by the global AgentToast component.
 */

/**
 * Fire a toast notification from anywhere in the app.
 *
 * Usage:
 *   import { showAgentToast } from "../hooks/useAgentSocket";
 *   showAgentToast({ title: "Nudge", body: "You haven't eaten in 5 hours.", type: "nudge" });
 */
export function showAgentToast({ title, body, type = "info", duration = 6000 }) {
  const event = new CustomEvent("agent:toast", {
    detail: { title, body, type, duration, id: Date.now() },
  });
  window.dispatchEvent(event);
}
