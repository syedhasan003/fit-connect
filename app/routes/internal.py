from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.missed_reminder_service import EvaluatorService

router = APIRouter(
    prefix="/internal",
    tags=["Internal"],
)


@router.post("/evaluate")
def evaluate_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates ONLY the current user.
    Used by Home / Central / app refresh.
    """
    service = EvaluatorService()
    state = service.evaluate_user(db, current_user.id)

    return {
        "status": "ok",
        "user_id": current_user.id,
        "focus": state.focus,
        "consistency_score": state.consistency_score,
        "missed_reminders": state.missed_reminders,
        "pending_tasks": state.pending_tasks,
        "ai_summary": state.ai_summary,
    }
