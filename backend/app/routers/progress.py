from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database.session import get_session
from app.core.auth_deps import get_current_user
from app.models.progress import Progress

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("/")
def get_progress(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    progress = session.exec(
        select(Progress).where(Progress.user_email == current_user)
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="No progress found")

    return progress


@router.put("/")
def update_progress(
    weight_kg: float,
    body_fat: float | None = None,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    progress = session.exec(
        select(Progress).where(Progress.user_email == current_user)
    ).first()

    if not progress:
        progress = Progress(
            user_email=current_user,
            weight_kg=weight_kg,
            body_fat=body_fat
        )
        session.add(progress)
    else:
        progress.weight_kg = weight_kg
        progress.body_fat = body_fat

    session.commit()
    session.refresh(progress)

    return {"message": "Progress updated ✅"}
