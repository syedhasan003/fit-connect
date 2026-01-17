export default function MealCard({ title, items, calories }) {
  return (
    <div className="meal-card">
      <div className="row">
        <h3>{title}</h3>
        <span>{calories}</span>
      </div>

      <p className="muted">{items}</p>
    </div>
  );
}
