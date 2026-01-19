from typing import Dict, Any
from datetime import datetime, timedelta


class ReminderReasoningAgent:
    """
    Interprets reminder-related intent and behavior.
    This agent NEVER talks directly to the user.
    """

    async def reason(
        self,
        *,
        text: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Returns an ACTION PLAN for Central, not user output.
        """

        lowered = text.lower()

        # -----------------------------------------
        # CREATE REMINDER
        # -----------------------------------------
        if "remind" in lowered or "schedule" in lowered:
            return {
                "action": "create_reminder",
                "confidence": 0.95,
                "data": {
                    "message": text,
                    "suggested_time": self._infer_time(lowered),
                }
            }

        # -----------------------------------------
        # SOFT MISSED BEHAVIOR (future use)
        # -----------------------------------------
        if "forgot" in lowered or "missed" in lowered:
            return {
                "action": "acknowledge_miss",
                "confidence": 0.7,
                "data": {
                    "tone": "supportive"
                }
            }

        # -----------------------------------------
        # NO ACTION
        # -----------------------------------------
        return {
            "action": "none",
            "confidence": 0.2
        }

    # ---------------------------------------------
    # INTERNAL HELPERS
    # ---------------------------------------------

    def _infer_time(self, text: str):
        """
        Very conservative time inference (expand later).
        """
        now = datetime.utcnow()

        if "tomorrow" in text:
            return (now + timedelta(days=1)).replace(hour=9, minute=0)

        if "evening" in text:
            return now.replace(hour=19, minute=0)

        return None
