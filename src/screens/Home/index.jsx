import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import ProfileDropdown from "../../components/ProfileDropdown";
import { fetchHomeOverview } from "../../api/home";
import { fetchReminders } from "../../api/reminders";
import { useAuth } from "../../auth/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const homeData = await fetchHomeOverview();
      console.log('✅ Home data received:', homeData);
      setData(homeData);

      // Load reminder count
      try {
        const reminderData = await fetchReminders();
        setReminderCount(reminderData.length);
      } catch (reminderError) {
        console.warn('⚠️ Failed to load reminders:', reminderError);
      }

    } catch (err) {
      console.error('❌ Home fetch error:', err);

      if (err.message.includes('Authentication failed') || err.message.includes('401')) {
        console.log('🚪 Auth failed - logging out...');
        logout();
        navigate('/login', { replace: true });
      } else {
        setError(err.message);
      }
    }
  };

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        padding: 20,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Error Loading Home</h2>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <LoadingState />;

  const user = data.user || {};
  const name = user.full_name || user.email?.split("@")[0] || "User";
  const today = data.today || { workout: "pending", diet: {}, reminders: { missed: 0 } };
  const consistency = data.consistency || [];
  const aiSummary = data.evaluator?.ai_summary || "Keep showing up. Momentum compounds.";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "24px 20px 20px",
        position: "relative",
      }}>
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer",
            position: "relative",
            width: "fit-content",
          }}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
            border: "2px solid rgba(139, 92, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.2)",
            position: "relative",
            transition: "all 0.2s ease",
            transform: isDropdownOpen ? "scale(1.05)" : "scale(1)",
          }}>
            <div style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              opacity: 0.3,
              filter: "blur(8px)",
              animation: "pulse 3s ease-in-out infinite",
            }} />
            <span style={{ position: "relative", zIndex: 1 }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}>
              {name}
            </h1>
            <p style={{
              margin: "2px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              fontWeight: 450,
            }}>
              Dashboard overview
            </p>
          </div>
        </div>

        {/* Profile Dropdown */}
        <ProfileDropdown
          userName={name}
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
        />
      </header>

      <div style={{ padding: "0 20px" }}>
        {/* TODAY SECTION */}
        <SectionHeader title="Today" />
        <TodayCard
          data={today}
          navigate={navigate}
          user={user}
        />

        {/* REMINDERS SUMMARY */}
        {reminderCount > 0 && (
          <>
            <SectionHeader title="Reminders" />
            <ReminderSummaryCard
              count={reminderCount}
              onClick={() => navigate("/reminders")}
            />
          </>
        )}

        {/* CREATE SECTION */}
        <SectionHeader title="Create" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 32,
        }}>
          <CreateCard
            icon="🏋️"
            label="CREATE"
            title="Workout"
            link="Manual builder →"
            color="#8b5cf6"
            onClick={() => navigate("/workout-builder")}
          />
          <CreateCard
            icon="🍽️"
            label="CREATE"
            title="Diet Plan"
            link="Manual builder →"
            color="#6366f1"
            onClick={() => navigate("/diet-builder")}
          />
        </div>

        {/* PROGRESS SECTION */}
        <SectionHeader title="Progress" />
        <ProgressCard consistency={consistency} />

        {/* AI INSIGHT SECTION */}
        <SectionHeader title="AI Insight" />
        <AIInsightCard insight={aiSummary} />
      </div>

      <BottomNav />

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes borderGlow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0%, 100% {
            transform: translateX(-50%);
            opacity: 0.4;
          }
          50% {
            transform: translateX(50%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function ReminderSummaryCard({ count, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 18,
        padding: "20px",
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        marginBottom: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h3 style={{
            margin: "0 0 6px",
            fontSize: 17,
            fontWeight: 600,
          }}>
            You have {count} active reminder{count !== 1 ? 's' : ''}
          </h3>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}>
            Tap to view all
          </p>
        </div>
        <div style={{
          fontSize: 24,
          color: "#8b5cf6",
        }}>
          →
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
    }}>
      <div style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            animation: "bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 style={{
      fontSize: 19,
      fontWeight: 600,
      marginTop: 32,
      marginBottom: 14,
      letterSpacing: 0.3,
    }}>
      {title}
    </h2>
  );
}

