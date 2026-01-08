"""
Central Reasoning Engine.

Consumes deterministic summaries and produces:
- WHY something happened
- WHAT should happen next
"""

from typing import Dict, Optional
from datetime import datetime

from app.ai.central_reasoning.rules import (
    detect_workout_regression,
    detect_reminder_issues,
    derive_decisions,
)
from app.ai.schema.central_reasoning_schema import CentralReasoningOutput
from app.ai.central.time_provider import TimeProvider


class CentralReasoningEngine:
    def __init__(self, time_provider: TimeProvider):
        self.time_provider = time_provider

    def analyze(
        self,
        *,
        summary: Dict,
        time_window: str,
        adaptive_context: Optional[Dict] = None,
    ) -> CentralReasoningOutput:
        """
        adaptive_context (optional):
        - signals from tasks (missed workouts, diets, etc.)
        - exercise substitution suggestions
        """

        why: list[str] = []
        signals_used: list[str] = []

        # ------------------
        # Existing logic (UNCHANGED)
        # ------------------
        workout_reasons = detect_workout_regression(summary)
        if workout_reasons:
            why.extend(workout_reasons)
            signals_used.append("workouts")

        reminder_reasons = detect_reminder_issues(summary)
        if reminder_reasons:
            why.extend(reminder_reasons)
            signals_used.append("reminders")

        decisions = derive_decisions(why)

        # ------------------
        # NEW: Adaptive reasoning hook (SAFE & OPTIONAL)
        # ------------------
        if adaptive_context:
            adaptive_decisions = adaptive_context.get("decisions", [])
            if adaptive_decisions:
                decisions.extend(adaptive_decisions)
                signals_used.append("adaptive")

        confidence_score = (
            0.9 if decisions and decisions[0]["action"] != "no_action" else 0.6
        )

        return {
            "reasoning_type": "behavior_analysis",
            "why": why,
            "signals_used": signals_used,
            "decisions": decisions,
            "confidence_score": confidence_score,
            "time_window": time_window,
            "generated_at": self.time_provider.now().isoformat(),
        }
