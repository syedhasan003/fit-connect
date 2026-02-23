"""
SQLAlchemy Models for FitNova Fitness System
✅ SQLITE COMPATIBLE - No func.now(), uses CURRENT_TIMESTAMP
"""

from sqlalchemy import (
    text,
    Column, Integer, String, Float, Boolean, Text, DateTime, Date, Time,
    ForeignKey, JSON, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship, deferred
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
    """Tracks workout sessions"""
    __tablename__ = "workout_sessions"

    # Core columns (exist in DB)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SQLEnum(SessionStatus), nullable=False, default=SessionStatus.IN_PROGRESS)

    # ✅ SQLITE COMPATIBLE - uses CURRENT_TIMESTAMP
    started_at = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    # Deferred columns (added by migration)
    manual_workout_id = deferred(Column(Integer, nullable=True))
    completed_at = deferred(Column(DateTime, nullable=True))
    duration_minutes = deferred(Column(Integer, nullable=True))
    planned_exercises_count = deferred(Column(Integer, nullable=False, default=0))
    completed_exercises_count = deferred(Column(Integer, nullable=False, default=0))
    skipped_exercises_count = deferred(Column(Integer, nullable=False, default=0))
    # ✅ FIXED: Use plain String instead of SQLEnum to avoid LookupError on bad data
    energy_level_start = deferred(Column(String(50), nullable=True))
    energy_level_end = deferred(Column(String(50), nullable=True))
    soreness_level_start = deferred(Column(Integer, nullable=True))
    soreness_level_end = deferred(Column(Integer, nullable=True))
    notes = deferred(Column(Text, nullable=True))
    ai_feedback = deferred(Column(Text, nullable=True))

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    exercise_logs = relationship("ExerciseLog", back_populates="workout_session", cascade="all, delete-orphan")


class ExerciseLog(Base):
    """Logs exercises within workout sessions"""
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True, index=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False, index=True)

    # All columns deferred (table structure may not exist yet)
    exercise_id = deferred(Column(Integer, nullable=True))
    sequence_order = deferred(Column(Integer, nullable=False))
    planned_sets = deferred(Column(Integer, nullable=False))
    planned_reps_per_set = deferred(Column(Integer, nullable=True))
    planned_weight = deferred(Column(Float, nullable=True))
    planned_rest_seconds = deferred(Column(Integer, nullable=True))
    completed_sets = deferred(Column(Integer, nullable=False, default=0))
    actual_reps = deferred(Column(JSON, nullable=True))
    actual_weights = deferred(Column(JSON, nullable=True))
    actual_rest_times = deferred(Column(JSON, nullable=True))
    skipped = deferred(Column(Boolean, nullable=False, default=False))
    deviation_reason = deferred(Column(Text, nullable=True))
    form_quality = deferred(Column(SQLEnum(FormQuality), nullable=True))
    form_notes = deferred(Column(Text, nullable=True))
    needs_deload = deferred(Column(Boolean, nullable=False, default=False))
    started_at = deferred(Column(DateTime, nullable=True))
    completed_at = deferred(Column(DateTime, nullable=True))

    workout_session = relationship("WorkoutSession", back_populates="exercise_logs")


class BehavioralPattern(Base):
    """Learns behavioral patterns from workout/diet logs"""
    __tablename__ = "behavioral_patterns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    pattern_type = Column(SQLEnum(BehavioralPatternType), nullable=False)
    pattern_subtype = Column(String(100), nullable=True)
    observation = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    occurrence_count = Column(Integer, nullable=False, default=1)
    confidence_score = Column(Float, nullable=False, default=0.5)
    first_observed = Column(DateTime, nullable=False)
    last_observed = Column(DateTime, nullable=False)
    ai_interpretation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    user = relationship("User", back_populates="behavioral_patterns")


class AICoachingLog(Base):
    """Logs AI coaching interactions"""
    __tablename__ = "ai_coaching_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)
    triggered_by = Column(String(100), nullable=True)
    ai_message = Column(Text, nullable=False)
    user_response = Column(Text, nullable=True)
    user_action_taken = Column(Text, nullable=True)
    was_helpful = Column(Boolean, nullable=True)
    was_followed = Column(Boolean, nullable=True)
    user_satisfaction = Column(Integer, nullable=True)

    # ✅ SQLITE COMPATIBLE - Python-side default (not server_default)
    created_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="ai_coaching_logs")


# ============================================================================
# DIET SYSTEM MODELS
# ============================================================================

class DietPlan(Base):
    """User diet plans"""
    __tablename__ = "diet_plans"

    # Core columns (exist in DB)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    goal_type = Column(SQLEnum(GoalType), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Deferred columns (added by migration)
    status = deferred(Column(String(50), nullable=True, default="pending"))

    # Deferred columns (don't exist in DB yet)
    start_date = deferred(Column(Date, nullable=False))
    end_date = deferred(Column(Date, nullable=True))
    created_at = deferred(Column(DateTime, nullable=False))
    target_calories = deferred(Column(Integer, nullable=False))
    target_protein = deferred(Column(Float, nullable=False))
    target_carbs = deferred(Column(Float, nullable=False))
    target_fats = deferred(Column(Float, nullable=False))
    workout_intensity_factor = deferred(Column(Float, nullable=False, default=1.0))
    rest_day_calories = deferred(Column(Integer, nullable=True))
    workout_day_calories = deferred(Column(Integer, nullable=True))
    meals_per_day = deferred(Column(Integer, nullable=False, default=3))
    dietary_restrictions = deferred(Column(JSON, nullable=True))
    allergies = deferred(Column(JSON, nullable=True))
    notes = deferred(Column(Text, nullable=True))

    user = relationship("User", back_populates="diet_plans")
    meal_templates = relationship("MealTemplate", back_populates="diet_plan", cascade="all, delete-orphan")
    meal_logs = relationship("MealLog", back_populates="diet_plan")


