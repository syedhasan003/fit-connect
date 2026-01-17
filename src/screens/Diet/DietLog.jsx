import { useState } from "react";
import { dietStore } from "./dietStore";
import DietBottomNav from "./components/DietBottomNav";
import "./diet.css";

export default function DietLog() {
  const [food, setFood] = useState("");
  const [calories, setCalories] = useState("");
  const [meal, setMeal] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const save = () => {
    if (!food || !calories) return;

    if (!dietStore.logs[today]) {
      dietStore.logs[today] = { meals: [] };
    }

    dietStore.logs[today].meals.push({
      name: meal || "Meal",
      items: [{ name: food, calories: Number(calories) }]
    });

    setFood("");
    setCalories("");
    setMeal("");
  };

  return (
    <main className="diet-screen">
      <div className="diet-wrapper">
        <h1 className="diet-title">Log food</h1>

        <div className="log-card">
          <div className="log-inputs">
            <input
              placeholder="Food name"
              value={food}
              onChange={e => setFood(e.target.value)}
            />
            <input
              placeholder="Calories"
              value={calories}
              onChange={e => setCalories(e.target.value)}
            />
            <input
              placeholder="Meal / context (e.g. Post-workout)"
              value={meal}
              onChange={e => setMeal(e.target.value)}
            />
          </div>

          <button className="primary wide" onClick={save}>
            Save
          </button>
        </div>

        <div className="bottom-spacer" />
        <DietBottomNav />
      </div>
    </main>
  );
}
