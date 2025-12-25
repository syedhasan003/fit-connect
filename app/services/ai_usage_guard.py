from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user_ai_usage import UserAIUsage


FREE_PROMPT_LIMIT = 5


def check_and_increment_usage(db: Session, user_id: int):
    usage = db.query(UserAIUsage).filter_by(user_id=user_id).first()

    if not usage:
        usage = UserAIUsage(user_id=user_id, prompts_used=0)
        db.add(usage)
        db.commit()
        db.refresh(usage)

    if usage.prompts_used >= FREE_PROMPT_LIMIT:
        raise HTTPException(
            status_code=402,
            detail="Free AI limit reached. Please subscribe to continue."
        )

    usage.prompts_used += 1
    db.commit()
