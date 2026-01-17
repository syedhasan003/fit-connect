import IntakeCard from "./components/IntakeCard";
import MealCard from "./components/MealCard";
import DietBottomNav from "./components/DietBottomNav";
import { useNavigate } from "react-router-dom";
import "./diet.css";

export default function DietHome() {
  const navigate = useNavigate();

  return (
    <main className="diet-screen">
      <h1 className="diet-title">Diet</h1>

      <IntakeCard />

      <section className="diet-actions">
        <button className="primary wide" onClick={() => navigate("/diet/log")}>
          Log food
        </button>
        <button className="ghost wide" onClick={() => navigate("/diet/calendar")}>
          View calendar
        </button>
      </section>

      <section className="diet-meals">
        <h2>Today's meals</h2>

        <MealCard
          title="Breakfast"
          items="Oats, banana, whey"
          calories="480 kcal"
        />
        <MealCard
          title="Lunch"
          items="Chicken rice bowl"
          calories="620 kcal"
        />
        <MealCard
          title="Snack"
          items="Peanut butter sandwich"
          calories="320 kcal"
        />
      </section>

      <div className="bottom-spacer" />
      <DietBottomNav />
    </main>
  );
}
