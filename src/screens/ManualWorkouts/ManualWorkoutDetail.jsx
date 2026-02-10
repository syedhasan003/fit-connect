import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItemById, deleteVaultItem, updateVaultItem } from "../../api/vault";

export default function ManualWorkoutDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, [id]);

  const loadWorkout = async () => {
    try {
      const data = await fetchVaultItemById(id);
      setWorkout(data);
    } catch (error) {
      console.error("Failed to load workout:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVaultItem(id);
      navigate("/vault/workouts");
    } catch (error) {
      console.error("Failed to delete workout:", error);
      alert("Failed to delete workout. Please try again.");
    }
  };

  const handleTogglePin = async () => {
    try {
      await updateVaultItem(id, { pinned: !workout.pinned });
      setWorkout({ ...workout, pinned: !workout.pinned });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleEditWorkout = () => {
    // Navigate to WorkoutBuilder with this workout's data pre-filled for editing
    navigate("/workout-builder", { 
      state: { 
        workoutData: workoutData,
        workoutId: workout.id,
        mode: "edit"
      } 
    });
  };

  const handleStartWorkout = () => {
    // Phase 2: Navigate to daily workout logger
    // For now, show a placeholder message
    alert("Daily workout logging coming in Phase 2! 🚀");
    
    // Future implementation:
    // navigate("/workout-logger", { 
    //   state: { 
    //     workoutId: workout.id,
    //     workoutData: workoutData
    //   } 
    // });
  };

  const handleSetAsActive = async () => {
    try {
      // Check if workout data has the proper structure
      if (!workoutData || !workoutData.days || workoutData.days.length === 0) {
        alert("This workout needs exercises before it can be set as active.");
        return;
      }

      // Update the workout to mark it as active
      const updatedContent = {
        ...workoutData,
        isActive: true,
        activatedAt: new Date().toISOString()
      };

      await updateVaultItem(id, { 
        content: updatedContent,
        summary: `Active Program: ${workout.title || 'Workout Program'}`
      });

      setWorkout({ 
        ...workout, 
        content: updatedContent 
      });

      // Show success message
      alert("✅ This workout is now your active program!");

    } catch (error) {
      console.error("Failed to set as active:", error);
      alert("Failed to set as active program. Please try again.");
    }
  };

  if (loading) return <LoadingState />;
  if (!workout) return <ErrorState />;

  // Parse workout data
  const workoutData = typeof workout.content === 'string' 
    ? JSON.parse(workout.content) 
    : workout.content;

  // Check if this is the active program
  const isActiveProgram = workoutData?.isActive === true;

  // Flatten exercises from nested days structure for display
  const days = workoutData?.days || [];
  const allExercises = [];
  
  days.forEach((day, dayIndex) => {
    (day.muscles || []).forEach((muscle) => {
      (muscle.areas || []).forEach((area) => {
        (area.exercises || []).forEach((exercise) => {
          allExercises.push({
            ...exercise,
            dayNumber: dayIndex + 1,
            muscleName: muscle.name,
            areaName: area.name,
          });
        });
      });
    });
  });

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
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}>
                  {workout.title || "Untitled Workout"}
                </h1>
                {isActiveProgram && (
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}>
                    ✓ Active
                  </span>
                )}
              </div>
              <p style={{
                margin: "8px 0 0",
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
              }}>
                Created {new Date(workout.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleTogglePin}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 8,
                }}
              >
                {workout.pinned ? "📌" : "📍"}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 8,
                  color: "#ef4444",
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS - THE THREE KEY BUTTONS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
          marginBottom: 32,
        }}>
          {/* EDIT WORKOUT */}
          <ActionButton
            icon="✏️"
            label="Edit Workout"
            color="#8b5cf6"
            onClick={handleEditWorkout}
            subtitle="Modify exercises and structure"
          />

          {/* START WORKOUT */}
          <ActionButton
            icon="🏋️"
            label="Start Workout"
            color="#3b82f6"
            onClick={handleStartWorkout}
            subtitle="Begin today's training session"
          />

          {/* SET AS ACTIVE PROGRAM */}
          <ActionButton
            icon={isActiveProgram ? "✓" : "⭐"}
            label={isActiveProgram ? "Active Program" : "Set as Active Program"}
            color={isActiveProgram ? "#10b981" : "#f59e0b"}
            onClick={handleSetAsActive}
            subtitle={isActiveProgram ? "This is your current routine" : "Make this your current routine"}
            disabled={isActiveProgram}
          />
        </div>

        {/* EXERCISES */}
        <h2 style={{
          fontSize: 19,
          fontWeight: 600,
          marginBottom: 16,
        }}>
          Exercises ({allExercises.length})
        </h2>

        {allExercises.length === 0 ? (
          <div style={{
            padding: "40px 20px",
            textAlign: "center",
            borderRadius: 16,
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px dashed rgba(139, 92, 246, 0.3)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💪</div>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
              No exercises yet. Click "Edit Workout" to add some!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {allExercises.map((exercise, index) => (
              <ExerciseCard key={index} exercise={exercise} index={index} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

function ActionButton({ icon, label, color, onClick, subtitle, disabled = false }) {
  const [isHover, setIsHover] = useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      disabled={disabled}
      style={{
        padding: "16px 18px",
        borderRadius: 16,
        border: `2px solid ${color}40`,
        background: disabled 
          ? `${color}15`
          : isHover 
            ? `${color}25` 
            : `${color}15`,
        color: color,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ 
        fontSize: 24,
        minWidth: 28,
        textAlign: "center",
      }}>
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ 
            fontSize: 12, 
            fontWeight: 400, 
            color: `${color}cc`,
            lineHeight: 1.3,
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}

function ExerciseCard({ exercise, index }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      padding: "18px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
    }}>
      {/* Animated border */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
          }}>
            {index + 1}
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
            }}>
              {exercise.name}
            </h3>
            <p style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}>
              Day {exercise.dayNumber} · {exercise.muscleName} · {exercise.areaName}
            </p>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
        }}>
          {exercise.sets && exercise.sets.length > 0 && (
            <>
              <DetailBadge label="Sets" value={exercise.sets.length} />
              {exercise.sets.map((set, idx) => (
                <div key={idx} style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  fontSize: 12,
                  color: "#a5b4fc",
                }}>
                  {set.reps && `${set.reps} reps`}
                  {set.reps && set.weight && ' · '}
                  {set.weight && `${set.weight} lbs`}
                  {(set.reps || set.weight) && set.rir && ' · '}
                  {set.rir && `RIR ${set.rir}`}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBadge({ label, value }) {
  return (
    <div style={{
      padding: "6px 12px",
      borderRadius: 999,
      background: "rgba(139, 92, 246, 0.15)",
      border: "1px solid rgba(139, 92, 246, 0.3)",
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#a78bfa",
      }}>
        {label}: {value}
      </span>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
      }} />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to top, rgb(17, 24, 39), rgb(31, 41, 55))",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: "24px 20px 40px",
        zIndex: 101,
        borderTop: "2px solid rgba(239, 68, 68, 0.3)",
      }}>
        <div style={{
          width: 40,
          height: 4,
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: 2,
          margin: "0 auto 24px",
        }} />
        <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600, color: "#fff" }}>
          Delete Workout?
        </h3>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
          This action cannot be undone. Your workout will be permanently deleted.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: "#ef4444",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}>
            Delete
          </button>
        </div>
      </div>
    </>
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
        width: 50,
        height: 50,
        border: "3px solid rgba(139, 92, 246, 0.2)",
        borderTop: "3px solid #8b5cf6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ErrorState() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
      color: "#fff",
      padding: 20,
    }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Workout Not Found</h2>
      <button
        onClick={() => navigate("/vault/workouts")}
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
        Back to Workouts
      </button>
    </div>
  );
}