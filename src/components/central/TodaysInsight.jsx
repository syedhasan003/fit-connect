export default function TodaysInsight() {
  return (
    <div style={{
      padding: "14px 18px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(140,170,255,0.7)",
        }} />
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(140,170,255,0.8)",
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}>
          Today's insight
        </p>
      </div>
      <p style={{ fontSize: 14, color: "#fff", fontWeight: 500, marginBottom: 4 }}>
        Training load is elevated
      </p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
        You trained 4 days in a row. Consider lighter volume today to protect recovery.
      </p>
    </div>
  );
}