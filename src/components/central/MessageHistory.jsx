import { useState, useMemo } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { createVaultItem } from "../../api/vault";
import { logDislike } from "../../api/ai";

// ─────────────────────────────────────────────────────────────────────────────
// MessageHistory
// ─────────────────────────────────────────────────────────────────────────────
export default function MessageHistory({ messages, onFlowAnswer }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id || index}
          message={msg}
          index={index}
          onFlowAnswer={onFlowAnswer}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher — routes to the correct bubble type
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ message, index, onFlowAnswer }) {
  if (message.role === "user")          return <UserBubble   message={message} index={index} />;
  if (message.role === "error")         return <ErrorBubble  message={message} index={index} />;
  if (message.role === "flow_question") return <FlowQuestion message={message} index={index} onFlowAnswer={onFlowAnswer} />;
  // assistant (streaming or complete)
  return <AssistantBubble message={message} index={index} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER bubble
// ─────────────────────────────────────────────────────────────────────────────
function UserBubble({ message, index }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        animation: "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "both",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "14px 18px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
          border: "1px solid rgba(139,92,246,0.3)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 8px 32px rgba(139,92,246,0.15), 0 0 0 1px rgba(255,255,255,0.03)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -1,
            left: "20%",
            right: "20%",
            height: "1.5px",
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)",
            borderRadius: "2px",
          }}
        />
        <p
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: 15.5,
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 450,
            letterSpacing: 0.2,
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR bubble
// ─────────────────────────────────────────────────────────────────────────────
function ErrorBubble({ message, index }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        animation: "slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "both",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "18px 22px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.07))",
          border: "1px solid rgba(239,68,68,0.28)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 40px rgba(239,68,68,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fca5a5",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Error
          </p>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 15,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOW QUESTION bubble — AI chip-based preference collection
