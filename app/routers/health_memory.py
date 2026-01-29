from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.health_memory import HealthMemory
from app.services.vault_mirror import VaultMirrorService

router = APIRouter(
    prefix="/health-memory",
    tags=["Health Memory"],
)

vault_mirror = VaultMirrorService()


# -------------------------------------------------
# LIST HEALTH MEMORIES
# -------------------------------------------------
@router.get("/")
def list_health_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


# -------------------------------------------------
# CREATE HEALTH MEMORY (AUTO MIRROR → VAULT)
# -------------------------------------------------
@router.post("/")
def create_health_memory(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if "category" not in payload:
        raise HTTPException(status_code=422, detail="category is required")

    if "content" not in payload:
        raise HTTPException(status_code=422, detail="content is required")

    memory = HealthMemory(
        user_id=current_user.id,
        category=payload["category"],
        source=payload.get("source", "manual"),
        content=payload["content"],
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    # 🔥 Mirror into Vault (contract now matches)
    vault_mirror.mirror_memory(
        db=db,
        user=current_user,
        memory=memory,
    )

    return {
        "id": memory.id,
        "category": memory.category,
        "source": memory.source,
        "content": memory.content,
        "created_at": memory.created_at,
    }
