import DietBottomNav from "./components/DietBottomNav";
import "./diet.css";

export default function DietLog() {
  return (
    <main className="diet-screen">
      <h1 className="diet-title">Log food</h1>

      <div className="form">
        <input placeholder="Food name" />
        <input placeholder="Calories" />
        <input placeholder="Meal name (optional)" />
        <button className="primary wide">Save</button>
      </div>

      <div className="bottom-spacer" />
      <DietBottomNav />
    </main>
  );
}