// ─────────────────────────────────────────────────────────────────────────────
function FlowQuestion({ message, index, onFlowAnswer }) {
  const [customValue, setCustomValue] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const isAnswered = !!message.answered;

  const handleChip = (opt) => {
    if (isAnswered) return;
    onFlowAnswer?.(opt, message.id);
  };

  const handleCustomSubmit = () => {
    const val = customValue.trim();
    if (!val || isAnswered) return;
    onFlowAnswer?.(val, message.id);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        animation: "slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "both",
      }}
    >
      <div
        style={{
          maxWidth: "92%",
          padding: "20px 22px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(17,24,39,0.65), rgba(31,41,55,0.45))",
          border: "1px solid rgba(139,92,246,0.28)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.08)",
        }}
      >
        {/* Header with step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
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
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.6,
                background: "linear-gradient(135deg, #a78bfa, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Quick setup
            </span>
          </div>
          {/* Step dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {Array.from({ length: message.totalSteps || 1 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i + 1 === message.stepNum ? 16 : 6,
                  height: 6,
                  borderRadius: 999,
                  background:
                    i + 1 === message.stepNum
                      ? "linear-gradient(90deg, #8b5cf6, #6366f1)"
                      : i + 1 < (message.stepNum || 1)
                      ? "rgba(139,92,246,0.6)"
                      : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Question text */}
        {!isAnswered ? (
          <>
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 15.5,
                fontWeight: 500,
                lineHeight: 1.55,
                margin: "0 0 16px 0",
              }}
            >
              {message.content}
            </p>

            {/* Chip options */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: message.allowCustom ? 12 : 0,
              }}
            >
              {(message.options || []).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleChip(opt)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(139,92,246,0.4)",
                    background: "rgba(139,92,246,0.1)",
                    color: "#c4b5fd",
                    fontSize: 13.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    letterSpacing: 0.2,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.22)";
                    e.currentTarget.style.borderColor =
                      "rgba(139,92,246,0.75)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(139,92,246,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(139,92,246,0.4)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Custom input (for allow_custom questions) */}
            {message.allowCustom && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCustomSubmit()
                  }
                  placeholder="Or type your own..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: "9px 14px",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim()}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: customValue.trim()
                      ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                      : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: customValue.trim() ? "pointer" : "not-allowed",
                    opacity: customValue.trim() ? 1 : 0.5,
                    transition: "all 0.2s",
                  }}
                >
                  ↵
                </button>
              </div>
            )}
          </>
        ) : (
          // Answered state — show confirmation inline
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSISTANT bubble — handles both streaming and complete states
// ─────────────────────────────────────────────────────────────────────────────
function AssistantBubble({ message, index }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDislikeMode, setShowDislikeMode] = useState(false);

  const { content, isStreaming } = message;
  const isEmpty = !content && isStreaming;

  // ── Save to Vault ────────────────────────────────────────────────────────
  const handleSaveToVault = async () => {
    setSaving(true);
    try {
      const lines = content.split("\n").filter((l) => l.trim());
      const isWorkout = /workout|exercise|sets|reps/i.test(content);
      const title =
        lines[0]?.replace(/[*#]/g, "").trim() ||
        (isWorkout ? "Workout Plan" : "Central Answer");

      await createVaultItem({
        type: isWorkout ? "workout" : "answer",
        category: "central",
        title,
        summary: lines[1]?.substring(0, 100) || "",
        content: { raw: content },
        source: "central",
        pinned: false,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("[vault] save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Copy ─────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        animation: "slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "both",
      }}
    >
      <div
        style={{
          maxWidth: "93%",
          padding: "22px 24px",
          paddingBottom: isStreaming ? "22px" : "56px", // extra bottom space for action bar
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(17,24,39,0.65), rgba(31,41,55,0.45))",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02)",
          position: "relative",
        }}
      >
        {/* Animated gradient top border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(99,102,241,0.6), transparent)",
            animation: isStreaming ? "shimmer 2s ease-in-out infinite" : "none",
            borderRadius: "24px 24px 0 0",
          }}
        />

        {/* Central AI badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 14,
            marginBottom: 14,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 14px rgba(139,92,246,0.7), 0 0 4px rgba(99,102,241,0.5)",
              animation: isStreaming ? "pulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textTransform: "uppercase",
              letterSpacing: 1.8,
            }}
          >
            Central AI
          </span>
          {isStreaming && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(139,92,246,0.65)",
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              · thinking…
            </span>
          )}
        </div>

        {/* Message content (or thinking dots) */}
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 15.5,
            lineHeight: 1.75,
          }}
        >
          {isEmpty ? (
            /* Thinking dots shown while waiting for first token */
            <ThinkingDots />
          ) : (
            <>
              <MarkdownRenderer text={content} />
              {/* Blinking cursor while streaming */}
              {isStreaming && <StreamCursor />}
            </>
          )}
        </div>

        {/* ── After-stream action bar ─────────────────────────────────────── */}
        {!isStreaming && content && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 24,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {/* Copy */}
            <ActionPill
              onClick={handleCopy}
              active={copied}
              activeColor="#22c55e"
              label={copied ? "✓ Copied" : "Copy"}
              icon={copied ? null : "⎘"}
            />

            {/* Save to Vault */}
            <ActionPill
              onClick={handleSaveToVault}
              disabled={saving || saved}
              active={saved}
              activeColor="#10b981"
              label={saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
              icon={saved ? null : "📥"}
            />

            {/* Mark dislikes toggle */}
            <ActionPill
              onClick={() => setShowDislikeMode((v) => !v)}
              active={showDislikeMode}
              activeColor="#f59e0b"
              label={showDislikeMode ? "Done marking" : "👎 Mark items"}
            />
          </div>
        )}

        {/* ── Granular dislike panel ──────────────────────────────────────── */}
        {!isStreaming && showDislikeMode && (
          <DislikePanel content={content} messageId={message.id} />
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(36px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-36px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.3; transform: translateX(-100%); }
          50%     { opacity: 0.8; transform: translateX(100%);  }
        }
        @keyframes pulse {
          0%,100% { opacity: 1;   transform: scale(1);    }
          50%     { opacity: 0.7; transform: scale(0.88); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
        @keyframes dotBounce {
          0%,60%,100% { transform: translateY(0);    opacity: 1;   }
          30%         { transform: translateY(-10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action pill button (Copy / Save / Mark items)
// ─────────────────────────────────────────────────────────────────────────────
function ActionPill({ onClick, disabled, active, activeColor, label, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 13px",
        borderRadius: 999,
        border: active
          ? `1px solid ${activeColor}50`
          : "1px solid rgba(255,255,255,0.1)",
        background: active
          ? `${activeColor}18`
          : "rgba(255,255,255,0.05)",
        color: active ? activeColor : "rgba(255,255,255,0.55)",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.2s ease",
        backdropFilter: "blur(8px)",
        letterSpacing: 0.2,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          e.currentTarget.style.color = "rgba(255,255,255,0.85)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
        }
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming cursor — blinking | at end of text
// ─────────────────────────────────────────────────────────────────────────────
function StreamCursor() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "1.1em",
        background: "#8b5cf6",
        marginLeft: 2,
        verticalAlign: "text-bottom",
        borderRadius: 1,
        animation: "blink 1s step-end infinite",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thinking dots — shown while waiting for first token
// ─────────────────────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            animation: "dotBounce 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
            boxShadow: "0 0 10px rgba(139,92,246,0.5)",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse dislikeable items from markdown table content
// Extracts exercise names (from workout tables) and meal/food names (from meal tables)
// ─────────────────────────────────────────────────────────────────────────────
function parseDislikeItems(content) {
  const items = [];
  const lines = content.split("\n");

  let headers = null;
  let pastSeparator = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
      // Non-table line resets table state
      if (headers) {
        headers = null;
        pastSeparator = false;
      }
      continue;
    }

    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    if (!cells.length) continue;

    // Separator row (e.g., |---|---|)
    if (cells.every((c) => /^[-: ]+$/.test(c))) {
      pastSeparator = true;
      continue;
    }

    if (!headers) {
      headers = cells;
      continue;
    }

    if (!pastSeparator) continue;

    // Skip rows that look like sub-headers or empty rows
    if (!cells[0] || cells[0].length < 2) continue;

    const headerText = headers.join(" ").toLowerCase();
    const isWorkoutTable = /exercise/.test(headerText);
    const isMealTable = /meal|food|time/.test(headerText);

    if (isWorkoutTable) {
      // First column is the exercise name
      const name = cells[0].replace(/\*\*/g, "").trim();
      if (name && name.length > 2 && !/^day|^week/i.test(name)) {
        items.push({ name, type: "exercise" });
      }
    } else if (isMealTable) {
      // Look for a "Meal" column first, then "Foods" column
      const mealColIdx = headers.findIndex((h) => /^meal$/i.test(h));
      const foodsColIdx = headers.findIndex((h) => /food/i.test(h));

      if (mealColIdx >= 0 && cells[mealColIdx]) {
        const name = cells[mealColIdx].replace(/\*\*/g, "").trim();
        if (name.length > 2) items.push({ name, type: "food" });
      } else if (foodsColIdx >= 0 && cells[foodsColIdx]) {
        // Parse comma-separated foods, strip quantities like "80g", "1 medium"
        const raw = cells[foodsColIdx];
        raw
          .split(/[,+]/)
          .map((f) =>
            f
              .replace(/\s*\d+[\w]*\s*/g, " ")
              .replace(/\*\*/g, "")
              .trim()
          )
          .filter((f) => f.length > 2)
          .slice(0, 3)
          .forEach((name) => items.push({ name, type: "food" }));
      }
    }
  }

  // Deduplicate by name
  const seen = new Set();
  return items.filter(({ name }) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dislike panel — shows after user toggles "Mark items"
// ─────────────────────────────────────────────────────────────────────────────
function DislikePanel({ content, messageId }) {
  const [disliked, setDisliked] = useState(new Set());
  const items = useMemo(() => parseDislikeItems(content), [content]);

  if (!items.length) {
    return (
      <div
        style={{
          marginTop: 14,
          padding: "14px 16px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.38)",
            fontSize: 13,
            margin: 0,
            textAlign: "center",
          }}
        >
          No individual items detected to mark.
        </p>
      </div>
    );
  }

  const handleDislike = async (item) => {
    if (disliked.has(item.name)) return;
    setDisliked((prev) => new Set([...prev, item.name]));
    try {
      await logDislike(item.type, item.name, `Central response #${messageId}`);
    } catch (err) {
      console.warn("[dislike]", err);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(255,255,255,0.38)",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        Tap to mark items you don't want
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => {
          const isMarked = disliked.has(item.name);
          return (
            <button
              key={i}
              onClick={() => handleDislike(item)}
              disabled={isMarked}
              title={
                isMarked
                  ? "Won't be suggested again"
                  : `Mark "${item.name}" as disliked`
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 999,
                border: isMarked
                  ? "1px solid rgba(239,68,68,0.45)"
                  : "1px solid rgba(255,255,255,0.14)",
                background: isMarked
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(255,255,255,0.06)",
                color: isMarked
                  ? "#f87171"
                  : "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 500,
                cursor: isMarked ? "default" : "pointer",
                transition: "all 0.2s ease",
                letterSpacing: 0.2,
              }}
              onMouseEnter={(e) => {
                if (!isMarked) {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                  e.currentTarget.style.color = "#fca5a5";
                  e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMarked) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }
              }}
            >
              <span style={{ fontSize: 14 }}>{isMarked ? "👎" : "👎"}</span>
              <span>{item.name}</span>
              {isMarked && (
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(248,113,113,0.7)",
                    fontStyle: "italic",
                    marginLeft: 2,
                  }}
                >
                  won't repeat
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
