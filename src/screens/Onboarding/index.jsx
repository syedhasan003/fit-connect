import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitOnboardingGoals } from "../../api/onboarding";
import { useAuth } from "../../auth/AuthContext";

// ─── Step definitions ──────────────────────────────────────────────────────
const TOTAL_STEPS = 5;

// ─── Option card component ─────────────────────────────────────────────────
function OptionCard({ label, emoji, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px 20px",
        borderRadius: 16,
        border: selected
          ? "1.5px solid rgba(139, 92, 246, 0.8)"
          : "1.5px solid rgba(255,255,255,0.08)",
        background: selected
          ? "rgba(139, 92, 246, 0.15)"
          : "rgba(255,255,255,0.04)",
        color: "#fff",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: selected ? "0 0 16px rgba(139,92,246,0.2)" : "none",
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: selected ? 600 : 400 }}>{label}</span>
      {selected && (
        <span style={{ marginLeft: "auto", color: "#a78bfa", fontSize: 18 }}>✓</span>
      )}
    </button>
  );
}

// ─── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ width: "100%", marginBottom: 32 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
        fontSize: 12,
        color: "rgba(255,255,255,0.4)",
      }}>
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div style={{
        height: 4,
        borderRadius: 4,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${(step / total) * 100}%`,
          background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
          borderRadius: 4,
          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
    </div>
  );
}

// ─── Main Onboarding component ─────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [workoutDays, setWorkoutDays] = useState(3);
  const [workoutLocation, setWorkoutLocation] = useState("gym");
  const [dietPreference, setDietPreference] = useState("");
  const [injuriesOrConditions, setInjuriesOrConditions] = useState("");

  // ── Navigation ────────────────────────────────────────────────────────────
  const canProceed = () => {
    switch (step) {
      case 1: return fullName.trim().length >= 2;
      case 2: return fitnessGoal !== "";
      case 3: return experienceLevel !== "";
      case 4: return workoutLocation !== "";
      case 5: return dietPreference !== "";
      default: return false;
    }
  };

  const goNext = () => {
    if (!canProceed() || animating) return;
    if (step < TOTAL_STEPS) {
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimating(false);
      }, 180);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 1 && !animating) {
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s - 1);
        setAnimating(false);
      }, 180);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await submitOnboardingGoals({
        full_name: fullName.trim(),
        fitness_goal: fitnessGoal,
        experience_level: experienceLevel,
        workout_days_per_week: workoutDays,
        workout_location: workoutLocation,
        diet_preference: dietPreference,
        injuries_or_conditions: injuriesOrConditions.trim() || "none",
      });
      navigate("/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: Name ────────────────────────────────────────────────────
      case 1:
        return (
          <>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 40 }}>👋</span>
            </div>
            <h2 style={headingStyle}>What's your name?</h2>
            <p style={subStyle}>
              Your trainer needs to know who they're working with.
            </p>
            <input
              autoFocus
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
              style={inputStyle}
            />
          </>
        );

      // ── Step 2: Fitness Goal ────────────────────────────────────────────
      case 2:
        return (
          <>
            <h2 style={headingStyle}>What's your main goal?</h2>
            <p style={subStyle}>We'll build everything around this.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { value: "lose_weight",       label: "Lose weight",          emoji: "🔥" },
                { value: "build_muscle",       label: "Build muscle",         emoji: "💪" },
                { value: "improve_endurance",  label: "Improve endurance",    emoji: "🏃" },
                { value: "improve_flexibility",label: "Flexibility & mobility",emoji: "🧘" },
                { value: "general_fitness",    label: "Stay fit & healthy",   emoji: "🌿" },
              ].map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  emoji={opt.emoji}
                  selected={fitnessGoal === opt.value}
                  onClick={() => setFitnessGoal(opt.value)}
                />
              ))}
            </div>
          </>
        );

      // ── Step 3: Experience Level ────────────────────────────────────────
      case 3:
        return (
          <>
            <h2 style={headingStyle}>Your experience level?</h2>
            <p style={subStyle}>Be honest — we calibrate everything to where you are.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { value: "beginner",     label: "Beginner",      emoji: "🌱", desc: "New to working out or just starting again" },
                { value: "intermediate", label: "Intermediate",   emoji: "⚡", desc: "Consistent for 6+ months, know the basics" },
                { value: "advanced",     label: "Advanced",       emoji: "🏆", desc: "2+ years, training seriously and consistently" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperienceLevel(opt.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 16,
                    border: experienceLevel === opt.value
                      ? "1.5px solid rgba(139, 92, 246, 0.8)"
                      : "1.5px solid rgba(255,255,255,0.08)",
                    background: experienceLevel === opt.value
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(255,255,255,0.04)",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: experienceLevel === opt.value
                      ? "0 0 16px rgba(139,92,246,0.2)"
                      : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: experienceLevel === opt.value ? 600 : 400 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                        {opt.desc}
                      </div>
                    </div>
                    {experienceLevel === opt.value && (
                      <span style={{ marginLeft: "auto", color: "#a78bfa", fontSize: 18 }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        );

      // ── Step 4: Workout Preferences ─────────────────────────────────────
      case 4:
        return (
          <>
            <h2 style={headingStyle}>Workout preferences</h2>
            <p style={subStyle}>How often and where do you want to train?</p>

            {/* Days per week */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
              }}>
                <span>Days per week</span>
                <span style={{
                  color: "#a78bfa",
                  fontWeight: 700,
                  fontSize: 18,
                }}>
                  {workoutDays}x
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                value={workoutDays}
                onChange={(e) => setWorkoutDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8b5cf6" }}
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                marginTop: 6,
              }}>
                <span>1 day</span>
                <span>7 days</span>
              </div>
            </div>

            {/* Workout location */}
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
                Where will you train?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { value: "gym",  label: "At a gym",       emoji: "🏋️" },
                  { value: "home", label: "At home",         emoji: "🏠" },
                  { value: "any",  label: "Both / flexible", emoji: "🔀" },
                ].map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    emoji={opt.emoji}
                    selected={workoutLocation === opt.value}
                    onClick={() => setWorkoutLocation(opt.value)}
                  />
                ))}
              </div>
            </div>
          </>
        );

      // ── Step 5: Diet & Health ────────────────────────────────────────────
      case 5:
        return (
          <>
            <h2 style={headingStyle}>Diet & health</h2>
            <p style={subStyle}>Almost there — this helps us personalise your nutrition guidance.</p>

            {/* Diet preference */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
                Diet preference
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { value: "no_preference",  label: "No preference",   emoji: "🍽️" },
                  { value: "vegetarian",      label: "Vegetarian",      emoji: "🥗" },
                  { value: "vegan",           label: "Vegan",           emoji: "🌱" },
                  { value: "keto",            label: "Keto / low-carb", emoji: "🥑" },
                  { value: "high_protein",    label: "High protein",    emoji: "🥩" },
                ].map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    emoji={opt.emoji}
                    selected={dietPreference === opt.value}
                    onClick={() => setDietPreference(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Injuries / conditions */}
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                Any injuries or health conditions?{" "}
                <span style={{ color: "rgba(255,255,255,0.35)" }}>(optional)</span>
              </p>
              <textarea
                placeholder="e.g. lower back pain, knee injury, diabetes… or leave blank"
                value={injuriesOrConditions}
                onChange={(e) => setInjuriesOrConditions(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "none",
                  lineHeight: 1.5,
                }}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "48px 24px 32px",
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {/* Progress */}
      <ProgressBar step={step} total={TOTAL_STEPS} />

      {/* Step content — fades on transition */}
      <div style={{
        flex: 1,
        opacity: animating ? 0 : 1,
        transform: animating ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}>
        {renderStep()}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          marginBottom: 16,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: "#fca5a5" }}>❌ {error}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{
        display: "flex",
        gap: 12,
        marginTop: 32,
        paddingBottom: 8,
      }}>
        {step > 1 && (
          <button
            onClick={goBack}
            style={{
              flex: "0 0 auto",
              padding: "14px 20px",
              borderRadius: 14,
              border: "1.5px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            ←
          </button>
        )}

        <button
          onClick={goNext}
          disabled={!canProceed() || loading}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: canProceed() && !loading
              ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
              : "rgba(139, 92, 246, 0.25)",
            color: canProceed() && !loading ? "#fff" : "rgba(255,255,255,0.35)",
            fontSize: 15,
            fontWeight: 600,
            cursor: canProceed() && !loading ? "pointer" : "not-allowed",
            transition: "all 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Setting up your profile…
            </>
          ) : step === TOTAL_STEPS ? (
            "Let's go 🚀"
          ) : (
            "Continue →"
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input[type=range]::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
        }
        input[type=range]::-webkit-slider-thumb {
          margin-top: -6px;
        }
      `}</style>
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────
const headingStyle = {
  margin: "12px 0 8px",
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1.2,
  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const subStyle = {
  margin: "0 0 24px",
  fontSize: 14,
  color: "rgba(255,255,255,0.5)",
  lineHeight: 1.5,
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1.5px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};
