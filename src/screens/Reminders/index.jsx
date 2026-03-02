import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import {
  fetchReminders,
  acknowledgeReminder,
  markReminderMissed,
  deleteReminder,
  fetchMedicationSchedules,
  fetchTodaysMedicationLogs,
} from "../../api/reminders";

// ── Category config ─────────────────────────────────────────────────────────

const CATEGORY = {
  workout:    { emoji: "🏋️", color: "#f59e0b", label: "Workout" },
  meal:       { emoji: "🥗", color: "#10b981", label: "Meal & Supps" },
  medication: { emoji: "💊", color: "#3b82f6", label: "Medication" },
  checkup:    { emoji: "🏥", color: "#ec4899", label: "Health Checkup" },
  other:      { emoji: "📌", color: "#8b5cf6", label: "Reminder" },
};

function getCategoryInfo(type) {
  return CATEGORY[type] || CATEGORY.other;
}

// ── Recurrence label ─────────────────────────────────────────────────────────

const DAY_LABELS = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

function getRecurrenceLabel(reminder) {
  const { recurrence, recurrence_days, recurrence_interval } = reminder;
  if (!recurrence || recurrence === "once") return null;
  if (recurrence === "daily") return "Daily";
  if (recurrence === "weekly") return "Weekly";
  if (recurrence === "monthly") return "Monthly";
  if (recurrence === "specific" && recurrence_days) {
    try {
      const days = JSON.parse(recurrence_days);
      return days.map((d) => DAY_LABELS[d] || d).join(" · ");
    } catch {
      return "Specific days";
    }
  }
  if (recurrence === "custom" && recurrence_interval) {
    return `Every ${recurrence_interval} days`;
  }
  return recurrence;
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function Reminders() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [medSchedules, setMedSchedules] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [remData, schedData, logsData] = await Promise.all([
        fetchReminders(),
        fetchMedicationSchedules().catch(() => []),
        fetchTodaysMedicationLogs().catch(() => []),
      ]);
      setReminders(remData.filter((r) => r.is_active));
      setMedSchedules(schedData);
      setMedLogs(logsData);
    } catch (error) {
      console.error("Failed to load reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (reminderId) => {
    try {
      await acknowledgeReminder(reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (error) {
      console.error("Failed to acknowledge:", error);
      alert("Failed to mark as done. Please try again.");
    }
  };

  const handleSkip = async (reminderId) => {
    try {
      await markReminderMissed(reminderId, "User skipped");
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (error) {
      console.error("Failed to skip:", error);
      alert("Failed to skip. Please try again.");
    }
  };

  const handleDelete = async (reminderId) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await deleteReminder(reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  const handleEdit = (reminder) => {
    navigate(`/reminders/edit/${reminder.id}`, { state: { reminder } });
  };

  if (loading) return <LoadingState />;

  // ── Group reminders ────────────────────────────────────────────────────────
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const overdue  = reminders.filter((r) => new Date(r.scheduled_at) < now);
  const todayAhead = reminders.filter((r) => {
    const d = new Date(r.scheduled_at);
    return d >= now && d <= todayEnd;
  });
  const upcoming = reminders.filter((r) => new Date(r.scheduled_at) > todayEnd);

  // ── Medication summary ─────────────────────────────────────────────────────
  const totalTablets = medLogs.reduce((sum, { schedule }) => {
    try {
      return sum + (schedule.tablets?.length || 0);
    } catch { return sum; }
  }, 0);
  const takenTablets = medLogs.reduce((sum, { log }) => {
    if (!log?.tablets_status) return sum;
    return sum + Object.values(log.tablets_status).filter(Boolean).length;
  }, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      {/* ── HEADER ── */}
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
              background: "transparent", border: "none",
              color: "#8b5cf6", fontSize: 28, cursor: "pointer",
              padding: 0, marginBottom: 8,
            }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: 0.3 }}>
            Reminders
          </h1>
        </div>
        <button
          onClick={() => navigate("/reminders/create")}
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            border: "none", borderRadius: 14, padding: "12px 20px",
            color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> New
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* ── MEDICATION BANNER ── */}
        {medSchedules.length > 0 && (
          <button
            onClick={() => navigate("/reminders/medication-today")}
            style={{
              width: "100%",
              marginBottom: 20,
              padding: "18px 20px",
              borderRadius: 18,
              border: "1px solid rgba(59, 130, 246, 0.3)",
              background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))",
              backdropFilter: "blur(12px)",
              color: "#fff",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, flexShrink: 0,
            }}>
              💊
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Today's Medication
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                {takenTablets}/{totalTablets} tablets taken
              </div>
              {/* Progress bar */}
              <div style={{
                marginTop: 8, height: 4, borderRadius: 99,
                background: "rgba(255,255,255,0.1)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                  width: totalTablets > 0
                    ? `${Math.round((takenTablets / totalTablets) * 100)}%`
                    : "0%",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>›</span>
          </button>
        )}

        {/* ── OVERDUE ── */}
        {overdue.length > 0 && (
          <>
            <SectionHeader title="Overdue" count={overdue.length} countColor="#ef4444" />
            {overdue.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onAcknowledge={() => handleAcknowledge(r.id)}
                onSkip={() => handleSkip(r.id)}
                onEdit={() => handleEdit(r)}
                onDelete={() => handleDelete(r.id)}
                isOverdue
              />
            ))}
          </>
        )}

        {/* ── TODAY (upcoming today) ── */}
        {todayAhead.length > 0 && (
          <>
            <SectionHeader title="Today" />
            {todayAhead.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onAcknowledge={() => handleAcknowledge(r.id)}
                onSkip={() => handleSkip(r.id)}
                onEdit={() => handleEdit(r)}
                onDelete={() => handleDelete(r.id)}
              />
            ))}
          </>
        )}

        {/* ── UPCOMING ── */}
        {upcoming.length > 0 && (
          <>
            <SectionHeader title="Upcoming" />
            {upcoming.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onAcknowledge={() => handleAcknowledge(r.id)}
                onSkip={() => handleSkip(r.id)}
                onEdit={() => handleEdit(r)}
                onDelete={() => handleDelete(r.id)}
              />
            ))}
          </>
        )}

        {/* ── EMPTY STATE ── */}
        {reminders.length === 0 && medSchedules.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.1))",
              border: "2px solid rgba(139,92,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, margin: "0 auto 24px",
            }}>
              🔔
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600 }}>
              No Reminders
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
              Create your first reminder to get started
            </p>
            <button
              onClick={() => navigate("/reminders/create")}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                border: "none", borderRadius: 14, padding: "14px 28px",
                color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
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

