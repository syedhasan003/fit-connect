export default function InsightCard({ answer, loading }) {
  // ----------------------------
  // Empty state
  // ----------------------------
  if (!answer && !loading) {
    return null;
  }

  // ----------------------------
  // Loading state
  // ----------------------------
  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          opacity: 0.7,
        }}
      >
        <strong>Central</strong>
        <p style={{ marginTop: 8 }}>
          Thinking…
        </p>
      </div>
    );
  }

  // ----------------------------
  // Error state
  // ----------------------------
  if (answer.type === "error") {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: "rgba(255,0,0,0.08)",
          border: "1px solid rgba(255,0,0,0.2)",
        }}
      >
        <strong>Error</strong>
        <p style={{ marginTop: 8 }}>
          {answer.content}
        </p>
      </div>
    );
  }

  // ----------------------------
  // Normal response
  // ----------------------------
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: "rgba(255,255,255,0.06)",
      }}
    >
      <strong>Central says</strong>
      <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
        {answer.content}
      </p>
    </div>
  );
}
