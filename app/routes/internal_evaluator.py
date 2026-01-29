from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.missed_reminder_service import EvaluatorService
from app.models.user import User

router = APIRouter(
    prefix="/internal/evaluator",
    tags=["Internal Evaluator"]
)


@router.post("/run")
def run_evaluator_for_all_users(db: Session = Depends(get_db)):
    """
    Runs evaluator for ALL users.
    Intended for cron / admin / system jobs.
    """
    service = EvaluatorService()

    users = db.query(User).all()
    results = []

    for user in users:
        state = service.evaluate_user(db, user.id)
        results.append({
            "user_id": user.id,
            "focus": state.focus,
            "consistency_score": state.consistency_score,
            "missed_reminders": state.missed_reminders,
        })

    return {
        "status": "ok",
        "evaluated_users": len(results),
        "results": results,
    }
