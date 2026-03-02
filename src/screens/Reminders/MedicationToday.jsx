import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTodaysMedicationLogs, markTabletTaken } from "../../api/reminders";

export default function MedicationToday() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]); // [{schedule, log}]
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // "scheduleId-tabletName"

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchTodaysMedicationLogs();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load medication logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (logId, scheduleId, tabletName, currentStatus) => {
    const key = `${scheduleId}-${tabletName}`;
    if (updating === key) return;
    setUpdating(key);

    try {
      const updated = await markTabletTaken(logId, { [tabletName]: !currentStatus });
      setEntries((prev) =>
        prev.map((e) =>
          e.log.id === logId
            ? { ...e, log: { ...e.log, tablets_status: updated.tablets_status } }
            : e
        )
      );
    } catch (err) {
      console.error("Failed to update tablet:", err);
      alert("Failed to update. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  // ── Overall progress ────────────────────────────────────────────────────────
  const totalTablets = entries.reduce((sum, { schedule }) => {
    return sum + (schedule.tablets?.length || 0);
  }, 0);
  const takenTablets = entries.reduce((sum, { log }) => {
    if (!log?.tablets_status) return sum;
    return sum + Object.values(log.tablets_status).filter(Boolean).length;
  }, 0);
  const progressPct = totalTablets > 0 ? (takenTablets / totalTablets) * 100 : 0;
  const allDone = totalTablets > 0 && takenTablets === totalTablets;

  if (loading) return <LoadingState />;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "24px 20px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent", border: "none",
            color: "#3b82f6", fontSize: 28, cursor: "pointer",
            padding: 0, marginBottom: 8,
          }}
        >
          ←
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: 0.3 }}>
              Today's Medication
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => navigate("/reminders/medication-history")}
            style={{
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 10, padding: "6px 12px",
              color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer",
              marginTop: 4, whiteSpace: "nowrap",
            }}
          >
            History →
          </button>
        </div>
      </div>

      {/* ── OVERALL PROGRESS CARD ── */}
      {totalTablets > 0 && (
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{
            padding: "22px",
            borderRadius: 20,
            background: allDone
              ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))"
              : "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))",
            border: allDone
              ? "1px solid rgba(16,185,129,0.3)"
              : "1px solid rgba(59,130,246,0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: 4 }}>
                  Overall Progress
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
                  {takenTablets}
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                    /{totalTablets}
                  </span>
                  <span style={{ fontSize: 15, marginLeft: 8, color: "rgba(255,255,255,0.7)" }}>
                    tablets
                  </span>
                </div>
              </div>
              {allDone ? (
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(16,185,129,0.2)",
                  border: "2px solid rgba(16,185,129,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26,
                }}>
                  ✅
                </div>
              ) : (
                <div style={{
                  fontSize: 28, fontWeight: 700,
                  color: "#3b82f6",
                }}>
                  {Math.round(progressPct)}%
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{
              height: 8, borderRadius: 99,
              background: "rgba(255,255,255,0.08)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                background: allDone
                  ? "linear-gradient(90deg, #10b981, #059669)"
                  : "linear-gradient(90deg, #3b82f6, #6366f1)",
                width: `${progressPct}%`,
                transition: "width 0.5s ease",
              }} />
            </div>

            {allDone && (
              <div style={{
                marginTop: 12, fontSize: 14, fontWeight: 500,
                color: "#10b981", textAlign: "center",
              }}>
                All done for today! Great job 🎉
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SCHEDULE CARDS ── */}
      <div style={{ padding: "0 20px" }}>
        {entries.length === 0 ? (
          <EmptyState onAdd={() => navigate("/reminders/create")} />
        ) : (
          entries.map(({ schedule, log }) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              log={log}
              updating={updating}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── ScheduleCard ─────────────────────────────────────────────────────────────

function ScheduleCard({ schedule, log, updating, onToggle }) {
  const tablets = schedule.tablets || [];
  const status = log?.tablets_status || {};

  const taken = Object.values(status).filter(Boolean).length;
  const total = tablets.length;
  const allTaken = total > 0 && taken === total;

  // Format time: "09:00" → "9:00 AM"
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <div style={{
      marginBottom: 16, borderRadius: 20,
      border: allTaken
        ? "1px solid rgba(16,185,129,0.3)"
        : "1px solid rgba(59,130,246,0.2)",
      background: allTaken
        ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))"
        : "linear-gradient(135deg, rgba(17,24,39,0.6), rgba(31,41,55,0.4))",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
    }}>
      {/* Schedule header */}
      <div style={{
        padding: "16px 18px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
            {schedule.name}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            🕐 {formatTime(schedule.scheduled_time)}
          </div>
        </div>
        <div style={{
          padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
          background: allTaken ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.12)",
          color: allTaken ? "#10b981" : "#60a5fa",
        }}>
          {taken}/{total}
        </div>
      </div>

      {/* Tablet list */}
      <div style={{ padding: "10px 0" }}>
        {tablets.map((tablet) => {
          const isTaken = !!status[tablet.name];
          const isUpdating = updating === `${schedule.id}-${tablet.name}`;

          return (
            <button
              key={tablet.name}
              onClick={() => onToggle(log.id, schedule.id, tablet.name, isTaken)}
              disabled={isUpdating}
              style={{
                width: "100%",
                padding: "14px 18px",
                background: "transparent",
                border: "none",
                cursor: isUpdating ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                border: isTaken
                  ? "2px solid #10b981"
                  : "2px solid rgba(255,255,255,0.2)",
                background: isTaken
                  ? "rgba(16,185,129,0.2)"
                  : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s ease",
                opacity: isUpdating ? 0.5 : 1,
              }}>
                {isTaken && "✓"}
              </div>

              {/* Tablet info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600,
                  color: isTaken ? "rgba(255,255,255,0.5)" : "#fff",
                  textDecoration: isTaken ? "line-through" : "none",
                  transition: "all 0.2s ease",
                }}>
                  {tablet.name}
                </div>
                {(tablet.dosage || tablet.instructions) && (
                  <div style={{
                    fontSize: 12, color: "rgba(255,255,255,0.4)",
                    marginTop: 2,
                  }}>
                    {[tablet.dosage, tablet.instructions].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>

              {/* Taken label */}
              {isTaken && (
                <span style={{
                  fontSize: 12, fontWeight: 600, color: "#10b981",
                  flexShrink: 0,
                }}>
                  Taken
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(59,130,246,0.1)",
        border: "2px solid rgba(59,130,246,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, margin: "0 auto 24px",
      }}>
        💊
      </div>
      <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600 }}>
        No Medication Schedules
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
        Set up a medication schedule to track your daily tablets here.
      </p>
      <button
        onClick={onAdd}
        style={{
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          border: "none", borderRadius: 14, padding: "14px 28px",
          color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
        }}
      >
        Add Medication
      </button>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

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
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            animation: "bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}}`}</style>
    </div>
  );
}
