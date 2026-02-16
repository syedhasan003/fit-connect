"""
SQLAlchemy Models for FitNova Agentic Fitness System

New tables for workout tracking, diet planning, and behavioral learning.
These models correspond to migrations 001-006.
"""

from sqlalchemy import (
    text,
    Column, Integer, String, Float, Boolean, Text, DateTime, Date, Time,
    ForeignKey, JSON, Enum as SQLEnum, UniqueConstraint, func
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.database import Base

# ============================================================================
# ENUMS
# ============================================================================

class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class FormQuality(str, enum.Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    OKAY = "okay"
    POOR = "poor"
    NEEDS_CORRECTION = "needs_correction"


class BehavioralPatternType(str, enum.Enum):
    TIMING = "timing"
    FORM = "form"
    ADHERENCE = "adherence"
    MOTIVATION = "motivation"
    ENERGY = "energy"
    RECOVERY = "recovery"


class GoalType(str, enum.Enum):
    MAINTAIN = "maintain"
    CUT = "cut"
    BULK = "bulk"


class MealTime(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class EnergyLevel(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    VERY_HIGH = "very_high"


class HungerLevel(str, enum.Enum):
    NOT_HUNGRY = "not_hungry"
    SLIGHTLY = "slightly"
    HUNGRY = "hungry"
    VERY_HUNGRY = "very_hungry"
    STARVING = "starving"


class Mood(str, enum.Enum):
    POOR = "poor"
    OKAY = "okay"
    GOOD = "good"
    GREAT = "great"
    EXCELLENT = "excellent"


class EatingPatternType(str, enum.Enum):
    TIMING = "timing"
    QUANTITY = "quantity"
    PREFERENCE = "preference"
    ADHERENCE = "adherence"
    ENERGY = "energy"


class FoodSource(str, enum.Enum):
    SEEDED = "seeded"
    API = "api"
    USER_CUSTOM = "user_custom"


# ============================================================================
# WORKOUT TRACKING MODELS
# ============================================================================

class WorkoutSession(Base):
    """
    Tracks a single workout session in real-time.
    Created when user starts a workout, updated throughout, finalized on completion.
    """
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    manual_workout_id = Column(Integer, nullable=True)  # ForeignKey removed temporarily

    # Session metadata
    status = Column(SQLEnum(SessionStatus), nullable=False, default=SessionStatus.IN_PROGRESS)
    started_at = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    completed_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    # Planned vs Actual
    planned_exercises_count = Column(Integer, nullable=False)
    completed_exercises_count = Column(Integer, nullable=False, default=0)
    skipped_exercises_count = Column(Integer, nullable=False, default=0)

    # Session context
    energy_level_start = Column(SQLEnum(EnergyLevel), nullable=True)
    energy_level_end = Column(SQLEnum(EnergyLevel), nullable=True)
    soreness_level_start = Column(Integer, nullable=True)  # 1-10
    soreness_level_end = Column(Integer, nullable=True)  # 1-10

    # Notes
    notes = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    # manual_workout = relationship("ManualWorkout", back_populates="workout_sessions")  # Temporarily disabled
    exercise_logs = relationship("ExerciseLog", back_populates="workout_session", cascade="all, delete-orphan")


class ExerciseLog(Base):
    """
    Logs every exercise within a workout session.
    Tracks deviations, form, rest times, and real-time progress.
    """
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True, index=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False, index=True)
    exercise_id = Column(Integer, nullable=True)  # ForeignKey removed temporarily

    # Order in workout
    sequence_order = Column(Integer, nullable=False)

    # Planned (from workout template)
    planned_sets = Column(Integer, nullable=False)
    planned_reps_per_set = Column(Integer, nullable=True)
    planned_weight = Column(Float, nullable=True)
    planned_rest_seconds = Column(Integer, nullable=True)

    # Actual (what happened)
    completed_sets = Column(Integer, nullable=False, default=0)
    actual_reps = Column(JSON, nullable=True)  # Array: [12, 10, 8] for each set
    actual_weights = Column(JSON, nullable=True)  # Array: [135, 135, 145]
    actual_rest_times = Column(JSON, nullable=True)  # Array: [60, 90, 120] in seconds

    # Deviations
    skipped = Column(Boolean, nullable=False, default=False)
    deviation_reason = Column(Text, nullable=True)

    # Form tracking
    form_quality = Column(SQLEnum(FormQuality), nullable=True)
    form_notes = Column(Text, nullable=True)
    needs_deload = Column(Boolean, nullable=False, default=False)

    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    workout_session = relationship("WorkoutSession", back_populates="exercise_logs")
    # exercise = relationship("Exercise")  # Temporarily disabled


class BehavioralPattern(Base):
    """
    Learns and stores behavioral patterns observed from workout/diet logs.
    Used by AI to adapt suggestions and provide proactive coaching.
    """
    __tablename__ = "behavioral_patterns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Pattern classification
    pattern_type = Column(SQLEnum(BehavioralPatternType), nullable=False)
    pattern_subtype = Column(String(100), nullable=True)

    # What was observed
    observation = Column(Text, nullable=False)
    context = Column(Text, nullable=True)

    # Supporting data
    occurrence_count = Column(Integer, nullable=False, default=1)
    confidence_score = Column(Float, nullable=False, default=0.5)  # 0.0 to 1.0

    # Timing
    first_observed = Column(DateTime, nullable=False)
    last_observed = Column(DateTime, nullable=False)

    # AI interpretation
    ai_interpretation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="behavioral_patterns")


class AICoachingLog(Base):
    """
    Logs every AI coaching interaction for continuity and learning.
    Tracks suggestions, responses, and outcomes.
    """
    __tablename__ = "ai_coaching_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Context
    interaction_type = Column(String(50), nullable=False)  # "suggestion", "feedback", "intervention", "check_in"
    triggered_by = Column(String(100), nullable=True)  # What caused this interaction

    # Content
    ai_message = Column(Text, nullable=False)
    user_response = Column(Text, nullable=True)
    user_action_taken = Column(Text, nullable=True)

    # Outcome tracking
    was_helpful = Column(Boolean, nullable=True)
    was_followed = Column(Boolean, nullable=True)
    user_satisfaction = Column(Integer, nullable=True)  # 1-5 rating

    # Timestamp
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="ai_coaching_logs")


# ============================================================================
# DIET SYSTEM MODELS
# ============================================================================

class DietPlan(Base):
    """
    User's active or historical diet plans.
    Contains macros, meal timing, and preferences.
    """
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Plan metadata
    name = Column(String(255), nullable=False)
    goal_type = Column(SQLEnum(GoalType), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Macro targets (daily)
    target_calories = Column(Integer, nullable=False)
    target_protein = Column(Float, nullable=False)
    target_carbs = Column(Float, nullable=False)
    target_fats = Column(Float, nullable=False)

    # Adjustments
    workout_intensity_factor = Column(Float, nullable=False, default=1.0)
    rest_day_calories = Column(Integer, nullable=True)
    workout_day_calories = Column(Integer, nullable=True)

    # Preferences
    meals_per_day = Column(Integer, nullable=False, default=3)
    dietary_restrictions = Column(JSON, nullable=True)  # ["vegetarian", "gluten_free"]
    allergies = Column(JSON, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="diet_plans")
    meal_templates = relationship("MealTemplate", back_populates="diet_plan", cascade="all, delete-orphan")
    meal_logs = relationship("MealLog", back_populates="diet_plan")


class MealTemplate(Base):
    """
    Template for a meal within a diet plan.
    Defines meal timing, macro targets, and foods.
    """
    __tablename__ = "meal_templates"

    id = Column(Integer, primary_key=True, index=True)
    diet_plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=False, index=True)

    # Meal info
    meal_time = Column(SQLEnum(MealTime), nullable=False)
    meal_name = Column(String(255), nullable=True)  # "Pre-Workout Shake", "Post-Workout Meal"
    scheduled_time = Column(Time, nullable=True)

    # Targets for this meal
    target_calories = Column(Integer, nullable=False)
    target_protein = Column(Float, nullable=False)
    target_carbs = Column(Float, nullable=False)
    target_fats = Column(Float, nullable=False)

    # Flexibility
    allow_substitutions = Column(Boolean, nullable=False, default=True)
    is_flexible_timing = Column(Boolean, nullable=False, default=False)

    # Relationships
    diet_plan = relationship("DietPlan", back_populates="meal_templates")
    meal_foods = relationship("MealFood", back_populates="meal_template", cascade="all, delete-orphan")


class MealFood(Base):
    """
    Individual foods within a meal template.
    """
    __tablename__ = "meal_foods"

    id = Column(Integer, primary_key=True, index=True)
    meal_template_id = Column(Integer, ForeignKey("meal_templates.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=True)  # Null if custom food

    # Food details
    food_name = Column(String(255), nullable=False)
    quantity_grams = Column(Float, nullable=False)

    # Nutrition (calculated from foods table or custom)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fats = Column(Float, nullable=False)

    # Options
    is_optional = Column(Boolean, nullable=False, default=False)
    substitution_group = Column(String(50), nullable=True)  # Group similar foods

    # Relationships
    meal_template = relationship("MealTemplate", back_populates="meal_foods")
    food = relationship("Food")


class MealLog(Base):
    """
    Daily meal logs - what user actually ate.
    Tracks adherence, deviations, and context (energy, mood, workout timing).
    """
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    diet_plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=False)
    meal_template_id = Column(Integer, ForeignKey("meal_templates.id"), nullable=True)

    # Timing
    logged_at = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), index=True)
    planned_time = Column(Time, nullable=True)
    actual_time = Column(Time, nullable=True)
    time_deviation_minutes = Column(Integer, nullable=True)

    # What was eaten (JSON array of foods)
    foods_eaten = Column(JSON, nullable=False)  # [{"name": "chicken", "grams": 200, "calories": 330}]

    # Adherence
    followed_plan = Column(Boolean, nullable=False, default=True)
    deviation_reason = Column(Text, nullable=True)

    # Totals
    total_calories = Column(Integer, nullable=False)
    total_protein = Column(Float, nullable=False)
    total_carbs = Column(Float, nullable=False)
    total_fats = Column(Float, nullable=False)

    # Context (before eating)
    energy_level = Column(SQLEnum(EnergyLevel), nullable=True)
    hunger_level = Column(SQLEnum(HungerLevel), nullable=True)
    mood = Column(SQLEnum(Mood), nullable=True)

    # Post-meal feedback
    satisfaction_rating = Column(Integer, nullable=True)  # 1-5
    too_much = Column(Boolean, nullable=False, default=False)
    too_little = Column(Boolean, nullable=False, default=False)

    # Workout context
    workout_before = Column(Boolean, nullable=False, default=False)
    workout_after = Column(Boolean, nullable=False, default=False)
    ai_suggestion_followed = Column(Boolean, nullable=True)
    ai_feedback = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="meal_logs")
    diet_plan = relationship("DietPlan", back_populates="meal_logs")
    meal_template = relationship("MealTemplate")


