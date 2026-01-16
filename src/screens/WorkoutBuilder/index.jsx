import { useState } from "react";
import EXERCISES from "./exercises.js";
import "./workoutbuilder.css";

export default function WorkoutBuilder() {
  const [days, setDays] = useState([{ muscles: [] }]);
  const [open, setOpen] = useState(null);

  const addDay = () => setDays(d => [...d, { muscles: [] }]);
  const removeDay = d =>
    setDays(prev => prev.filter((_, i) => i !== d));

  const addMuscle = (d, name) => {
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? { ...day, muscles: [...day.muscles, { name, areas: [] }] }
          : day
      )
    );
    setOpen(null);
  };

  const removeMuscle = (d, m) =>
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? { ...day, muscles: day.muscles.filter((_, mi) => mi !== m) }
          : day
      )
    );

  const addArea = (d, m, name) => {
    setDays(prev =>
      prev.map((day, di) =>
        di === d
          ? {
              ...day,
              muscles: day.muscles.map((mu, mi) =>
                mi === m
                  ? { ...mu, areas: [...mu.areas, { name, exercises: [] }] }
                  : mu
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
                mi === m
                  ? {
                      ...mu,
                      areas: mu.areas.filter((_, ai) => ai !== a)
                    }
                  : mu
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
                              exercises: [
                                ...ar.exercises,
                                {
                                  name,
                                  sets: [{ reps: "", weight: "", rir: "" }]
                                }
                              ]
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
                        ai === a
                          ? {
                              ...ar,
                              exercises: ar.exercises.filter((_, ei) => ei !== e)
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
                                ei === e
                                  ? {
                                      ...ex,
                                      sets: [
                                        ...ex.sets,
                                        { reps: "", weight: "", rir: "" }
                                      ]
                                    }
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

  const updateSet = (d, m, a, e, s, k, v) =>
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
                                  ? {
                                      ...ex,
                                      sets: ex.sets.map((set, si) =>
                                        si === s ? { ...set, [k]: v } : set
                                      )
                                    }
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
                                ei === e
                                  ? {
                                      ...ex,
                                      sets: ex.sets.filter((_, si) => si !== s)
                                    }
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

  return (
    <div className="workout-builder">
      <h1>Create Workout</h1>

      {days.map((day, d) => (
        <div className="day-card" key={d}>
          <div className="row">
            <h2>Day {d + 1}</h2>
            {days.length > 1 && (
              <button className="icon-btn" onClick={() => removeDay(d)}>✕</button>
            )}
          </div>

          <button className="pill wide" onClick={() => setOpen(`muscle-${d}`)}>
            + Add Muscle Group
          </button>

          {open === `muscle-${d}` && (
            <div className="selector-list">
              {Object.keys(EXERCISES).map(m => (
                <button
                  key={m}
                  className="selector-item"
                  onClick={() => addMuscle(d, m)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {day.muscles.map((mus, m) => (
            <div className="muscle-block" key={m}>
              <div className="row">
                <h3>{mus.name}</h3>
                <button className="icon-btn" onClick={() => removeMuscle(d, m)}>✕</button>
              </div>

              <button className="pill ghost small" onClick={() => setOpen(`area-${d}-${m}`)}>
                + Add Area
              </button>

              {open === `area-${d}-${m}` && (
                <div className="selector-list">
                  {Object.keys(EXERCISES[mus.name]).map(a => (
                    <button
                      key={a}
                      className="selector-item"
                      onClick={() => addArea(d, m, a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}

              {mus.areas.map((ar, a) => (
                <div className="area-block" key={a}>
                  <div className="row">
                    <h4>{ar.name}</h4>
                    <button className="icon-btn" onClick={() => removeArea(d, m, a)}>✕</button>
                  </div>

                  <button className="pill small" onClick={() => setOpen(`ex-${d}-${m}-${a}`)}>
                    + Add Exercise
                  </button>

                  {open === `ex-${d}-${m}-${a}` && (
                    <div className="selector-list">
                      {EXERCISES[mus.name][ar.name].map(ex => (
                        <button
                          key={ex}
                          className="selector-item"
                          onClick={() => addExercise(d, m, a, ex)}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}

                  {ar.exercises.map((ex, e) => (
                    <div className="exercise-card" key={e}>
                      <div className="row">
                        <strong>{ex.name}</strong>
                        <button className="icon-btn" onClick={() => removeExercise(d, m, a, e)}>✕</button>
                      </div>

                      {ex.sets.map((set, s) => (
                        <div className="set-row" key={s}>
                          <input placeholder="Reps" value={set.reps} onChange={e => updateSet(d, m, a, e, s, "reps", e.target.value)} />
                          <input placeholder="Weight" value={set.weight} onChange={e => updateSet(d, m, a, e, s, "weight", e.target.value)} />
                          <input placeholder="RIR" value={set.rir} onChange={e => updateSet(d, m, a, e, s, "rir", e.target.value)} />
                          <button className="icon-btn" onClick={() => removeSet(d, m, a, e, s)}>✕</button>
                        </div>
                      ))}

                      <button className="pill small ghost" onClick={() => addSet(d, m, a, e)}>
                        + Add Set
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      <button className="pill wide" onClick={addDay}>+ Add Day</button>
      <button className="pill save">Save Workout</button>
    </div>
  );
}
