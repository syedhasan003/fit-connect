import MarkdownRenderer from "./MarkdownRenderer";

export default function MessageHistory({ messages, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {loading && <LoadingBubble />}
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          maxWidth: "78%",
          padding: "11px 16px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}>
          <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{
          maxWidth: "82%",
          padding: "14px 18px",
          borderRadius: 18,
          background: "rgba(255,50,50,0.07)",
          border: "1px solid rgba(255,50,50,0.18)",
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#f87171", marginBottom: 4 }}>Error</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}>{message.content}</p>
        </div>
      </div>
    );
  }

  // ── Assistant response ──
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{
        maxWidth: "88%",
        padding: "16px 18px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(140,170,255,0.9)",
          textTransform: "uppercase",
          letterSpacing: 1.2,
          marginBottom: 10,
        }}>
          Central
        </p>
        <MarkdownRenderer text={message.content} />
      </div>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{
        padding: "16px 18px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(140,170,255,0.9)",
          textTransform: "uppercase",
          letterSpacing: 1.2,
          marginBottom: 10,
        }}>
          Central
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "rgba(140,170,255,0.5)",
              animation: "centralBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes centralBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}