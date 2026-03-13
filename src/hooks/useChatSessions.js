/**
 * useChatSessions
 * ───────────────────────────────────────────────────────────────
 * Manages multiple Central chat sessions in localStorage.
 *
 * Storage layout:
 *   "central_sessions"        → JSON array of session summaries
 *   "central_sess_{id}"       → JSON array of raw messages for that session
 *
 * Sessions are capped at MAX_SESSIONS (30). Oldest are pruned automatically.
 */

import { useState, useCallback } from "react";

const INDEX_KEY    = "central_sessions";
const MSG_KEY      = (id) => `central_sess_${id}`;
const MAX_SESSIONS = 30;

// ── Helpers ────────────────────────────────────────────────────────────────
function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveIndex(sessions) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(sessions));
  } catch { /* quota — silently ignore */ }
}

function loadMessages(id) {
  try {
    const raw = localStorage.getItem(MSG_KEY(id));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(id, messages) {
  // Only persist user + assistant turns (strip UI-only fields)
  const slim = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content && !m.isStreaming)
    .map((m) => ({ id: m.id, role: m.role, content: m.content }));
  try {
    localStorage.setItem(MSG_KEY(id), JSON.stringify(slim));
  } catch { /* quota */ }
}

function removeMessages(id) {
  try { localStorage.removeItem(MSG_KEY(id)); } catch { /* ignore */ }
}

/** Get the auto-title from the first user message */
function deriveTitle(messages) {
  const first = messages.find((m) => m.role === "user" && m.content);
  if (!first) return "New chat";
  const t = first.content.trim();
  return t.length > 42 ? t.slice(0, 40) + "…" : t;
}

/** Get a short preview from the first completed assistant message */
function derivePreview(messages) {
  const first = messages.find((m) => m.role === "assistant" && m.content && !m.isStreaming);
  if (!first) return "";
  const t = first.content.replace(/[*#|_~`>]/g, "").replace(/\s+/g, " ").trim();
  return t.length > 65 ? t.slice(0, 62) + "…" : t;
}

// ── The hook ───────────────────────────────────────────────────────────────
export default function useChatSessions() {
  const [sessions, setSessions] = useState(() => loadIndex());

  /**
   * Generate a new unique session ID (call when starting a fresh chat).
   * Does NOT save anything yet — call saveSession once there are messages.
   */
  const newSessionId = useCallback(() => `sess_${Date.now()}`, []);

  /**
   * Persist the current session messages + update the index entry.
   * Safe to call on every message change (idempotent).
   */
  const saveSession = useCallback((id, messages) => {
    if (!id || !messages.length) return;

    const title   = deriveTitle(messages);
    const preview = derivePreview(messages);
    const now     = Date.now();

    saveMessages(id, messages);

    setSessions((prev) => {
      const existing = prev.find((s) => s.id === id);
      let updated;
      if (existing) {
        updated = prev.map((s) =>
          s.id === id ? { ...s, title, preview, updatedAt: now } : s
        );
      } else {
        const entry = { id, title, preview, createdAt: now, updatedAt: now };
        // Prepend newest, cap at MAX_SESSIONS
        updated = [entry, ...prev].slice(0, MAX_SESSIONS);
        // Prune messages from removed sessions
        if (prev.length >= MAX_SESSIONS) {
          const removed = prev.slice(MAX_SESSIONS - 1);
          removed.forEach((s) => removeMessages(s.id));
        }
      }
      saveIndex(updated);
      return updated;
    });
  }, []);

  /**
   * Load the full messages array for a session (for display in chat).
   */
  const loadSession = useCallback((id) => {
    return loadMessages(id);
  }, []);

  /**
   * Delete a session from the index and remove its messages.
   */
  const deleteSession = useCallback((id) => {
    removeMessages(id);
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveIndex(updated);
      return updated;
    });
  }, []);

  return { sessions, newSessionId, saveSession, loadSession, deleteSession };
}
