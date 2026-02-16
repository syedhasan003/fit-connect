from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.role import Role 
from sqlalchemy import String

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, nullable=False, default=Role.user.value)
    active_workout_program_id = Column(Integer, nullable=True)
    active_diet_plan_id = Column(Integer, nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, server_default='false')
    workout_sessions = relationship("WorkoutSession", back_populates="user", foreign_keys="WorkoutSession.user_id")
    behavioral_patterns = relationship("BehavioralPattern", back_populates="user", foreign_keys="BehavioralPattern.user_id")
    ai_coaching_logs = relationship("AICoachingLog", back_populates="user", foreign_keys="AICoachingLog.user_id")
    diet_plans = relationship("DietPlan", back_populates="user", foreign_keys="DietPlan.user_id")
    meal_logs = relationship("MealLog", back_populates="user", foreign_keys="MealLog.user_id")
    food_preferences = relationship("FoodPreference", back_populates="user", foreign_keys="FoodPreference.user_id")
    eating_patterns = relationship("EatingPattern", back_populates="user", foreign_keys="EatingPattern.user_id")
    custom_foods = relationship("Food", back_populates="user", foreign_keys="Food.user_id")
