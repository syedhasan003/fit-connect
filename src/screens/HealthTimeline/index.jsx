import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";

const API_BASE = 'http://localhost:8000';

async function fetchHealthTimeline() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/health-timeline`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch timeline');
  return response.json();
}

export default function HealthTimeline() {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const data = await fetchHealthTimeline();
      setTimeline(data.items || []);
    } catch (error) {
      console.error("Failed to load timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group by date
  const groupedByDate = timeline.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      <div style={{ padding: "24px 20px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b5cf6",
              fontSize: 28,
              cursor: "pointer",
              padding: 0,
              marginBottom: 8,
            }}
          >
            ←
          </button>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}>
            Health Memory
          </h1>
          <p style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
          }}>
            Immutable daily health snapshots — Your complete fitness journey
          </p>
        </div>

        {/* LOCK NOTICE */}
        <div style={{
          padding: "16px 20px",
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(14, 165, 233, 0.08))",
          border: "1px solid rgba(6, 182, 212, 0.2)",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <div>
            <p style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#67e8f9",
            }}>
              Read-Only Timeline
            </p>
            <p style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
            }}>
              Immutable after 3 days · Central AI can edit within 72 hours
            </p>
          </div>
        </div>

        {/* TIMELINE */}
        {loading ? (
          <LoadingState />
        ) : dates.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ position: "relative" }}>
            {/* Timeline vertical line */}
            <div style={{
              position: "absolute",
              left: 20,
              top: 20,
              bottom: 20,
              width: "2px",
              background: "linear-gradient(to bottom, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.2), transparent)",
            }} />

            {/* Timeline items */}
            {dates.map((date, i) => (
              <DaySection key={date} date={date} items={groupedByDate[date]} index={i} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function DaySection({ date, items, index }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First day expanded

  // Calculate if editable (within 3 days)
  const dayDate = new Date(date);
  const now = new Date();
  const daysDiff = Math.floor((now - dayDate) / (1000 * 60 * 60 * 24));
  const isEditable = daysDiff <= 3;

  // Count by category
  const workouts = items.filter(i => i.category === 'workout').length;
  const meals = items.filter(i => i.category === 'diet' || i.category === 'meal').length;
  const reminders = items.filter(i => i.category === 'reminder').length;

  return (
    <div style={{
      position: "relative",
      marginBottom: 24,
      paddingLeft: 50,
      animation: "slideIn 0.5s ease-out",
      animationDelay: `${index * 0.1}s`,
      animationFillMode: "both",
    }}>
      {/* Timeline dot */}
      <div style={{
        position: "absolute",
        left: 11,
        top: 20,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: isEditable
          ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
          : "linear-gradient(135deg, #8b5cf6, #6366f1)",
        border: "3px solid #000",
        boxShadow: isEditable
          ? "0 0 20px rgba(251, 191, 36, 0.5)"
          : "0 0 20px rgba(139, 92, 246, 0.4)",
        zIndex: 1,
      }} />

      {/* Day card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: "relative",
          borderRadius: 18,
          padding: "20px",
          background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          transition: "all 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Animated border */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          padding: "1px",
          background: isEditable
            ? "linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3))"
            : "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: "borderGlow 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Date header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#fff",
              }}>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: isEditable ? "#fbbf24" : "rgba(255,255,255,0.5)",
                fontWeight: isEditable ? 600 : 400,
              }}>
                {isEditable ? `🔓 Editable (${3 - daysDiff} days left)` : "🔒 Immutable"}
              </p>
            </div>
            <span style={{
              fontSize: 20,
              transition: "transform 0.3s ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            }}>
              ▼
            </span>
          </div>

          {/* Quick stats */}
          <div style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}>
            {workouts > 0 && (
              <StatBadge icon="🏋️" label="Workouts" count={workouts} color="#8b5cf6" />
            )}
            {meals > 0 && (
              <StatBadge icon="🍽️" label="Meals" count={meals} color="#ec4899" />
            )}
            {reminders > 0 && (
              <StatBadge icon="⏰" label="Reminders" count={reminders} color="#06b6d4" />
            )}
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              animation: "fadeIn 0.3s ease-out",
            }}>
              {items.map((item, i) => (
                <TimelineItem key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StatBadge({ icon, label, count, color }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 999,
      background: `${color}15`,
      border: `1px solid ${color}30`,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: color,
      }}>
        {count} {label}
      </span>
    </div>
  );
}

function TimelineItem({ item }) {
  const getCategoryStyle = (category) => {
    const styles = {
      workout: { color: "#8b5cf6", icon: "🏋️", bg: "rgba(139, 92, 246, 0.1)" },
      diet: { color: "#ec4899", icon: "🍽️", bg: "rgba(236, 72, 153, 0.1)" },
      meal: { color: "#ec4899", icon: "🍽️", bg: "rgba(236, 72, 153, 0.1)" },
      reminder: { color: "#06b6d4", icon: "⏰", bg: "rgba(6, 182, 212, 0.1)" },
      ai_insight: { color: "#10b981", icon: "💡", bg: "rgba(16, 185, 129, 0.1)" },
      default: { color: "#6b7280", icon: "📝", bg: "rgba(107, 114, 128, 0.1)" },
    };
    return styles[category] || styles.default;
  };

  const style = getCategoryStyle(item.category);

  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 14,
      background: style.bg,
      border: `1px solid ${style.color}20`,
      marginBottom: 10,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{style.icon}</span>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: style.color,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            {item.category}
          </span>
        </div>
        <span style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
        }}>
          {new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
      <p style={{
        margin: 0,
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 1.5,
      }}>
        {item.content || item.description || "No details available"}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "60px 20px",
    }}>
      <div style={{
        width: 50,
        height: 50,
        margin: "0 auto 20px",
        border: "3px solid rgba(139, 92, 246, 0.2)",
        borderTop: "3px solid #8b5cf6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{
        fontSize: 15,
        color: "rgba(255,255,255,0.6)",
      }}>
        Loading your health timeline...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "60px 20px",
    }}>
      <span style={{ fontSize: 60, marginBottom: 20, display: "block" }}>📊</span>
      <h3 style={{
        margin: "0 0 12px",
        fontSize: 20,
        fontWeight: 600,
      }}>
        No Health Data Yet
      </h3>
      <p style={{
        margin: 0,
        fontSize: 15,
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.6,
      }}>
        Your health timeline will automatically populate as you log workouts, meals, and track progress.
      </p>
    </div>
  );
}