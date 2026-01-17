import { Link } from "react-router-dom";
import { dietStore } from "./dietStore";
import DietBottomNav from "./components/DietBottomNav";
import "./diet.css";

export default function DietHome() {
  const today = new Date().toISOString().slice(0, 10);
  const logs = dietStore.logs[today]?.items || [];
  const plan = dietStore.activePlan;

  const totalCalories = logs.reduce((sum, item) => sum + item.calories, 0);

  const progress = plan?.calories
    ? Math.min(100, Math.round((totalCalories / plan.calories) * 100))
    : 0;

  return (
    <>
      <main className="diet-screen">
        <div className="diet-wrapper">
          <h1 className="diet-title">Diet</h1>

          {/* HERO CARD */}
          <div className="diet-hero-card">
            <div className="hero-left">
              <div className="hero-ring">
                <svg width="110" height="110">
                  <circle
                    cx="55"
                    cy="55"
                    r="48"
                    stroke="#1f1f1f"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r="48"
                    stroke="#ffffff"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={302}
                    strokeDashoffset={302 - (302 * progress) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                  />
                </svg>

                <div className="hero-center">
                  <strong>{progress}%</strong>
                  <span>kcal</span>
                </div>
              </div>
            </div>

            <div className="hero-right">
              <h2>Today's intake</h2>

              <p className="hero-cal">
                {totalCalories} / {plan?.calories || 0} kcal
              </p>

              {plan && (
                <p className="muted">
                  P {plan.protein}g · C {plan.carbs}g · F {plan.fat}g
                </p>
              )}

              <div className="hero-actions">
                <Link to="/diet/log" className="primary">
                  Log food
                </Link>

                <Link to="/diet/calendar" className="pill ghost">
                  View calendar
                </Link>
              </div>
            </div>
          </div>

          {/* MEALS SECTION */}
          <section className="diet-section">
            <h2>Today's meals</h2>

            {logs.length === 0 && (
              <div className="empty-state">
                <p className="muted">No meals logged yet</p>
                <Link to="/diet/log" className="pill ghost small">
                  Add first meal
                </Link>
              </div>
            )}

            {logs.map((item, index) => (
              <div key={index} className="meal-card">
                <div className="row">
                  <strong>{item.food}</strong>
                  <span>{item.calories} kcal</span>
                </div>
                {item.meal && <p className="muted">{item.meal}</p>}
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* ✅ REQUIRED: Diet sub navigation */}
      <DietBottomNav />
    </>
  );
}
