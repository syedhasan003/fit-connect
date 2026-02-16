import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EXERCISES from "./exercises.js";
import { createVaultItem, updateVaultItem } from "../../api/vault";
import { setActiveWorkoutProgram } from "../../api/user";

export default function WorkoutBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're editing an existing workout
  const editingWorkout = location.state?.workoutData;
  const editingId = location.state?.workoutId;

  // NEW: Day selection state
  const [selectedDayCount, setSelectedDayCount] = useState(
    editingWorkout ? editingWorkout.days.length : null
  );
  const [showDaySelector, setShowDaySelector] = useState(
    !editingWorkout && !selectedDayCount
  );

  const [workoutName, setWorkoutName] = useState(
    editingWorkout?.workoutName || ""
  );
  const [days, setDays] = useState(
    editingWorkout?.days || []
  );
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState(editingId || null);

  // Initialize days when day count is selected
  useEffect(() => {
    if (selectedDayCount && days.length === 0 && !editingWorkout) {
      const initialDays = Array.from({ length: selectedDayCount }, () => ({ muscles: [] }));
      setDays(initialDays);
    }
  }, [selectedDayCount, days.length, editingWorkout]);

  const handleDayCountSelect = (count) => {
    setSelectedDayCount(count);
    const initialDays = Array.from({ length: count }, () => ({ muscles: [] }));
    setDays(initialDays);
    setShowDaySelector(false);
  };

  const removeDay = d => {
    // Only allow removing if we're editing and want to allow flexibility
    // For new workouts, days are locked to selected count
    if (editingWorkout) {
      setDays(prev => prev.filter((_, i) => i !== d));
    }
  };

  const addMuscle = (d, name) => {
    setDays(prev =>
      prev.map((day, di) =>
        di === d ? { ...day, muscles: [...day.muscles, { name, areas: [] }] } : day
      )
    );
    setOpen(null);
  };

  const removeMuscle = (d, m) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d ? { ...day, muscles: day.muscles.filter((_, mi) => mi !== m) } : day
      )
    );

  const addArea = (d, m, name) => {
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m ? { ...mu, areas: [...mu.areas, { name, areas: [] }] } : mu
              )
            }
          : day
      )
    );
    setOpen(null);
  };

  const removeArea = (d, m, a) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m ? { ...mu, areas: mu.areas.filter((_, ai) => ai !== a) } : mu
              )
            }
          : day
      )
    );

  const addExercise = (d, m, a, name) => {
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m
                  ? {
                      ...mu,
                      areas: mu.areas.map((ar, ai) =>
                        ai === a
                          ? {
                              ...ar,
                              exercises: [...(ar.exercises || []), { name, sets: [{ reps: "", weight: "", rir: "" }] }]
                            }
                          : ar
                      )
                    }
                  : mu
              )
            }
          : day
      )
    );
    setOpen(null);
  };

  const removeExercise = (d, m, a, e) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m
                  ? {
                      ...mu,
                      areas: mu.areas.map((ar, ai) =>
                        ai === a ? { ...ar, exercises: ar.exercises.filter((_, ei) => ei !== e) } : ar
                      )
                    }
                  : mu
              )
            }
          : day
      )
    );

  const addSet = (d, m, a, e) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m
                  ? {
                      ...mu,
                      areas: mu.areas.map((ar, ai) =>
                        ai === a
                          ? {
                              ...ar,
                              exercises: ar.exercises.map((ex, ei) =>
                                ei === e ? { ...ex, sets: [...ex.sets, { reps: "", weight: "", rir: "" }] } : ex
                              )
                            }
                          : ar
                      )
                    }
                  : mu
              )
            }
          : day
      )
    );

  const updateSet = (d, m, a, e, s, key, value) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m
                  ? {
                      ...mu,
                      areas: mu.areas.map((ar, ai) =>
                        ai === a
                          ? {
                              ...ar,
                              exercises: ar.exercises.map((ex, ei) =>
                                ei === e
                                  ? { ...ex, sets: ex.sets.map((set, si) => (si === s ? { ...set, [key]: value } : set)) }
                                  : ex
                              )
                            }
                          : ar
                      )
                    }
                  : mu
              )
            }
          : day
      )
    );

  const removeSet = (d, m, a, e, s) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m
                  ? {
                      ...mu,
                      areas: mu.areas.map((ar, ai) =>
                        ai === a
                          ? {
                              ...ar,
                              exercises: ar.exercises.map((ex, ei) =>
                                ei === e ? { ...ex, sets: ex.sets.filter((_, si) => si !== s) } : ex
                              )
                            }
                          : ar
                      )
                    }
                  : mu
              )
            }
          : day
      )
    );

  const handleSave = async () => {
    // Validate workout name
    if (!workoutName.trim()) {
      alert("❌ Please enter a workout name");
      return;
    }

    // Validate at least one exercise
    const hasExercises = days.some(day =>
      day.muscles.some(muscle =>
        muscle.areas.some(area =>
          area.exercises && area.exercises.length > 0
        )
      )
    );

    if (!hasExercises) {
      alert("❌ Please add at least one exercise");
      return;
    }

    setSaving(true);
    try {
      const totalMuscles = days.reduce((acc, d) => acc + d.muscles.length, 0);
      const totalExercises = days.reduce((acc, day) =>
        acc + day.muscles.reduce((mAcc, muscle) =>
          mAcc + muscle.areas.reduce((aAcc, area) =>
            aAcc + (area.exercises ? area.exercises.length : 0), 0
          ), 0
        ), 0
      );

      const workoutData = {
        type: "workout",
        category: "manual",
        title: workoutName.trim(),
        summary: `${days.length} day${days.length > 1 ? 's' : ''} · ${totalMuscles} muscle group${totalMuscles > 1 ? 's' : ''} · ${totalExercises} exercise${totalExercises > 1 ? 's' : ''}`,
        content: {
          workoutName: workoutName.trim(),
          days: days,
          created_at: new Date().toISOString(),
        },
        source: "manual",
        pinned: false,
      };

      let workoutId;
      if (editingId || savedWorkoutId) {
        // Update existing workout
        workoutId = editingId || savedWorkoutId;
        await updateVaultItem(workoutId, workoutData);
        alert("✅ Workout updated successfully!");
      } else {
        // Create new workout
        const response = await createVaultItem(workoutData);
        workoutId = response.id;
        setSavedWorkoutId(workoutId);
        alert("✅ Workout saved to Vault!");
      }

      return workoutId;
    } catch (error) {
      console.error("Failed to save workout:", error);
      alert(`❌ ${error.message || 'Failed to save workout. Please try again.'}`);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsActive = async () => {
    setSettingActive(true);
    try {
      // First, ensure workout is saved
      let workoutId = savedWorkoutId || editingId;

      if (!workoutId) {
        workoutId = await handleSave();
        if (!workoutId) {
          setSettingActive(false);
          return;
        }
      }

      // Now set as active program
      await setActiveWorkoutProgram(workoutId);
      alert("✅ Set as active workout program! You'll see your progress on the home screen.");
      navigate("/");
    } catch (error) {
      console.error("Failed to set active program:", error);
      alert(`❌ ${error.message || 'Failed to set as active program. Please try again.'}`);
    } finally {
      setSettingActive(false);
    }
  };

  const getSelectorItems = () => {
    if (!open) return [];
    const parts = open.split('-');

    if (open.startsWith('muscle-')) {
      return Object.keys(EXERCISES);
    }

    if (open.startsWith('area-')) {
      const dayIndex = parseInt(parts[1]);
      const muscleIndex = parseInt(parts[2]);
      const muscleName = days[dayIndex].muscles[muscleIndex].name;
      return Object.keys(EXERCISES[muscleName]);
    }

    if (open.startsWith('ex-')) {
      const dayIndex = parseInt(parts[1]);
      const muscleIndex = parseInt(parts[2]);
      const areaIndex = parseInt(parts[3]);
      const muscle = days[dayIndex].muscles[muscleIndex];
      const areaName = muscle.areas[areaIndex].name;
      return EXERCISES[muscle.name][areaName];
    }

    return [];
  };

  const handleSelectorSelect = (item) => {
    if (!open) return;
    const parts = open.split('-');

    if (open.startsWith('muscle-')) {
      const dayIndex = parseInt(parts[1]);
      addMuscle(dayIndex, item);
    } else if (open.startsWith('area-')) {
      const dayIndex = parseInt(parts[1]);
      const muscleIndex = parseInt(parts[2]);
      addArea(dayIndex, muscleIndex, item);
    } else if (open.startsWith('ex-')) {
      const dayIndex = parseInt(parts[1]);
      const muscleIndex = parseInt(parts[2]);
      const areaIndex = parseInt(parts[3]);
      addExercise(dayIndex, muscleIndex, areaIndex, item);
    }
  };

  // Show day selector for first-time users
  if (showDaySelector) {
    return <DaySelector onSelect={handleDayCountSelect} onBack={() => navigate(-1)} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      overflowY: "auto",
      paddingBottom: "140px",
    }}>
      <div style={{ padding: "24px 20px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
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
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}>
              {editingId ? "Edit Workout" : "Create Workout"}
            </h1>
            <p style={{
              margin: "4px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
            }}>
              {editingId ? "Update your routine" : `${selectedDayCount}-day workout program`}
            </p>
          </div>
        </div>

        {/* WORKOUT NAME INPUT */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 8,
          }}>
            Workout Name *
          </label>
          <input
            type="text"
            placeholder="e.g., PPL Program, Upper/Lower Split, Full Body..."
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 16,
              border: "1px solid rgba(139, 92, 246, 0.3)",
              background: "rgba(139, 92, 246, 0.05)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 500,
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(139, 92, 246, 0.6)";
              e.target.style.background = "rgba(139, 92, 246, 0.1)";
              e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(139, 92, 246, 0.3)";
              e.target.style.background = "rgba(139, 92, 246, 0.05)";
              e.target.style.boxShadow = "none";
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

        {/* INFO: Days are locked for new workouts */}
        {!editingWorkout && (
          <div style={{
            padding: "16px 20px",
            borderRadius: 16,
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🔒</span>
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

      {/* FLOATING ACTION BUTTONS */}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 50,
      }}>
        {/* SET AS ACTIVE BUTTON */}
        <button
          onClick={handleSetAsActive}
          disabled={settingActive}
          style={{
            padding: "16px 32px",
            borderRadius: 999,
            border: "none",
            background: settingActive
              ? "rgba(16, 185, 129, 0.5)"
              : "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: settingActive ? "not-allowed" : "pointer",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.4)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: settingActive ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!settingActive) {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(16, 185, 129, 0.6)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(16, 185, 129, 0.4)";
          }}
        >
          {settingActive ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Setting Active...
            </>
          ) : (
            <>⚡ Set as Active Program</>
          )}
        </button>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "16px 32px",
            borderRadius: 999,
            border: "none",
            background: saving
              ? "rgba(139, 92, 246, 0.5)"
              : "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(139, 92, 246, 0.6)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(139, 92, 246, 0.4)";
          }}
        >
          {saving ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              {editingId ? "Updating..." : "Saving..."}
            </>
          ) : (
            <>{editingId ? "💾 Update Workout" : "💾 Save to Vault"}</>
          )}
        </button>
      </div>

      {open && (
        <Selector
          items={getSelectorItems()}
          onSelect={handleSelectorSelect}
          onClose={() => setOpen(null)}
        />
      )}

      <style>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// NEW: Day Selection Screen
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
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
    }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#8b5cf6",
          fontSize: 28,
          cursor: "pointer",
          padding: 0,
          marginBottom: 24,
          alignSelf: "flex-start",
        }}
      >
        ←
      </button>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏋️</div>
          <h1 style={{
            margin: "0 0 12px",
            fontSize: 28,
            fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            How many days per week?
          </h1>
          <p style={{
            margin: 0,
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
          }}>
            Choose your training frequency to build<br />your personalized workout program
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dayOptions.map((option) => (
            <button
              key={option.count}
              onClick={() => onSelect(option.count)}
              onMouseEnter={() => setHoveredDay(option.count)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                position: "relative",
                padding: "24px 28px",
                borderRadius: 20,
                border: `2px solid ${hoveredDay === option.count ? option.color : 'rgba(255,255,255,0.1)'}`,
                background: hoveredDay === option.count
                  ? `linear-gradient(135deg, ${option.color}15, ${option.color}08)`
                  : "rgba(17, 24, 39, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: hoveredDay === option.count ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
                boxShadow: hoveredDay === option.count
                  ? `0 12px 32px ${option.color}40`
                  : "none",
                textAlign: "left",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "100%",
                background: `linear-gradient(135deg, ${option.color}10, transparent)`,
                opacity: hoveredDay === option.count ? 1 : 0,
                transition: "opacity 0.3s ease",
              }} />

              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{
                    margin: "0 0 6px",
                    fontSize: 22,
                    fontWeight: 700,
                    color: hoveredDay === option.count ? option.color : "#fff",
                    transition: "color 0.3s ease",
                  }}>
                    {option.label}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.6)",
                  }}>
                    {option.description}
                  </p>
                </div>
                <div style={{
                  fontSize: 24,
                  color: option.color,
                  transform: hoveredDay === option.count ? "translateX(4px)" : "translateX(0)",
                  transition: "transform 0.3s ease",
                }}>
                  →
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{
          marginTop: 32,
          padding: "20px",
          borderRadius: 16,
          background: "rgba(139, 92, 246, 0.08)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
        }}>
          <p style={{
            margin: 0,
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.6,
            textAlign: "center",
          }}>
            💡 <strong style={{ color: "#a78bfa" }}>Tip:</strong> Most people see great results with 4-5 days per week. You can always adjust later!
          </p>
        </div>
      </div>
    </div>
  );
}