class MealTemplate(Base):
    """Meal templates within diet plans"""
    __tablename__ = "meal_templates"

    id = Column(Integer, primary_key=True, index=True)
    diet_plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=False, index=True)
    meal_time = Column(SQLEnum(MealTime), nullable=False)
    meal_name = Column(String(255), nullable=True)
    scheduled_time = Column(Time, nullable=True)
    target_calories = Column(Integer, nullable=False)
    target_protein = Column(Float, nullable=False)
    target_carbs = Column(Float, nullable=False)
    target_fats = Column(Float, nullable=False)
    allow_substitutions = Column(Boolean, nullable=False, default=True)
    is_flexible_timing = Column(Boolean, nullable=False, default=False)

    diet_plan = relationship("DietPlan", back_populates="meal_templates")
    meal_foods = relationship("MealFood", back_populates="meal_template", cascade="all, delete-orphan")


class MealFood(Base):
    """Individual foods within meal templates"""
    __tablename__ = "meal_foods"

    id = Column(Integer, primary_key=True, index=True)
    meal_template_id = Column(Integer, ForeignKey("meal_templates.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=True)
    food_name = Column(String(255), nullable=False)
    quantity_grams = Column(Float, nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fats = Column(Float, nullable=False)
    is_optional = Column(Boolean, nullable=False, default=False)
    substitution_group = Column(String(50), nullable=True)

    meal_template = relationship("MealTemplate", back_populates="meal_foods")
    food = relationship("Food")


class MealLog(Base):
    """Daily meal logs"""
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    diet_plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=False)
    meal_template_id = Column(Integer, ForeignKey("meal_templates.id"), nullable=True)

    # ✅ SQLITE COMPATIBLE
    logged_at = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), index=True)

    meal_name = Column(String(100), nullable=True)  # "breakfast", "lunch", "dinner", "snack", custom
    planned_time = Column(Time, nullable=True)
    actual_time = Column(Time, nullable=True)
    time_deviation_minutes = Column(Integer, nullable=True)
    foods_eaten = Column(JSON, nullable=False)
    followed_plan = Column(Boolean, nullable=False, default=True)
    deviation_reason = Column(Text, nullable=True)
    total_calories = Column(Integer, nullable=False)
    total_protein = Column(Float, nullable=False)
    total_carbs = Column(Float, nullable=False)
    total_fats = Column(Float, nullable=False)
    energy_level = Column(SQLEnum(EnergyLevel), nullable=True)
    hunger_level = Column(SQLEnum(HungerLevel), nullable=True)
    mood = Column(SQLEnum(Mood), nullable=True)
    satisfaction_rating = Column(Integer, nullable=True)
    too_much = Column(Boolean, nullable=False, default=False)
    too_little = Column(Boolean, nullable=False, default=False)
    workout_before = Column(Boolean, nullable=False, default=False)
    workout_after = Column(Boolean, nullable=False, default=False)
    ai_suggestion_followed = Column(Boolean, nullable=True)
    ai_feedback = Column(Text, nullable=True)

    user = relationship("User", back_populates="meal_logs")
    diet_plan = relationship("DietPlan", back_populates="meal_logs")
    meal_template = relationship("MealTemplate")


class FoodPreference(Base):
    """Learned food preferences"""
    __tablename__ = "food_preferences"
    __table_args__ = (
        UniqueConstraint('user_id', 'food_name', name='uq_user_food'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_name = Column(String(255), nullable=False)
    food_category = Column(String(100), nullable=True)
    times_eaten = Column(Integer, nullable=False, default=0)
    times_chosen_when_alternative = Column(Integer, nullable=False, default=0)
    avg_satisfaction_rating = Column(Float, nullable=True)
    preferred_meal_time = Column(SQLEnum(MealTime), nullable=True)
    preferred_on_workout_days = Column(Boolean, nullable=True)
    preferred_on_rest_days = Column(Boolean, nullable=True)
    energy_correlation = Column(Float, nullable=True)
    mood_correlation = Column(Float, nullable=True)
    workout_performance_correlation = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.5)
    first_observed = Column(DateTime, nullable=False)
    last_observed = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="food_preferences")


class EatingPattern(Base):
    """High-level eating patterns"""
    __tablename__ = "eating_patterns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    pattern_type = Column(SQLEnum(EatingPatternType), nullable=False)
    observation = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    occurrence_count = Column(Integer, nullable=False, default=1)
    confidence_score = Column(Float, nullable=False, default=0.5)
    first_observed = Column(DateTime, nullable=False)
    last_observed = Column(DateTime, nullable=False)
    ai_interpretation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    user = relationship("User", back_populates="eating_patterns")


class Food(Base):
    """Searchable food database"""
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    calories_per_100g = Column(Integer, nullable=False)
    protein_per_100g = Column(Float, nullable=False)
    carbs_per_100g = Column(Float, nullable=False)
    fats_per_100g = Column(Float, nullable=False)
    fiber_per_100g = Column(Float, nullable=True)
    common_serving = Column(String(100), nullable=True)
    common_serving_grams = Column(Float, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=True)
    source = Column(SQLEnum(FoodSource), nullable=False, default=FoodSource.SEEDED, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    times_used = Column(Integer, nullable=False, default=0)

    # ✅ SQLITE COMPATIBLE - Python-side default
    created_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="custom_foods")