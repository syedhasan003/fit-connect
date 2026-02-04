export default function Suggestions({ onSelect }) {
  const suggestions = [
    { icon: "🏋️", text: "Create a workout plan", color: "#8b5cf6" },
    { icon: "🍽️", text: "Design a meal plan", color: "#6366f1" },
    { icon: "💭", text: "Motivate me", color: "#ec4899" },
    { icon: "📊", text: "Analyze my progress", color: "#06b6d4" },
  ];

  return (
    <div style={{ width: "100%" }}>
      <p style={{
        fontSize: 13,
        fontWeight: 600,
        color: "rgba(255,255,255,0.5)",
        marginBottom: 14,
        textTransform: "uppercase",
        letterSpacing: 1.2,
      }}>
        Quick Actions
      </p>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
      }}>
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={index}
            suggestion={suggestion}
            onSelect={onSelect}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onSelect, index }) {
  return (
    <button
      onClick={() => onSelect(suggestion.text)}
      style={{
        padding: "16px 18px",
        borderRadius: 18,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        animation: "fadeInUp 0.4s ease-out",
        animationDelay: `${index * 0.08}s`,
        animationFillMode: "both",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.5))`;
        e.currentTarget.style.border = `1px solid ${suggestion.color}40`;
        e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
        e.currentTarget.style.boxShadow = `0 12px 32px ${suggestion.color}25, 0 0 0 1px ${suggestion.color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))";
        e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(0.98)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
      }}
    >
      {/* Gradient overlay on hover */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100%",
        background: `linear-gradient(135deg, ${suggestion.color}15, transparent)`,
        opacity: 0,
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }} className="gradient-overlay" />

      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <span style={{
          fontSize: 24,
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
        }}>
          {suggestion.icon}
        </span>
        <span style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: 14.5,
          fontWeight: 500,
          letterSpacing: 0.2,
          lineHeight: 1.4,
        }}>
          {suggestion.text}
        </span>
      </div>

      <style>{`
        button:hover .gradient-overlay {
          opacity: 1 !important;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </button>
  );
}