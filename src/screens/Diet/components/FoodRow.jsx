export default function FoodRow({ food }) {
  return (
    <div className="food-row">
      <span>{food.name}</span>
      <span>{food.calories} kcal</span>
    </div>
  );
}
