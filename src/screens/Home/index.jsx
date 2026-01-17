import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <main className="home">
        <header className="home-header">
          <div className="avatar" />
          <div>
            <h1>Lewis Tarun</h1>
            <p className="muted">Dashboard overview</p>
          </div>
        </header>

        <section>
          <h2>Today</h2>
          <div className="card">
            <div className="row">
              <span>Workout</span>
              <span className="status">Pending</span>
            </div>
            <div className="row">
              <span>Diet</span>
              <span className="muted">1420 / 2400 kcal</span>
            </div>
            <div className="row">
              <span>Reminder</span>
              <span className="muted">1 missed</span>
            </div>
          </div>
        </section>

        <section>
          <h2>Create</h2>
          <div className="grid">
            <div
              className="card clickable"
              onClick={() => navigate("/workout-builder")}
            >
              <small>CREATE</small>
              <h3>Workout</h3>
              <p className="link">Open Central →</p>
            </div>

            <div
              className="card clickable"
              onClick={() => navigate("/diet")}
            >
              <small>CREATE</small>
              <h3>Diet Plan</h3>
              <p className="link">Open Diet →</p>
            </div>
          </div>
        </section>

        <section>
          <h2>AI Insights</h2>
          <div className="card muted">
            Your calorie intake is consistent this week
          </div>
        </section>

        <div style={{ height: "90px" }} />
      </main>

      <BottomNav />
    </>
  );
}