class FoodPreference(Base):
    """
    Learns which foods user prefers based on repeated choices and ratings.
    Used by AI to suggest meals user will enjoy.
    """
    __tablename__ = "food_preferences"
    __table_args__ = (
        UniqueConstraint('user_id', 'food_name', name='uq_user_food'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Food
    food_name = Column(String(255), nullable=False)
    food_category = Column(String(100), nullable=True)

    # Preference data
    times_eaten = Column(Integer, nullable=False, default=0)
    times_chosen_when_alternative = Column(Integer, nullable=False, default=0)
    avg_satisfaction_rating = Column(Float, nullable=True)

    # Context preferences
    preferred_meal_time = Column(SQLEnum(MealTime), nullable=True)
    preferred_on_workout_days = Column(Boolean, nullable=True)
    preferred_on_rest_days = Column(Boolean, nullable=True)

    # Correlations (learned patterns)
    energy_correlation = Column(Float, nullable=True)  # -1 to 1
    mood_correlation = Column(Float, nullable=True)
    workout_performance_correlation = Column(Float, nullable=True)

    # Learning metadata
    confidence_score = Column(Float, nullable=False, default=0.5)
    first_observed = Column(DateTime, nullable=False)
    last_observed = Column(DateTime, nullable=False)

    # Relationships
    user = relationship("User", back_populates="food_preferences")


class EatingPattern(Base):
    """
    High-level eating patterns detected by AI.
    Examples: "Eats more carbs on workout days", "Skips breakfast on weekends"
    """
    __tablename__ = "eating_patterns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Pattern
    pattern_type = Column(SQLEnum(EatingPatternType), nullable=False)
    observation = Column(Text, nullable=False)
    context = Column(Text, nullable=True)

    # Data
    occurrence_count = Column(Integer, nullable=False, default=1)
    confidence_score = Column(Float, nullable=False, default=0.5)

    # Timing
    first_observed = Column(DateTime, nullable=False)
    last_observed = Column(DateTime, nullable=False)

    # AI interpretation
    ai_interpretation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="eating_patterns")


class Food(Base):
    """
    Searchable food database.
    Seeded with common foods, extended with API data and user customs.
    """
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True, index=True)

    # Nutrition per 100g (standardized)
    calories_per_100g = Column(Integer, nullable=False)
    protein_per_100g = Column(Float, nullable=False)
    carbs_per_100g = Column(Float, nullable=False)
    fats_per_100g = Column(Float, nullable=False)
    fiber_per_100g = Column(Float, nullable=True)

    # Common serving
    common_serving = Column(String(100), nullable=True)  # "1 cup", "1 medium", "1 scoop"
    common_serving_grams = Column(Float, nullable=True)

    # Metadata
    is_verified = Column(Boolean, nullable=False, default=True)
    source = Column(SQLEnum(FoodSource), nullable=False, default=FoodSource.SEEDED, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # If custom
    times_used = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="custom_foods")


# ============================================================================
# UPDATE EXISTING USER MODEL (add these to your User class)
# ============================================================================

"""
Add these relationships to your existing User model:

class User(Base):
    # ... existing columns ...

    # New columns (from migration_001)
    active_workout_program_id = Column(Integer, ForeignKey("manual_workouts.id"), nullable=True)
    active_diet_plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, default=False)

    # New relationships
    workout_sessions = relationship("WorkoutSession", back_populates="user")
    behavioral_patterns = relationship("BehavioralPattern", back_populates="user")
    ai_coaching_logs = relationship("AICoachingLog", back_populates="user")
    diet_plans = relationship("DietPlan", back_populates="user")
    meal_logs = relationship("MealLog", back_populates="user")
    food_preferences = relationship("FoodPreference", back_populates="user")
    eating_patterns = relationship("EatingPattern", back_populates="user")
    custom_foods = relationship("Food", back_populates="user")
"""
