const CHIPS = [
  "Create today's workout",
  "Adjust my calories",
  "Check recovery",
  "Analyze progress",
];

export default function Suggestions({ onSelect }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 500 }}>
        Quick actions
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CHIPS.map((text) => (
          <Chip key={text} label={text} onClick={() => onSelect(text)} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 16px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.11)",
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        cursor: "pointer",
        transition: "all 0.18s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(140,170,255,0.12)";
        e.currentTarget.style.borderColor = "rgba(140,170,255,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)";
      }}
    >
      {label}
    </button>
  );
}