from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.health_memory import HealthMemory
from app.services.health_memory_correction_service import HealthMemoryCorrectionService
from app.services.daily_snapshot_service import DailySnapshotService

router = APIRouter(
    prefix="/internal/health-memory",
    tags=["Internal Health Memory"],
)

correction_service = HealthMemoryCorrectionService()
snapshot_service = DailySnapshotService()


@router.post("/correct/{memory_id}")
def correct_health_memory(
    memory_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Central-only correction of health memory.
    Automatically rebuilds daily snapshot.
    """

    memory = correction_service.correct_memory(
        db=db,
        user_id=current_user.id,
        memory_id=memory_id,
        corrected_content=payload,
    )

    # 🔁 REBUILD DAILY SNAPSHOT FOR THAT DAY
    snapshot_service.build_snapshot(
        db=db,
        user_id=current_user.id,
        target_date=memory.created_at.date(),
    )

    return {
        "status": "ok",
        "memory_id": memory.id,
        "snapshot_rebuilt": True,
    }
