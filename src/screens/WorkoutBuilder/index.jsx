import { useState } from "react";
import EXERCISES_BY_MUSCLE from "./exercises";
import "./workoutBuilder.css";

const emptySet = () => ({ reps: "", weight: "", rir: "" });

export default function WorkoutBuilder() {
  const [days, setDays] = useState([{ muscles: [] }]);

  /* ---------------- DAY ---------------- */

  const addDay = () => {
    setDays(prev => [...prev, { muscles: [] }]);
  };

  const deleteDay = (dayIndex) => {
    setDays(prev => prev.filter((_, i) => i !== dayIndex));
  };

  /* ---------------- MUSCLE ---------------- */

  const addMuscle = (dayIndex, muscle) => {
    if (!muscle) return;

    setDays(prev => {
      const updated = prev.map((day, i) => {
        if (i !== dayIndex) return day;

        if (day.muscles.some(m => m.muscle === muscle)) return day;

        return {
          ...day,
          muscles: [
            ...day.muscles,
            { muscle, exercises: [] }
          ]
        };
      });
      return updated;
    });
  };

  const deleteMuscle = (dayIndex, muscleIndex) => {
    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, muscles: day.muscles.filter((_, m) => m !== muscleIndex) }
          : day
      )
    );
  };

  /* ---------------- EXERCISE ---------------- */

  const addExercise = (dayIndex, muscleIndex, name) => {
    if (!name) return;

    setDays(prev =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;

        return {
          ...day,
          muscles: day.muscles.map((m, mi) =>
            mi === muscleIndex
              ? {
                  ...m,
                  exercises: [
                    ...m.exercises,
                    { name, sets: [emptySet()] }
                  ]
                }
              : m
          )
        };
      })
    );
  };

  const deleteExercise = (dayIndex, muscleIndex, exerciseIndex) => {
    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              muscles: day.muscles.map((m, mi) =>
                mi === muscleIndex
                  ? {
                      ...m,
                      exercises: m.exercises.filter((_, ei) => ei !== exerciseIndex)
                    }
                  : m
              )
            }
          : day
      )
    );
  };

  /* ---------------- SET ---------------- */

  const addSet = (dayIndex, muscleIndex, exerciseIndex) => {
    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              muscles: day.muscles.map((m, mi) =>
                mi === muscleIndex
                  ? {
                      ...m,
                      exercises: m.exercises.map((e, ei) =>
                        ei === exerciseIndex
                          ? { ...e, sets: [...e.sets, emptySet()] }
                          : e
                      )
                    }
                  : m
              )
            }
          : day
      )
    );
  };

  const deleteSet = (dayIndex, muscleIndex, exerciseIndex, setIndex) => {
    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              muscles: day.muscles.map((m, mi) =>
                mi === muscleIndex
                  ? {
                      ...m,
                      exercises: m.exercises.map((e, ei) =>
                        ei === exerciseIndex
                          ? {
                              ...e,
                              sets: e.sets.filter((_, si) => si !== setIndex)
                            }
                          : e
                      )
                    }
                  : m
              )
            }
          : day
      )
    );
  };

  const updateSet = (dayIndex, muscleIndex, exerciseIndex, setIndex, field, value) => {
    setDays(prev =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              muscles: day.muscles.map((m, mi) =>
                mi === muscleIndex
                  ? {
                      ...m,
                      exercises: m.exercises.map((e, ei) =>
                        ei === exerciseIndex
                          ? {
                              ...e,
                              sets: e.sets.map((s, si) =>
                                si === setIndex ? { ...s, [field]: value } : s
                              )
                            }
                          : e
                      )
                    }
                  : m
              )
            }
          : day
      )
    );
  };

  /* ---------------- SAVE ---------------- */

  const saveWorkout = () => {
    console.log("WORKOUT:", days);
    alert("Workout saved (frontend only)");
  };

  /* ---------------- RENDER ---------------- */

  return (
    <main className="workout-builder">
      <h1>Create Workout</h1>

      {days.map((day, dayIndex) => (
        <section key={dayIndex} className="day-card">
          <div className="day-header">
            <h2>Day {dayIndex + 1}</h2>
            {days.length > 1 && (
              <button className="icon-btn" onClick={() => deleteDay(dayIndex)}>×</button>
            )}
          </div>

          {day.muscles.map((muscleBlock, muscleIndex) => (
            <div key={muscleIndex} className="muscle-block">
              <div className="muscle-header">
                <strong>{muscleBlock.muscle}</strong>
                <button className="icon-btn" onClick={() => deleteMuscle(dayIndex, muscleIndex)}>×</button>
              </div>

              {muscleBlock.exercises.map((ex, exIndex) => (
                <div key={exIndex} className="exercise-card">
                  <div className="exercise-header">
                    <h4>{ex.name}</h4>
                    <button className="icon-btn" onClick={() => deleteExercise(dayIndex, muscleIndex, exIndex)}>×</button>
                  </div>

                  {ex.sets.map((set, setIndex) => (
                    <div key={setIndex} classN="set-row">
                      <input placeholder="Reps" value={set.reps}
                        onChange={e => updateSet(dayIndex, muscleIndex, exIndex, setIndex, "reps", e.target.value)} />
                      <input placeholder="Weight" value={set.weight}
                        onChange={e => updateSet(dayIndex, muscleIndex, exIndex, setIndex, "weight", e.target.value)} />
                      <input placeholder="RIR" value={set.rir}
                        onChange={e => updateSet(dayIndex, muscleIndex, exIndex, setIndex, "rir", e.target.value)} />
                      {ex.sets.length > 1 && (
                        <button className="icon-btn"
                          onClick={() => deleteSet(dayIndex, muscleIndex, exIndex, setIndex)}>×</button>
                      )}
                    </div>
                  ))}

                  <button className="pill-btn" onClick={() => addSet(dayIndex, muscleIndex, exIndex)}>
                    + Add Set
                  </button>
               </div>
              ))}

              <select defaultValue=""
                onChange={e => { addExercise(dayIndex, muscleIndex, e.target.value); e.target.value = ""; }}>
                <option value="">Add exercise</option>
                {(EXERCISES_BY_MUSCLE[muscleBlock.muscle] || []).map(ex =>
                  <option key={ex} value={ex}>{ex}</option>
                )}
              </select>
            </div>
          ))}

          <select defaultValue=""
            onChange={e => { addMuscle(dayIndex, e.target.value); e.target.value = ""; }}>
            <option value="">Add muscle group</option>
            {Object.keys(EXERCISES_BY_MUSCLE).map(m =>
              <option key={m} value={m}>{m}</option>
            )}
          </select>
        </section>
      ))}

      <button className="pill-btn wide" onClick={addDay}>+ Add Day</button>
      <button className="save-floating" onClick={saveWorkout}>Save Workout</button>
    </main>
  );
}
