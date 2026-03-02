import api from "./axios";

/**
 * Submit onboarding goals — marks the user as onboarded on the backend
 * and stores structured health context for the agent pipeline.
 */
export async function submitOnboardingGoals(payload) {
  const res = await api.post("/onboarding/goals", payload);
  return res.data;
}

/**
 * Quick status check — returns { onboarding_completed, full_name }
 * Used by Login to decide whether to route to /onboarding or /home.
 */
export async function getOnboardingStatus() {
  const res = await api.get("/onboarding/status");
  return res.data;
}
