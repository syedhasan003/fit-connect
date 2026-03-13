import { useState, useEffect } from "react";
import { fetchHomeOverview } from "../../api/home";

// ─────────────────────────────────────────────────────────────────────────────
// TodaysInsight — pulls the AI evaluator summary from the home overview API.
// Shows nothing while loading, and gracefully hides if there's no insight.
// ─────────────────────────────────────────────────────────────────────────────
export default function TodaysInsight() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHomeOverview()
      .then((data) => {
        if (cancelled) return;
        const summary = data?.evaluator?.ai_summary || null;
        setInsight(summary);
      })
      .catch(() => {
        if (!cancelled) setInsight(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Don't show anything while loading or if there's no insight
  if (loading || !insight) return null;

  // Split summary into a headline (first sentence) and the rest
  const dotIndex = insight.search(/[.!?]/);
  const headline = dotIndex > 0 ? insight.slice(0, dotIndex + 1).trim() : insight;
  const detail   = dotIndex > 0 ? insight.slice(dotIndex + 1).trim() : null;

  return (
    <div style={{
      padding: "14px 18px",
      borderRadius: 16,
      background: "#1A1A1A",
      border: "1px solid #1E1E1E",
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
          margin: 0,
        }}>
          Today's insight
        </p>
      </div>
      <p style={{ fontSize: 14, color: "#FFFFFF", fontWeight: 500, marginBottom: detail ? 4 : 0 }}>
        {headline}
      </p>
      {detail && (
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
          {detail}
        </p>
      )}
    </div>
  );
}
