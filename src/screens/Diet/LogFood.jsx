import { useState } from "react";
import { dietStore } from "./dietStore";

export default function LogFood() {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [meal, setMeal] = useState("");

  const save = () => {
    const date = new Date().toISOString().slice(0, 10);

    if (!dietStore.logs[date]) {
      dietStore.logs[date] = { meals: [] };
    }

    dietStore.logs[date].meals.push({
      name: meal || "Meal",
      items: [{ name, calories }]
    });

    alert("Food logged");
    setName("");
    setCalories("");
    setMeal("");
  };

  return (
    <main className="workout-builder">
      <h1>Log food</h1>

      <input placeholder="Food name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Calories" value={calories} onChange={e => setCalories(e.target.value)} />
      <input placeholder="Meal name" value={meal} onChange={e => setMeal(e.target.value)} />

      <button className="pill wide" onClick={save}>
        Save
      </button>
    </main>
  );
}
