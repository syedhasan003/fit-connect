import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { createVaultItem } from "../../api/vault";

export default function MessageHistory({ messages, loading }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {messages.map((msg, index) => (
        <MessageBubble key={msg.id || index} message={msg} index={index} />
      ))}
      {loading && <LoadingBubble />}
    </div>
  );
}

function MessageBubble({ message, index }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Detect if response contains workout structure
  const isWorkout = (content) => {
    const workoutKeywords = ['workout', 'exercise', 'sets', 'reps', '🏋️'];
    const lowerContent = content.toLowerCase();
    return workoutKeywords.some(kw => lowerContent.includes(kw)) && 
           (lowerContent.includes('sets') || lowerContent.includes('reps'));
  };

  // Extract workout data if it's a workout response
  const extractWorkoutData = (content) => {
    // Simple extraction - looks for exercise patterns
    const lines = content.split('\n');
    const exercises = [];
    
    lines.forEach(line => {
      // Match patterns like "1. **Exercise Name**" or "- **Exercise**"
      const match = line.match(/(?:\d+\.|[-*])\s+\*\*(.+?)\*\*/);
      if (match) {
        exercises.push({ name: match[1].trim() });
      }
    });
    
    return exercises.length > 0 ? exercises : null;
  };

  const handleSaveToVault = async () => {
    setSaving(true);
    try {
      const content = message.content;
      const workoutData = extractWorkoutData(content);
      
      // Determine type and extract title
      const isWorkoutContent = isWorkout(content);
      const lines = content.split('\n').filter(l => l.trim());
      const title = lines[0]?.replace(/[*#]/g, '').trim() || 
                    (isWorkoutContent ? "Workout Plan" : "Central Answer");
      
      await createVaultItem({
        type: isWorkoutContent ? "workout" : "answer",
        category: "central",
        title: title,
        summary: lines[1]?.substring(0, 100) || "",
        content: {
          raw: content,
          ...(workoutData && { exercises: workoutData }),
        },
        source: "central",
        pinned: false,
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (message.role === "user") {
    return (
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "flex-end",
          animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          animationDelay: `${index * 0.05}s`,
          animationFillMode: "both",
        }}
      >
        <div style={{
          maxWidth: "80%",
          padding: "16px 20px",
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(139, 92, 246, 0.18))",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 40px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.03)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: -1,
            left: "20%",
            right: "20%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)",
            borderRadius: "2px",
          }} />
          
          <p style={{ 
            color: "rgba(255,255,255,0.96)", 
            fontSize: 15.5, 
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 450,
            letterSpacing: 0.2,
          }}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "flex-start",
          animation: "slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          animationDelay: `${index * 0.05}s`,
          animationFillMode: "both",
        }}
      >
        <div style={{
          maxWidth: "85%",
          padding: "18px 22px",
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08))",
          border: "1px solid rgba(239, 68, 68, 0.28)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 40px rgba(239, 68, 68, 0.12)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <p style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: "#fca5a5", 
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}>
              Error
            </p>
          </div>
          <p style={{ 
            color: "rgba(255,255,255,0.75)", 
            fontSize: 15, 
            lineHeight: 1.65,
            margin: 0,
            letterSpacing: 0.2,
          }}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // ── Assistant Response WITH SAVE BUTTON ──
  return (
    <div 
      style={{ 
        display: "flex", 
        justifyContent: "flex-start",
        animation: "slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        animationDelay: `${index * 0.05}s`,
        animationFillMode: "both",
      }}
    >
      <div style={{
        maxWidth: "92%",
        padding: "24px 26px",
        borderRadius: 24,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.65), rgba(31, 41, 55, 0.45))",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 25px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.03)",
        position: "relative",
      }}>
        {/* Animated gradient top border */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), rgba(99, 102, 241, 0.6), transparent)",
          animation: "shimmer 4s ease-in-out infinite",
        }} />

        {/* Central AI Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 16,
          marginBottom: 16,
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            boxShadow: "0 0 16px rgba(139, 92, 246, 0.7), 0 0 4px rgba(99, 102, 241, 0.5)",
            animation: "pulse 2.5s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 11.5,
            fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textTransform: "uppercase",
            letterSpacing: 1.8,
          }}>
            Central AI
          </span>
        </div>

        {/* Message content */}
        <div style={{ 
          color: "rgba(255,255,255,0.90)",
          fontSize: 15.5,
          lineHeight: 1.75,
        }}>
          <MarkdownRenderer text={message.content} />
        </div>

        {/* SAVE TO VAULT BUTTON */}
        <button
          onClick={handleSaveToVault}
          disabled={saving || saved}
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: saved
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))",
            color: saved ? "#fff" : "#a78bfa",
            fontSize: 12,
            fontWeight: 600,
            cursor: saving || saved ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.3s ease",
            backdropFilter: "blur(12px)",
            boxShadow: saved
              ? "0 4px 16px rgba(16, 185, 129, 0.3)"
              : "0 4px 16px rgba(139, 92, 246, 0.2)",
          }}
          onMouseEnter={(e) => {
            if (!saving && !saved) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(99, 102, 241, 0.25))";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!saving && !saved) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.2)";
            }
          }}
        >
          {saving ? (
            <>
              <div style={{
                width: 12,
                height: 12,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #a78bfa",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <span>Saving...</span>
            </>
          ) : saved ? (
            <>
              <span>✓</span>
              <span>Saved!</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Save to Vault</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0%, 100% {
            transform: translateX(-100%);
            opacity: 0.3;
          }
          50% {
            transform: translateX(100%);
            opacity: 0.7;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            boxShadow: 0 0 16px rgba(139, 92, 246, 0.7), 0 0 4px rgba(99, 102, 241, 0.5);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.92);
            boxShadow: 0 0 12px rgba(139, 92, 246, 0.5), 0 0 3px rgba(99, 102, 241, 0.3);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div 
      style={{ 
        display: "flex", 
        justifyContent: "flex-start",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div style={{
        padding: "24px 26px",
        borderRadius: 24,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.65), rgba(31, 41, 55, 0.45))",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 25px 70px rgba(0, 0, 0, 0.45)",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            boxShadow: "0 0 16px rgba(139, 92, 246, 0.7)",
            animation: "pulse 2.5s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 11.5,
            fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textTransform: "uppercase",
            letterSpacing: 1.8,
          }}>
            Central AI
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              animation: "bounce 1.6s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
              boxShadow: "0 0 12px rgba(139, 92, 246, 0.5)",
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          30% {
            transform: translateY(-12px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}