import DietBottomNav from "./components/DietBottomNav";
import "./diet.css";

export default function DietCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const loggedUntil = 16;

  return (
    <main className="diet-screen">
      <div className="diet-wrapper">
        <h1 className="diet-title">Diet calendar</h1>

        <div className="calendar-grid">
          {days.map(day => {
            const logged = day <= loggedUntil;
            return (
              <div
                key={day}
                className={`calendar-day ${logged ? "logged" : ""}`}
              >
                <span className="day-num">{day}</span>
                {logged && <span className="day-status">Logged</span>}
              </div>
            );
          })}
        </div>

        <div className="bottom-spacer" />
        <DietBottomNav />
      </div>
    </main>
  );
}
