import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { updateReminder } from "../../api/reminders";

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY = {
  workout:    { emoji: "🏋️", color: "#f59e0b", label: "Workout" },
  meal:       { emoji: "🥗", color: "#10b981", label: "Meal & Supps" },
  medication: { emoji: "💊", color: "#3b82f6", label: "Medication" },
  checkup:    { emoji: "🏥", color: "#ec4899", label: "Health Checkup" },
  other:      { emoji: "📌", color: "#8b5cf6", label: "Reminder" },
};

const DAY_OPTIONS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const RECURRENCE_OPTIONS = [
  { value: "once",     label: "Once" },
  { value: "daily",    label: "Daily" },
  { value: "weekly",   label: "Weekly" },
  { value: "specific", label: "Specific days" },
  { value: "monthly",  label: "Monthly" },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EditReminder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingReminder = location.state?.reminder;

  const [selectedTime, setSelectedTime] = useState({ hour: 8, minute: 0, period: "AM" });
  const [recurrence, setRecurrence] = useState("once");
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingReminder) {
      // Parse time from scheduled_at
      const d = new Date(existingReminder.scheduled_at);
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours - 12;
      setSelectedTime({ hour: hours, minute: minutes, period });

      // Recurrence
      const rec = existingReminder.recurrence || "once";
      setRecurrence(rec);
      if (existingReminder.recurrence_days) {
        try {
          setSelectedDays(JSON.parse(existingReminder.recurrence_days));
        } catch { setSelectedDays([]); }
      }
    }
  }, [existingReminder]);

  const cat = CATEGORY[existingReminder?.type] || CATEGORY.other;
  const displayTitle = existingReminder?.title || existingReminder?.message || "Reminder";

  const toggleDay = (key) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert 12h → 24h
      let hour24 = selectedTime.hour;
      if (selectedTime.period === "PM" && selectedTime.hour !== 12) hour24 = selectedTime.hour + 12;
      else if (selectedTime.period === "AM" && selectedTime.hour === 12) hour24 = 0;

      // Use today's date + chosen time
      const now = new Date();
      const scheduled = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        hour24, selectedTime.minute, 0, 0
      );
      // If time is in the past, push to tomorrow
      if (scheduled < now && recurrence === "once") {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      await updateReminder(id, {
        scheduled_at: scheduled.toISOString(),
        recurrence,
        recurrence_days: recurrence === "specific" ? JSON.stringify(selectedDays) : null,
        is_active: true,
      });

      navigate("/reminders");
    } catch (error) {
      console.error("Failed to update reminder:", error);
      alert(`Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 120 }}>
      {/* ── HEADER ── */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Edit Reminder</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "0 20px" }}>

        {/* ── REMINDER INFO (read-only) ── */}
        <div style={{ marginTop: 28 }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500, letterSpacing: 0.5 }}>
            REMINDER
          </label>
          <div style={{
            marginTop: 10,
            padding: "16px 18px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `rgba(${hexToRgb(cat.color)}, 0.15)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {cat.emoji}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
                {displayTitle}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                {cat.label}
              </div>
            </div>
          </div>
        </div>

        {/* ── TIME ── */}
        <div style={{ marginTop: 32 }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500, letterSpacing: 0.5 }}>
            TIME
          </label>
          <div style={{ marginTop: 10 }}>
            <TimePicker selectedTime={selectedTime} onSelectTime={setSelectedTime} />
          </div>
        </div>

        {/* ── RECURRENCE ── */}
        <div style={{ marginTop: 32 }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500, letterSpacing: 0.5 }}>
            REPEAT
          </label>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecurrence(opt.value)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 99,
                  border: recurrence === opt.value
                    ? "2px solid #8b5cf6"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: recurrence === opt.value
                    ? "rgba(139,92,246,0.2)"
                    : "rgba(255,255,255,0.04)",
                  color: recurrence === opt.value ? "#a78bfa" : "rgba(255,255,255,0.75)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Day grid for "specific" */}
          {recurrence === "specific" && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {DAY_OPTIONS.map(({ key, label }) => {
                const active = selectedDays.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    style={{
                      padding: "12px 0",
                      borderRadius: 12,
                      border: active ? "2px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)",
                      background: active ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                      color: active ? "#a78bfa" : "rgba(255,255,255,0.6)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SAVE BUTTON ── */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "16px 20px",
          background: "linear-gradient(to top, #000 80%, transparent)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <button
            type="submit"
            disabled={loading || (recurrence === "specific" && selectedDays.length === 0)}
            style={{
              width: "100%", padding: "16px",
              borderRadius: 14, border: "none",
              background: (loading || (recurrence === "specific" && selectedDays.length === 0))
                ? "rgba(139,92,246,0.4)"
                : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#fff", fontSize: 17, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── TimePicker ────────────────────────────────────────────────────────────────

function TimePicker({ selectedTime, onSelectTime }) {
  const hours   = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const selectStyle = {
    width: "100%", padding: "14px 12px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "#fff",
    fontSize: 16, fontWeight: 600, cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      {/* Hour */}
      <div>
        <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          Hour
        </label>
        <select
          value={selectedTime.hour}
          onChange={(e) => onSelectTime({ ...selectedTime, hour: parseInt(e.target.value) })}
          style={selectStyle}
        >
          {hours.map((h) => (
            <option key={h} value={h} style={{ background: "#1f1f1f" }}>{h}</option>
          ))}
        </select>
      </div>

      {/* Minute */}
      <div>
        <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          Minute
        </label>
        <select
          value={selectedTime.minute}
          onChange={(e) => onSelectTime({ ...selectedTime, minute: parseInt(e.target.value) })}
          style={selectStyle}
        >
          {minutes.map((m) => (
            <option key={m} value={m} style={{ background: "#1f1f1f" }}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {/* AM/PM */}
      <div>
        <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          Period
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {["AM", "PM"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSelectTime({ ...selectedTime, period: p })}
              style={{
                padding: "14px 6px", borderRadius: 12,
                border: selectedTime.period === p
                  ? "2px solid #8b5cf6"
                  : "1px solid rgba(255,255,255,0.1)",
                background: selectedTime.period === p
                  ? "rgba(139,92,246,0.2)"
                  : "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  // Returns "r,g,b" string for rgba() usage
  const map = {
    "#f59e0b": "245,158,11",
    "#10b981": "16,185,129",
    "#3b82f6": "59,130,246",
    "#ec4899": "236,72,153",
    "#8b5cf6": "139,92,246",
  };
  return map[hex] || "139,92,246";
}