// ── Sub-components ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{
      minHeight: "100vh", background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ display: "flex", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 12, height: 12, borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            animation: "bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}}`}</style>
    </div>
  );
}

function SectionHeader({ title, count, countColor = "#ef4444" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      marginTop: 28, marginBottom: 14,
    }}>
      <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, letterSpacing: 0.3 }}>
        {title}
      </h2>
      {count !== undefined && (
        <span style={{
          padding: "4px 10px", borderRadius: 999,
          background: `rgba(${countColor === "#ef4444" ? "239,68,68" : "139,92,246"}, 0.15)`,
          fontSize: 13, fontWeight: 600, color: countColor,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function ReminderCard({ reminder, onAcknowledge, onSkip, onEdit, onDelete, isOverdue = false }) {
  const cat = getCategoryInfo(reminder.type);
  const recLabel = getRecurrenceLabel(reminder);

  const scheduledDate = new Date(reminder.scheduled_at);
  const timeStr = scheduledDate.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  const dateStr = scheduledDate.toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  const displayTitle = reminder.title || reminder.message || "Reminder";

  return (
    <div style={{
      borderRadius: 18, padding: "18px",
      background: "linear-gradient(135deg, rgba(17,24,39,0.6), rgba(31,41,55,0.4))",
      backdropFilter: "blur(12px)",
      border: isOverdue
        ? "1px solid rgba(239,68,68,0.3)"
        : `1px solid rgba(${cat.color === "#f59e0b" ? "245,158,11" : cat.color === "#10b981" ? "16,185,129" : cat.color === "#3b82f6" ? "59,130,246" : cat.color === "#ec4899" ? "236,72,153" : "139,92,246"}, 0.2)`,
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>

        {/* Left: icon + title */}
        <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 0 }}>
          {/* Category icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `rgba(${cat.color === "#f59e0b" ? "245,158,11" : cat.color === "#10b981" ? "16,185,129" : cat.color === "#3b82f6" ? "59,130,246" : cat.color === "#ec4899" ? "236,72,153" : "139,92,246"}, 0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            {cat.emoji}
          </div>

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: "0 0 4px", fontSize: 16, fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {displayTitle}
            </h3>

            {/* Date/time + recurrence */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{
                fontSize: 13,
                color: isOverdue ? "#ef4444" : "rgba(255,255,255,0.55)",
                fontWeight: 500,
              }}>
                {dateStr} · {timeStr}
              </span>
              {recLabel && (
                <span style={{
                  padding: "2px 8px", borderRadius: 999,
                  background: "rgba(139,92,246,0.15)",
                  fontSize: 11, fontWeight: 600, color: "#a78bfa",
                  letterSpacing: 0.3,
                }}>
                  {recLabel}
                </span>
              )}
              {isOverdue && (
                <span style={{
                  padding: "2px 8px", borderRadius: 999,
                  background: "rgba(239,68,68,0.15)",
                  fontSize: 11, fontWeight: 700, color: "#ef4444",
                  letterSpacing: 0.5,
                }}>
                  OVERDUE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: edit / delete */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
          <button
            onClick={onEdit}
            style={{
              background: "transparent", border: "none",
              color: "#8b5cf6", fontSize: 17, cursor: "pointer", padding: "4px 8px",
            }}
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{
              background: "transparent", border: "none",
              color: "#ef4444", fontSize: 17, cursor: "pointer", padding: "4px 8px",
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          onClick={onAcknowledge}
          style={{
            padding: "11px", borderRadius: 12, border: "none",
            background: "rgba(16,185,129,0.15)", color: "#10b981",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          ✓ Done
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: "11px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
