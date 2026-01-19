from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.deps import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/health-memory",
    tags=["Health Memory"],
)


@router.get("/")
def list_health_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the user's most recent health memories.
    """

    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == current_user.id)
        .order_by(HealthMemory.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": m.id,
            "category": m.category,
            "source": m.source,
            "content": m.content,
            "created_at": m.created_at,
        }
        for m in memories
    ]
