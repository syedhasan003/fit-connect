"""
preference_manager.py
CRUD service for user AI preferences (workout & meal).
Used by ai_central to check if preferences are locked before running
onboarding question flows.
"""

import logging
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.models.user_ai_preferences import UserAIPreferences

logger = logging.getLogger(__name__)


def get_preferences(db: Session, user_id: int, preference_type: str) -> dict | None:
    """
    Returns the stored preference data dict, or None if not yet set.
    preference_type: 'workout' | 'meal'
    """
    row = (
        db.query(UserAIPreferences)
        .filter(
            UserAIPreferences.user_id == user_id,
            UserAIPreferences.preference_type == preference_type,
        )
        .first()
    )
    return row.data if row else None


def save_preferences(db: Session, user_id: int, preference_type: str, data: dict) -> UserAIPreferences:
    """
    Upserts preferences for the given type. Marks them as locked.
    """
    existing = (
        db.query(UserAIPreferences)
        .filter(
            UserAIPreferences.user_id == user_id,
            UserAIPreferences.preference_type == preference_type,
        )
        .first()
    )

    if existing:
        existing.data = data
        db.commit()
        db.refresh(existing)
        return existing
    else:
        row = UserAIPreferences(
            user_id=user_id,
            preference_type=preference_type,
            data=data,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row


def clear_preferences(db: Session, user_id: int, preference_type: str) -> bool:
    """
    Clears preferences so the next request triggers re-onboarding.
    Called when user taps "Change my preferences".
    """
    row = (
        db.query(UserAIPreferences)
        .filter(
            UserAIPreferences.user_id == user_id,
            UserAIPreferences.preference_type == preference_type,
        )
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
        return True
    return False


# ─────────────────────────────────────────────────────────────
# Preference question definitions
# Returned to frontend so it can render the chip-based question flow
# ─────────────────────────────────────────────────────────────

WORKOUT_QUESTIONS = [
    {
        "key": "days_per_week",
        "question": "How many days a week can you train?",
        "options": ["3 days", "4 days", "5 days", "6 days"],
    },
    {
        "key": "location",
        "question": "Where do you train?",
        "options": ["Gym", "Home (with equipment)", "Home (no equipment)"],
    },
    {
        "key": "goal",
        "question": "What's your main goal?",
        "options": ["Build muscle", "Lose fat", "Get stronger", "General fitness"],
    },
    {
        "key": "experience",
        "question": "What's your experience level?",
        "options": ["Beginner", "Intermediate", "Advanced"],
    },
    {
        "key": "injuries",
        "question": "Any injuries or areas to avoid? (type or tap below)",
        "options": ["None", "Lower back", "Knees", "Shoulders"],
        "allow_custom": True,
    },
]

MEAL_QUESTIONS = [
    {
        "key": "diet_type",
        "question": "What's your diet type?",
        "options": ["Non-vegetarian", "Vegetarian", "Vegan"],
    },
    {
        "key": "cuisine",
        "question": "What cuisine do you prefer?",
        "options": ["Indian", "Western", "Mixed"],
    },
    {
        "key": "cook_time",
        "question": "How long can you spend cooking per meal?",
        "options": ["Quick (< 15 min)", "Moderate (15–30 min)", "Elaborate (30+ min)"],
    },
    {
        "key": "allergies",
        "question": "Any allergies or foods you hate? (type or tap below)",
        "options": ["None", "Dairy", "Gluten", "Nuts"],
        "allow_custom": True,
    },
    {
        "key": "schedule",
        "question": "How many meals a day? And roughly when do you wake up?",
        "options": ["3 meals, wake 6–7am", "3 meals, wake 7–9am", "4 meals, wake 6–7am", "4 meals, wake 7–9am"],
        "allow_custom": True,
    },
]

REMINDER_QUESTIONS = [
    {
        "key": "reminder_type",
        "question": "What do you want a reminder for?",
        "options": ["🏋️ Workout", "🥗 Meal", "💧 Water", "✏️ Custom"],
    },
    {
        "key": "time",
        "question": "What time should I remind you?",
        "options": ["Morning (7am)", "Midday (12pm)", "Afternoon (4pm)", "Evening (7pm)"],
        "allow_custom": True,
    },
    {
        "key": "frequency",
        "question": "How often?",
        "options": ["Every day", "Weekdays only", "Specific days", "Just once"],
    },
]


def get_questions(flow_type: str) -> list:
    """Returns question list for a given flow type."""
    return {
        "workout": WORKOUT_QUESTIONS,
        "meal": MEAL_QUESTIONS,
        "reminder": REMINDER_QUESTIONS,
    }.get(flow_type, [])
