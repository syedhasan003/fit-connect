import apiClient from './client';

// ── Body Weight ────────────────────────────────────────────────────────────────

export async function getWeightHistory(limit = 14) {
  const res = await apiClient.get(`/api/metrics/weight?limit=${limit}`);
  return res.data;
}

export async function logWeight(weight_kg, note = null) {
  const res = await apiClient.post('/api/metrics/weight', { weight_kg, note });
  return res.data;
}

// ── Water ──────────────────────────────────────────────────────────────────────

export async function getWaterToday() {
  const res = await apiClient.get('/api/metrics/water/today');
  return res.data;
}

export async function updateWaterToday(glasses, target_glasses = 8) {
  const res = await apiClient.patch('/api/metrics/water/today', { glasses, target_glasses });
  return res.data;
}

// ── Weekly Adherence ──────────────────────────────────────────────────────────

export async function getWeekAdherence() {
  const res = await apiClient.get('/api/metrics/sessions/week');
  return res.data;
}
