import { API_BASE as BASE_URL } from "./config.js";
import api from "./axios";


// ── Legacy non-streaming (kept for backward compat) ───────────────────────
export async function askCentral(question) {
  const res = await api.post("/ai/central/ask", { question });
  return res.data;
}

// ── Streaming (primary) ──────────────────────────────────────────────────
/**
 * Streams a response from Central AI using Server-Sent Events.
 *
 * Uses native fetch (not axios) because EventSource doesn't support POST with body.
 *
 * @param {object} params
 * @param {string}        params.question             - The user's current question
 * @param {Array}         params.conversationHistory  - [{role, content}] prior messages
 * @param {object}        params.flowContext           - {intent, answers, preferences}
 * @param {function}      params.onToken              - Called with each text token
 * @param {function}      params.onDone               - Called when stream completes
 * @param {function}      params.onError              - Called with Error on failure
 * @param {AbortSignal}   params.signal               - AbortController.signal for stop
 */
export async function streamCentral({
  question,
  conversationHistory = [],
  flowContext = {},
  onToken,
  onAgent,   // NEW: called with { agent, intent } when server announces active agent
  onDone,
  onError,
  signal,
}) {
  const token = localStorage.getItem("access_token");

  let response;
  try {
    response = await fetch(`${BASE_URL}/ai/central/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question,
        conversation_history: conversationHistory,
        flow_context: flowContext,
      }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return;
    onError?.(err);
    return;
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => `HTTP ${response.status}`);
    onError?.(new Error(errText));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process all complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep potentially incomplete last chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const raw = trimmed.slice(5).trim();
        if (!raw) continue;

        try {
          const parsed = JSON.parse(raw);
          if (parsed.agent) {
            onAgent?.(parsed);   // { agent, intent }
          } else if (parsed.token) {
            onToken?.(parsed.token);
          } else if (parsed.done) {
            onDone?.();
            return;
          } else if (parsed.error) {
            onError?.(new Error(parsed.error));
            return;
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    onError?.(err);
    return;
  }

  onDone?.();
}

// ── Preferences ──────────────────────────────────────────────────────────

/**
 * Get locked preferences for a flow type.
 * Returns { preference_type, data, locked } — data is {} if none saved.
 */
export async function getPreferences(prefType) {
  const res = await api.get(`/ai/central/preferences/${prefType}`);
  return res.data;
}

/**
 * Save / upsert preferences for a flow type. Locks them.
 * @param {string} prefType - 'workout' | 'meal' | 'reminder'
 * @param {object} data     - key/value answers from the flow
 */
export async function savePreferences(prefType, data) {
  const res = await api.post("/ai/central/preferences", {
    preference_type: prefType,
    data,
  });
  return res.data;
}

/**
 * Clear preferences so the user gets re-onboarded next time.
 */
export async function clearPreferences(prefType) {
  const res = await api.delete(`/ai/central/preferences/${prefType}`);
  return res.data;
}

// ── Dislike ───────────────────────────────────────────────────────────────

/**
 * Log a specific exercise or food item as disliked.
 * Stored in health_memory and injected into future system prompts.
 * @param {string} itemType  - 'exercise' | 'food' | 'ingredient'
 * @param {string} itemName  - The exact name of the item
 * @param {string} context   - Optional context string (e.g., "From workout plan")
 */
export async function logDislike(itemType, itemName, context = null) {
  const res = await api.post("/ai/central/dislike", {
    item_type: itemType,
    item_name: itemName,
    context,
  });
  return res.data;
}

// ── Flow Questions ────────────────────────────────────────────────────────

/**
 * Get the question list for a preference flow.
 * Returns { flow_type, questions: [{key, question, options, allow_custom}] }
 * @param {string} flowType - 'workout' | 'meal' | 'reminder'
 */
export async function getFlowQuestions(flowType) {
  const res = await api.get(`/ai/central/questions/${flowType}`);
  return res.data;
}


// ── Voice — STT + TTS ─────────────────────────────────────────────────────

/**
 * Transcribe an audio Blob to text via Whisper.
 * @param {Blob} audioBlob  - recorded audio (webm/opus from MediaRecorder)
 * @param {string} language - optional ISO-639-1 code (e.g. 'en')
 * @returns {Promise<{ text: string, language: string }>}
 */
export async function transcribeAudio(audioBlob, language = null) {
  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  if (language) formData.append("language", language);

  const res = await fetch(`${BASE_URL}/ai/voice/transcribe`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(err);
  }
  return res.json();
}

/**
 * Convert text to speech and return an audio URL for playback.
 * Streams the MP3 from the server, creates an object URL.
 * @param {string} text
 * @param {object} opts - { voice, speed }
 * @returns {Promise<string>} objectURL — remember to URL.revokeObjectURL() after use
 */
export async function speakText(text, { voice = null, speed = 1.0 } = {}) {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${BASE_URL}/ai/voice/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, voice, speed }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`TTS failed: ${err}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
