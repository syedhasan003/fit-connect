from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
    Saves the user's onboarding profile into HealthMemory (structured JSON)
    and marks onboarding_completed = True on the User record.

    This is CRITICAL for all agent jobs — narrative, morning brief, nudge,
    and adaptation all read this context to personalise their output.
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

    # ── Store as structured JSON so agents can parse individual fields ──
    structured_content = {
        "fitness_goal":          payload["fitness_goal"],
        "experience_level":      payload["experience_level"],
        "workout_days_per_week": payload["workout_days_per_week"],
        "diet_preference":       payload["diet_preference"],
        "injuries_or_conditions": payload["injuries_or_conditions"],
        # optional extras
        "workout_location":      payload.get("workout_location", "any"),
        "full_name":             payload.get("full_name", ""),
    }

    # Upsert — if user re-completes onboarding, update rather than duplicate
    existing = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == current_user.id,
            HealthMemory.category == "onboarding_goals",
        )
        .first()
    )

    if existing:
        existing.content = structured_content
    else:
        memory = HealthMemory(
            user_id=current_user.id,
            category="onboarding_goals",
            source="user",
            content=structured_content,
        )
        db.add(memory)

    # ── Update full_name if provided ────────────────────────────────────
    if payload.get("full_name") and not current_user.full_name:
        current_user.full_name = payload["full_name"].strip()

    # ── Mark onboarding complete ────────────────────────────────────────
    current_user.onboarding_completed = True

    db.commit()

    return {
        "status": "onboarding_complete",
        "user_id": current_user.id,
        "onboarding_completed": True,
    }


@router.get("/status")
def onboarding_status(
    current_user: User = Depends(get_current_user),
):
    """Quick check — frontend calls this to decide whether to show onboarding."""
    return {
        "onboarding_completed": bool(current_user.onboarding_completed),
        "full_name": current_user.full_name,
    }
