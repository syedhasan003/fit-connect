import { useDietStore } from "../../state/dietStore";

export default function DietOnboarding() {
  const setPlan = useDietStore((s) => s.setPlan);

  const createPlan = () => {
    setPlan({
      id: "plan-1",
      name: "Central Generated Plan",
      targets: {
        calories: 2400,
        protein: 150,
        carbs: 250,
        fats: 70,
      },
      createdBy: "central",
    });
  };

  return (
    <div className="diet-onboarding">
      <h1>Create your diet plan</h1>
      <p>This will generate a plan tailored for you.</p>
      <button className="pill wide" onClick={createPlan}>
        Create plan
      </button>
    </div>
  );
}
