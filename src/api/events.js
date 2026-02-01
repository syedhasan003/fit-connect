import api from "./client";

/**
 * logEvent(type, payload)
 *
 * Fire-and-forget. Call it anywhere — it never blocks the UI.
 * The backend stores every event in the `behaviour_log` table.
 *
 * Event types used across the app:
 *   central_question_asked      { question }
 *   central_answer_received     { question, answerLength }
 *   central_error               { question, error }
 *   suggestion_chip_clicked     { chip }
 *   reminder_missed_viewed      { reminderId, reason? }
 *   workout_logged              { workoutId, duration }
 *   workout_skipped             { scheduledDate, reason? }
 *   home_opened                 {}
 *   vault_item_viewed           { itemId, category }
 */
export async function logEvent(type, payload = {}) {
  try {
    await api.post("/behaviour/log", {
      event_type: type,
      payload,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Silent — never crash the app over logging
  }
}