export default function DietCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <main className="workout-builder">
      <h1>Diet Calendar</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "12px"
      }}>
        {days.map(day => (
          <div key={day} className="day-card" style={{ textAlign: "center" }}>
            Day {day}
          </div>
        ))}
      </div>
    </main>
  );
}
