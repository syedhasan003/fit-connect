from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.user_gym import UserGymLink
from app.models.workout_log import WorkoutLog
from app.models.weight_log import WeightLog
from app.schemas.workout_log import WorkoutLogCreate, WorkoutLogOut
from app.schemas.weight_log import WeightLogCreate, WeightLogOut

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/workout", response_model=WorkoutLogOut)
def log_workout(
    payload: WorkoutLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(UserGymLink).filter(
        UserGymLink.user_id == current_user.id
    ).first()

    if not link:
        raise Exception("User has no selected gym")

    log = WorkoutLog(
        user_id=current_user.id,
        gym_id=link.gym_id,
        workout_type=payload.workout_type,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.post("/weight", response_model=WeightLogOut)
def log_weight(
    payload: WeightLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = WeightLog(
        user_id=current_user.id,
        weight=payload.weight,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/summary")
def progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workouts = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == current_user.id
    ).count()

    latest_weight = db.query(WeightLog).filter(
        WeightLog.user_id == current_user.id
    ).order_by(WeightLog.created_at.desc()).first()

    return {
        "total_workouts": workouts,
        "latest_weight": latest_weight.weight if latest_weight else None,
    }
