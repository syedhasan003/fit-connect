from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User

from app.ai.orchestrator.engine import OrchestratorEngine

router = APIRouter(
    prefix="/diet",
    tags=["Diet AI"],
)

engine = OrchestratorEngine()


@router.post("/central")
async def diet_central(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Diet-safe AI entrypoint.
    Frontend must ONLY call this endpoint for diet intelligence.
    """

    goal = payload.get("goal")
    if not goal:
        raise HTTPException(status_code=400, detail="Missing goal")

    result = await engine.handle(
        user_id=str(current_user.id),
        message=goal,
        short_history=None,
        profile=None,
        memory=None,
        goals=None,
    )

    structured = result.get("structured_output", {})

    return {
        "status": "ok",
        "goal": goal,
        "responses": [
            {
                "response_type": structured.get("response_type", "inform"),
                "tone": structured.get("tone", "neutral"),
                "message": structured.get("message", ""),
                "follow_up": structured.get("follow_up"),
                "cta": structured.get("cta"),
                "confidence": structured.get("confidence", 0.5),
            }
        ],
        "ui_hints": {
            "surface": "diet",
            "intent": "diet",
        },
        "data": structured.get("data", {}),
    }
