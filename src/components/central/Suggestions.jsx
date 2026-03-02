// ─────────────────────────────────────────────────────────────────────────────
// Suggestions.jsx
// 5 quick-action chips rendered in a horizontal scroll row.
// onSelect(text, flowType) — parent uses flowType to start the right flow.
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    icon: "🏋️",
    text: "Create a workout",
    flowType: "workout",
    color: "#8b5cf6",
    subtitle: "Custom plan",
  },
  {
    icon: "🥗",
    text: "Meal plan",
    flowType: "meal",
    color: "#10b981",
    subtitle: "7-day diet",
  },
  {
    icon: "🙌",
    text: "Motivate me",
    flowType: "motivate",
    color: "#ec4899",
    subtitle: "Let's go",
  },
  {
    icon: "📊",
    text: "My progress",
    flowType: "progress",
    color: "#06b6d4",
    subtitle: "Weekly review",
  },
  {
    icon: "⏰",
    text: "Set a reminder",
    flowType: "reminder",
    color: "#f59e0b",
    subtitle: "Stay on track",
  },
];

export default function Suggestions({ onSelect }) {
  return (
    <div style={{ width: "100%" }}>
      <p
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "rgba(255,255,255,0.42)",
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        Quick Actions
      </p>

      {/* Horizontal scrollable row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 4,
          // Hide scrollbar on most browsers
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="suggestions-scroll"
      >
        {SUGGESTIONS.map((s, i) => (
          <SuggestionChip
            key={i}
            suggestion={s}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>

      <style>{`
        .suggestions-scroll::-webkit-scrollbar {
          display: none;
        }
        @keyframes chipFadeIn {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}

function SuggestionChip({ suggestion, index, onSelect }) {
  const { icon, text, flowType, color, subtitle } = suggestion;

  return (
    <button
      onClick={() => onSelect(text, flowType)}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        padding: "14px 16px",
        borderRadius: 20,
        background:
          "linear-gradient(135deg, rgba(17,24,39,0.55), rgba(31,41,55,0.35))",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        textAlign: "left",
        minWidth: 120,
        maxWidth: 140,
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        animation: "chipFadeIn 0.4s ease-out",
        animationDelay: `${index * 0.07}s`,
        animationFillMode: "both",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `linear-gradient(135deg, ${color}18, ${color}0a)`;
        e.currentTarget.style.border = `1px solid ${color}45`;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 10px 28px ${color}22, 0 0 0 1px ${color}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          "linear-gradient(135deg, rgba(17,24,39,0.55), rgba(31,41,55,0.35))";
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(-1px) scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-3px) scale(1)";
      }}
    >
      {/* Icon */}
      <span
        style={{
          fontSize: 22,
          lineHeight: 1,
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span
        style={{
          color: "rgba(255,255,255,0.88)",
          fontSize: 13.5,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: 0.1,
        }}
      >
        {text}
      </span>

      {/* Subtitle */}
      <span
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 11.5,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}
