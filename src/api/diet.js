const API_BASE = 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found. Please log in.');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse(res, errorMsg) {
  if (res.status === 401) throw new Error('Authentication failed. Please log in again.');
  if (res.status === 404) throw new Error('Not found.');
  if (!res.ok) {
    let detail = res.statusText;
    try { const j = await res.json(); detail = j.detail || detail; } catch {}
    throw new Error(`${errorMsg}: ${detail}`);
  }
  return res.json();
}

// ── FOOD SEARCH ───────────────────────────────────────────────────────────────
export async function searchFoods(query, limit = 20) {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  const res = await fetch(`${API_BASE}/api/diet/foods/search?${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to search foods');
}

export async function getPopularFoods(limit = 50) {
  const res = await fetch(`${API_BASE}/api/diet/foods/popular?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to fetch popular foods');
}

// ── DIET PLANS ────────────────────────────────────────────────────────────────
export async function createDietPlan(planData) {
  const res = await fetch(`${API_BASE}/api/diet/plans`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(planData),
  });
  return handleResponse(res, 'Failed to create diet plan');
}

export async function getActiveDietPlan() {
  const res = await fetch(`${API_BASE}/api/diet/plans/active`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 401) throw new Error('Authentication failed. Please log in again.');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function getDietPlanById(planId) {
  const res = await fetch(`${API_BASE}/api/diet/plans/${planId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to fetch diet plan');
}

export async function getMyDietPlans() {
  const res = await fetch(`${API_BASE}/api/diet/plans`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to fetch diet plans');
}

export async function updateDietPlan(planId, updates) {
  const res = await fetch(`${API_BASE}/api/diet/plans/${planId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  return handleResponse(res, 'Failed to update diet plan');
}

export async function deleteDietPlan(planId) {
  const res = await fetch(`${API_BASE}/api/diet/plans/${planId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to delete diet plan');
}

export async function activateDietPlan(planId) {
  const res = await fetch(`${API_BASE}/api/diet/plans/${planId}/activate`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to activate diet plan');
}

// ── MEAL TEMPLATES ────────────────────────────────────────────────────────────
export async function addMealToPlan(planId, mealData) {
  const res = await fetch(`${API_BASE}/api/diet/plans/${planId}/meals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(mealData),
  });
  return handleResponse(res, 'Failed to add meal to plan');
}

export async function getPlanMeals(planId) {
  const res = await fetch(`${API_BASE}/api/diet/plans/${planId}/meals`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to fetch plan meals');
}

// ── MEAL LOGGING ──────────────────────────────────────────────────────────────

/**
 * Log a meal.
 * payload shape: {
 *   meal_name: string,            // "breakfast" | "lunch" | "dinner" | "snack" | custom
 *   meal_template_id?: number,
 *   followed_plan?: boolean,
 *   foods_eaten: [{               // all foods in ONE meal, as a list
 *     name, food_id?, grams, calories, protein, carbs, fats
 *   }],
 *   energy_level?: string,
 *   hunger_level?: string,
 * }
 */
export async function logMeal(mealData) {
  const res = await fetch(`${API_BASE}/api/diet/logs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(mealData),
  });
  return handleResponse(res, 'Failed to log meal');
}

/**
 * Returns { meals: [...], totals: {...}, targets: {...} }
 * Each meal has: { id, meal_name, foods_eaten, total_calories, total_protein, ... }
 */
export async function getTodaysMeals() {
  const res = await fetch(`${API_BASE}/api/diet/logs/today`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Failed to fetch today's meals");
}

export async function getWeeklyStats() {
  const res = await fetch(`${API_BASE}/api/diet/stats/weekly`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, 'Failed to fetch weekly stats');
}
