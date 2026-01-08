from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.missed_reminder_service import process_missed_reminders

router = APIRouter(
    prefix="/internal",
    tags=["internal"]
)

@router.post("/process-missed-reminders")
def process_missed_reminders_endpoint(db: Session = Depends(get_db)):
    process_missed_reminders(db)
    return {"status": "missed reminders processed"}
