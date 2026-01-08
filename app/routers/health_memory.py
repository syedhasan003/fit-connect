from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/health-memory", tags=["Health Memory"])


@router.post("/", response_model=dict)
def create_memory(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory = HealthMemory(
        user_id=current_user.id,
        category=data.get("category"),
        content=data.get("content"),
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return {"id": memory.id}


@router.get("/", response_model=List[dict])
def list_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == current_user.id)
        .order_by(HealthMemory.created_at.desc())
        .all()
    )

    return [
        {
            "id": m.id,
            "category": m.category,
            "content": m.content,
            "created_at": m.created_at,
        }
        for m in memories
    ]
