from sqlalchemy.orm import Session
from app.models.health_memory import HealthMemory
from app.models.library_item import LibraryItem


def build_central_context(db: Session, user_id: int) -> str:
    """
    Builds full user context for Central AI
    """

    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == user_id)
        .order_by(HealthMemory.created_at.desc())
        .limit(20)
        .all()
    )

    library_items = (
        db.query(LibraryItem)
        .filter(LibraryItem.user_id == user_id)
        .order_by(LibraryItem.created_at.desc())
        .all()
    )

    memory_text = "\n".join(
        f"- [{m.category}] {m.content}"
        for m in memories
    ) or "No prior health memory."

    library_text = "\n".join(
        f"- {item.file_type} | {item.category} | {item.file_path}"
        for item in library_items
    ) or "No uploaded files."

    return f"""
Health Memory:
{memory_text}

Uploaded Documents:
{library_text}
"""
