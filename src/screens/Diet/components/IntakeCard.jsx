import { dietStore } from "../dietStore";

export default function IntakeCard() {
  const { calories, protein, carbs, fat } = dietStore.plan;

  const consumed = 1420; // wire later
  const percent = Math.min(100, Math.round((consumed / calories) * 100));

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="intake-card premium">
      <div className="ring-wrap">
        <svg width="120" height="120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="white"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        <div className="ring-center premium-center">
          <span className="ring-percent">{percent}%</span>
          <span className="ring-sub">of goal</span>
        </div>
      </div>

      <div className="intake-meta">
        <h2>Today's intake</h2>
        <p>{consumed} / {calories} kcal</p>
        <p className="macros">
          P {protein}g · C {carbs}g · F {fat}g
        </p>
      </div>
    </div>
  );
}