function DayCard({ day, dayIndex, daysLength, open, setOpen, onRemoveDay, onAddMuscle, onRemoveMuscle, onAddArea, onRemoveArea, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet, isLocked }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      padding: "24px",
      marginBottom: 24,
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.4))",
      backdropFilter: "blur(16px)",
      overflow: "visible",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 22,
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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Day {dayIndex + 1}
            </h2>
            <p style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
            }}>
              {day.muscles.length} muscle group{day.muscles.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Only show remove button if not locked and more than 1 day */}
          {!isLocked && daysLength > 1 && (
            <button onClick={onRemoveDay} style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 16,
              transition: "all 0.2s ease",
            }}>
              ✕
            </button>
          )}
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

function MuscleBlock({ muscle, dayIndex, muscleIndex, open, setOpen, onRemove, onAddArea, onRemoveArea, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet }) {
  return (
    <div style={{
      marginTop: 20,
      borderRadius: 18,
      padding: "18px",
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#a78bfa" }}>{muscle.name}</h3>
        <button onClick={onRemove} style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "none",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: 14,
        }}>✕</button>
      </div>

      <SmallButton onClick={() => setOpen(`area-${dayIndex}-${muscleIndex}`)} text="+ Add Area" color="#6366f1" />

      {muscle.areas.map((ar, a) => (
        <AreaBlock
          key={a}
          area={ar}
          dayIndex={dayIndex}
          muscleIndex={muscleIndex}
          areaIndex={a}
          muscleName={muscle.name}
          open={open}
          setOpen={setOpen}
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

function AreaBlock({ area, dayIndex, muscleIndex, areaIndex, muscleName, open, setOpen, onRemove, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet }) {
  return (
    <div style={{
      marginTop: 14,
      borderRadius: 16,
      padding: "16px",
      background: "rgba(0, 0, 0, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#818cf8" }}>{area.name}</h4>
        <button onClick={onRemove} style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "none",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: 12,
        }}>✕</button>
      </div>

      <SmallButton onClick={() => setOpen(`ex-${dayIndex}-${muscleIndex}-${areaIndex}`)} text="+ Add Exercise" color="#ec4899" />

      {area.exercises && area.exercises.map((ex, e) => (
        <ExerciseCard
          key={e}
          exercise={ex}
          onRemove={() => onRemoveExercise(e)}
          onAddSet={() => onAddSet(e)}
          onUpdateSet={(s, key, value) => onUpdateSet(e, s, key, value)}
          onRemoveSet={(s) => onRemoveSet(e, s)}
        />
      ))}
    </div>
  );
}

function ExerciseCard({ exercise, onRemove, onAddSet, onUpdateSet, onRemoveSet }) {
  return (
    <div style={{
      position: "relative",
      marginTop: 12,
      borderRadius: 14,
      padding: "14px",
      background: "rgba(0, 0, 0, 0.5)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 14,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>{exercise.name}</strong>
          <button onClick={onRemove} style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "none",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: 12,
          }}>✕</button>
        </div>

        {exercise.sets.map((set, s) => (
          <div key={s} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) auto", gap: 8, marginBottom: 8 }}>
            <Input placeholder="Reps" value={set.reps} onChange={(e) => onUpdateSet(s, "reps", e.target.value)} />
            <Input placeholder="Weight" value={set.weight} onChange={(e) => onUpdateSet(s, "weight", e.target.value)} />
            <Input placeholder="RIR" value={set.rir} onChange={(e) => onUpdateSet(s, "rir", e.target.value)} />
            <button onClick={() => onRemoveSet(s)} style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 14,
            }}>✕</button>
          </div>
        ))}

        <SmallButton onClick={onAddSet} text="+ Add Set" color="#10b981" ghost />
      </div>
    </div>
  );
}

