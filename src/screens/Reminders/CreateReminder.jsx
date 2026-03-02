import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReminder } from "../../api/reminders";

// ─── Category definitions ─────────────────────────────────────────────────
const CATEGORIES = [
  { id: "workout",    label: "Workout",        emoji: "🏋️", color: "#f59e0b" },
  { id: "meal",       label: "Meal & Supps",   emoji: "🥗", color: "#10b981" },
  { id: "medication", label: "Medication",     emoji: "💊", color: "#ef4444" },
  { id: "checkup",    label: "Health Checkup", emoji: "🏥", color: "#3b82f6" },
  { id: "other",      label: "Other",          emoji: "📌", color: "#8b5cf6" },
];

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
const DAY_LABELS = ["M","T","W","T","F","S","S"];

const RECURRENCE_OPTIONS = [
  { value: "once",     label: "Once" },
  { value: "daily",    label: "Every day" },
  { value: "weekly",   label: "Weekly" },
  { value: "specific", label: "Specific days" },
  { value: "monthly",  label: "Monthly" },
];

// ─── Shared sub-components ────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: "0 0 10px", fontSize: 12, fontWeight: 600,
      color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.9,
    }}>
      {children}
    </p>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "13px 15px", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)", color: "#fff",
        fontSize: 15, outline: "none", boxSizing: "border-box", ...style,
      }}
    />
  );
}

