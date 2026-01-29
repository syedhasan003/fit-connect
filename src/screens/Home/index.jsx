import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchHomeOverview } from "../../api/home";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchHomeOverview()
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return null;

  const name =
    data.user.full_name ||
    data.user.email.split("@")[0];

  return (
    <>
      <main className="home">
        {/* HEADER */}
        <header className="home-header">
          <div className="avatar" />
          <div>
            <h1>{name}</h1>
            <p className="muted">Dashboard overview</p>
          </div>
        </header>

        {/* TODAY */}
        <section>
          <h2>Today</h2>
          <div className="card">
            <div className="row">
              <span>Workout</span>
              <span className="status">
                {data.today.workout === "completed"
                  ? "Completed"
                  : "Pending"}
              </span>
            </div>

            <div className="row">
              <span>Diet</span>
              <span className="muted">Coming soon</span>
            </div>

            <div className="row">
              <span>Reminders</span>
              <span className="muted">
                {data.today.reminders.missed} missed
              </span>
            </div>
          </div>
        </section>

        {/* CREATE */}
        <section>
          <h2>Create</h2>
          <div className="grid">
            <div
              className="card clickable"
              onClick={() => navigate("/workout-builder")}
            >
              <small>CREATE</small>
              <h3>Workout</h3>
              <p className="link">Manual builder →</p>
            </div>

            <div
              className="card clickable"
              onClick={() =>
                navigate("/central", {
                  state: {
                    preset: "Create a diet plan for me"
                  }
                })
              }
            >
              <small>CREATE</small>
              <h3>Diet Plan</h3>
              <p className="link">Use AI →</p>
            </div>
          </div>
        </section>

        {/* PROGRESS */}
        <section>
          <h2>Progress</h2>
          <div className="card center">
            <div className="consistency">
              {data.consistency.map((d) => (
                <span
                  key={d.date}
                  className={`dot ${d.worked_out ? "on" : ""}`}
                />
              ))}
            </div>
            <p className="muted">Consistency (last 14 days)</p>
          </div>
        </section>

        {/* AI INSIGHT */}
        <section>
          <h2>AI Insight</h2>
          <div className="card muted">
            {data.evaluator?.ai_summary ||
              "Keep showing up. Momentum compounds."}
          </div>
        </section>

        <div style={{ height: "90px" }} />
      </main>

      <BottomNav />
    </>
  );
}
