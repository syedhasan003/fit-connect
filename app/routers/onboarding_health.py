from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/health")
def onboarding_health(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Stores lifestyle & health context
    Used heavily by Central AI + Reminder Intelligence
    """

    memory_text = f"""
Sleep Quality: {payload.get('sleep_quality')}
Stress Level: {payload.get('stress_level')}
Work Type: {payload.get('work_type')}
Daily Energy Levels: {payload.get('energy_levels')}
Current Medications: {payload.get('medications')}
"""

    memory = HealthMemory(
        user_id=current_user.id,
        category="onboarding_health",
        content=memory_text.strip(),
    )

    db.add(memory)
    db.commit()

    return {"status": "onboarding_health_saved"}
