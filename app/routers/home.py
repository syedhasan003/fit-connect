from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.home_service import HomeService

router = APIRouter(prefix="/home", tags=["Home"])

home_service = HomeService()


@router.get("/")
def get_home(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return home_service.build_home(db, current_user)
