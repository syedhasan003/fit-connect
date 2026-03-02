import { useState, useRef, useEffect } from "react";

// ── Recording state machine ───────────────────────────────────────────────
// idle → recording → transcribing → idle

const MIC_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="13" rx="3"/>
    <path d="M5 10a7 7 0 0 0 14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8"  y1="22" x2="16" y2="22"/>
  </svg>
);

const STOP_REC_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
  </svg>
);

const SEND_ICON = "↑";

export default function CentralInput({ onSubmit, onTranscribe, disabled, activeAgent }) {
  const [value, setValue]           = useState("");
  const [isFocused, setIsFocused]   = useState(false);
  const [recState, setRecState]     = useState("idle"); // idle | recording | transcribing
  const [recSeconds, setRecSeconds] = useState(0);
  const [waveform, setWaveform]     = useState([3,5,4,6,3,7,4,5,3,6]); // fake bars

  const mediaRef    = useRef(null);  // MediaRecorder instance
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const waveRef     = useRef(null);
  const streamRef   = useRef(null);  // mic MediaStream (to stop tracks on done)

  // ── Waveform animation while recording ───────────────────────────────────
  useEffect(() => {
    if (recState === "recording") {
      waveRef.current = setInterval(() => {
        setWaveform(Array.from({ length: 10 }, () => 3 + Math.random() * 18));
      }, 120);
    } else {
      clearInterval(waveRef.current);
      setWaveform([3,5,4,6,3,7,4,5,3,6]);
    }
    return () => clearInterval(waveRef.current);
  }, [recState]);

  // ── Recording timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (recState === "recording") {
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [recState]);

  // ── Start recording ───────────────────────────────────────────────────────
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Microphone access not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: getSupportedMime() });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleRecordingStop;
      mr.start(100); // collect in 100ms chunks
      mediaRef.current = mr;
      setRecState("recording");
    } catch (err) {
      console.error("[Voice] mic error:", err);
      alert("Could not access microphone. Please allow mic permissions.");
    }
  }

  // ── Stop recording → transcribe ──────────────────────────────────────────
  function stopRecording() {
    mediaRef.current?.stop();
    // stop mic tracks so the indicator light goes off
    streamRef.current?.getTracks().forEach(t => t.stop());
    setRecState("transcribing");
  }

  async function handleRecordingStop() {
    const mime  = getSupportedMime();
    const blob  = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];

    if (blob.size < 200) {
      setRecState("idle");
      return;
    }

    try {
      // onTranscribe is provided by Central.layout — it calls the API and
      // returns the text, then auto-submits it
      if (onTranscribe) {
        await onTranscribe(blob);
      }
    } catch (err) {
      console.error("[Voice] transcribe error:", err);
    } finally {
      setRecState("idle");
    }
  }

  function getSupportedMime() {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || "audio/webm";
  }

  // ── Text submit ───────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Mic button click ──────────────────────────────────────────────────────
  function handleMicClick() {
    if (disabled) return;
    if (recState === "idle") startRecording();
    else if (recState === "recording") stopRecording();
  }

  const isRecording     = recState === "recording";
  const isTranscribing  = recState === "transcribing";
  const canSend         = value.trim() && !disabled && recState === "idle";
  const inputDisabled   = disabled || recState !== "idle";

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  return (
    <div style={{
      position: "fixed",
      bottom: 64,
      left: 0,
      right: 0,
      padding: "0 16px 16px 16px",
      background: "linear-gradient(to top, rgba(0,0,0,0.97) 70%, transparent)",
      backdropFilter: "blur(20px)",
      zIndex: 10,
    }}>
      {/* ── Active agent badge ───────────────────────────────────────────── */}
      {activeAgent && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 8,
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
            animation: "agentFadeIn 0.3s ease",
          }}>
            <span style={{ fontSize: 13 }}>{activeAgent.split(" ")[0]}</span>
            <span>{activeAgent.split(" ").slice(1).join(" ")}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{
          position: "relative",
          background: isRecording
            ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(31,41,55,0.75))"
            : isFocused
              ? "linear-gradient(135deg, rgba(17,24,39,0.85), rgba(31,41,55,0.75))"
              : "linear-gradient(135deg, rgba(17,24,39,0.7), rgba(31,41,55,0.6))",
          border: isRecording
            ? "1px solid rgba(239,68,68,0.45)"
            : isFocused
              ? "1px solid rgba(139,92,246,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          padding: isRecording ? "14px 70px 14px 16px" : "14px 110px 14px 20px",
          backdropFilter: "blur(16px)",
          boxShadow: isRecording
            ? "0 0 30px rgba(239,68,68,0.15)"
            : isFocused
              ? "0 20px 60px rgba(139,92,246,0.15)"
              : "0 10px 40px rgba(0,0,0,0.3)",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          minHeight: 54,
          display: "flex",
          alignItems: "center",
        }}>

          {/* Top glow on focus */}
          {isFocused && !isRecording && (
            <div style={{
              position: "absolute", top: -1, left: "15%", right: "15%", height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent)",
              borderRadius: "2px",
              animation: "shimmer 2s ease-in-out infinite",
            }} />
          )}

          {/* ── RECORDING STATE: waveform + timer ─────────────────────── */}
          {isRecording ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, flex: 1,
            }}>
              {/* Waveform bars */}
              <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28 }}>
                {waveform.map((h, i) => (
                  <div key={i} style={{
                    width: 3, height: h, borderRadius: 2,
                    background: `rgba(239,68,68,${0.5 + (h / 24) * 0.5})`,
                    transition: "height 0.1s ease",
                  }} />
                ))}
              </div>
              <span style={{ color: "rgba(239,68,68,0.9)", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {fmtTime(recSeconds)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                Tap ■ to send
              </span>
            </div>
          ) : isTranscribing ? (
            /* ── TRANSCRIBING STATE ──────────────────────────────────── */
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <div style={{
                width: 16, height: 16,
                border: "2px solid rgba(139,92,246,0.3)",
                borderTop: "2px solid #8b5cf6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                Transcribing…
              </span>
            </div>
          ) : (
            /* ── NORMAL TEXT INPUT ───────────────────────────────────── */
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask Central anything…"
              disabled={inputDisabled}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "rgba(255,255,255,0.95)",
                fontSize: 15,
                fontWeight: 450,
                letterSpacing: 0.2,
                lineHeight: 1.5,
                fontFamily: "inherit",
              }}
              className="central-input"
            />
          )}

          {/* ── RIGHT BUTTONS ─────────────────────────────────────────── */}
          <div style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {/* Mic / Stop button */}
            {recState !== "transcribing" && (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={disabled}
                title={isRecording ? "Stop recording" : "Voice input"}
                style={{
                  width: 40, height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: isRecording
                    ? "rgba(239,68,68,0.18)"
                    : "rgba(255,255,255,0.07)",
                  color: isRecording ? "#f87171" : "rgba(255,255,255,0.45)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                  boxShadow: isRecording ? "0 0 16px rgba(239,68,68,0.25)" : "none",
                  animation: isRecording ? "micPulse 1.5s ease-in-out infinite" : "none",
                }}
              >
                {isRecording ? STOP_REC_ICON : MIC_ICON}
              </button>
            )}

            {/* Send button — only show when not recording */}
            {!isRecording && !isTranscribing && (
              <button
                type="submit"
                disabled={!canSend}
                style={{
                  width: 40, height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: canSend
                    ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                    : "rgba(255,255,255,0.07)",
                  color: "#fff",
                  cursor: canSend ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: canSend ? "0 6px 20px rgba(139,92,246,0.35)" : "none",
                  opacity: canSend ? 1 : 0.35,
                  flexShrink: 0,
                }}
              >
                {disabled ? (
                  <div style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                ) : SEND_ICON}
              </button>
            )}
          </div>
        </div>

        {/* Hint */}
        <p style={{
          textAlign: "center", fontSize: 11.5,
          color: "rgba(255,255,255,0.28)",
          marginTop: 10, fontWeight: 500, letterSpacing: 0.3,
        }}>
          {isRecording
            ? "🔴 Recording — tap ■ when done"
            : "Press Enter to send  •  🎙 mic for voice"}
        </p>
      </form>

      <style>{`
        .central-input::placeholder {
          color: rgba(255,255,255,0.32);
          font-weight: 450;
        }
        @keyframes shimmer {
          0%,100% { transform:translateX(-50%); opacity:0.3; }
          50%      { transform:translateX(50%);  opacity:0.8; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes micPulse {
          0%,100% { box-shadow: 0 0 16px rgba(239,68,68,0.25); }
          50%      { box-shadow: 0 0 28px rgba(239,68,68,0.50); }
        }
        @keyframes agentFadeIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </div>
  );
}
