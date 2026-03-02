import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate as useNav } from "react-router-dom";
import {
  streamCentral,
  getPreferences,
  savePreferences,
  getFlowQuestions,
  transcribeAudio,
  speakText,
} from "../../api/ai";
import GlowingOrb from "../../components/central/GlowingOrb";
import Suggestions from "../../components/central/Suggestions";
import TodaysInsight from "../../components/central/TodaysInsight";
import MessageHistory from "../../components/central/MessageHistory";
import CentralInput from "../../components/central/CentralInput";
import BottomNav from "../../components/navigation/BottomNav";

// ── Flow intents that need preference collection before generating ─────────
const FLOW_INTENTS = ["workout", "meal", "reminder"];

// ── Lightweight frontend intent detection (mirrors backend patterns) ───────
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/create.*workout|build.*workout|workout.*plan|training.*plan|new.*program|exercise.*plan|design.*workout|new.*routine/.test(t)) return "workout";
  if (/meal.*plan|diet.*plan|nutrition.*plan|generate.*meal|food.*plan|what.*should.*eat|design.*meal|eating.*plan/.test(t)) return "meal";
  if (/set.*reminder|remind me|create.*reminder|add.*reminder|new.*reminder|schedule.*reminder/.test(t)) return "reminder";
  if (/motivat|hype me|inspire|feeling.*lazy|pump me up|need.*motivation|keep.*going|encourage/.test(t)) return "motivate";
  if (/my progress|analyz.*progress|progress.*report|how.*i.*doing|weekly.*summary|show.*stats|fitness.*summary/.test(t)) return "progress";
  return "general";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function CentralLayout() {
  const location = useLocation();
  const navReplace = useNav();

  // ── Core state ────────────────────────────────────────────────────────────
  const [messages,    setMessages]    = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);  // e.g. "🏋️ Personal Trainer"
  const [isSpeaking,  setIsSpeaking]  = useState(false); // TTS playback in progress
  const [voiceEnabled, setVoiceEnabled] = useState(
    () => localStorage.getItem("voice_enabled") === "true"
  );

  // Preference collection flow state: null | { type, questions, step, answers }
  const [flow, setFlow] = useState(null);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const abortRef          = useRef(null);
  const streamingMsgIdRef = useRef(null);
  const messagesEndRef    = useRef(null);
  const audioRef          = useRef(null);   // current <Audio> object for TTS
  const ttsUrlRef         = useRef(null);   // current objectURL to revoke when done

  // We keep a ref to conversation history so startStreaming (stable callback)
  // always reads the latest messages without needing them as a dependency.
  const convHistoryRef = useRef([]);
  useEffect(() => {
    convHistoryRef.current = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          !m.isStreaming &&
          m.content
      )
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle preset question from other screens (e.g., Progress → Central)
  // StrictMode-proof: schedule via setTimeout and return clearTimeout as cleanup.
  // In dev, StrictMode does mount→unmount→remount; the unmount cleanup cancels
  // the pending timer so handleSubmit only fires once (on the final real mount).
  useEffect(() => {
    const preset = location.state?.preset;
    if (!preset) return;
    // Clear from history immediately so back-nav never re-fires it
    navReplace(location.pathname, { replace: true, state: {} });
    const timer = setTimeout(() => handleSubmit(preset), 10);
    return () => clearTimeout(timer); // StrictMode unmount cancels this
  }, []); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────
  // startStreaming — adds a streaming placeholder message and kicks off SSE
  // Stable callback: no dependencies since it only uses refs and setMessages.
  // ─────────────────────────────────────────────────────────────────────────
  // ── TTS helper — speak the completed response ─────────────────────────────
  const speakResponse = useCallback(async (text) => {
    if (!text?.trim()) return;
    // Strip markdown for cleaner speech
    const clean = text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\|[^\n]*/g, "")   // table rows
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim()
      .slice(0, 800);  // keep TTS short — summarise only the first ~800 chars

    try {
      setIsSpeaking(true);
      // Revoke previous URL if any
      if (ttsUrlRef.current) { URL.revokeObjectURL(ttsUrlRef.current); ttsUrlRef.current = null; }
      const url = await speakText(clean);
      ttsUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); ttsUrlRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); };
      await audio.play();
    } catch (err) {
      console.warn("[TTS] error:", err);
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (ttsUrlRef.current) { URL.revokeObjectURL(ttsUrlRef.current); ttsUrlRef.current = null; }
    setIsSpeaking(false);
  }, []);

  // Persist voice toggle preference
  useEffect(() => {
    localStorage.setItem("voice_enabled", voiceEnabled);
    if (!voiceEnabled) stopSpeaking();
  }, [voiceEnabled, stopSpeaking]);

  const startStreaming = useCallback((question, intent, prefs) => {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    streamingMsgIdRef.current = msgId;
    setIsStreaming(true);
    setActiveAgent(null);

    // Add an empty streaming placeholder that will be filled token-by-token
    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        role: "assistant",
        content: "",
        isStreaming: true,
        intent: intent || "general",
      },
    ]);

    const abort = new AbortController();
    abortRef.current = abort;

    const flowContext = intent ? { intent, answers: prefs || {} } : {};

    // Track full response text for TTS
    let fullText = "";

    streamCentral({
      question,
      conversationHistory: convHistoryRef.current,
      flowContext,
      signal: abort.signal,
      onAgent: ({ agent }) => {
        setActiveAgent(agent);
        // Update the streaming message with agent label
        setMessages((prev) =>
          prev.map((m) => m.id === msgId ? { ...m, agent } : m)
        );
      },
      onToken: (token) => {
        fullText += token;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, content: m.content + token } : m
          )
        );
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, isStreaming: false } : m
          )
        );
        setIsStreaming(false);
        abortRef.current = null;
        // Auto-speak if voice mode is on
        if (voiceEnabled && fullText) {
          speakResponse(fullText);
        }
      },
      onError: (err) => {
        console.error("[Central] stream error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  isStreaming: false,
                  role: "error",
                  content:
                    m.content ||
                    "Something went wrong. Please try again in a moment.",
                }
              : m
          )
        );
        setIsStreaming(false);
        abortRef.current = null;
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled, speakResponse]); // voiceEnabled needed for TTS auto-play

  // ─────────────────────────────────────────────────────────────────────────
  // handleStop — aborts the current SSE stream
  // ─────────────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    const msgId = streamingMsgIdRef.current;
    if (msgId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, isStreaming: false } : m
        )
      );
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // handleFlowAnswer — handles a user tapping a chip in a flow question
  // ─────────────────────────────────────────────────────────────────────────
  const handleFlowAnswer = useCallback(
    async (answer, msgId) => {
      if (!flow) return;

      const currentQ = flow.questions[flow.step];
      const newAnswers = { ...flow.answers, [currentQ.key]: answer };
      const nextStep = flow.step + 1;

      // Mark the flow_question bubble as answered (hides chips)
      // and append the user's chosen answer as a regular user message
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === msgId ? { ...m, answered: answer } : m
        ),
        {
          id: `user_fa_${Date.now()}`,
          role: "user",
          content: answer,
        },
      ]);

      if (nextStep >= flow.questions.length) {
        // ── All questions answered ── save prefs, then stream ──────────────
        const flowType = flow.type;
        setFlow(null);

        try {
          await savePreferences(flowType, newAnswers);
        } catch (err) {
          console.warn("[flow] prefs save failed:", err);
          // Non-fatal — still generate even if pref save fails
        }

        const genQuestion =
          flowType === "workout"
            ? "Create my personalized workout plan"
            : flowType === "meal"
            ? "Design my personalized meal plan"
            : `Set a ${newAnswers.reminder_type?.replace(/[🏋️🥗💧✏️ ]/g, "").trim() || "fitness"} reminder`;

        // Small delay lets React flush the state updates first
        setTimeout(() => startStreaming(genQuestion, flowType, newAnswers), 80);
      } else {
        // ── More questions to go ─────────────────────────────────────────
        const nextQ = flow.questions[nextStep];
        setFlow({ ...flow, step: nextStep, answers: newAnswers });
        setMessages((prev) => [
          ...prev,
          {
            id: `fq_${Date.now()}`,
            role: "flow_question",
            content: nextQ.question,
            options: nextQ.options || [],
            flowType: flow.type,
            allowCustom: nextQ.allow_custom || false,
            stepNum: nextStep + 1,
            totalSteps: flow.questions.length,
          },
        ]);
      }
    },
    [flow, startStreaming]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // handleSubmit — main entry point for any user input
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (question, suggestedFlowType = null) => {
      if (!question?.trim() || isStreaming || flow) return;

      // Append user message immediately
      setMessages((prev) => [
        ...prev,
        {
          id: `user_${Date.now()}`,
          role: "user",
          content: question,
        },
      ]);

      const intent = suggestedFlowType || detectIntent(question);

      // For flow-type intents: check if preferences are already locked
      if (FLOW_INTENTS.includes(intent)) {
        try {
          const prefData = await getPreferences(intent);
          if (
            prefData?.locked &&
            prefData.data &&
            Object.keys(prefData.data).length > 0
          ) {
            // Preferences saved — stream directly with them
            startStreaming(question, intent, prefData.data);
            return;
          }
        } catch {
          // No preferences yet — fall through to flow
        }

        // Start Q&A preference collection
        try {
          const result = await getFlowQuestions(intent);
          const questions = result?.questions || [];

          if (questions.length > 0) {
            setFlow({ type: intent, questions, step: 0, answers: {} });
            const firstQ = questions[0];
            setMessages((prev) => [
              ...prev,
              {
                id: `fq_${Date.now()}`,
                role: "flow_question",
                content: firstQ.question,
                options: firstQ.options || [],
                flowType: intent,
                allowCustom: firstQ.allow_custom || false,
                stepNum: 1,
                totalSteps: questions.length,
              },
            ]);
            return;
          }
        } catch (err) {
          console.warn("[flow] failed to load questions:", err);
          // Fall through to direct stream
        }
      }

      // Direct streaming (general, motivate, progress, or fallback)
      startStreaming(question, intent !== "general" ? intent : null, null);
    },
    [isStreaming, flow, startStreaming]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // handleTranscribe — called by CentralInput when recording finishes
  // ─────────────────────────────────────────────────────────────────────────
  const handleTranscribe = useCallback(async (audioBlob) => {
    try {
      const { text } = await transcribeAudio(audioBlob);
      if (text?.trim()) {
        // Treat transcribed text exactly like typed input
        handleSubmit(text.trim());
      }
    } catch (err) {
      console.error("[STT] transcription failed:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const hasMessages = messages.length > 0;
  const inputDisabled = isStreaming || flow !== null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "inherit",
      }}
    >
      {/* ─── SLIM HEADER ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "52px 24px 10px 24px",
          flexShrink: 0,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 10px rgba(139,92,246,0.7)",
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: 0.3,
            }}
          >
            Central
          </span>
        </div>

        {/* Right side: speaking indicator + voice toggle + online dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Speaking indicator */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20, padding: "3px 10px",
                color: "#a5b4fc", fontSize: 12, fontWeight: 600,
                cursor: "pointer", animation: "speakingPulse 1.2s ease-in-out infinite",
              }}
            >
              <span>🔊</span>
              <span>Speaking</span>
              <span style={{ color: "rgba(165,180,252,0.5)", fontSize: 10 }}>✕</span>
            </button>
          )}

          {/* Voice mode toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            title={voiceEnabled ? "Voice response on — click to mute" : "Voice response off — click to enable"}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: voiceEnabled ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
              border: voiceEnabled ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: "3px 10px",
              color: voiceEnabled ? "#a5b4fc" : "rgba(255,255,255,0.3)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {voiceEnabled ? "🔊" : "🔇"}
            <span style={{ fontSize: 11 }}>{voiceEnabled ? "Voice on" : "Voice off"}</span>
          </button>

          {/* Online dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px rgba(34,197,94,0.7)",
              animation: "onlinePulse 3s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>
              online
            </span>
          </div>
        </div>
      </div>

      {/* ─── SCROLLABLE BODY ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 20px",
          paddingBottom: "200px",
        }}
      >
        {/* EMPTY STATE */}
        {!hasMessages && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginTop: 8,
            }}
          >
            <GlowingOrb loading={false} />

            {/* Greeting */}
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                {getGreeting()} 👋
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.42)",
                  fontSize: 15,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                What would you like to work on today?
              </p>
            </div>

            <Suggestions onSelect={handleSubmit} />
            <TodaysInsight />
          </div>
        )}

        {/* MESSAGE HISTORY */}
        {hasMessages && (
          <div style={{ marginTop: 14 }}>
            <MessageHistory
              messages={messages}
              onFlowAnswer={handleFlowAnswer}
            />
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </div>
        )}
      </div>

      {/* ─── STOP BUTTON (floating, visible while streaming) ─────────────── */}
      {isStreaming && (
        <div
          style={{
            position: "fixed",
            bottom: 148,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
          }}
        >
          <button
            onClick={handleStop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 999,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(15,10,10,0.8)",
              backdropFilter: "blur(16px)",
              color: "#f87171",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow:
                "0 4px 20px rgba(239,68,68,0.18), 0 0 0 1px rgba(239,68,68,0.1)",
              letterSpacing: 0.3,
              whiteSpace: "nowrap",
            }}
          >
            {/* Stop square icon */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "#f87171",
                display: "block",
                flexShrink: 0,
              }}
            />
            Stop generating
          </button>
        </div>
      )}

      {/* ─── FIXED INPUT ─────────────────────────────────────────────────── */}
      <CentralInput
        onSubmit={handleSubmit}
        onTranscribe={handleTranscribe}
        disabled={inputDisabled}
        activeAgent={activeAgent}
      />

      {/* ─── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <BottomNav />

      <style>{`
        @keyframes onlinePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes speakingPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0px rgba(99,102,241,0.3); }
          50%       { opacity: 0.8; box-shadow: 0 0 12px rgba(99,102,241,0.5); }
        }
      `}</style>
    </div>
  );
}
