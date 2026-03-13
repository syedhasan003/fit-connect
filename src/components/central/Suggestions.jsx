// ─────────────────────────────────────────────────────────────────────────────
// Suggestions.jsx
// Full-width 2-column card grid matching the Vault card style.
// First 4 items in a 2×2 grid, 5th item spans full width.
// Order adapts to time of day so the most relevant action is always first.
// ─────────────────────────────────────────────────────────────────────────────

const ALL_SUGGESTIONS = {
  workout:  { icon: "🏋️", text: "Create a workout", flowType: "workout",  color: "#A855F7", dim: "rgba(168,85,247,0.12)",  glow: "rgba(168,85,247,0.20)", subtitle: "Custom plan"    },
  meal:     { icon: "🥗",  text: "Meal plan",        flowType: "meal",     color: "#22C55E", dim: "rgba(34,197,94,0.12)",   glow: "rgba(34,197,94,0.20)",  subtitle: "7-day diet"     },
  motivate: { icon: "🙌",  text: "Motivate me",      flowType: "motivate", color: "#EC4899", dim: "rgba(236,72,153,0.12)",  glow: "rgba(236,72,153,0.20)", subtitle: "Let's go"       },
  progress: { icon: "📊",  text: "My progress",      flowType: "progress", color: "#3B82F6", dim: "rgba(59,130,246,0.12)",  glow: "rgba(59,130,246,0.20)", subtitle: "Weekly review"  },
  reminder: { icon: "⏰",  text: "Set a reminder",   flowType: "reminder", color: "#F59E0B", dim: "rgba(245,158,11,0.12)",  glow: "rgba(245,158,11,0.20)", subtitle: "Stay on track"  },
};

function getOrderedKeys() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return ["motivate", "workout", "meal",    "progress", "reminder"];
  if (h >= 12 && h < 17) return ["workout",  "progress","meal",    "motivate", "reminder"];
  if (h >= 17 && h < 22) return ["progress", "meal",    "motivate","workout",  "reminder"];
  return                         ["meal",     "reminder","progress","motivate", "workout"];
}

export default function Suggestions({ onSelect }) {
  const ordered = getOrderedKeys().map((k) => ALL_SUGGESTIONS[k]);

  return (
    <div style={{ width: "100%" }}>
      <p style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 1.4,
      }}>
        Quick Actions
      </p>

      {/* 2-column grid — items 0-3 normal, item 4 spans both columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}>
        {ordered.map((s, i) => (
          <SuggestionCard
            key={s.flowType}
            suggestion={s}
            index={i}
            onSelect={onSelect}
            fullWidth={i === 4}
          />
        ))}
      </div>

      <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SuggestionCard({ suggestion, index, onSelect, fullWidth }) {
  const { icon, text, flowType, color, dim, glow, subtitle } = suggestion;

  return (
    <button
      onClick={() => onSelect(text, flowType)}
      style={{
        gridColumn: fullWidth ? "1 / -1" : undefined,
        display: "flex",
        flexDirection: fullWidth ? "row" : "column",
        alignItems: fullWidth ? "center" : "flex-start",
        gap: fullWidth ? 14 : 14,
        padding: "18px 16px",
        borderRadius: 16,
        background: "#1A1A1A",
        border: "1px solid #1E1E1E",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "border-color 0.18s ease, background 0.18s ease",
        animation: `cardFadeIn 0.35s ease-out ${index * 0.055}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = dim;
        e.currentTarget.style.borderColor = color + "44";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1A1A1A";
        e.currentTarget.style.borderColor = "#1E1E1E";
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {/* Colored icon bubble */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: dim,
        border: `1px solid ${color}28`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Text — fills remaining space on full-width row */}
      <div style={{ flex: 1 }}>
        <p style={{
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.3,
          letterSpacing: 0.1,
        }}>
          {text}
        </p>
        <p style={{
          color: "#6B7280",
          fontSize: 12,
          margin: "4px 0 0",
          lineHeight: 1.3,
        }}>
          {subtitle}
        </p>
      </div>

      {/* Chevron (full-width only) */}
      {fullWidth && (
        <span style={{ color: "#6B7280", fontSize: 16, flexShrink: 0 }}>›</span>
      )}
    </button>
  );
}
