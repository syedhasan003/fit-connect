from typing import Dict, Any, List
from collections import Counter
from sqlalchemy.orm import Session

from app.models.health_memory import HealthMemory


class PreferenceReader:
    """
    Reads BEHAVIORAL signals only.
    Never writes. Never reasons. Never interprets content.
    """

    @staticmethod
    def read(
        *,
        user_id: int,
        db: Session,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Returns a stable preference snapshot derived from behavioral signals.
        """

        memories: List[HealthMemory] = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.user_id == user_id,
                HealthMemory.category == "ai_insight",
            )
            .order_by(HealthMemory.created_at.desc())
            .limit(limit)
            .all()
        )

        if not memories:
            return {}

        signal_counts = Counter()
        values_by_signal: Dict[str, List[Any]] = {}

        for m in memories:
            content = m.content or {}
            signal = content.get("signal")
            value = content.get("value")

            if not signal:
                continue

            signal_counts[signal] += 1
            values_by_signal.setdefault(signal, []).append(value)

        # ------------------------------
        # DERIVED PREFERENCES (SAFE)
        # ------------------------------
        preferences: Dict[str, Any] = {}

        # Scope preference
        scope_values = values_by_signal.get("user_scope_preference", [])
        if scope_values:
            preferences["preferred_scope"] = Counter(scope_values).most_common(1)[0][0]

        # Primary agent tendency
        primary_agents = values_by_signal.get("primary_agent_used", [])
        if primary_agents:
            preferences["preferred_primary_agent"] = (
                Counter(primary_agents).most_common(1)[0][0]
            )

        # Intent stability
        intents = values_by_signal.get("intent_observed", [])
        if intents:
            preferences["dominant_intent"] = Counter(intents).most_common(1)[0][0]

        # Secondary suppression frequency
        preferences["secondary_agent_suppression_rate"] = signal_counts.get(
            "secondary_agent_suppressed", 0
        )

        return preferences
