"""
Internal schema for Central Reasoning output.

RULES:
- Not user-facing
- Not API-facing
- Consumed by planners / generators
- Deterministic only (no LLM decisions)
"""

from typing import List, Dict, Literal, TypedDict


ReasoningActionType = Literal[
    "adjust_reminder_time",
    "suggest_lighter_workout",
    "suggest_rest_day",
    "request_user_feedback",
    "no_action",
]


class ReasoningDecision(TypedDict):
    action: ReasoningActionType
    reason: str


class CentralReasoningOutput(TypedDict):
    reasoning_type: str
    why: List[str]
    signals_used: List[str]
    decisions: List[ReasoningDecision]
    confidence_score: float
    time_window: str
    generated_at: str
