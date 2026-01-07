import React from "react";

export default function Home() {
  return (
    <div className="home-root">
      {/* TODAY */}
      <section className="section">
        <h2 className="section-title">Today</h2>

        <div className="card today-card">
          <div className="today-row">
            <span>Workout</span>
            <span className="status pending">Pending</span>
          </div>
          <div className="today-row">
            <span>Diet</span>
            <span className="status warning">Not created</span>
          </div>
          <div className="today-row">
            <span>Reminder</span>
            <span className="status danger">1 missed</span>
          </div>
        </div>
      </section>

      {/* REMINDERS */}
      <section className="section">
        <h2 className="section-title">Reminders</h2>

        <div className="card reminder-card">
          <div className="reminder-header">
            You have <strong>2 active reminders</strong>
          </div>

          <button className="reminder-button">
            Create reminder
          </button>
        </div>
      </section>

      {/* CREATE */}
      <section className="section">
        <h2 className="section-title">Create</h2>

        <div className="create-grid">
          <div className="card create-card workout-card">
            <span className="card-eyebrow">CREATE</span>
            <h3>Workout</h3>
            <span className="card-link">Open Central →</span>
          </div>

          <div className="card create-card diet-card">
            <span className="card-eyebrow">CREATE</span>
            <h3>Diet plan</h3>
            <span className="card-link">Open Central →</span>
          </div>
        </div>
      </section>

      {/* AI INSIGHTS */}
      <section className="section">
        <h2 className="section-title">AI insights</h2>

        <div className="card insight-card">
          Your workout consistency dropped compared to last week
    </div>
      </section>

      {/* PROGRESS */}
      <section className="section">
        <h2 className="section-title">Progress</h2>

        <div className="card progress-card">
          Activity over time (last 7 days)
        </div>
      </section>
    </div>
  );
}
