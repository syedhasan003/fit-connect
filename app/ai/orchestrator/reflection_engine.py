from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.ai.memory.memory_writer import persist_health_memory


class ReflectionEngine:
    """
    Central self-observation engine.

    Stores BEHAVIORAL signals, never raw content.
    """

    @staticmethod
    def reflect(
        *,
        user_id: int,
        intent: str,
        decisions: List[Dict[str, Any]],
        db: Session,
    ) -> None:
        if not decisions:
            return

        primary = decisions[0]
        primary_agent = primary.get("agent")

        secondary_agents = [
            d.get("agent")
            for d in decisions[1:]
            if d.get("agent")
        ]

        signals = []

        # -----------------------------------------
        # PRIMARY AGENT SIGNAL
        # -----------------------------------------
        signals.append({
            "signal": "primary_agent_used",
            "value": primary_agent,
        })

        # -----------------------------------------
        # SECONDARY SUPPRESSION SIGNAL
        # -----------------------------------------
        if secondary_agents:
            signals.append({
                "signal": "secondary_agent_suppressed",
                "value": secondary_agents,
            })

        # -----------------------------------------
        # SCOPE PREFERENCE SIGNAL
        # -----------------------------------------
        if primary_agent == "coach":
            signals.append({
                "signal": "user_scope_preference",
                "value": "workout_only",
            })

        if primary_agent == "dietician":
            signals.append({
                "signal": "user_scope_preference",
                "value": "nutrition_only",
            })

        # -----------------------------------------
        # INTENT STABILITY SIGNAL
        # -----------------------------------------
        signals.append({
            "signal": "intent_observed",
            "value": intent,
        })

        # -----------------------------------------
        # PERSIST AS BEHAVIORAL MEMORY
        # -----------------------------------------
        for s in signals:
            persist_health_memory(
                user_id=user_id,
                category="ai_insight",
                source="system",
                content=s,
                db=db,
            )