function TodayCard({ data, navigate, user }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Helper to get workout display
  const getWorkoutDisplay = () => {
    const status = data.workout || "not_set";

    switch (status) {
      case "completed":
        return { value: "Completed", status: "success", icon: "✅" };
      case "in_progress":
        return { value: "In Progress", status: "in_progress", icon: "🏋️" };
      case "pending":
        return { value: "Pending", status: "pending", icon: "⏳" };
      case "rest_day":
        return { value: "Rest Day", status: "rest", icon: "🌙" };
      case "not_set":
        return { value: "Not Set", status: "muted", icon: "➕" };
      default:
        return { value: "Pending", status: "pending", icon: "⏳" };
    }
  };

  // Helper to get diet display
  const getDietDisplay = () => {
    const dietData = data.diet || {};
    const status = dietData.status || "not_set";
    const calories = dietData.calories || { logged: 0, target: 0 };

    switch (status) {
      case "completed":
        return {
          value: `${calories.logged}/${calories.target} cal ✅`,
          status: "success",
          icon: "✅"
        };
      case "in_progress":
        return {
          value: `${calories.logged}/${calories.target} cal`,
          status: "in_progress",
          icon: "🍽️"
        };
      case "pending":
        return {
          value: `0/${calories.target} cal`,
          status: "pending",
          icon: "⏳"
        };
      case "not_set":
        return { value: "Not Set", status: "muted", icon: "➕" };
      default:
        return { value: "Not Set", status: "muted", icon: "➕" };
    }
  };

  const workoutDisplay = getWorkoutDisplay();
  const dietDisplay = getDietDisplay();

  // Define items with click handlers
  const items = [
    {
      label: "Workout",
      value: workoutDisplay.value,
      status: workoutDisplay.status,
      icon: workoutDisplay.icon,
      onClick: () => {
        // Check if user has active workout program
        if (user.active_workout_program_id) {
          // Go to workout tracking/session page
          navigate('/workout-tracking');  // ✅ FIXED PATH
        } else {
          // Go to workout builder for first-time setup
          navigate('/workout-builder');
        }
      },
    },
    {
      label: "Diet",
      value: dietDisplay.value,
      status: dietDisplay.status,
      icon: dietDisplay.icon,
      onClick: () => {
        // Check if user has active diet plan
        if (user.active_diet_plan_id) {
          // Go to meal logging page
          navigate('/meal-logging');  // ✅ FIXED PATH
        } else {
          // Go to diet builder for first-time setup
          navigate('/diet-builder');
        }
      },
    },
    {
      label: "Reminders",
      value: `${data.reminders?.missed || 0} missed`,
      status: (data.reminders?.missed || 0) > 0 ? "warning" : "muted",
      icon: (data.reminders?.missed || 0) > 0 ? "⚠️" : "✅",
      onClick: () => navigate('/reminders'),
    },
  ];

  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "18px 20px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        inset: -20,
        background: "conic-gradient(from 0deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)",
        animation: "rotate 8s linear infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {items.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 8px",
              borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              cursor: "pointer",
              background: hoveredIndex === i
                ? "rgba(139, 92, 246, 0.1)"
                : "transparent",
              borderRadius: 8,
              transition: "all 0.2s ease",
              transform: hoveredIndex === i ? "translateX(4px)" : "translateX(0)",
            }}
          >
            <span style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 450,
            }}>
              {item.label}
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: item.status === "success"
                  ? "#10b981"
                  : item.status === "warning"
                  ? "#f59e0b"
                  : item.status === "pending"
                  ? "#8b5cf6"
                  : item.status === "in_progress"
                  ? "#3b82f6"
                  : item.status === "rest"
                  ? "#6b7280"
                  : "rgba(255,255,255,0.5)",
              }}>
                {item.value}
              </span>
              {hoveredIndex === i && (
                <span style={{
                  fontSize: 16,
                  color: "#8b5cf6",
                  transition: "all 0.2s ease",
                }}>
                  →
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateCard({ icon, label, title, link, color, onClick }) {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "18px 16px",
        background: isHover
          ? `linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.5))`
          : "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHover ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: isHover
          ? `0 12px 32px ${color}25, 0 0 0 1px ${color}15`
          : "none",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        padding: "1px",
        background: isHover
          ? `linear-gradient(135deg, ${color}60, transparent)`
          : `linear-gradient(135deg, ${color}20, transparent)`,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        transition: "background 0.3s ease",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100%",
        background: `linear-gradient(135deg, ${color}15, transparent)`,
        opacity: isHover ? 1 : 0,
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 32,
          marginBottom: 8,
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
        }}>
          {icon}
        </div>
        <p style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 6,
          fontWeight: 600,
        }}>
          {label}
        </p>
        <h3 style={{
          fontSize: 17,
          fontWeight: 600,
          margin: "0 0 8px",
          letterSpacing: 0.3,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          margin: 0,
          fontWeight: 450,
        }}>
          {link}
        </p>
      </div>
    </div>
  );
}

function ProgressCard({ consistency }) {
  if (!consistency || consistency.length === 0) {
    consistency = Array(14).fill({ worked_out: false });
  }

  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "24px 20px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      textAlign: "center",
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 16,
        }}>
          {consistency.map((d, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: d.worked_out
                  ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                  : "rgba(255, 255, 255, 0.08)",
                boxShadow: d.worked_out ? "0 0 12px rgba(139, 92, 246, 0.6)" : "none",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          margin: 0,
          fontWeight: 500,
          letterSpacing: 0.3,
        }}>
          Consistency (last 14 days)
        </p>
      </div>
    </div>
  );
}

function AIInsightCard({ insight }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "20px",
      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
      marginBottom: 24,
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: "20%",
        right: "20%",
        height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)",
        borderRadius: "2px",
        animation: "shimmer 3s ease-in-out infinite",
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            boxShadow: "0 0 12px rgba(139, 92, 246, 0.6)",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}>
            Central AI
          </span>
        </div>

        <p style={{
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.85)",
          margin: 0,
          fontWeight: 450,
          letterSpacing: 0.2,
        }}>
          {insight}
        </p>
      </div>
    </div>
  );
}