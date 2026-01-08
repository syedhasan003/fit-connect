from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.library_item import LibraryItem
from app.models.user import User
from app.deps import get_current_user
from app.schemas.central import CentralQuestion, CentralAnswer

router = APIRouter(prefix="/ai/central", tags=["Central AI"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.post("/ask", response_model=CentralAnswer)
def ask_central_ai(
    payload: CentralQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Central AI Brain (STABLE)

    - Reads onboarding memory
    - Reads reminder behavior
    - Reads adaptation insights
    - Reads uploaded documents + image analysis
    - Responds with reasoning
    - Stores AI insight back into memory
    """

    question = payload.question  # ✅ SINGLE SOURCE OF TRUTH

    # --------------------------------------------------
    # Fetch latest memories
    # --------------------------------------------------
    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == current_user.id)
        .order_by(HealthMemory.created_at.desc())
        .limit(25)
        .all()
    )

    onboarding = []
    behavior = []
    adaptations = []
    ai_insights = []

    for m in memories:
        if m.category.startswith("onboarding"):
            onboarding.append(m.content)
        elif m.category == "reminder_behavior":
            behavior.append(m.content)
        elif m.category == "adaptation_insight":
            adaptations.append(m.content)
        elif m.category == "ai_insight":
            ai_insights.append(m.content)

    # --------------------------------------------------
    # Fetch uploaded documents
    # --------------------------------------------------
    library_items = (
        db.query(LibraryItem)
        .filter(LibraryItem.user_id == current_user.id)
        .order_by(LibraryItem.created_at.desc())
        .all()
    )

    # --------------------------------------------------
    # Build context
    # --------------------------------------------------
    onboarding_text = "\n".join(onboarding) or "No onboarding data."
    behavior_text = "\n".join(behavior) or "No reminder behavior recorded."
    adaptation_text = "\n".join(adaptations) or "No adaptations generated."
    library_text = (
        "\n".join(
            f"{item.file_type} | {item.category} | {item.file_path}"
            for item in library_items
        )
        or "No uploaded documents."
    )

    system_prompt = f"""
You are FitNova Central AI.

ROLE:
You help users improve fitness consistency using behavioral memory and reasoning.

STRICT SAFETY RULES:
- You are NOT a doctor
- No diagnosis
- No prescriptions
- Always suggest professional consultation when medical uncertainty exists
- Be supportive, never judgmental
- Explain *why* patterns happen

USER ONBOARDING:
{onboarding_text}

REMINDER BEHAVIOR:
{behavior_text}

ADAPTATION INSIGHTS:
{adaptation_text}

UPLOADED DOCUMENTS:
{library_text}
"""

    # --------------------------------------------------
    # Call OpenAI
    # --------------------------------------------------
    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    answer = response.output_text.strip()

    # --------------------------------------------------
    # Store AI insight
    # --------------------------------------------------
    db.add(
        HealthMemory(
            user_id=current_user.id,
            category="ai_insight",
            content=answer,
        )
    )
    db.commit()

    return CentralAnswer(
        question=question,
        answer=answer,
    )
