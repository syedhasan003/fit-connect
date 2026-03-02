import { API_BASE } from "./config.js";
/**
 * agent.js
 * ========
 * Frontend API calls for the agent layer.
 * Matches backend /api/agent/* endpoints.
 */

import axios from "axios";

const BASE = `${API_BASE}/api/agent`;

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Get the latest morning brief for the logged-in user. */
export async function getMorningBrief() {
  const { data } = await axios.get(`${BASE}/morning-brief`, {
    headers: authHeaders(),
  });
  return data;
}

/** Get + clear pending offline notifications (called on app open). */
export async function getPendingNotifications() {
  const { data } = await axios.get(`${BASE}/notifications`, {
    headers: authHeaders(),
  });
  return data;
}

/** Get the latest weekly adaptation report. */
export async function getWeeklyAdaptation() {
  const { data } = await axios.get(`${BASE}/weekly-adaptation`, {
    headers: authHeaders(),
  });
  return data;
}

/** Get latest correlation insights. */
export async function getCorrelations() {
  const { data } = await axios.get(`${BASE}/correlations`, {
    headers: authHeaders(),
  });
  return data;
}

/**
 * Manually trigger a background agent job (dev/testing).
 * @param {"morning_brief"|"narrative"|"nudge"|"adaptation"} jobName
 */
export async function triggerAgentJob(jobName) {
  const { data } = await axios.post(`${BASE}/trigger/${jobName}`, {}, {
    headers: authHeaders(),
  });
  return data;
}
