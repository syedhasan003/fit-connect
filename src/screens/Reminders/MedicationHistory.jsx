/**
 * MedicationHistory
 * ─────────────────
 * Shows the last 30 days of medication adherence.
 *
 * Layout:
 *  • Adherence calendar heat-map (7 cols × N rows, one cell per day)
 *  • Per-schedule stats cards (streak, adherence %)
 *  • Day-drill-down list: tap any calendar day to see that day's details
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMedicationHistory,
  fetchMedicationSchedules,
} from "../../api/reminders";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#0d0d0f",
  surface:  "#18181c",
  surface2: "#222228",
  border:   "#2a2a34",
  accent:   "#6366f1",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
  amber:    "#f59e0b",
  red:      "#ef4444",
  text:     "#f1f1f3",
  muted:    "#6b7280",
  muted2:   "#9ca3af",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function isoDate(d) {
  return d.toISOString().split("T")[0];
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function adherenceColor(pct) {
  if (pct === null || pct === undefined) return "#2a2a34";
  if (pct >= 80) return C.green;
  if (pct >= 50) return C.amber;
  return C.red;
}

function adherenceLabel(pct) {
  if (pct === null || pct === undefined) return "No data";
  if (pct >= 80) return "Great";
  if (pct >= 50) return "Partial";
  return "Missed";
}

/**
 * Compute per-day adherence score from logs.
 * Returns { "YYYY-MM-DD": pct } where pct = 0–100 or null if no log.
 */
function computeDayScores(logs) {
  const map = {};
  for (const log of logs) {
    const date = log.log_date;
    const tablets = log.tablets_status || {};
    const entries = Object.values(tablets);
    if (entries.length === 0) {
      // Log exists but no tablets recorded → treat as 0
      if (!(date in map)) map[date] = { taken: 0, total: 0 };
      continue;
    }
    if (!(date in map)) map[date] = { taken: 0, total: 0 };
    map[date].taken += entries.filter(Boolean).length;
    map[date].total += entries.length;
  }
  const result = {};
  for (const [date, { taken, total }] of Object.entries(map)) {
    result[date] = total > 0 ? Math.round((taken / total) * 100) : 0;
  }
  return result;
}

/**
 * Compute current adherence streak (consecutive fully-acknowledged days).
 */
function computeStreak(dayScores) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = isoDate(addDays(today, -i));
    const pct = dayScores[d];
    if (pct === undefined || pct === null) break;
    if (pct >= 80) streak++;
    else break;
  }
  return streak;
}

