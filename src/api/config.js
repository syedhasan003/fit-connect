/**
 * config.js
 * ─────────
 * Single source of truth for API base URLs.
 *
 * Set VITE_API_URL in .env.local to point at your backend:
 *   VITE_API_URL=https://api.fitconnect.in
 *
 * Falls back to localhost for local development.
 */

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const WS_BASE  = import.meta.env.VITE_WS_URL  ||
  API_BASE.replace(/^http/, "ws");  // http→ws, https→wss automatically
