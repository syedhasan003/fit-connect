import api from "./client";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Fetch gyms near a location with optional filters.
 *
 * @param {Object} params
 * @param {number}  [params.lat]          - User latitude
 * @param {number}  [params.lng]          - User longitude
 * @param {number}  [params.radiusKm=5]   - Search radius in km
 * @param {boolean} [params.is24x7]
 * @param {boolean} [params.hasTrainers]
 * @param {boolean} [params.hasSauna]
 * @param {boolean} [params.isPremium]
 * @param {boolean} [params.hasPool]
 * @param {boolean} [params.openNow]
 * @param {string}  [params.sortBy]       - "distance" | "popular" | "newest"
 * @param {number}  [params.limit=30]
 * @returns {Promise<Array>}
 */
export async function fetchGyms({
  lat,
  lng,
  radiusKm = 5,
  is24x7,
  hasTrainers,
  hasSauna,
  isPremium,
  hasPool,
  openNow,
  sortBy = "distance",
  limit = 30,
} = {}) {
  const params = { radius_km: radiusKm, sort_by: sortBy, limit };

  if (lat != null) params.user_lat = lat;
  if (lng != null) params.user_lng = lng;
  if (is24x7     != null) params.is_24_7       = is24x7;
  if (hasTrainers != null) params.has_trainers  = hasTrainers;
  if (hasSauna   != null) params.has_sauna      = hasSauna;
  if (isPremium  != null) params.is_premium     = isPremium;
  if (hasPool    != null) params.has_pool       = hasPool;
  if (openNow    != null) params.open_now       = openNow;

  const { data } = await api.get("/discovery/gyms", { params });
  return data;
}

/**
 * Fetch full detail for a single gym.
 * @param {number} gymId
 * @param {number} [lat]
 * @param {number} [lng]
 */
export async function fetchGymDetail(gymId, lat, lng) {
  const params = {};
  if (lat != null) params.user_lat = lat;
  if (lng != null) params.user_lng = lng;
  const { data } = await api.get(`/discovery/gyms/${gymId}`, { params });
  return data;
}

/**
 * Returns the proxied photo URL for a given photo_reference.
 * The backend fetches from Google and streams back the image,
 * keeping the API key server-side.
 *
 * @param {string} photoReference - Google Places photo_reference string
 * @param {number} [maxWidth=600]
 * @returns {string} URL to use as <img src>
 */
export function gymPhotoUrl(photoReference, maxWidth = 600) {
  if (!photoReference) return null;
  const token = localStorage.getItem("access_token");
  // We need auth — build a URL that the browser will call with the token header.
  // We use a transparent fetch + objectURL approach inside GymPhotoImg component.
  return `${BASE}/discovery/photo?ref=${encodeURIComponent(photoReference)}&maxwidth=${maxWidth}`;
}

/**
 * Fetch a gym photo and return a blob URL for use in <img>.
 * Handles auth header transparently.
 * @param {string} photoReference
 * @param {number} [maxWidth=600]
 * @returns {Promise<string|null>} blobURL or null on failure
 */
export async function fetchGymPhotoBlob(photoReference, maxWidth = 600) {
  if (!photoReference) return null;
  try {
    const resp = await api.get("/discovery/photo", {
      params: { ref: photoReference, maxwidth: maxWidth },
      responseType: "blob",
    });
    return URL.createObjectURL(resp.data);
  } catch {
    return null;
  }
}

/**
 * Fetch featured / trending gyms.
 * @param {number} [lat]
 * @param {number} [lng]
 */
export async function fetchFeaturedGyms(lat, lng) {
  const params = {};
  if (lat != null) params.user_lat = lat;
  if (lng != null) params.user_lng = lng;
  const { data } = await api.get("/discovery/featured", { params });
  return data;
}
