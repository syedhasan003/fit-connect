const actions = [
  "Create today's workout",
  "Adjust my calories",
  "Check recovery",
  "Analyze progress",
];

export default function Suggestions() {
  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Suggestions</h3>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {actions.map((action) => (
          <button
            key={action}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
