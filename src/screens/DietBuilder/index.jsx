import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchFoods, createDietPlan, addMealToPlan, activateDietPlan } from "../../api/diet";
import { createVaultItem } from "../../api/vault";

export default function DietBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're editing an existing diet plan
  const editingPlan = location.state?.planData;
  const editingId = location.state?.planId;

  // Selection state
  const [selectedGoal, setSelectedGoal] = useState(editingPlan?.goal || null);
  const [selectedMealCount, setSelectedMealCount] = useState(
    editingPlan?.meals?.length || null
  );
  const [showGoalSelector, setShowGoalSelector] = useState(
    !editingPlan && !selectedGoal
  );
  const [showMealSelector, setShowMealSelector] = useState(false);

  // Plan state
  const [planName, setPlanName] = useState(editingPlan?.name || "");
  const [dailyCalories, setDailyCalories] = useState(
    editingPlan?.daily_calories || ""
  );
  const [dailyProtein, setDailyProtein] = useState(
    editingPlan?.daily_protein || ""
  );
  const [meals, setMeals] = useState(editingPlan?.meals || []);

  // Calorie split (rest day vs training day)
  const [showCalorieSplit, setShowCalorieSplit] = useState(true);
  const [restDayCalories, setRestDayCalories] = useState(editingPlan?.rest_day_calories || "");
  const [workoutDayCalories, setWorkoutDayCalories] = useState(editingPlan?.workout_day_calories || "");

  // UI state
  const [saving, setSaving] = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState(editingId || null);
  const [activeMeal, setActiveMeal] = useState(null); // Which meal is being edited

  // Initialize meals when meal count is selected
  useEffect(() => {
    if (selectedMealCount && meals.length === 0 && !editingPlan) {
      const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack 1", "Snack 2"];
      const initialMeals = Array.from({ length: selectedMealCount }, (_, i) => ({
        name: mealNames[i] || `Meal ${i + 1}`,
        foods: [],
        target_calories: Math.round((dailyCalories || 2000) / selectedMealCount),
      }));
      setMeals(initialMeals);
    }
  }, [selectedMealCount, meals.length, editingPlan, dailyCalories]);

  // Auto-calculate targets based on goal
  useEffect(() => {
    if (selectedGoal && !dailyCalories) {
      const defaults = {
        cut: { calories: 1800, protein: 150 },
        maintain: { calories: 2200, protein: 160 },
        bulk: { calories: 2800, protein: 180 },
      };
      const goalDefaults = defaults[selectedGoal.toLowerCase()];
      if (goalDefaults) {
        setDailyCalories(goalDefaults.calories);
        setDailyProtein(goalDefaults.protein);
      }
    }
  }, [selectedGoal, dailyCalories]);

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    setShowGoalSelector(false);
    setShowMealSelector(true);
  };

  const handleMealCountSelect = (count) => {
    setSelectedMealCount(count);
    setShowMealSelector(false);
  };

  const addFoodToMeal = (mealIndex, food) => {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === mealIndex
          ? {
              ...meal,
              foods: [
                ...meal.foods,
                {
                  food_id: food.id,
                  name: food.name,
                  serving_size: 100,
                  calories: food.calories_per_100g,
                  protein: food.protein_per_100g,
                  carbs: food.carbs_per_100g,
                  fats: food.fats_per_100g,
                },
              ],
            }
          : meal
      )
    );
    setActiveMeal(null);
  };

  const removeFoodFromMeal = (mealIndex, foodIndex) => {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === mealIndex
          ? { ...meal, foods: meal.foods.filter((_, fi) => fi !== foodIndex) }
          : meal
      )
    );
  };

  const updateFoodServing = (mealIndex, foodIndex, servingSize) => {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === mealIndex
          ? {
              ...meal,
              foods: meal.foods.map((food, fi) =>
                fi === foodIndex
                  ? { ...food, serving_size: servingSize }
                  : food
              ),
            }
          : meal
      )
    );
  };

  const calculateMealTotals = (meal) => {
    return meal.foods.reduce(
      (totals, food) => {
        const multiplier = food.serving_size / 100;
        return {
          calories: totals.calories + food.calories * multiplier,
          protein: totals.protein + food.protein * multiplier,
          carbs: totals.carbs + food.carbs * multiplier,
          fats: totals.fats + food.fats * multiplier,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const calculateDailyTotals = () => {
    return meals.reduce(
      (totals, meal) => {
        const mealTotals = calculateMealTotals(meal);
        return {
          calories: totals.calories + mealTotals.calories,
          protein: totals.protein + mealTotals.protein,
          carbs: totals.carbs + mealTotals.carbs,
          fats: totals.fats + mealTotals.fats,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      alert("❌ Please enter a diet plan name");
      return;
    }

    if (!dailyCalories || !dailyProtein) {
      alert("❌ Please set daily calorie and protein targets");
      return;
    }

    if (meals.length === 0) {
      alert("❌ Please add at least one meal");
      return;
    }

    setSaving(true);
    try {
      // ── 1. Map meal names → meal_time enum ─────────────────────────────────
      const mealTimeMap = {
        breakfast: "breakfast", lunch: "lunch", dinner: "dinner",
        "snack 1": "snack", "snack 2": "snack", snack: "snack",
      };
      const getMealTime = (name) =>
        mealTimeMap[name.toLowerCase()] || "snack";

      // ── 2. Derive carbs & fats from calories if not set manually ───────────
      const cal = parseInt(dailyCalories) || 2000;
      const prot = parseInt(dailyProtein) || 150;
      const protCals = prot * 4;
      const remaining = cal - protCals;
      const carbs = Math.round((remaining * 0.55) / 4);
      const fats = Math.round((remaining * 0.45) / 9);

      // ── 3. Create the plan ─────────────────────────────────────────────────
      const planPayload = {
        name: planName.trim(),
        goal_type: selectedGoal?.toLowerCase() || "maintain",
        target_calories: cal,
        target_protein: prot,
        target_carbs: carbs,
        target_fats: fats,
        meals_per_day: meals.length,
        is_active: true,
        rest_day_calories: restDayCalories ? parseInt(restDayCalories) : null,
        workout_day_calories: workoutDayCalories ? parseInt(workoutDayCalories) : null,
      };

      const plan = await createDietPlan(planPayload);
      const planId = plan.id;
      setSavedPlanId(planId);

      // ── 4. Save each meal template with foods ──────────────────────────────
      for (const meal of meals) {
        const mealTotals = calculateMealTotals(meal);
        const mealPayload = {
          meal_time: getMealTime(meal.name),
          meal_name: meal.name,
          target_calories: Math.round(mealTotals.calories) || Math.round(cal / meals.length),
          target_protein: Math.round(mealTotals.protein) || Math.round(prot / meals.length),
          target_carbs: Math.round(mealTotals.carbs) || 0,
          target_fats: Math.round(mealTotals.fats) || 0,
          foods: meal.foods.map((food) => {
            const mult = food.serving_size / 100;
            return {
              food_id: food.food_id || null,
              food_name: food.name,
              quantity_grams: food.serving_size,
              calories: Math.round(food.calories * mult),
              protein: Math.round(food.protein * mult * 10) / 10,
              carbs: Math.round(food.carbs * mult * 10) / 10,
              fats: Math.round(food.fats * mult * 10) / 10,
            };
          }),
        };
        await addMealToPlan(planId, mealPayload);
      }

      // ── 5. Mirror to Vault ─────────────────────────────────────────────────
      try {
        await createVaultItem({
          type: "diet",
          category: "plan",
          title: planName.trim(),
          summary: `${selectedGoal} · ${cal} kcal · ${prot}g protein · ${meals.length} meals/day`,
          content: { planId, name: planName.trim(), goal: selectedGoal, target_calories: cal, target_protein: prot, meals_per_day: meals.length },
          source: "user",
        });
      } catch (vaultErr) {
        console.warn("Vault mirror failed (non-fatal):", vaultErr);
      }

      return planId;
    } catch (error) {
      console.error("Failed to save diet plan:", error);
      alert(`Failed to save: ${error.message || "Unknown error"}`);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsActive = async () => {
    setSettingActive(true);
    try {
      let planId = savedPlanId || editingId;

      if (!planId) {
        planId = await handleSave();
        if (!planId) { setSettingActive(false); return; }
      }

      await activateDietPlan(planId);
      navigate("/", { state: { toast: "Diet plan set as active!" } });
    } catch (error) {
      console.error("Failed to set active plan:", error);
      alert(`Failed: ${error.message || "Could not set as active plan"}`);
    } finally {
      setSettingActive(false);
    }
  };

  // Show goal selector
  if (showGoalSelector) {
    return (
      <GoalSelector
        onSelect={handleGoalSelect}
        onBack={() => navigate(-1)}
      />
    );
  }

  // Show meal count selector
  if (showMealSelector) {
    return (
      <MealCountSelector
        onSelect={handleMealCountSelect}
        onBack={() => setShowGoalSelector(true)}
      />
    );
  }

  const dailyTotals = calculateDailyTotals();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        overflowY: "auto",
        paddingBottom: "140px",
      }}
    >
      <div style={{ padding: "24px 20px" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "transparent",
                border: "none",
                color: "#8b5cf6",
                fontSize: 28,
                cursor: "pointer",
                padding: 0,
                marginBottom: 8,
              }}
            >
              ←
            </button>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 0.3,
              }}
            >
              {editingId ? "Edit Diet Plan" : "Create Diet Plan"}
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {selectedGoal} · {selectedMealCount} meals per day
            </p>
          </div>
        </div>

        {/* PLAN NAME */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 8,
            }}
          >
            Plan Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Summer Shred, Lean Bulk, Maintenance..."
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 16,
              border: "1px solid rgba(139, 92, 246, 0.3)",
              background: "rgba(139, 92, 246, 0.05)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 500,
              outline: "none",
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {/* DAILY TARGETS */}
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              color: "#a78bfa",
            }}
          >
            Daily Targets
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: 6,
                }}
              >
                Calories
              </label>
              <input
                type="number"
                value={dailyCalories}
                onChange={(e) => setDailyCalories(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.4)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: 6,
                }}
              >
                Protein (g)
              </label>
              <input
                type="number"
                value={dailyProtein}
                onChange={(e) => setDailyProtein(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.4)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* CALORIE SPLIT (rest day vs training day) */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowCalorieSplit(!showCalorieSplit)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.25)", borderRadius: 14,
              padding: "13px 16px", cursor: "pointer", color: "#a78bfa",
              fontSize: 14, fontWeight: 600,
            }}
          >
            <span>Training vs Rest Day Calorie Split</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{showCalorieSplit ? "▲ Collapse" : "▼ Expand"}</span>
          </button>

          {showCalorieSplit && (
            <div style={{
              marginTop: 10, padding: "16px", borderRadius: 14,
              background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)",
            }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                Eat more on training days, less on rest days. Leave blank to use the same daily target for all days.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                    Training Day (kcal)
                  </label>
                  <input
                    type="number"
                    placeholder={dailyCalories || "e.g. 2500"}
                    value={workoutDayCalories}
                    onChange={(e) => setWorkoutDayCalories(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 12px", borderRadius: 10,
                      border: "1px solid rgba(99,102,241,0.3)", background: "rgba(0,0,0,0.35)",
                      color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                    Rest Day (kcal)
                  </label>
                  <input
                    type="number"
                    placeholder={dailyCalories ? Math.round(dailyCalories * 0.85) : "e.g. 2000"}
                    value={restDayCalories}
                    onChange={(e) => setRestDayCalories(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 12px", borderRadius: 10,
                      border: "1px solid rgba(99,102,241,0.3)", background: "rgba(0,0,0,0.35)",
                      color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DAILY TOTALS */}
        <DailyTotalsCard totals={dailyTotals} targets={{ calories: dailyCalories, protein: dailyProtein }} />

        {/* MEALS */}
        {meals.map((meal, i) => (
          <MealCard
            key={i}
            meal={meal}
            mealIndex={i}
            totals={calculateMealTotals(meal)}
            onAddFood={() => setActiveMeal(i)}
            onRemoveFood={(foodIndex) => removeFoodFromMeal(i, foodIndex)}
            onUpdateServing={(foodIndex, serving) =>
              updateFoodServing(i, foodIndex, serving)
            }
          />
        ))}

        {/* LOCKED INFO */}
        {!editingPlan && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 16,
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>
                {selectedMealCount}-Meal {selectedGoal} Plan
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                Complete all meals to create your diet plan
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 50,
        }}
      >
        <ActionButton
          onClick={handleSetAsActive}
          loading={settingActive}
          color="#10b981"
          icon=""
          text="Set as Active Plan"
          loadingText="Setting Active..."
        />
        <ActionButton
          onClick={handleSave}
          loading={saving}
          color="#8b5cf6"
          icon=""
          text={savedPlanId ? "Saved" : editingId ? "Update Plan" : "Save Plan"}
          loadingText={editingId ? "Updating..." : "Saving..."}
        />
      </div>

      {/* FOOD SEARCH MODAL */}
      {activeMeal !== null && (
        <FoodSearchModal
          onSelectFood={(food) => addFoodToMeal(activeMeal, food)}
          onClose={() => setActiveMeal(null)}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// GOAL SELECTOR
// ============================================================================

function GoalSelector({ onSelect, onBack }) {
  const [hoveredGoal, setHoveredGoal] = useState(null);

  const goals = [
    {
      name: "Cut",
      description: "Lose fat, maintain muscle",
      color: "#ef4444",
      icon: "🔥",
    },
    {
      name: "Maintain",
      description: "Stay at current weight",
      color: "#3b82f6",
      icon: "⚖️",
    },
    {
      name: "Bulk",
      description: "Build muscle, gain weight",
      color: "#10b981",
      icon: "💪",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#8b5cf6",
          fontSize: 28,
          cursor: "pointer",
          padding: 0,
          marginBottom: 24,
          alignSelf: "flex-start",
        }}
      >
        ←
      </button>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 28,
              fontWeight: 700,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            What's your goal?
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
            }}
          >
            Choose your nutrition goal to get<br />personalized calorie targets
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {goals.map((goal) => (
            <button
              key={goal.name}
              onClick={() => onSelect(goal.name)}
              onMouseEnter={() => setHoveredGoal(goal.name)}
              onMouseLeave={() => setHoveredGoal(null)}
              style={{
                position: "relative",
                padding: "24px 28px",
                borderRadius: 20,
                border: `2px solid ${
                  hoveredGoal === goal.name ? goal.color : "rgba(255,255,255,0.1)"
                }`,
                background:
                  hoveredGoal === goal.name
                    ? `linear-gradient(135deg, ${goal.color}15, ${goal.color}08)`
                    : "rgba(17, 24, 39, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                transform:
                  hoveredGoal === goal.name
                    ? "translateY(-4px) scale(1.02)"
                    : "translateY(0) scale(1)",
                boxShadow:
                  hoveredGoal === goal.name ? `0 12px 32px ${goal.color}40` : "none",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 40 }}>{goal.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: 22,
                      fontWeight: 700,
                      color: hoveredGoal === goal.name ? goal.color : "#fff",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {goal.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {goal.description}
                  </p>
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: goal.color,
                    transform:
                      hoveredGoal === goal.name ? "translateX(4px)" : "translateX(0)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEAL COUNT SELECTOR
// ============================================================================

function MealCountSelector({ onSelect, onBack }) {
  const [hoveredCount, setHoveredCount] = useState(null);

  const options = [
    { count: 2, label: "2 Meals", description: "Intermittent fasting", color: "#f59e0b" },
    { count: 3, label: "3 Meals", description: "Classic approach", color: "#10b981" },
    { count: 4, label: "4 Meals", description: "Balanced eating", color: "#3b82f6" },
    { count: 5, label: "5 Meals", description: "Frequent feeding", color: "#8b5cf6" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#8b5cf6",
          fontSize: 28,
          cursor: "pointer",
          padding: 0,
          marginBottom: 24,
          alignSelf: "flex-start",
        }}
      >
        ←
      </button>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 28,
              fontWeight: 700,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            How many meals per day?
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
            }}
          >
            Choose your meal frequency to build<br />your personalized nutrition plan
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {options.map((option) => (
            <button
              key={option.count}
              onClick={() => onSelect(option.count)}
              onMouseEnter={() => setHoveredCount(option.count)}
              onMouseLeave={() => setHoveredCount(null)}
              style={{
                position: "relative",
                padding: "24px 28px",
                borderRadius: 20,
                border: `2px solid ${
                  hoveredCount === option.count
                    ? option.color
                    : "rgba(255,255,255,0.1)"
                }`,
                background:
                  hoveredCount === option.count
                    ? `linear-gradient(135deg, ${option.color}15, ${option.color}08)`
                    : "rgba(17, 24, 39, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                transform:
                  hoveredCount === option.count
                    ? "translateY(-4px) scale(1.02)"
                    : "translateY(0) scale(1)",
                boxShadow:
                  hoveredCount === option.count
                    ? `0 12px 32px ${option.color}40`
                    : "none",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: 22,
                      fontWeight: 700,
                      color:
                        hoveredCount === option.count ? option.color : "#fff",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {option.label}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {option.description}
                  </p>
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: option.color,
                    transform:
                      hoveredCount === option.count
                        ? "translateX(4px)"
                        : "translateX(0)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  →
                </div>
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            padding: "20px",
            borderRadius: 16,
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            💡 <strong style={{ color: "#a78bfa" }}>Tip:</strong> Most people thrive
            on 3-4 meals. Choose what fits your schedule!
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEAL CARD
// ============================================================================

function MealCard({ meal, mealIndex, totals, onAddFood, onRemoveFood, onUpdateServing }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 22,
        padding: "24px",
        marginBottom: 24,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.4))",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          padding: "1px",
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#a78bfa",
              }}
            >
              {meal.name}
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {Math.round(totals.calories)} cal · {Math.round(totals.protein)}g protein
            </p>
          </div>
        </div>

        {meal.foods.map((food, fi) => (
          <FoodItem
            key={fi}
            food={food}
            onRemove={() => onRemoveFood(fi)}
            onUpdateServing={(serving) => onUpdateServing(fi, serving)}
          />
        ))}

        <button
          onClick={onAddFood}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))",
            color: "#a78bfa",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 12,
          }}
        >
          + Add Food
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FOOD ITEM
// ============================================================================

function FoodItem({ food, onRemove, onUpdateServing }) {
  const multiplier = food.serving_size / 100;

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 14,
        background: "rgba(0, 0, 0, 0.4)",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>
            {food.name}
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {Math.round(food.calories * multiplier)} cal · {Math.round(food.protein * multiplier)}g P · {Math.round(food.carbs * multiplier)}g C · {Math.round(food.fats * multiplier)}g F
          </p>
        </div>
        <button
          onClick={onRemove}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
            whiteSpace: "nowrap",
          }}
        >
          Serving:
        </label>
        <input
          type="number"
          value={food.serving_size}
          onChange={(e) => onUpdateServing(parseFloat(e.target.value) || 0)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: 14,
            outline: "none",
          }}
        />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>g</span>
      </div>
    </div>
  );
}

// ============================================================================
// DAILY TOTALS CARD
// ============================================================================

function DailyTotalsCard({ totals, targets }) {
  const caloriePercent = targets.calories
    ? (totals.calories / targets.calories) * 100
    : 0;
  const proteinPercent = targets.protein
    ? (totals.protein / targets.protein) * 100
    : 0;

  return (
    <div
      style={{
        padding: "20px",
        borderRadius: 18,
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.05))",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        marginBottom: 24,
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: 16,
          fontWeight: 600,
          color: "#a78bfa",
        }}
      >
        Daily Progress
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Calories
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {Math.round(totals.calories)}/{targets.calories || 0}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(caloriePercent, 100)}%`,
                background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Protein
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {Math.round(totals.protein)}/{targets.protein || 0}g
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(proteinPercent, 100)}%`,
                background: "linear-gradient(90deg, #10b981, #059669)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {Math.round(totals.carbs)}g
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Carbs</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {Math.round(totals.fats)}g
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Fats</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FOOD SEARCH MODAL
// ============================================================================

function FoodSearchModal({ onSelectFood, onClose }) {
  // ✅ All search state lives inside the modal — no props, no infinite loop
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchFoods(searchQuery);
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    // Cleanup cancels the timer if query changes before 400ms — no stale request fires
    return () => clearTimeout(timer);
  }, [searchQuery]); // ✅ Only depends on the local string, never on a function reference

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
        }}
      />

      <div
        style={{
          position: "relative",
          marginTop: "auto",
          background: "linear-gradient(to top, rgb(17, 24, 39), rgb(31, 41, 55))",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          borderTop: "2px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <div
          style={{
            padding: "16px 0 12px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              background: "rgba(255, 255, 255, 0.3)",
              borderRadius: 2,
            }}
          />
        </div>

        <h3
          style={{
            margin: "0 0 16px",
            padding: "0 24px",
            fontSize: 18,
            fontWeight: 600,
            textAlign: "center",
            color: "#fff",
          }}
        >
          Search Foods
        </h3>

        <div style={{ padding: "0 20px 16px" }}>
          <input
            type="text"
            placeholder="Search for chicken, rice, broccoli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 16,
              border: "1px solid rgba(139, 92, 246, 0.3)",
              background: "rgba(0, 0, 0, 0.5)",
              color: "#fff",
              fontSize: 16,
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 40px",
          }}
        >
          {searching ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => onSelectFood(food)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "none",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      marginBottom: 4,
                    }}
                  >
                    {food.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {food.calories_per_100g} cal · {food.protein_per_100g}g P · {food.carbs_per_100g}g C · {food.fats_per_100g}g F
                    <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.4)" }}>
                      (per 100g)
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              No foods found for "{searchQuery}"
            </div>
          ) : (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Start typing to search foods...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionButton({ onClick, loading, color, icon, text, loadingText }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "16px 32px",
        borderRadius: 999,
        border: "none",
        background: loading
          ? `${color}80`
          : `linear-gradient(135deg, ${color}, ${color}dd)`,
        color: "#fff",
        fontSize: 15,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: `0 8px 32px ${color}66`,
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = `0 12px 40px ${color}99`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = `0 8px 32px ${color}66`;
      }}
    >
      {loading ? (
        <>
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid #fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          {loadingText}
        </>
      ) : (
        <>
          {icon} {text}
        </>
      )}
    </button>
  );
}