from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/goals")
def onboarding_goals(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Stores onboarding goals into HealthMemory
    This is CRITICAL for Central AI context
    """

    required_fields = [
        "fitness_goal",
        "experience_level",
        "workout_days_per_week",
        "diet_preference",
        "injuries_or_conditions",
    ]

    for field in required_fields:
        if field not in payload:
            return {"error": f"Missing field: {field}"}

    memory_text = f"""
Fitness Goal: {payload['fitness_goal']}
Experience Level: {payload['experience_level']}
Workout Days/Week: {payload['workout_days_per_week']}
Diet Preference: {payload['diet_preference']}
Injuries/Conditions: {payload['injuries_or_conditions']}
"""

    memory = HealthMemory(
        user_id=current_user.id,
        category="onboarding_goals",
        content=memory_text.strip(),
    )

    db.add(memory)
    db.commit()

    return {
        "status": "onboarding_goals_saved",
        "user_id": current_user.id
    }
