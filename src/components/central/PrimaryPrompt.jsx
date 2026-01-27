export default function PrimaryPrompt() {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>
        What would you like to do?
      </h2>
      <p style={{ opacity: 0.6, marginTop: 8 }}>
        I can plan, adjust, and guide your training and nutrition.
      </p>
    </div>
  );
}