// ── Calendar heat-map ─────────────────────────────────────────────────────────
function CalendarGrid({ dayScores, selectedDay, onSelectDay }) {
  const today = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(isoDate(addDays(today, -i)));
  }

  // Pad with blank cells so the grid starts on Monday
  const firstDay = new Date(days[0]);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const cells = Array(startDow).fill(null).concat(days);

  const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div>
      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;
          const pct = dayScores[date];
          const isToday = date === isoDate(today);
          const isSelected = date === selectedDay;
          const color = adherenceColor(pct);
          const dayNum = parseInt(date.split("-")[2], 10);

          return (
            <button
              key={date}
              onClick={() => onSelectDay(date === selectedDay ? null : date)}
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                background: pct !== undefined ? `${color}30` : C.surface2,
                border: isSelected
                  ? `2px solid ${C.accent}`
                  : isToday
                  ? `1.5px solid ${C.muted}`
                  : `1px solid transparent`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 1,
                padding: 0,
                transition: "border-color 0.1s",
              }}
            >
              <span style={{ fontSize: 10, color: pct !== undefined ? color : C.muted, fontWeight: isToday ? 800 : 500 }}>
                {dayNum}
              </span>
              {pct !== undefined && (
                <div style={{ width: "55%", height: 3, borderRadius: 2, background: color }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Day detail sheet ──────────────────────────────────────────────────────────
function DayDetail({ date, logs, schedules }) {
  const dayLogs = logs.filter(l => l.log_date === date);
  const schedMap = {};
  for (const s of schedules) schedMap[s.id] = s;

  const fmt = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short",
  });

  if (dayLogs.length === 0) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginTop: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>{fmt}</p>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>No medication records for this day.</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginTop: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>{fmt}</p>
      {dayLogs.map(log => {
        const sched = schedMap[log.schedule_id];
        const tablets = log.tablets_status || {};
        const entries = Object.entries(tablets);
        const taken = entries.filter(([, v]) => v).length;
        const total = entries.length;
        const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
        const color = adherenceColor(pct);

        return (
          <div key={log.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                {sched?.name || `Schedule #${log.schedule_id}`}
              </p>
              <span style={{
                fontSize: 11, fontWeight: 700, color: color,
                background: `${color}20`, borderRadius: 20, padding: "2px 8px",
              }}>
                {taken}/{total} taken
              </span>
            </div>

            {/* Tablet chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {entries.map(([tablet, isTaken]) => (
                <span key={tablet} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 20,
                  background: isTaken ? C.greenDim : "rgba(239,68,68,0.1)",
                  border: `1px solid ${isTaken ? C.green : C.red}44`,
                  color: isTaken ? C.green : C.red,
                  fontWeight: 600,
                }}>
                  {isTaken ? "✓" : "✕"} {tablet}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Schedule stats card ───────────────────────────────────────────────────────
function ScheduleStats({ schedule, logs }) {
  const myLogs = logs.filter(l => l.schedule_id === schedule.id);
  let totalTablets = 0, takenTablets = 0;
  for (const log of myLogs) {
    const entries = Object.values(log.tablets_status || {});
    totalTablets += entries.length;
    takenTablets += entries.filter(Boolean).length;
  }
  const adherencePct = totalTablets > 0 ? Math.round((takenTablets / totalTablets) * 100) : 0;
  const color = adherenceColor(adherencePct);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{schedule.name}</p>
        <span style={{ fontSize: 18, fontWeight: 800, color }}>{adherencePct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ background: C.surface2, borderRadius: 4, height: 6, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ width: `${adherencePct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
      </div>

      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
        {takenTablets} of {totalTablets} tablets taken in last 30 days
      </p>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MedicationHistory() {
  const navigate = useNavigate();

  const [logs,      setLogs]      = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(null); // selected calendar day

  useEffect(() => {
    Promise.all([fetchMedicationHistory(30), fetchMedicationSchedules()])
      .then(([history, scheds]) => {
        setLogs(history);
        setSchedules(scheds);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const dayScores = computeDayScores(logs);
  const streak    = computeStreak(dayScores);

  const overallPct = (() => {
    const days = Object.values(dayScores);
    if (days.length === 0) return null;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  })();

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, paddingBottom: 40 }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: C.surface2, border: "none", borderRadius: 10, width: 36, height: 36, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Medication History</h1>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Last 30 days</p>
        </div>
        <button
          onClick={() => navigate("/reminders/medication-today")}
          style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.muted2, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
        >
          Today →
        </button>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px 16px 0" }}>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginBottom: 16, color: C.red, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: streak > 0 ? C.green : C.muted, margin: "0 0 4px" }}>
              {streak}🔥
            </p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Day streak</p>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: overallPct !== null ? adherenceColor(overallPct) : C.muted, margin: "0 0 4px" }}>
              {overallPct !== null ? `${overallPct}%` : "—"}
            </p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>30-day adherence</p>
          </div>
        </div>

        {/* ── Calendar ───────────────────────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>Adherence Calendar</p>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            {[["≥80% — Great", C.green], ["50–79% — Partial", C.amber], ["<50% — Missed", C.red], ["No data", C.muted]].map(([label, color]) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.muted }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: color === C.muted ? 0.4 : 1 }} />
                {label}
              </span>
            ))}
          </div>

          <CalendarGrid dayScores={dayScores} selectedDay={selected} onSelectDay={setSelected} />
        </div>

        {/* ── Day drill-down ─────────────────────────────────────────────── */}
        {selected && (
          <div style={{ marginBottom: 20 }}>
            <DayDetail date={selected} logs={logs} schedules={schedules} />
          </div>
        )}

        {/* ── Per-schedule stats ─────────────────────────────────────────── */}
        {schedules.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>By Medication</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {schedules.map(s => (
                <ScheduleStats key={s.id} schedule={s} logs={logs} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {logs.length === 0 && !error && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💊</p>
            <p style={{ color: C.muted, fontSize: 14 }}>No medication logs yet.</p>
            <p style={{ color: C.muted, fontSize: 12 }}>Start tracking your medications to see history here.</p>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
