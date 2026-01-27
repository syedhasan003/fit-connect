from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.reminder_evaluator import evaluate_missed_reminders

router = APIRouter(prefix="/internal/reminders", tags=["Internal"])


@router.post("/evaluate")
def evaluate(db: Session = Depends(get_db)):
    return evaluate_missed_reminders(db)
