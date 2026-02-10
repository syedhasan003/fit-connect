import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems } from "../../api/vault";

export default function ManualWorkoutsList() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await fetchVaultItems();
      // Filter only workout items
      const workoutItems = data.filter(item => item.type === "workout" || item.source === "workout");
      setWorkouts(workoutItems);
    } catch (error) {
      console.error("Failed to load workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}>
            Manual Workouts
          </h1>
          <p style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
          }}>
            Workout plans created with the manual builder
          </p>
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 16,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.03)",
              color: "#fff",
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        {/* WORKOUTS LIST */}
        {loading ? (
          <LoadingState />
        ) : filteredWorkouts.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onClick={() => navigate(`/vault/workouts/${workout.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function WorkoutCard({ workout, onClick }) {
  const [isHover, setIsHover] = useState(false);

  // Parse workout data
  const workoutData = typeof workout.content === 'string' 
    ? JSON.parse(workout.content) 
    : workout.content;

  // Calculate exercises and sets from nested days structure
  const days = workoutData?.days || [];
  const exerciseCount = days.reduce((total, day) => {
    return total + (day.muscles || []).reduce((muscleTotal, muscle) => {
      return muscleTotal + (muscle.areas || []).reduce((areaTotal, area) => {
        return areaTotal + (area.exercises || []).length;
      }, 0);
    }, 0);
  }, 0);

  const totalSets = days.reduce((total, day) => {
    return total + (day.muscles || []).reduce((muscleTotal, muscle) => {
      return muscleTotal + (muscle.areas || []).reduce((areaTotal, area) => {
        return areaTotal + (area.exercises || []).reduce((exTotal, exercise) => {
          return exTotal + (exercise.sets || []).length;
        }, 0);
      }, 0);
    }, 0);
  }, 0);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "20px",
        background: isHover
          ? "linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.5))"
          : "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: isHover ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
      }}
    >
      {/* Animated border */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        padding: "1px",
        background: isHover
          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4))"
          : "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#fff",
            }}>
              {workout.title || "Untitled Workout"}
            </h3>
            <p style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
            }}>
              {new Date(workout.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          {workout.is_pinned && (
            <span style={{ fontSize: 18 }}>📌</span>
          )}
        </div>

        <div style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <StatBadge icon="🏋️" label={`${exerciseCount} exercises`} color="#8b5cf6" />
          <StatBadge icon="📊" label={`${totalSets} sets`} color="#6366f1" />
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, color }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 999,
      background: `${color}15`,
      border: `1px solid ${color}30`,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: color,
      }}>
        {label}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "60px 20px",
    }}>
      <div style={{
        width: 50,
        height: 50,
        margin: "0 auto 20px",
        border: "3px solid rgba(139, 92, 246, 0.2)",
        borderTop: "3px solid #8b5cf6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{
        fontSize: 15,
        color: "rgba(255,255,255,0.6)",
      }}>
        Loading workouts...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ searchQuery }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "60px 20px",
    }}>
      <span style={{ fontSize: 60, marginBottom: 20, display: "block" }}>🏋️</span>
      <h3 style={{
        margin: "0 0 12px",
        fontSize: 20,
        fontWeight: 600,
      }}>
        {searchQuery ? "No workouts found" : "No workouts yet"}
      </h3>
      <p style={{
        margin: 0,
        fontSize: 15,
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.6,
      }}>
        {searchQuery
          ? "Try a different search term"
          : "Create your first workout with the Manual Builder"}
      </p>
    </div>
  );
}