from typing import Optional, Literal
from pydantic import BaseModel


class CuratedAnswer(BaseModel):
    """
    Final curated response sent to frontend.

    This is NOT raw LLM output.
    This is safe, explainable, and UI-ready.
    """

    response_type: Literal["inform", "ask", "warn"]
    tone: Literal["supportive", "neutral", "firm"]

    message: str
    follow_up: Optional[str] = None
    cta: Optional[str] = None

    confidence: float
