import { useState } from "react";

export default function CentralInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 64,
      left: 0,
      right: 0,
      padding: "0 24px 24px 24px",
      background: "linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)",
      backdropFilter: "blur(20px)",
      zIndex: 10,
    }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{
          position: "relative",
          background: isFocused 
            ? "linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(31, 41, 55, 0.75))"
            : "linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.6))",
          border: isFocused
            ? "1px solid rgba(139, 92, 246, 0.4)"
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 24,
          padding: "16px 70px 16px 22px",
          backdropFilter: "blur(16px)",
          boxShadow: isFocused
            ? "0 20px 60px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)"
            : "0 10px 40px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Animated glow on focus */}
          {isFocused && (
            <div style={{
              position: "absolute",
              top: -1,
              left: "15%",
              right: "15%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.7), transparent)",
              borderRadius: "2px",
              animation: "shimmer 2s ease-in-out infinite",
            }} />
          )}

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Central anything..."
            disabled={disabled}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.95)",
              fontSize: 15.5,
              fontWeight: 450,
              letterSpacing: 0.2,
              lineHeight: 1.5,
              resize: "none",
              fontFamily: "inherit",
            }}
            className="central-input"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!value.trim() || disabled}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "none",
              background: value.trim() && !disabled
                ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                : "rgba(255, 255, 255, 0.08)",
              color: "#fff",
              cursor: value.trim() && !disabled ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: value.trim() && !disabled
                ? "0 8px 24px rgba(139, 92, 246, 0.35)"
                : "none",
              opacity: value.trim() && !disabled ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (value.trim() && !disabled) {
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(139, 92, 246, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              e.currentTarget.style.boxShadow = value.trim() && !disabled
                ? "0 8px 24px rgba(139, 92, 246, 0.35)"
                : "none";
            }}
          >
            {disabled ? (
              <div style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              "↑"
            )}
          </button>
        </div>

        {/* Hint text */}
        <p style={{
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
          marginTop: 12,
          fontWeight: 500,
          letterSpacing: 0.3,
        }}>
          Press <span style={{ 
            color: "rgba(139, 92, 246, 0.7)", 
            fontWeight: 600,
          }}>Enter</span> to send • <span style={{ 
            color: "rgba(139, 92, 246, 0.7)", 
            fontWeight: 600,
          }}>Shift + Enter</span> for new line
        </p>
      </form>

      <style>{`
        .central-input::placeholder {
          color: rgba(255,255,255,0.35);
          font-weight: 450;
          letter-spacing: 0.2px;
        }
        
        @keyframes shimmer {
          0%, 100% {
            transform: translateX(-50%);
            opacity: 0.3;
          }
          50% {
            transform: translateX(50%);
            opacity: 0.8;
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}