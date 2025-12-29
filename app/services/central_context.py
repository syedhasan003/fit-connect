from datetime import date
from sqlalchemy.orm import Session

from app.models.health_memory import HealthMemory
from app.models.library_item import LibraryItem
from app.services.central_daily_state import get_daily_health_state


def build_central_context(db: Session, user_id: int) -> str:
    """
    Builds full user context for Central AI.
    DEMO-SAFE: deterministic, read-only aggregation.
    """

    # ----------------------------
    # DAILY HEALTH STATE (NEW)
    # ----------------------------
    daily_state = get_daily_health_state(
        db=db,
        user_id=user_id,
        target_date=date.today()
    )

    daily_state_text = f"""
Daily Health State:
- Date: {daily_state["date"]}
- Workout Status: {daily_state["workout_status"]}
- Workout Reminder: {daily_state["reminder_status"]["workout"]}
- Nutrition Reminder: {daily_state["reminder_status"]["nutrition"]}
- Confidence Level: {daily_state["confidence_level"]}
"""

    # ----------------------------
    # HEALTH MEMORY
    # ----------------------------
    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == user_id)
        .order_by(HealthMemory.created_at.desc())
        .limit(20)
        .all()
    )

    memory_text = "\n".join(
        f"- [{m.category}] {m.content}"
        for m in memories
    ) or "No prior health memory."

    # ----------------------------
    # LIBRARY / UPLOADED FILES
    # ----------------------------
    library_items = (
        db.query(LibraryItem)
        .filter(LibraryItem.user_id == user_id)
        .order_by(LibraryItem.created_at.desc())
        .all()
    )

    library_text = "\n".join(
        f"- {item.file_type} | {item.category} | {item.file_path}"
        for item in library_items
    ) or "No uploaded files."

    # ----------------------------
    # FINAL CONTEXT
    # ----------------------------
    return f"""
{daily_state_text}

Health Memory:
{memory_text}

Uploaded Documents:
{library_text}
"""
