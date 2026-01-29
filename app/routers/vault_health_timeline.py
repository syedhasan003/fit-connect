from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.health_timeline_service import HealthTimelineService

router = APIRouter(
    prefix="/vault/health-timeline",
    tags=["Vault"],
)

service = HealthTimelineService()


@router.get("/")
def get_health_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Read-only health timeline.
    Immutable, doctor-safe, AI-ready.
    """
    return {
        "type": "health_timeline",
        "read_only": True,
        "items": service.get_timeline(
            db=db,
            user_id=current_user.id,
        ),
    }
