import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EXERCISES from "./exercises.js";
import { createVaultItem, updateVaultItem } from "../../api/vault";
import { setActiveWorkoutProgram } from "../../api/user";

const WEEKDAY_CHIPS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WorkoutBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  const editingWorkout = location.state?.workoutData;
  const editingId = location.state?.workoutId;

  const [selectedDayCount, setSelectedDayCount] = useState(
    editingWorkout ? editingWorkout.days.length : null
  );
  const [showDaySelector, setShowDaySelector] = useState(
    !editingWorkout && !selectedDayCount
  );

  const [workoutName, setWorkoutName] = useState(editingWorkout?.workoutName || "");
  const [days, setDays] = useState(editingWorkout?.days || []);
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState(editingId || null);

  useEffect(() => {
    if (selectedDayCount && days.length === 0 && !editingWorkout) {
      const initialDays = Array.from({ length: selectedDayCount }, () => ({ muscles: [], name: "" }));
      setDays(initialDays);
    }
  }, [selectedDayCount, days.length, editingWorkout]);

  const handleDayCountSelect = (count) => {
    setSelectedDayCount(count);
    const initialDays = Array.from({ length: count }, () => ({ muscles: [], name: "" }));
    setDays(initialDays);
    setShowDaySelector(false);
  };

  const removeDay = (d) => {
    if (editingWorkout) setDays(prev => prev.filter((_, i) => i !== d));
  };

  // ── Day name ───────────────────────────────────────────────────────────────
  const updateDayName = (d, name) =>
    setDays(prev => prev.map((day, di) => di === d ? { ...day, name } : day));

  // ── Muscles ────────────────────────────────────────────────────────────────
  const addMuscle = (d, name) => {
    setDays(prev => prev.map((day, di) =>
      di === d ? { ...day, muscles: [...day.muscles, { name, areas: [] }] } : day
    ));
    setOpen(null);
  };

  const removeMuscle = (d, m) =>
    setDays(prev => prev.map((day, di) =>
      di === d ? { ...day, muscles: day.muscles.filter((_, mi) => mi !== m) } : day
    ));

  // ── Areas ──────────────────────────────────────────────────────────────────
  const addArea = (d, m, name) => {
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? { ...mu, areas: [...mu.areas, { name, areas: [] }] } : mu
        ),
      } : day
    ));
    setOpen(null);
  };

  const removeArea = (d, m, a) =>
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? { ...mu, areas: mu.areas.filter((_, ai) => ai !== a) } : mu
        ),
      } : day
    ));

  // ── Exercises ──────────────────────────────────────────────────────────────
  const addExercise = (d, m, a, name) => {
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? {
            ...mu,
            areas: mu.areas.map((ar, ai) =>
              ai === a ? {
                ...ar,
                exercises: [...(ar.exercises || []), { name, sets: [{ reps: "", weight: "", rir: "" }] }],
              } : ar
            ),
          } : mu
        ),
      } : day
    ));
    setOpen(null);
  };

  const removeExercise = (d, m, a, e) =>
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? {
            ...mu,
            areas: mu.areas.map((ar, ai) =>
              ai === a ? { ...ar, exercises: ar.exercises.filter((_, ei) => ei !== e) } : ar
            ),
          } : mu
        ),
      } : day
    ));

  // ── Sets ───────────────────────────────────────────────────────────────────
  const addSet = (d, m, a, e) =>
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? {
            ...mu,
            areas: mu.areas.map((ar, ai) =>
              ai === a ? {
                ...ar,
                exercises: ar.exercises.map((ex, ei) =>
                  ei === e ? { ...ex, sets: [...ex.sets, { reps: "", weight: "", rir: "" }] } : ex
                ),
              } : ar
            ),
          } : mu
        ),
      } : day
    ));

  const updateSet = (d, m, a, e, s, key, value) =>
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? {
            ...mu,
            areas: mu.areas.map((ar, ai) =>
              ai === a ? {
                ...ar,
                exercises: ar.exercises.map((ex, ei) =>
                  ei === e ? {
                    ...ex, sets: ex.sets.map((set, si) => si === s ? { ...set, [key]: value } : set),
                  } : ex
                ),
              } : ar
            ),
          } : mu
        ),
      } : day
    ));

  const removeSet = (d, m, a, e, s) =>
    setDays(prev => prev.map((day, di) =>
      di === d ? {
        ...day,
        muscles: day.muscles.map((mu, mi) =>
          mi === m ? {
            ...mu,
            areas: mu.areas.map((ar, ai) =>
              ai === a ? {
                ...ar,
                exercises: ar.exercises.map((ex, ei) =>
                  ei === e ? { ...ex, sets: ex.sets.filter((_, si) => si !== s) } : ex
                ),
              } : ar
            ),
          } : mu
        ),
      } : day
    ));

  // ── Save / activate ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!workoutName.trim()) { alert("Please enter a workout name"); return; }

    const hasExercises = days.some(day =>
      day.muscles.some(muscle => muscle.areas.some(area => area.exercises && area.exercises.length > 0))
    );
    if (!hasExercises) { alert("Please add at least one exercise"); return; }

    setSaving(true);
    try {
      const totalMuscles = days.reduce((acc, d) => acc + d.muscles.length, 0);
      const totalExercises = days.reduce((acc, day) =>
        acc + day.muscles.reduce((mAcc, muscle) =>
          mAcc + muscle.areas.reduce((aAcc, area) => aAcc + (area.exercises ? area.exercises.length : 0), 0), 0
        ), 0
      );

      const workoutData = {
        type: "workout", category: "manual",
        title: workoutName.trim(),
        summary: `${days.length} day${days.length > 1 ? "s" : ""} · ${totalMuscles} muscle group${totalMuscles > 1 ? "s" : ""} · ${totalExercises} exercise${totalExercises > 1 ? "s" : ""}`,
        content: { workoutName: workoutName.trim(), days, created_at: new Date().toISOString() },
        source: "manual", pinned: false,
      };

      let workoutId;
      if (editingId || savedWorkoutId) {
        workoutId = editingId || savedWorkoutId;
        await updateVaultItem(workoutId, workoutData);
        alert("Workout updated successfully!");
      } else {
        const response = await createVaultItem(workoutData);
        workoutId = response.id;
        setSavedWorkoutId(workoutId);
        alert("Workout saved to Vault!");
      }
      return workoutId;
    } catch (error) {
      alert(`${error.message || "Failed to save workout. Please try again."}`);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsActive = async () => {
    setSettingActive(true);
    try {
      let workoutId = savedWorkoutId || editingId;
      if (!workoutId) {
        workoutId = await handleSave();
        if (!workoutId) { setSettingActive(false); return; }
      }
      await setActiveWorkoutProgram(workoutId);
      alert("Set as active workout program!");
      navigate("/");
    } catch (error) {
      alert(`${error.message || "Failed to set as active program."}`);
    } finally {
      setSettingActive(false);
    }
  };

  const getSelectorItems = () => {
    if (!open) return [];
    const parts = open.split("-");
    if (open.startsWith("muscle-")) return Object.keys(EXERCISES);
    if (open.startsWith("area-")) {
      const muscleName = days[parseInt(parts[1])].muscles[parseInt(parts[2])].name;
      return Object.keys(EXERCISES[muscleName]);
    }
    if (open.startsWith("ex-")) {
      const muscle = days[parseInt(parts[1])].muscles[parseInt(parts[2])];
      return EXERCISES[muscle.name][muscle.areas[parseInt(parts[3])].name];
    }
    return [];
  };

  const handleSelectorSelect = (item) => {
    if (!open) return;
    const parts = open.split("-");
    if (open.startsWith("muscle-")) addMuscle(parseInt(parts[1]), item);
    else if (open.startsWith("area-")) addArea(parseInt(parts[1]), parseInt(parts[2]), item);
    else if (open.startsWith("ex-")) addExercise(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]), item);
  };

  if (showDaySelector) return <DaySelector onSelect={handleDayCountSelect} onBack={() => navigate(-1)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", overflowY: "auto", paddingBottom: "140px" }}>
      <div style={{ padding: "24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <button onClick={() => navigate(-1)} style={{
              background: "transparent", border: "none", color: "#8b5cf6",
              fontSize: 28, cursor: "pointer", padding: 0, marginBottom: 8,
            }}>←</button>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: 0.3 }}>
              {editingId ? "Edit Workout" : "Create Workout"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              {editingId ? "Update your routine" : `${selectedDayCount}-day workout program`}
            </p>
          </div>
        </div>

        {/* WORKOUT NAME */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            Workout Name *
          </label>
          <input
            type="text"
            placeholder="e.g., PPL Program, Upper/Lower Split, Full Body..."
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 16,
              border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.05)",
              color: "#fff", fontSize: 16, fontWeight: 500, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {days.map((day, d) => (
          <DayCard
            key={d}
            day={day}
            dayIndex={d}
            daysLength={days.length}
            open={open}
            setOpen={setOpen}
            onRemoveDay={() => removeDay(d)}
            onUpdateDayName={(name) => updateDayName(d, name)}
            onAddMuscle={(name) => addMuscle(d, name)}
            onRemoveMuscle={(m) => removeMuscle(d, m)}
            onAddArea={(m, name) => addArea(d, m, name)}
            onRemoveArea={(m, a) => removeArea(d, m, a)}
            onAddExercise={(m, a, name) => addExercise(d, m, a, name)}
            onRemoveExercise={(m, a, e) => removeExercise(d, m, a, e)}
            onAddSet={(m, a, e) => addSet(d, m, a, e)}
            onUpdateSet={(m, a, e, s, key, value) => updateSet(d, m, a, e, s, key, value)}
            onRemoveSet={(m, a, e, s) => removeSet(d, m, a, e, s)}
            isLocked={!editingWorkout}
          />
        ))}

        {!editingWorkout && (
          <div style={{
            padding: "16px 20px", borderRadius: 16,
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
            marginTop: 16, display: "flex", alignItems: "center", gap: 12,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>
                {selectedDayCount}-Day Program
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                Complete all {selectedDayCount} days to create your workout
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING BUTTONS */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 12, zIndex: 50 }}>
        <button onClick={handleSetAsActive} disabled={settingActive} style={{
          padding: "16px 32px", borderRadius: 999, border: "none",
          background: settingActive ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff", fontSize: 15, fontWeight: 600,
          cursor: settingActive ? "not-allowed" : "pointer",
          boxShadow: "0 8px 32px rgba(16,185,129,0.4)",
          display: "flex", alignItems: "center", gap: 8, opacity: settingActive ? 0.7 : 1,
        }}>
          {settingActive ? "Setting Active..." : "Set as Active Program"}
        </button>

        <button onClick={handleSave} disabled={saving} style={{
          padding: "16px 32px", borderRadius: 999, border: "none",
          background: saving ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
          color: "#fff", fontSize: 15, fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
          display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Saving..." : (editingId ? "Update Workout" : "Save to Vault")}
        </button>
      </div>

      {open && (
        <Selector items={getSelectorItems()} onSelect={handleSelectorSelect} onClose={() => setOpen(null)} />
      )}

      <style>{`
        @keyframes borderGlow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Day Selector screen ──────────────────────────────────────────────────────
function DaySelector({ onSelect, onBack }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const dayOptions = [
    { count: 3, label: "3 Days", description: "Full body focus", color: "#10b981" },
    { count: 4, label: "4 Days", description: "Upper/Lower split", color: "#3b82f6" },
    { count: 5, label: "5 Days", description: "Push/Pull/Legs", color: "#8b5cf6" },
    { count: 6, label: "6 Days", description: "Advanced split", color: "#ec4899" },
    { count: 7, label: "7 Days", description: "Daily training", color: "#f59e0b" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column" }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#8b5cf6", fontSize: 28, cursor: "pointer", padding: 0, marginBottom: 24, alignSelf: "flex-start" }}>←</button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            margin: "0 0 12px", fontSize: 28, fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            How many days per week?
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            Choose your training frequency to build your personalized workout program
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dayOptions.map((option) => (
            <button key={option.count} onClick={() => onSelect(option.count)}
              onMouseEnter={() => setHoveredDay(option.count)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                padding: "24px 28px", borderRadius: 20,
                border: `2px solid ${hoveredDay === option.count ? option.color : "rgba(255,255,255,0.1)"}`,
                background: hoveredDay === option.count
                  ? `linear-gradient(135deg, ${option.color}15, ${option.color}08)`
                  : "rgba(17,24,39,0.5)",
                cursor: "pointer", transition: "all 0.3s", textAlign: "left",
                transform: hoveredDay === option.count ? "translateY(-4px)" : "none",
                boxShadow: hoveredDay === option.count ? `0 12px 32px ${option.color}40` : "none",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: hoveredDay === option.count ? option.color : "#fff" }}>
                    {option.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{option.description}</p>
                </div>
                <span style={{ fontSize: 20, color: option.color }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, dayIndex, daysLength, open, setOpen, onRemoveDay, onUpdateDayName, onAddMuscle, onRemoveMuscle, onAddArea, onRemoveArea, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet, isLocked }) {
  return (
    <div style={{
      position: "relative", borderRadius: 22, padding: "24px", marginBottom: 24,
      background: "linear-gradient(135deg, rgba(17,24,39,0.6), rgba(31,41,55,0.4))",
      backdropFilter: "blur(16px)", overflow: "visible",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 22, padding: "1px",
        background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor", maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Day header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: 20, fontWeight: 600,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Day {dayIndex + 1}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {day.muscles.length} muscle group{day.muscles.length !== 1 ? "s" : ""}
            </p>
          </div>
          {!isLocked && daysLength > 1 && (
            <button onClick={onRemoveDay} style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 16,
            }}>✕</button>
          )}
        </div>

        {/* ── DAY NAME PICKER ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
            Assign Day
          </p>
          {/* Weekday chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {WEEKDAY_CHIPS.map((wd) => {
              const isSelected = day.name === wd;
              return (
                <button key={wd} onClick={() => onUpdateDayName(isSelected ? "" : wd)} style={{
                  padding: "5px 12px", borderRadius: 100, border: "none", cursor: "pointer",
                  background: isSelected
                    ? "linear-gradient(135deg, #6366f1, #818cf8)"
                    : "rgba(99,102,241,0.12)",
                  color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: 12, fontWeight: isSelected ? 700 : 500,
                  transition: "all 0.2s",
                  boxShadow: isSelected ? "0 2px 10px rgba(99,102,241,0.4)" : "none",
                }}>
                  {wd}
                </button>
              );
            })}
          </div>
          {/* Custom name input */}
          <input
            type="text"
            placeholder="Or type a custom name (e.g., Push Day, Leg Day...)"
            value={WEEKDAY_CHIPS.includes(day.name) ? "" : (day.name || "")}
            onChange={(e) => onUpdateDayName(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)",
              color: "#fff", fontSize: 13, outline: "none",
            }}
          />
        </div>

        <GradientButton onClick={() => setOpen(`muscle-${dayIndex}`)} text="+ Add Muscle Group" color="#8b5cf6" />

        {day.muscles.map((mus, m) => (
          <MuscleBlock
            key={m}
            muscle={mus}
            dayIndex={dayIndex}
            muscleIndex={m}
            open={open}
            setOpen={setOpen}
            onRemove={() => onRemoveMuscle(m)}
            onAddArea={(name) => onAddArea(m, name)}
            onRemoveArea={(a) => onRemoveArea(m, a)}
            onAddExercise={(a, name) => onAddExercise(m, a, name)}
            onRemoveExercise={(a, e) => onRemoveExercise(m, a, e)}
            onAddSet={(a, e) => onAddSet(m, a, e)}
            onUpdateSet={(a, e, s, key, value) => onUpdateSet(m, a, e, s, key, value)}
            onRemoveSet={(a, e, s) => onRemoveSet(m, a, e, s)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Muscle Block ─────────────────────────────────────────────────────────────
function MuscleBlock({ muscle, dayIndex, muscleIndex, open, setOpen, onRemove, onAddArea, onRemoveArea, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet }) {
  return (
    <div style={{ marginTop: 20, borderRadius: 18, padding: "18px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#a78bfa" }}>{muscle.name}</h3>
        <button onClick={onRemove} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
      </div>
      <SmallButton onClick={() => setOpen(`area-${dayIndex}-${muscleIndex}`)} text="+ Add Area" color="#6366f1" />
      {muscle.areas.map((ar, a) => (
        <AreaBlock
          key={a} area={ar} dayIndex={dayIndex} muscleIndex={muscleIndex} areaIndex={a} muscleName={muscle.name}
          open={open} setOpen={setOpen}
          onRemove={() => onRemoveArea(a)}
          onAddExercise={(name) => onAddExercise(a, name)}
          onRemoveExercise={(e) => onRemoveExercise(a, e)}
          onAddSet={(e) => onAddSet(a, e)}
          onUpdateSet={(e, s, key, value) => onUpdateSet(a, e, s, key, value)}
          onRemoveSet={(e, s) => onRemoveSet(a, e, s)}
        />
      ))}
    </div>
  );
}

// ─── Area Block ───────────────────────────────────────────────────────────────
function AreaBlock({ area, dayIndex, muscleIndex, areaIndex, muscleName, open, setOpen, onRemove, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet }) {
  return (
    <div style={{ marginTop: 14, borderRadius: 16, padding: "16px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#818cf8" }}>{area.name}</h4>
        <button onClick={onRemove} style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>✕</button>
      </div>
      <SmallButton onClick={() => setOpen(`ex-${dayIndex}-${muscleIndex}-${areaIndex}`)} text="+ Add Exercise" color="#ec4899" />
      {area.exercises && area.exercises.map((ex, e) => (
        <ExerciseCard
          key={e} exercise={ex}
          onRemove={() => onRemoveExercise(e)}
          onAddSet={() => onAddSet(e)}
          onUpdateSet={(s, key, value) => onUpdateSet(e, s, key, value)}
          onRemoveSet={(s) => onRemoveSet(e, s)}
        />
      ))}
    </div>
  );
}

// ─── Exercise Card (collapsible) ──────────────────────────────────────────────
function ExerciseCard({ exercise, onRemove, onAddSet, onUpdateSet, onRemoveSet }) {
  const [expanded, setExpanded] = useState(true);
  const doneSetCount = exercise.sets.filter(s => s.reps || s.weight).length;

  return (
    <div style={{
      position: "relative", marginTop: 12, borderRadius: 14,
      background: "rgba(0,0,0,0.5)", overflow: "hidden",
    }}>
      {/* gradient border */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 14, padding: "1px",
        background: "linear-gradient(135deg, rgba(236,72,153,0.4), rgba(168,85,247,0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor", maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, padding: 14 }}>
        {/* Collapsible header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              flex: 1, background: "none", border: "none", color: "#fff",
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: 0,
            }}
          >
            <strong style={{ fontSize: 14, fontWeight: 600, textAlign: "left" }}>{exercise.name}</strong>
            <span style={{
              padding: "2px 8px", borderRadius: 100,
              background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)",
              fontSize: 11, color: "#f9a8d4", fontWeight: 600,
            }}>
              {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
              {doneSetCount > 0 ? ` · ${doneSetCount} filled` : ""}
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: "auto" }}>
              {expanded ? "▲" : "▼"}
            </span>
          </button>
          <button onClick={onRemove} style={{
            width: 24, height: 24, borderRadius: "50%", border: "none",
            background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", fontSize: 12, marginLeft: 8,
          }}>✕</button>
        </div>

        {/* Expandable set rows */}
        {expanded && (
          <div style={{ marginTop: 12 }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) auto", gap: 8, marginBottom: 6 }}>
              {["Reps", "Weight (kg)", "RIR", ""].map(h => (
                <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 0.8, textAlign: "center" }}>{h}</span>
              ))}
            </div>
            {exercise.sets.map((set, s) => (
              <div key={s} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) auto", gap: 8, marginBottom: 8 }}>
                <Input placeholder="Reps" value={set.reps} onChange={(e) => onUpdateSet(s, "reps", e.target.value)} />
                <Input placeholder="kg" value={set.weight} onChange={(e) => onUpdateSet(s, "weight", e.target.value)} />
                <Input placeholder="RIR" value={set.rir} onChange={(e) => onUpdateSet(s, "rir", e.target.value)} />
                <button onClick={() => onRemoveSet(s)} style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: "rgba(239,68,68,0.12)", color: "#ef4444", cursor: "pointer", fontSize: 14,
                }}>✕</button>
              </div>
            ))}
            <SmallButton onClick={onAddSet} text="+ Add Set" color="#10b981" ghost />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Input({ placeholder, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <input
      type="text" placeholder={placeholder} value={value} onChange={onChange}
      onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
      style={{
        padding: "10px 12px", borderRadius: 10,
        border: isFocused ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 14, outline: "none",
        boxShadow: isFocused ? "0 0 0 3px rgba(139,92,246,0.1)" : "none", transition: "all 0.2s",
      }}
    />
  );
}

function GradientButton({ onClick, text, color }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px", borderRadius: 14, border: "none",
      background: `linear-gradient(135deg, ${color}20, ${color}10)`,
      color, fontSize: 14, fontWeight: 600, cursor: "pointer",
    }}>{text}</button>
  );
}

function SmallButton({ onClick, text, color, ghost }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 999,
      border: ghost ? `1px solid ${color}30` : "none",
      background: ghost ? "transparent" : `${color}20`,
      color, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8,
    }}>{text}</button>
  );
}

function Selector({ items, onSelect, onClose }) {
  const contentRef = useRef(null);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div style={{
        position: "relative", marginTop: "auto",
        background: "linear-gradient(to top, rgb(17,24,39), rgb(31,41,55))",
        borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80vh",
        display: "flex", flexDirection: "column", borderTop: "2px solid rgba(139,92,246,0.3)",
      }}>
        <div style={{ padding: "16px 0 12px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
        </div>
        <h3 style={{ margin: "0 0 16px", padding: "0 24px", fontSize: 18, fontWeight: 600, textAlign: "center", color: "#fff" }}>
          Select Option
        </h3>
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => onSelect(item)} style={{
                padding: "18px 20px", borderRadius: 14, border: "none",
                background: "rgba(255,255,255,0.06)", color: "#fff",
                fontSize: 16, fontWeight: 500, cursor: "pointer", textAlign: "left",
              }}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}