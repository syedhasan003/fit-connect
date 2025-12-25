from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List

from app.db.database import get_db
from app.models.visit import Visit
from app.schemas.visit import VisitCreate, VisitOut
from app.deps import get_current_user
from app.services.roles import require_roles

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ===== USER ACTION: RECORD A VISIT =====
# Users can visit a gym, so this stays open to all authenticated users
@router.post("/visit", response_model=VisitOut)
def record_visit(
    payload: VisitCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    visit = Visit(gym_id=payload.gym_id, user_id=payload.user_id)
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


# ===== ADMIN ONLY: COUNT VISITS OF A GYM =====
@router.get(
    "/gym/{gym_id}/visits",
    dependencies=[Depends(require_roles(["admin"]))]
)
def gym_visits_count(
    gym_id: int,
    start: str = None,
    end: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(func.count(Visit.id)).filter(Visit.gym_id == gym_id)

    if start:
        try:
            s = datetime.fromisoformat(start)
            q = q.filter(Visit.created_at >= s)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid start date format, use ISO")

    if end:
        try:
            e = datetime.fromisoformat(end)
            q = q.filter(Visit.created_at < e)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid end date format, use ISO")

    count = q.scalar() or 0
    return {"gym_id": gym_id, "visits": count}


# ===== ADMIN ONLY: TOP GYMS BY VISITS =====
@router.get(
    "/top-gyms",
    dependencies=[Depends(require_roles(["admin"]))]
)
def top_gyms(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    q = (
        db.query(Visit.gym_id, func.count(Visit.id).label("cnt"))
        .group_by(Visit.gym_id)
        .order_by(func.count(Visit.id).desc())
        .limit(limit)
    )

    results = [{"gym_id": r.gym_id, "visits": r.cnt} for r in q.all()]
    return results
