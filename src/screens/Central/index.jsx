import OrbScene from "@/components/central/OrbScene";

export default function Central() {
  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        padding: "28px 20px 140px",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "26px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: 4 }}>
          Central
        </h1>
        <span style={{ color: "#9a9a9a", fontSize: 14 }}>
          AI fitness agent
        </span>
      </div>

      <div style={{ maxWidth: "520px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 500, marginBottom: 10 }}>
          How can I help today?
        </h2>
        <p style={{ color: "#9a9a9a", lineHeight: 1.6 }}>
          Ask anything about workouts, diet, recovery, or progress. I can plan,
          adjust, and optimize.
        </p>
      </div>

      <div style={{ marginTop: "14px", marginBottom: "20px" }}>
        <OrbScene />
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        <div className="card">
          <h3>Fix today’s workout</h3>
          <p>Adjust volume and intensity intelligently</p>
        </div>

        <div className="card">
          <h3>Optimize my diet</h3>
          <p>Calories, macros, timing, and meals</p>
        </div>

        <div className="card">
          <h3>Review my progress</h3>
          <p>Strength, body weight, and trends</p>
        </div>
      </div>

      <div className="input-wrap">
        <div className="input">
          <div className="field">Message Central…</div>
          <button className="send">→</button>
        </div>
      </div>
    </div>
  );
}
