from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------------------------------------
# DB session dependency
# -------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# IMPORT ALL MODELS (CRITICAL — KEEP TOGETHER)
# -------------------------------------------------

# Gyms
from app.models.gym import Gym
from app.models.gym_equipment import GymEquipment
from app.models.gym_pricing import GymPricing
from app.models.gym_trainer import GymTrainer

# Users
from app.models.user import User
from app.models.user_gym import UserGymLink
from app.models.visit import Visit

# Media
from app.models.gallery import GalleryItem
from app.models.user_file import UserFile
from app.models.library_item import LibraryItem

# Fitness
from app.models.workout_log import WorkoutLog
from app.models.weight_log import WeightLog

# Health
from app.models.health_profile import HealthProfile
from app.models.health_memory import HealthMemory

# Reminders
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog

# AI
from app.models.user_ai_usage import UserAIUsage
# -------------------------------------------------
# CREATE TABLES
# -------------------------------------------------
def init_db():
    Base.metadata.create_all(bind=engine)