function Input({ placeholder, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: isFocused ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(0, 0, 0, 0.4)",
        color: "#fff",
        fontSize: 14,
        outline: "none",
        transition: "all 0.2s ease",
        boxShadow: isFocused ? "0 0 0 3px rgba(139, 92, 246, 0.1)" : "none",
      }}
    />
  );
}

function GradientButton({ onClick, text, color }) {
  return (
    <button onClick={onClick} style={{
      width: "100%",
      padding: "14px",
      borderRadius: 14,
      border: "none",
      background: `linear-gradient(135deg, ${color}20, ${color}10)`,
      color: color,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
    }}>{text}</button>
  );
}

function SmallButton({ onClick, text, color, ghost }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px",
      borderRadius: 999,
      border: ghost ? `1px solid ${color}30` : "none",
      background: ghost ? "transparent" : `${color}20`,
      color: color,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      marginTop: 8,
    }}>{text}</button>
  );
}

function Selector({ items, onSelect, onClose }) {
  const contentRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
        }}
      />

      <div
        style={{
          position: "relative",
          marginTop: "auto",
          background: "linear-gradient(to top, rgb(17, 24, 39), rgb(31, 41, 55))",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          borderTop: "2px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <div style={{
          padding: "16px 0 12px",
          display: "flex",
          justifyContent: "center",
        }}>
          <div style={{
            width: 40,
            height: 4,
            background: "rgba(255, 255, 255, 0.3)",
            borderRadius: 2,
          }} />
        </div>

        <h3 style={{
          margin: "0 0 16px",
          padding: "0 24px",
          fontSize: 18,
          fontWeight: 600,
          textAlign: "center",
          color: "#fff",
        }}>
          Select Option
        </h3>

        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 40px",
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => onSelect(item)}
                style={{
                  padding: "18px 20px",
                  borderRadius: 14,
                  border: "none",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}