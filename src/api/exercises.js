import { API_BASE } from "./config.js";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// EXERCISES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated exercise list with optional filters.
 * @param {Object} params - search, muscle, equipment, difficulty, category, limit, offset
 */
export async function fetchExercises(params = {}) {
  const query = new URLSearchParams();
  if (params.search)     query.set("search",     params.search);
  if (params.muscle)     query.set("muscle",     params.muscle);
  if (params.equipment)  query.set("equipment",  params.equipment);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.category)   query.set("category",   params.category);
  query.set("limit",  params.limit  ?? 30);
  query.set("offset", params.offset ?? 0);

  const res = await fetch(`${API_BASE}/api/exercises/?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch exercises");
  return res.json();
}

/**
 * Fetch a single exercise by ID.
 */
export async function fetchExerciseById(id) {
  const res = await fetch(`${API_BASE}/api/exercises/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Exercise not found");
  return res.json();
}

/**
 * Fetch a YouTube video ID for an exercise demonstrating proper form.
 * Cached in the DB after first call — subsequent calls are instant.
 * Returns { video_id: string|null, cached: bool }
 */
export async function fetchExerciseVideo(id) {
  const res = await fetch(`${API_BASE}/api/exercises/${id}/video`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return { video_id: null, cached: false };
  return res.json();
}

/**
 * Fetch filter metadata (all unique muscles, equipment, difficulties, categories).
 */
export async function fetchExerciseFilters() {
  const res = await fetch(`${API_BASE}/api/exercises/meta/filters`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch exercise filters");
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// FOODS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Search foods by name/brand with optional filters.
 * @param {Object} params - search, category, is_indian, limit, offset
 */
export async function fetchFoods(params = {}) {
  const query = new URLSearchParams();
  if (params.search)   query.set("search",    params.search);
  if (params.category) query.set("category",  params.category);
  if (params.is_indian !== undefined) query.set("is_indian", params.is_indian);
  query.set("limit",  params.limit  ?? 30);
  query.set("offset", params.offset ?? 0);

  const res = await fetch(`${API_BASE}/api/foods/?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch foods");
  return res.json();
}

/**
 * Fetch a single food item by ID.
 */
export async function fetchFoodById(id) {
  const res = await fetch(`${API_BASE}/api/foods/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Food not found");
  return res.json();
}

/**
 * Fetch all food categories.
 */
export async function fetchFoodCategories() {
  const res = await fetch(`${API_BASE}/api/foods/meta/categories`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch food categories");
  return res.json();
}
