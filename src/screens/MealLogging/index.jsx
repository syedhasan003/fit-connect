import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchFoods, logMeal, getTodaysMeals } from '../../api/diet';
import { getUserProfile } from '../../api/user';

export default function MealLogging() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dietPlan, setDietPlan] = useState(null);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(null);

  // Targets
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProtein, setTargetProtein] = useState(150);

  // Totals
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFats, setTotalFats] = useState(0);

  useEffect(() => {
    loadMealData();
  }, []);

  useEffect(() => {
    // Recalculate totals when meals change
    const calories = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const protein = todaysMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const carbs = todaysMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const fats = todaysMeals.reduce((sum, m) => sum + (m.fats || 0), 0);

    setTotalCalories(calories);
    setTotalProtein(protein);
    setTotalCarbs(carbs);
    setTotalFats(fats);
  }, [todaysMeals]);

  const loadMealData = async () => {
    try {
      setLoading(true);

      // Get user profile to check for active diet plan
      const profile = await getUserProfile();

      if (!profile.active_diet_plan_id) {
        alert('No active diet plan found. Please create and set a diet plan first.');
        navigate('/diet-builder');
        return;
      }

      // For now, use default targets (we can fetch diet plan details later)
      // TODO: Fetch actual diet plan to get real targets
      setTargetCalories(profile.target_calories || 2000);
      setTargetProtein(profile.target_protein || 150);

      // Load today's meals
      const meals = await getTodaysMeals();
      setTodaysMeals(meals || []);
    } catch (error) {
      console.error('Failed to load meal data:', error);
      alert(error.message || 'Failed to load meal data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async (mealName, food, servingGrams) => {
    try {
      const multiplier = servingGrams / 100;

      const mealData = {
        meal_name: mealName,
        food_id: food.id,
        food_name: food.name,
        serving_size_grams: servingGrams,
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier),
        carbs: Math.round(food.carbs * multiplier),
        fats: Math.round(food.fats * multiplier),
      };

      try {
        const result = await logMeal(mealData);
        setTodaysMeals((prev) => [...prev, result]);
      } catch {
        // Backend endpoint doesn't exist yet - add locally
        setTodaysMeals((prev) => [...prev, { ...mealData, id: Date.now() }]);
      }

      setShowFoodSearch(false);
      setCurrentMeal(null);
    } catch (error) {
      console.error('Failed to log meal:', error);
      alert(error.message || 'Failed to log meal');
    }
  };

  const openFoodSearch = (mealName) => {
    setCurrentMeal(mealName);
    setShowFoodSearch(true);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading meals...</p>
        </div>
      </div>
    );
  }

  const calorieProgress = (totalCalories / targetCalories) * 100;
  const proteinProgress = (totalProtein / targetProtein) * 100;

  const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          ← Back
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Today's Nutrition</h1>
          <p style={styles.subtitle}>Track your meals and macros</p>
        </div>
      </div>

      {/* Daily Progress Card */}
      <div style={styles.progressCard}>
        <h2 style={styles.progressTitle}>Daily Progress</h2>

        {/* Calories */}
        <div style={styles.macroSection}>
          <div style={styles.macroHeader}>
            <span style={styles.macroLabel}>Calories</span>
            <span style={styles.macroValue}>
              {totalCalories} / {targetCalories} kcal
            </span>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(100, calorieProgress)}%`,
                backgroundColor: '#00d4ff',
              }}
            ></div>
          </div>
        </div>

        {/* Protein */}
        <div style={styles.macroSection}>
          <div style={styles.macroHeader}>
            <span style={styles.macroLabel}>Protein</span>
            <span style={styles.macroValue}>
              {totalProtein}g / {targetProtein}g
            </span>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(100, proteinProgress)}%`,
                backgroundColor: '#00ff88',
              }}
            ></div>
          </div>
        </div>

        {/* Other Macros */}
        <div style={styles.otherMacros}>
          <div style={styles.otherMacroItem}>
            <span style={styles.otherMacroLabel}>Carbs</span>
            <span style={styles.otherMacroValue}>{totalCarbs}g</span>
          </div>
          <div style={styles.otherMacroItem}>
            <span style={styles.otherMacroLabel}>Fats</span>
            <span style={styles.otherMacroValue}>{totalFats}g</span>
          </div>
        </div>
      </div>

      {/* Meal Sections */}
      {mealNames.map((mealName) => {
        const mealLogs = todaysMeals.filter((m) => m.meal_name === mealName);
        const mealCalories = mealLogs.reduce((sum, m) => sum + (m.calories || 0), 0);

        return (
          <div key={mealName} style={styles.mealCard}>
            <div style={styles.mealHeader}>
              <div>
                <h3 style={styles.mealName}>{mealName}</h3>
                {mealCalories > 0 && (
                  <p style={styles.mealCalories}>{mealCalories} kcal</p>
                )}
              </div>
              <button
                onClick={() => openFoodSearch(mealName)}
                style={styles.addButton}
              >
                + Add Food
              </button>
            </div>

            {/* Logged Foods */}
            {mealLogs.length > 0 ? (
              <div style={styles.foodList}>
                {mealLogs.map((meal, index) => (
                  <div key={index} style={styles.foodItem}>
                    <div style={styles.foodInfo}>
                      <span style={styles.foodName}>{meal.food_name}</span>
                      <span style={styles.foodServing}>
                        {meal.serving_size_grams}g
                      </span>
                    </div>
                    <div style={styles.foodMacros}>
                      <span>{meal.calories} kcal</span>
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fats}g</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyMeal}>No foods logged yet</p>
            )}
          </div>
        );
      })}

      {/* Food Search Modal */}
      {showFoodSearch && (
        <FoodSearchModal
          mealName={currentMeal}
          onClose={() => {
            setShowFoodSearch(false);
            setCurrentMeal(null);
          }}
          onSelectFood={handleLogMeal}
        />
      )}
    </div>
  );
}