function TimePicker({ value, onChange }) {
  const parts = value.split(" ");
  const period = parts[1] || "AM";
  const [hStr, mStr] = (parts[0] || "08:00").split(":");
  const h = parseInt(hStr) || 8;
  const m = parseInt(mStr) || 0;

  const update = (nh, nm, np) => {
    onChange(`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")} ${np}`);
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <select value={h} onChange={e => update(parseInt(e.target.value), m, period)}
        style={selectStyle}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(hh => (
          <option key={hh} value={hh} style={{ background: "#111" }}>{hh}</option>
        ))}
      </select>
      <select value={m} onChange={e => update(h, parseInt(e.target.value), period)}
        style={selectStyle}>
        {Array.from({ length: 60 }, (_, i) => i).map(mm => (
          <option key={mm} value={mm} style={{ background: "#111" }}>
            {String(mm).padStart(2, "0")}
          </option>
        ))}
      </select>
      <div style={{ display: "flex", gap: 6 }}>
        {["AM", "PM"].map(per => (
          <button key={per} type="button" onClick={() => update(h, m, per)}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 10,
              border: "none", cursor: "pointer",
              background: period === per ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
              color: period === per ? "#a78bfa" : "rgba(255,255,255,0.5)",
              fontWeight: period === per ? 700 : 400, fontSize: 14,
            }}>
            {per}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecurrencePicker({ recurrence, recurrenceDays, onRecurrenceChange, onDaysChange }) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {RECURRENCE_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => onRecurrenceChange(opt.value)}
            style={{
              padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              background: recurrence === opt.value ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
              color: recurrence === opt.value ? "#a78bfa" : "rgba(255,255,255,0.55)",
              fontWeight: recurrence === opt.value ? 600 : 400, fontSize: 13,
              outline: recurrence === opt.value ? "1px solid rgba(139,92,246,0.5)" : "none",
            }}>
            {opt.label}
          </button>
        ))}
      </div>
      {recurrence === "specific" && (
        <div style={{ display: "flex", gap: 8 }}>
          {DAYS.map((d, i) => {
            const on = recurrenceDays.includes(d);
            return (
              <button key={d} type="button"
                onClick={() => onDaysChange(
                  on ? recurrenceDays.filter(x => x !== d) : [...recurrenceDays, d]
                )}
                style={{
                  width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: on ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.07)",
                  color: on ? "#fff" : "rgba(255,255,255,0.4)",
                  fontWeight: 600, fontSize: 12,
                }}>
                {DAY_LABELS[i]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Workout form ─────────────────────────────────────────────────────────

function WorkoutForm({ data, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionLabel>Reminder title</SectionLabel>
        <StyledInput value={data.title} onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="e.g. Morning push day, Leg day" />
      </div>
      <div>
        <SectionLabel>Note (optional)</SectionLabel>
        <StyledInput value={data.note} onChange={e => onChange({ ...data, note: e.target.value })}
          placeholder="e.g. Don't skip warm-up" />
      </div>
      <div>
        <SectionLabel>Pre-workout supplement reminder</SectionLabel>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button"
            onClick={() => onChange({ ...data, preWorkoutEnabled: !data.preWorkoutEnabled })}
            style={{
              width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
              background: data.preWorkoutEnabled ? "#8b5cf6" : "rgba(255,255,255,0.12)",
              transition: "background 0.2s", position: "relative", flexShrink: 0,
            }}>
            <span style={{
              position: "absolute", top: 4, width: 18, height: 18, borderRadius: "50%",
              background: "#fff", transition: "left 0.2s",
              left: data.preWorkoutEnabled ? 24 : 4,
            }} />
          </button>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            Remind me 30 min before workout
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Meal + Supplements form ──────────────────────────────────────────────

function MealForm({ data, onChange }) {
  const MEAL_TYPES = [
    { v: "breakfast", l: "🌅 Breakfast" }, { v: "lunch", l: "☀️ Lunch" },
    { v: "dinner", l: "🌙 Dinner" }, { v: "snack", l: "🍎 Snack" },
  ];

  const addSupplement = () =>
    onChange({ ...data, supplements: [...data.supplements, { name: "", dosage: "" }] });

  const updateSupp = (i, field, val) => {
    const s = [...data.supplements];
    s[i] = { ...s[i], [field]: val };
    onChange({ ...data, supplements: s });
  };

  const removeSupp = (i) =>
    onChange({ ...data, supplements: data.supplements.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionLabel>Meal type</SectionLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MEAL_TYPES.map(mt => (
            <button key={mt.v} type="button" onClick={() => onChange({ ...data, mealType: mt.v })}
              style={{
                padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                background: data.mealType === mt.v ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
                color: data.mealType === mt.v ? "#34d399" : "rgba(255,255,255,0.6)",
                outline: data.mealType === mt.v ? "1px solid rgba(16,185,129,0.4)" : "none",
                fontSize: 14, fontWeight: data.mealType === mt.v ? 600 : 400,
              }}>
              {mt.l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Note (optional)</SectionLabel>
        <StyledInput value={data.note} onChange={e => onChange({ ...data, note: e.target.value })}
          placeholder="e.g. Eat within 30 min of waking" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionLabel>Supplements</SectionLabel>
          <button type="button" onClick={addSupplement}
            style={{
              background: "rgba(139,92,246,0.2)", border: "none", color: "#a78bfa",
              borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
            }}>
            + Add
          </button>
        </div>
        {data.supplements.length === 0 && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            Add Creatine, Protein, Vitamins, etc.
          </p>
        )}
        {data.supplements.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <StyledInput value={s.name} onChange={e => updateSupp(i, "name", e.target.value)}
              placeholder="Supplement name" style={{ flex: 2 }} />
            <StyledInput value={s.dosage} onChange={e => updateSupp(i, "dosage", e.target.value)}
              placeholder="Dosage" style={{ flex: 1 }} />
            <button type="button" onClick={() => removeSupp(i)}
              style={{
                background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171",
                borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontSize: 16,
              }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Medication form ──────────────────────────────────────────────────────

function MedicationForm({ data, onChange }) {
  const addTablet = () =>
    onChange({ ...data, tablets: [...data.tablets, { name: "", dosage: "", instructions: "" }] });

  const updateTablet = (i, field, val) => {
    const t = [...data.tablets];
    t[i] = { ...t[i], [field]: val };
    onChange({ ...data, tablets: t });
  };

  const removeTablet = (i) =>
    onChange({ ...data, tablets: data.tablets.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionLabel>Schedule name</SectionLabel>
        <StyledInput value={data.scheduleName}
          onChange={e => onChange({ ...data, scheduleName: e.target.value })}
          placeholder="e.g. Morning tablets, Night medication" />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionLabel>Tablets / medication</SectionLabel>
          <button type="button" onClick={addTablet}
            style={{
              background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171",
              borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
            }}>
            + Add tablet
          </button>
        </div>
        {data.tablets.length === 0 && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            List every tablet — each one will be tracked individually
          </p>
        )}
        {data.tablets.map((t, i) => (
          <div key={i} style={{
            padding: "14px", borderRadius: 12, marginBottom: 10,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Tablet {i + 1}
              </span>
              <button type="button" onClick={() => removeTablet(i)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <StyledInput value={t.name} onChange={e => updateTablet(i, "name", e.target.value)}
                placeholder="Name (e.g. Metformin)" style={{ flex: 2 }} />
              <StyledInput value={t.dosage} onChange={e => updateTablet(i, "dosage", e.target.value)}
                placeholder="Dosage" style={{ flex: 1 }} />
            </div>
            <StyledInput value={t.instructions}
              onChange={e => updateTablet(i, "instructions", e.target.value)}
              placeholder="Instructions (e.g. with food, before sleep)" />
          </div>
        ))}
      </div>

      <div style={{
        padding: "16px", borderRadius: 14,
        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
      }}>
        <SectionLabel>🚨 Emergency contact (optional)</SectionLabel>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
          If tablets aren't confirmed after 3 reminders, we'll notify them.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <StyledInput value={data.contactName}
            onChange={e => onChange({ ...data, contactName: e.target.value })}
            placeholder="Contact name (e.g. Priya)" />
          <StyledInput value={data.contactPhone}
            onChange={e => onChange({ ...data, contactPhone: e.target.value })}
            placeholder="Phone number" type="tel" />
          <StyledInput value={data.contactRelation}
            onChange={e => onChange({ ...data, contactRelation: e.target.value })}
            placeholder="Relationship (e.g. daughter, son, spouse)" />
        </div>
      </div>
    </div>
  );
}

// ─── Checkup form ─────────────────────────────────────────────────────────

function CheckupForm({ data, onChange }) {
  const APPT_TYPES = [
    "GP / Doctor", "Cardiologist", "Dentist", "Eye exam",
    "Blood test", "Physiotherapy", "Dermatologist", "Other specialist",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionLabel>Appointment title</SectionLabel>
        <StyledInput value={data.title} onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="e.g. Annual blood test, Dental cleaning" />
      </div>
      <div>
        <SectionLabel>Appointment type</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {APPT_TYPES.map(at => (
            <button key={at} type="button" onClick={() => onChange({ ...data, appointmentType: at })}
              style={{
                padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                background: data.appointmentType === at ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                color: data.appointmentType === at ? "#60a5fa" : "rgba(255,255,255,0.55)",
                outline: data.appointmentType === at ? "1px solid rgba(59,130,246,0.4)" : "none",
                fontSize: 13, fontWeight: data.appointmentType === at ? 600 : 400,
              }}>
              {at}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Doctor / Clinic (optional)</SectionLabel>
        <StyledInput value={data.doctor} onChange={e => onChange({ ...data, doctor: e.target.value })}
          placeholder="e.g. Dr. Sharma, Apollo Hospital" />
      </div>
      <div>
        <SectionLabel>Location (optional)</SectionLabel>
        <StyledInput value={data.location} onChange={e => onChange({ ...data, location: e.target.value })}
          placeholder="Address or Google Maps link" />
      </div>
      <div style={{
        padding: "14px 16px", borderRadius: 14,
        background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)",
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <button type="button"
            onClick={() => onChange({ ...data, hasHealthRecords: !data.hasHealthRecords })}
            style={{
              marginTop: 2, width: 20, height: 20, borderRadius: 6, border: "none",
              cursor: "pointer", flexShrink: 0,
              background: data.hasHealthRecords ? "#3b82f6" : "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {data.hasHealthRecords && (
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>
            )}
          </button>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              I have health records for this
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Attach them from your Vault after saving
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Other form ───────────────────────────────────────────────────────────

function OtherForm({ data, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionLabel>Reminder name</SectionLabel>
        <StyledInput value={data.customName}
          onChange={e => onChange({ ...data, customName: e.target.value })}
          placeholder="e.g. Study session, Evening prayer, Water intake" />
      </div>
      <div>
        <SectionLabel>Note (optional)</SectionLabel>
        <StyledInput value={data.note} onChange={e => onChange({ ...data, note: e.target.value })}
          placeholder="Any details" />
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────

export default function CreateReminder() {
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [time, setTime]         = useState("08:00 AM");
  const [recurrence, setRecurrence]         = useState("once");
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [workoutData, setWorkoutData] = useState({ title: "", note: "", preWorkoutEnabled: false });
  const [mealData,    setMealData]    = useState({ mealType: "breakfast", note: "", supplements: [] });
  const [medData,     setMedData]     = useState({ scheduleName: "", tablets: [], contactName: "", contactPhone: "", contactRelation: "" });
  const [checkupData, setCheckupData] = useState({ title: "", appointmentType: "", doctor: "", location: "", hasHealthRecords: false });
  const [otherData,   setOtherData]   = useState({ customName: "", note: "" });

  const cat = CATEGORIES.find(c => c.id === category);

  const getTitle = () => {
    switch (category) {
      case "workout":    return workoutData.title || "Workout reminder";
      case "meal":       return `${mealData.mealType.charAt(0).toUpperCase() + mealData.mealType.slice(1)} reminder`;
      case "medication": return medData.scheduleName || "Medication reminder";
      case "checkup":    return checkupData.title || "Health checkup";
      case "other":      return otherData.customName || "Reminder";
      default:           return "Reminder";
    }
  };

  const getMeta = () => {
    switch (category) {
      case "workout":    return { workout_name: workoutData.title, note: workoutData.note, pre_workout_supplement: workoutData.preWorkoutEnabled };
      case "meal":       return { meal_type: mealData.mealType, note: mealData.note, supplements: mealData.supplements };
      case "medication": return { schedule_name: medData.scheduleName, tablets: medData.tablets, emergency_contact: { name: medData.contactName, phone: medData.contactPhone, relation: medData.contactRelation } };
      case "checkup":    return { appointment_type: checkupData.appointmentType, doctor: checkupData.doctor, location: checkupData.location, has_health_records: checkupData.hasHealthRecords };
      case "other":      return { custom_name: otherData.customName, note: otherData.note };
      default:           return {};
    }
  };

  const canSubmit = () => {
    if (!category) return false;
    switch (category) {
      case "workout":    return workoutData.title.trim().length > 0;
      case "meal":       return true;
      case "medication": return medData.scheduleName.trim().length > 0 && medData.tablets.length > 0 && medData.tablets.every(t => t.name.trim());
      case "checkup":    return checkupData.title.trim().length > 0;
      case "other":      return otherData.customName.trim().length > 0;
      default:           return false;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const [hm, period] = time.split(" ");
      let [h, m] = hm.split(":").map(Number);
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;

      const now = new Date();
      const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
      if (scheduledDate <= now) scheduledDate.setDate(scheduledDate.getDate() + 1);

      await createReminder({
        type:            category,
        title:           getTitle(),
        message:         getTitle(),
        scheduled_at:    scheduledDate.toISOString(),
        recurrence,
        recurrence_days: JSON.stringify(recurrenceDays),
        category_meta:   JSON.stringify(getMeta()),
        is_active:       true,
        consent_required: false,
      });

      navigate("/reminders");
    } catch (err) {
      setError("Failed to save reminder. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => category ? setCategory(null) : navigate(-1)}
          style={{ background: "transparent", border: "none", color: "#8b5cf6",
            fontSize: 26, cursor: "pointer", padding: 0, marginBottom: 8 }}>
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
          {category ? `${cat?.emoji}  ${cat?.label}` : "New Reminder"}
        </h1>
        {!category && (
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Choose a category to get started
          </p>
        )}
      </div>

      <div style={{ padding: "20px" }}>
        {/* ── Category selector ── */}
        {!category && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "18px 20px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer", background: "rgba(255,255,255,0.03)", textAlign: "left",
                }}>
                <span style={{ fontSize: 26, width: 38, textAlign: "center" }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>{c.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: "rgba(255,255,255,0.38)" }}>
                    {c.id === "workout"    && "Tied to your training schedule"}
                    {c.id === "meal"       && "Meals, nutrition & supplements"}
                    {c.id === "medication" && "Tablet tracking with escalation alerts"}
                    {c.id === "checkup"    && "Appointments, tests & health records"}
                    {c.id === "other"      && "Studies, habits, anything custom"}
                  </p>
                </div>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Category form ── */}
        {category && (
          <>
            <div style={{ marginBottom: 28 }}>
              {category === "workout"    && <WorkoutForm  data={workoutData} onChange={setWorkoutData} />}
              {category === "meal"       && <MealForm     data={mealData}    onChange={setMealData} />}
              {category === "medication" && <MedicationForm data={medData}   onChange={setMedData} />}
              {category === "checkup"    && <CheckupForm  data={checkupData} onChange={setCheckupData} />}
              {category === "other"      && <OtherForm    data={otherData}   onChange={setOtherData} />}
            </div>

            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Time</SectionLabel>
              <TimePicker value={time} onChange={setTime} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Repeat</SectionLabel>
              <RecurrencePicker
                recurrence={recurrence}
                recurrenceDays={recurrenceDays}
                onRecurrenceChange={setRecurrence}
                onDaysChange={setRecurrenceDays}
              />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#fca5a5" }}>❌ {error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA */}
      {category && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px",
          background: "linear-gradient(to top, #000 80%, transparent)",
        }}>
          <button onClick={handleSubmit} disabled={!canSubmit() || loading}
            style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              background: canSubmit() && !loading
                ? `linear-gradient(135deg, ${cat?.color || "#8b5cf6"}, #6366f1)`
                : "rgba(255,255,255,0.08)",
              color: canSubmit() && !loading ? "#fff" : "rgba(255,255,255,0.3)",
              fontSize: 16, fontWeight: 700,
              cursor: canSubmit() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #fff", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite" }} />
                Saving...
              </>
            ) : "Save Reminder"}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const selectStyle = {
  flex: 1, padding: "12px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff", fontSize: 15, fontWeight: 600,
  cursor: "pointer", outline: "none",
};
