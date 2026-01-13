import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <main className="home">
        {/* Header */}
        <header className="home-header">
          <div className="avatar" />
          <div>
            <h1>Lewis Tarun</h1>
            <p className="muted">Dashboard overview</p>
          </div>
        </header>

        {/* Today */}
        <section>
          <h2>Today</h2>
          <div className="card">
            <div className="row">
              <span>Workout</span>
              <span className="status">Pending</span>
            </div>
            <div className="row">
              <span>Diet</span>
              <span className="muted">Not created</span>
            </div>
            <div className="row">
              <span>Reminder</span>
              <span className="muted">1 missed</span>
            </div>
          </div>
        </section>

        {/* Reminders */}
        <section>
          <h2>Reminders</h2>
          <div className="card center">
            <p>You have 2 active reminders</p>
            <button className="primary">Create reminder</button>
          </div>
        </section>

        {/* Create */}
        <section>
          <h2>Create</h2>
          <div className="grid">
            {/* Workout */}
            <div
              className="card clickable"
              onClick={() => navigate("/workout-builder")}
            >
              <small>CREATE</small>
              <h3>Workout</h3>
              <p
                className="link"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/central");
                }}
              >
                Open Central →
              </p>
            </div>

            {/* Diet */}
            <div
              className="card clickable"
            onClick={() => navigate("/central")}
            >
              <small>CREATE</small>
              <h3>Diet Plan</h3>
              <p className="link">Open Central →</p>
            </div>
          </div>
        </section>

        {/* AI Insights */}
        <section>
          <h2>AI Insights</h2>
          <div className="card muted">
            Your workout consistency dropped compared to last week
          </div>
        </section>

        <div style={{ height: "90px" }} />
      </main>

      <BottomNav />
    </>
  );
}
