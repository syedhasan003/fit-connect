import api from "./axios";

/**
 * Weekly workout stats — sessions, minutes, exercises, avg duration, adherence
 * GET /api/workouts/stats/weekly
 */
export async function getWeeklyWorkoutStats() {
  const res = await api.get("/api/workouts/stats/weekly");
  return res.data;
}

/**
 * Per-day completion for the current Mon–Sun week
 * GET /api/metrics/sessions/week
 */
export async function getWeekSessions() {
  const res = await api.get("/api/metrics/sessions/week");
  return res.data;
}

/**
 * Nutrition averages for the last 7 days
 * GET /api/diet/stats/weekly
 */
export async function getWeeklyNutritionStats() {
  const res = await api.get("/api/diet/stats/weekly");
  return res.data;
}

/**
 * Weight history (ascending, last N entries)
 * GET /api/metrics/weight?limit=14
 */
export async function getWeightHistory(limit = 14) {
  const res = await api.get("/api/metrics/weight", { params: { limit } });
  return res.data;
}

/**
 * Today's water intake
 * GET /api/metrics/water/today
 */
export async function getWaterToday() {
  const res = await api.get("/api/metrics/water/today");
  return res.data;
}
