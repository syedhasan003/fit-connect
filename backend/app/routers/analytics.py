# app/routers/analytics.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import uuid

from app.database.deps import get_db
from app import models
from app.schemas.analytics import GymEventIn, GymDailyOut, GymSummaryOut

router = APIRouter(prefix="/analytics", tags=["analytics"])


# POST /analytics/event
@router.post("/event", status_code=201)
def log_event(payload: GymEventIn, db: Session = Depends(get_db)):
    event_id = str(uuid.uuid4())

    ev = models.GymEvent(
        id=event_id,
        gym_id=payload.gym_id,
        user_id=payload.user_id,
        event_type=payload.event_type,
        source=payload.source,
        meta=payload.metadata,             # ✔ using meta (correct)
        created_at=datetime.utcnow()
    )

    db.add(ev)
    db.commit()
    db.refresh(ev)

    return {"id": event_id, "status": "recorded"}


# GET /analytics/gym/{id}/daily
@router.get("/gym/{gym_id}/daily", response_model=list[GymDailyOut])
def get_gym_daily(gym_id: int, days: int = 30, db: Session = Depends(get_db)):
    start = date.today() - timedelta(days=days - 1)

    rows = (
        db.query(models.GymDailyAnalytics)
        .filter(models.GymDailyAnalytics.gym_id == gym_id)
        .filter(models.GymDailyAnalytics.date >= start)
        .order_by(models.GymDailyAnalytics.date.asc())
        .all()
    )

    return rows


# GET /analytics/gym/{id}/summary
@router.get("/gym/{gym_id}/summary", response_model=GymSummaryOut)
def get_gym_summary(gym_id: int, days: int = 30, db: Session = Depends(get_db)):
    start_date = date.today() - timedelta(days=days - 1)

    rows = (
        db.query(models.GymDailyAnalytics)
        .filter(models.GymDailyAnalytics.gym_id == gym_id)
        .filter(models.GymDailyAnalytics.date >= start_date)
        .all()
    )

    if not rows:
        events = (
            db.query(models.GymEvent)
            .filter(models.GymEvent.gym_id == gym_id)
            .filter(models.GymEvent.created_at >= datetime.combine(start_date, datetime.min.time()))
            .all()
        )

        views = sum(e.event_type == "view" for e in events)
        saves = sum(e.event_type == "save" for e in events)
        leads = sum(e.event_type in ("click_whatsapp", "click_call", "click_location", "membership_interest") for e in events)
        premium_views = sum(e.event_type == "premium_view" for e in events)

        engagement = (views * 0.2) + (saves * 2) + (leads * 3.5)

        return GymSummaryOut(
            views=views,
            saves=saves,
            leads=leads,
            premium_views=premium_views,
            engagement_score=float(engagement),
            trend="N/A"
        )

    views = sum(r.views for r in rows)
    saves = sum(r.saves for r in rows)
    leads = sum(r.leads for r in rows)
    premium_views = sum(r.premium_views for r in rows)
    engagement = sum(r.engagement_score for r in rows)

    return GymSummaryOut(
        views=views,
        saves=saves,
        leads=leads,
        premium_views=premium_views,
        engagement_score=float(engagement),
        trend="N/A"
    )
