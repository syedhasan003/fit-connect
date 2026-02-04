from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
from datetime import datetime, timedelta

from ..db.database import get_db
from ..deps import get_current_user
from ..models.user import User

router = APIRouter(prefix="/behaviour", tags=["Behaviour"])

# -------------------------------------------------
# CREATE TABLE SQL (run on startup)
# -------------------------------------------------
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS behaviour_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

# -------------------------------------------------
# Schemas
# -------------------------------------------------
class BehaviourEvent(BaseModel):
    event_type: str
    payload: Optional[Dict[str, Any]] = None


class BehaviourSummaryOut(BaseModel):
    total_events_7d: int
    event_counts_7d: Dict[str, int]
    last_workout_logged: Optional[str] = None
    missed_reminders_recent: list = []
    recent_central_questions: list = []


# -------------------------------------------------
# POST /behaviour/log
# -------------------------------------------------
@router.post("/log", status_code=201)
def log_event(
    event: BehaviourEvent,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.execute(
        text("INSERT INTO behaviour_log (user_id, event_type, payload) VALUES (:uid, :etype, :pay)"),
        {
            "uid": user.id,
            "etype": event.event_type,
            "pay": json.dumps(event.payload) if event.payload else None,
        },
    )
    db.commit()
    return {"status": "ok"}


# -------------------------------------------------
# GET /behaviour/summary
# -------------------------------------------------
@router.get("/summary", response_model=BehaviourSummaryOut)
def get_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()

    # Total events in last 7 days
    row = db.execute(
        text("SELECT COUNT(*) as cnt FROM behaviour_log WHERE user_id = :uid AND created_at >= :since"),
        {"uid": user.id, "since": seven_days_ago},
    ).fetchone()
    total_events_7d = row.cnt if row else 0

    # Per-type counts
    rows = db.execute(
        text(
            "SELECT event_type, COUNT(*) as cnt FROM behaviour_log "
            "WHERE user_id = :uid AND created_at >= :since GROUP BY event_type"
        ),
        {"uid": user.id, "since": seven_days_ago},
    ).fetchall()
    event_counts_7d = {r.event_type: r.cnt for r in rows}

    # Last workout logged
    last_wl = db.execute(
        text(
            "SELECT created_at FROM behaviour_log "
            "WHERE user_id = :uid AND event_type = 'workout_logged' "
            "ORDER BY created_at DESC LIMIT 1"
        ),
        {"uid": user.id},
    ).fetchone()
    last_workout_logged = str(last_wl.created_at) if last_wl else None

    # Recent missed reminders (with payload)
    missed = db.execute(
        text(
            "SELECT payload, created_at FROM behaviour_log "
            "WHERE user_id = :uid AND event_type = 'reminder_missed_viewed' "
            "ORDER BY created_at DESC LIMIT 5"
        ),
        {"uid": user.id},
    ).fetchall()
    missed_reminders_recent = [
        {"payload": json.loads(r.payload) if r.payload else {}, "at": str(r.created_at)}
        for r in missed
    ]

    # Recent Central questions
    questions = db.execute(
        text(
            "SELECT payload, created_at FROM behaviour_log "
            "WHERE user_id = :uid AND event_type = 'central_question_asked' "
            "ORDER BY created_at DESC LIMIT 5"
        ),
        {"uid": user.id},
    ).fetchall()
    recent_central_questions = [
        {"payload": json.loads(r.payload) if r.payload else {}, "at": str(r.created_at)}
        for r in questions
    ]

    return BehaviourSummaryOut(
        total_events_7d=total_events_7d,
        event_counts_7d=event_counts_7d,
        last_workout_logged=last_workout_logged,
        missed_reminders_recent=missed_reminders_recent,
        recent_central_questions=recent_central_questions,
    )