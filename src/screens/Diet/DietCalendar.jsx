import DietBottomNav from "./components/DietBottomNav";
import "./diet.css";

export default function DietCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const today = 17;

  return (
    <main className="diet-screen">
      <h1 className="diet-title">Diet calendar</h1>

      <section className="calendar-grid">
        {days.map((day) => {
          const logged = day < today;
          const isToday = day === today;

          return (
            <div
              key={day}
              className={`calendar-day ${logged ? "logged" : ""} ${
                isToday ? "today" : ""
              }`}
            >
              <span className="day-number">{day}</span>
              {logged && <span className="day-status">Logged</span>}
              {isToday && <span className="day-status today-dot" />}
            </div>
          );
        })}
      </section>

      <div className="bottom-spacer" />
      <DietBottomNav />
    </main>
  );
}
