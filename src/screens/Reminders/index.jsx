import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchReminders, acknowledgeReminder, markReminderMissed, deleteReminder } from "../../api/reminders";

export default function Reminders() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await fetchReminders();
      setReminders(data.filter(r => r.is_active));
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (reminderId) => {
    try {
      await acknowledgeReminder(reminderId);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Failed to acknowledge:', error);
      alert('Failed to mark as done. Please try again.');
    }
  };

  const handleSkip = async (reminderId) => {
    try {
      await markReminderMissed(reminderId, 'User skipped');
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Failed to skip:', error);
      alert('Failed to skip. Please try again.');
    }
  };

  const handleDelete = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      await deleteReminder(reminderId);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleEdit = (reminder) => {
    navigate(`/reminders/edit/${reminder.id}`, { state: { reminder } });
  };

  if (loading) return <LoadingState />;

  // Organize reminders
  const now = new Date();
  const today = reminders.filter(r => {
    const schedDate = new Date(r.scheduled_at);
    return schedDate.toDateString() === now.toDateString();
  });

  const overdue = reminders.filter(r => new Date(r.scheduled_at) < now);
  const upcoming = reminders.filter(r => {
    const schedDate = new Date(r.scheduled_at);
    return schedDate > now && schedDate < new Date(now.getTime() + 24 * 60 * 60 * 1000);
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "24px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
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
            Reminders
          </h1>
        </div>
        <button
          onClick={() => navigate("/reminders/create")}
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            border: "none",
            borderRadius: 14,
            padding: "12px 20px",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          New
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* TODAY SUMMARY */}
        {(today.length > 0 || overdue.length > 0) && (
          <>
            <SectionHeader title="Today" />
            <SummaryCard
              active={today.length}
              overdue={overdue.length}
            />
          </>
        )}

        {/* OVERDUE */}
        {overdue.length > 0 && (
          <>
            <SectionHeader title="Overdue" count={overdue.length} />
            {overdue.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onAcknowledge={() => handleAcknowledge(reminder.id)}
                onSkip={() => handleSkip(reminder.id)}
                onEdit={() => handleEdit(reminder)}
                onDelete={() => handleDelete(reminder.id)}
                isOverdue={true}
              />
            ))}
          </>
        )}

        {/* UPCOMING (Next 24h) */}
        {upcoming.length > 0 && (
          <>
            <SectionHeader title="Upcoming" subtitle="Next 24h" />
            {upcoming.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onAcknowledge={() => handleAcknowledge(reminder.id)}
                onSkip={() => handleSkip(reminder.id)}
                onEdit={() => handleEdit(reminder)}
                onDelete={() => handleDelete(reminder.id)}
              />
            ))}
          </>
        )}

        {/* EMPTY STATE */}
        {reminders.length === 0 && (
          <div style={{
            padding: "60px 20px",
            textAlign: "center",
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))",
              border: "2px solid rgba(139, 92, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              margin: "0 auto 24px",
            }}>
              🔔
            </div>
            <h2 style={{
              margin: "0 0 12px",
              fontSize: 20,
              fontWeight: 600,
            }}>
              No Reminders
            </h2>
            <p style={{
              margin: "0 0 28px",
              fontSize: 15,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
            }}>
              Create your first reminder to get started
            </p>
            <button
              onClick={() => navigate("/reminders/create")}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                border: "none",
                borderRadius: 14,
                padding: "14px 28px",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create Reminder
            </button>
          </div>
        )}
      </div>

      <BottomNav />
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
    }}>
      <div style={{ display: "flex", gap: 10 }}>
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

function SectionHeader({ title, subtitle, count }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 32,
      marginBottom: 14,
    }}>
      <div>
        <h2 style={{
          fontSize: 19,
          fontWeight: 600,
          margin: 0,
          letterSpacing: 0.3,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            margin: "4px 0 0",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {count !== undefined && (
        <span style={{
          padding: "4px 10px",
          borderRadius: 999,
          background: "rgba(239, 68, 68, 0.2)",
          fontSize: 13,
          fontWeight: 600,
          color: "#ef4444",
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function SummaryCard({ active, overdue }) {
  return (
    <div style={{
      borderRadius: 18,
      padding: "20px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(139, 92, 246, 0.2)",
      marginBottom: 16,
    }}>
      <div style={{
        display: "flex",
        gap: 24,
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 4,
          }}>
            {active}
          </div>
          <div style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
          }}>
            Active
          </div>
        </div>
        {overdue > 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ef4444",
              marginBottom: 4,
            }}>
              {overdue}
            </div>
            <div style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}>
              Overdue
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReminderCard({ reminder, onAcknowledge, onSkip, onEdit, onDelete, isOverdue = false }) {
  // Convert UTC timestamp to local timezone for display
  const scheduledDate = new Date(reminder.scheduled_at);

  const timeString = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const dateString = scheduledDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{
      borderRadius: 16,
      padding: "18px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.4))",
      backdropFilter: "blur(12px)",
      border: isOverdue
        ? "1px solid rgba(239, 68, 68, 0.3)"
        : "1px solid rgba(139, 92, 246, 0.2)",
      marginBottom: 12,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: "0 0 6px",
            fontSize: 17,
            fontWeight: 600,
          }}>
            {reminder.message}
          </h3>
          <div style={{
            fontSize: 14,
            color: isOverdue ? "#ef4444" : "rgba(255,255,255,0.6)",
            fontWeight: 500,
          }}>
            {dateString} · {timeString}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isOverdue && (
            <span style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(239, 68, 68, 0.2)",
              fontSize: 11,
              fontWeight: 700,
              color: "#ef4444",
              letterSpacing: 0.5,
            }}>
              OVERDUE
            </span>
          )}
          <button
            onClick={onEdit}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b5cf6",
              fontSize: 18,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              fontSize: 18,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}>
        <button
          onClick={onAcknowledge}
          style={{
            padding: "12px",
            borderRadius: 12,
            border: "none",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Done
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: "12px",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}