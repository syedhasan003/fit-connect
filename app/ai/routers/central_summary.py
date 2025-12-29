from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.central import CentralQuestion
from app.ai.central_summaries.range_resolver import resolve_time_range
from app.ai.central_summaries.central_summary_service import build_central_summary

router = APIRouter(
    prefix="/ai/central",
    tags=["Central Summary"]
)


@router.post("/summary")
def central_summary(
    payload: CentralQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Central Summary Engine

    Examples:
    - How did I do this week?
    - Show my last 30 days
    - How consistent was I in the last 3 months?
    """

    # 1️⃣ Resolve time range
    time_range = resolve_time_range(payload.question)

    # 2️⃣ Build summary
    summary = build_central_summary(
        db=db,
        user_id=current_user.id,
        start_date=time_range["start_date"],
        end_date=time_range["end_date"],
        granularity=time_range["granularity"],
    )

    return {
        "question": payload.question,
        "time_range": time_range,
        "summary": summary,
    }
