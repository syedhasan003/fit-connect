from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/ai/adapt", tags=["AI Adaptation"])


@router.post("/")
def generate_adaptation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Adaptation Logic v1
    - Reads reminder behavior
    - Generates adaptation insight
    - Stores it as memory
    """

    # Fetch recent reminder behavior
    behaviors = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == current_user.id,
            HealthMemory.category == "reminder_behavior"
        )
        .order_by(HealthMemory.created_at.desc())
        .limit(5)
        .all()
    )

    if not behaviors:
        return {
            "status": "no_behavior_data",
            "message": "No reminder behavior found yet."
        }

    # Simple reasoning rules (v1)
    missed_count = 0
    reasons = []

    for b in behaviors:
        content = b.content.lower()
        if "missed" in content or "delay" in content:
            missed_count += 1
        reasons.append(b.content)

    if missed_count >= 3:
        insight = (
            "User frequently misses or delays reminders. "
            "Recommend reducing intensity, adjusting reminder timing, "
            "and using a more supportive tone."
        )
    else:
        insight = (
            "User generally follows reminders with minor delays. "
            "Maintain current schedule with gentle flexibility."
        )

    memory = HealthMemory(
        user_id=current_user.id,
        category="adaptation_insight",
        content=insight,
    )

    db.add(memory)
    db.commit()

    return {
        "status": "adaptation_generated",
        "missed_events": missed_count,
        "insight": insight,
        "source_behaviors": reasons
    }
