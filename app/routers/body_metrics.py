"""
Body Metrics Endpoints
Body weight logging, water intake tracking, and weekly session adherence
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from app.db.database import get_db
from app.models.fitness_tracking import BodyWeightLog, WaterLog, WorkoutSession, SessionStatus
from app.deps import get_current_user

router = APIRouter(prefix="/api/metrics", tags=["Body Metrics"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class WeightCreate(BaseModel):
    weight_kg: float
    note: Optional[str] = None

class WaterUpdate(BaseModel):
    glasses: int
    target_glasses: Optional[int] = 8


# ── Weight ────────────────────────────────────────────────────────────────────

@router.post("/weight")
async def log_weight(
    data: WeightCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    entry = BodyWeightLog(
        user_id=current_user.id,
        weight_kg=round(data.weight_kg, 1),
        note=data.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # ── Write health memory (fire-and-forget) ──────────────────────────────
    try:
        from app.services.memory_writer import write_weight_memory
        # Determine trend from last 3 entries
        recent = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == current_user.id)
            .order_by(BodyWeightLog.logged_at.desc())
            .limit(4)
            .all()
        )
        trend = "stable"
        if len(recent) >= 2:
            prev = recent[1].weight_kg
            curr = recent[0].weight_kg
            if curr < prev - 0.1:
                trend = "down"
            elif curr > prev + 0.1:
                trend = "up"
        write_weight_memory(
            db=db,
            user_id=current_user.id,
            weight_kg=round(data.weight_kg, 1),
            trend=trend,
            note=data.note,
        )
    except Exception as _mem_err:
        import logging
        logging.getLogger(__name__).warning(f"[body_metrics] memory write failed: {_mem_err}")
    # ──────────────────────────────────────────────────────────────────────

    return {"id": entry.id, "weight_kg": entry.weight_kg, "logged_at": entry.logged_at.isoformat()}


@router.get("/weight")
async def get_weight_history(
    limit: int = 14,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    entries = (
        db.query(BodyWeightLog)
        .filter(BodyWeightLog.user_id == current_user.id)
        .order_by(BodyWeightLog.logged_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {"id": e.id, "weight_kg": e.weight_kg, "logged_at": e.logged_at.isoformat(), "note": e.note}
        for e in reversed(entries)
    ]


# ── Water ─────────────────────────────────────────────────────────────────────

@router.get("/water/today")
async def get_water_today(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today = date.today()
    log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == today,
    ).first()
    if not log:
        return {"glasses": 0, "target_glasses": 8, "date": today.isoformat()}
    return {"glasses": log.glasses, "target_glasses": log.target_glasses, "date": today.isoformat()}


@router.patch("/water/today")
async def update_water_today(
    data: WaterUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today = date.today()
    log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == today,
    ).first()
    if not log:
        log = WaterLog(user_id=current_user.id, date=today, glasses=data.glasses, target_glasses=data.target_glasses or 8)
        db.add(log)
    else:
        log.glasses = max(0, data.glasses)
        if data.target_glasses:
            log.target_glasses = data.target_glasses
    db.commit()
    return {"glasses": log.glasses, "target_glasses": log.target_glasses, "date": today.isoformat()}


# ── Weekly Adherence ──────────────────────────────────────────────────────────

@router.get("/sessions/week")
async def get_week_adherence(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Returns completed workout sessions for the current Mon-Sun week."""
    today = date.today()
    # Start of week (Monday)
    week_start = today - timedelta(days=today.weekday())
    week_end   = week_start + timedelta(days=6)

    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.COMPLETED,
            func.date(WorkoutSession.completed_at) >= week_start,
            func.date(WorkoutSession.completed_at) <= week_end,
        )
        .all()
    )

    # Build day map: weekday (0=Mon) → session info
    day_map = {}
    for s in sessions:
        if s.completed_at:
            wd = s.completed_at.weekday()  # 0=Mon
            day_map[wd] = {
                "day_name": s.completed_at.strftime("%A"),
                "program_name": getattr(s, "program_name", None),
                "duration_minutes": s.duration_minutes,
            }

    days = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i, name in enumerate(day_names):
        day_date = week_start + timedelta(days=i)
        days.append({
            "weekday": i,
            "short_name": name,
            "date": day_date.isoformat(),
            "is_today": day_date == today,
            "is_past": day_date < today,
            "completed": i in day_map,
            "session": day_map.get(i),
        })

    return {"days": days, "total_completed": len(day_map), "week_start": week_start.isoformat()}