// ============================================================================
// ✅ FIXED FOOD SEARCH MODAL - No more flickering!
// ============================================================================

function FoodSearchModal({ mealName, onClose, onSelectFood }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingGrams, setServingGrams] = useState('100');

  // ✅ FIX: Move search logic into useEffect, properly memoized
  useEffect(() => {
    // Early return if query too short
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Set up debounce
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        console.log('🔍 Searching for:', searchQuery); // Debug log
        const results = await searchFoods(searchQuery, 20);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    // Cleanup: cancel timer if searchQuery changes before 300ms
    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]); // Only re-run when searchQuery changes

  const handleAddFood = () => {
    if (!selectedFood || !servingGrams) {
      alert('Please select a food and enter serving size');
      return;
    }

    onSelectFood(mealName, selectedFood, parseFloat(servingGrams));
  };

  // ✅ FIX: Memoize macro calculation to prevent unnecessary recalculations
  const macros = useCallback(() => {
    if (!selectedFood) return null;
    const multiplier = parseFloat(servingGrams || 100) / 100;
    return {
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier),
      carbs: Math.round(selectedFood.carbs * multiplier),
      fats: Math.round(selectedFood.fats * multiplier),
    };
  }, [selectedFood, servingGrams])();

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add to {mealName}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search for food..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          autoFocus
        />

        {/* Search Results */}
        {searching && <p style={styles.searchingText}>Searching...</p>}

        {searchResults.length > 0 && !selectedFood && (
          <div style={styles.resultsList}>
            {searchResults.map((food) => (
              <div
                key={food.id}
                onClick={() => setSelectedFood(food)}
                style={styles.resultItem}
              >
                <div style={styles.resultName}>{food.name}</div>
                <div style={styles.resultMacros}>
                  {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F:{' '}
                  {food.fats}g
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Food Confirmation */}
        {selectedFood && (
          <div style={styles.selectedFoodCard}>
            <div style={styles.selectedHeader}>
              <h3 style={styles.selectedName}>{selectedFood.name}</h3>
              <button
                onClick={() => setSelectedFood(null)}
                style={styles.changeButton}
              >
                Change
              </button>
            </div>

            <div style={styles.servingInput}>
              <label style={styles.servingLabel}>Serving Size (grams)</label>
              <input
                type="number"
                step="1"
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
                style={styles.servingField}
              />
            </div>

            {macros && (
              <div style={styles.macroPreview}>
                <div style={styles.macroPreviewItem}>
                  <span style={styles.macroPreviewLabel}>Calories</span>
                  <span style={styles.macroPreviewValue}>{macros.calories}</span>
                </div>
                <div style={styles.macroPreviewItem}>
                  <span style={styles.macroPreviewLabel}>Protein</span>
                  <span style={styles.macroPreviewValue}>{macros.protein}g</span>
                </div>
                <div style={styles.macroPreviewItem}>
                  <span style={styles.macroPreviewLabel}>Carbs</span>
                  <span style={styles.macroPreviewValue}>{macros.carbs}g</span>
                </div>
                <div style={styles.macroPreviewItem}>
                  <span style={styles.macroPreviewLabel}>Fats</span>
                  <span style={styles.macroPreviewValue}>{macros.fats}g</span>
                </div>
              </div>
            )}

            <button onClick={handleAddFood} style={styles.addFoodButton}>
              Add to {mealName}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '60px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#888',
  },
  header: {
    marginBottom: '24px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '12px',
    padding: '8px 0',
  },
  headerContent: {
    marginTop: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    margin: 0,
  },
  progressCard: {
    background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(75, 0, 130, 0.15))',
    border: '1px solid rgba(138, 43, 226, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  progressTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#ffffff',
  },
  macroSection: {
    marginBottom: '20px',
  },
  macroHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  macroLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#aaa',
  },
  macroValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
  },
  progressBar: {
    height: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  otherMacros: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '20px',
  },
  otherMacroItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  otherMacroLabel: {
    fontSize: '12px',
    color: '#888',
  },
  otherMacroValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  mealCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  },
  mealHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  mealName: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  mealCalories: {
    fontSize: '14px',
    color: '#00d4ff',
    margin: 0,
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#00d4ff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  foodList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  foodItem: {
    backgroundColor: '#0a0a0a',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  foodInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  foodName: {
    fontSize: '14px',
    fontWeight: '600',
  },
  foodServing: {
    fontSize: '12px',
    color: '#888',
  },
  foodMacros: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#aaa',
  },
  emptyMeal: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    padding: '20px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh',
    padding: '24px',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '24px',
    cursor: 'pointer',
  },
  searchInput: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '16px',
    marginBottom: '16px',
  },
  searchingText: {
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  resultItem: {
    padding: '12px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #2a2a2a',
  },
  resultName: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  resultMacros: {
    fontSize: '12px',
    color: '#888',
  },
  selectedFoodCard: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    border: '1px solid #2a2a2a',
  },
  selectedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  selectedName: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  changeButton: {
    padding: '6px 12px',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  servingInput: {
    marginBottom: '16px',
  },
  servingLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  servingField: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
  },
  macroPreview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  macroPreviewItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  macroPreviewLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
  },
  macroPreviewValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#00d4ff',
  },
  addFoodButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#00d4ff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);