import "./diet.css";

export default function DietCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const loggedUntil = 16;

  return (
    <main className="diet-screen">
      <div className="diet-wrapper">
        <h1 className="diet-title">Diet calendar</h1>

        <div className="calendar-grid">
          {days.map(day => (
            <div
              key={day}
              className={`calendar-day ${day <= loggedUntil ? "logged" : ""}`}
            >
              <span className="day-num">{day}</span>
              {day <= loggedUntil && <span className="day-status">Logged</span>}
            </div>
          ))}
        </div>

        <div className="bottom-spacer" />
      </div>
    </main>
  );
}
