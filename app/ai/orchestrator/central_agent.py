from typing import Dict, Any, List

from app.ai.intent_router import classify_intent, Intent
from app.ai.agents.reminder_reasoning_agent import ReminderReasoningAgent

# Phase 5: Preference Reader (READ-ONLY)
from app.ai.memory.preference_reader import PreferenceReader

# Phase 8: Workout Constraints (READ-ONLY)
from app.ai.central_reasoning.workout_constraints import extract_workout_constraints

# Phase 9.1: Gym Context Resolver (READ-ONLY)
from app.ai.central_reasoning.gym_context_resolver import resolve_gym_context


class CentralAgent:
    """
    Central is the authority brain.

    RESPONSIBILITIES:
    - Interpret user intent
    - Decide WHICH agent(s) may act
    - Enforce primary vs secondary scope
    - Produce ranked decisions ONLY (no presentation)
    - READ behavioral preferences (Phase 5)
    - READ workout constraints (Phase 8)
    - READ gym context (Phase 9.1)
    """

    def __init__(self, registry, collab_manager):
        self.registry = registry
        self.collab = collab_manager
        self.reminder_agent = ReminderReasoningAgent()

    # ======================================================
    # ENTRYPOINT
    # ======================================================

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        goal_text: str = payload["input"]["goal_text"]
        context: Dict[str, Any] = payload.get("context", {}) or {}

        intent = classify_intent(goal_text)
        decisions: List[Dict[str, Any]] = []

        # --------------------------------------------------
        # PHASE 5: READ BEHAVIORAL PREFERENCES (READ-ONLY)
        # --------------------------------------------------
        preferences: Dict[str, Any] = {}
        try:
            user = context.get("user")
            db = context.get("db")
            if user and db:
                preferences = PreferenceReader.read(
                    user_id=user["id"],
                    db=db,
                )
                if preferences:
                    print("[CENTRAL][PREFERENCES]", preferences)
        except Exception:
            pass  # MUST never block

        # --------------------------------------------------
        # PHASE 8: WORKOUT CONSTRAINT EXTRACTION (READ-ONLY)
        # --------------------------------------------------
        constraints: Dict[str, Any] = {}
        try:
            constraints = extract_workout_constraints(goal_text) or {}
            if constraints:
                print("[CENTRAL][CONSTRAINTS]", constraints)
        except Exception:
            constraints = {}

        # --------------------------------------------------
        # PHASE 9.1: GYM CONTEXT RESOLUTION (READ-ONLY)
        # --------------------------------------------------
        gym_context: Dict[str, Any] = {}
        try:
            user = context.get("user")
            db = context.get("db")
            if user and db:
                gym_context = resolve_gym_context(
                    user_id=user["id"],
                    db=db,
                ) or {}
                if gym_context:
                    print("[CENTRAL][GYM_CONTEXT]", gym_context)
        except Exception:
            gym_context = {}

        # --------------------------------------------------
        # FITNESS / TRAINING / GENERAL GUIDANCE
        # --------------------------------------------------
        if intent in {Intent.RAG_QUESTION, Intent.LLM_ONLY}:
            decisions = await self._handle_training(goal_text)

        # --------------------------------------------------
        # REMINDERS (AGENTIC – NOT CRUD)
        # --------------------------------------------------
        elif intent in {
            Intent.REMINDER_CREATE,
            Intent.REMINDER_LIST,
            Intent.REMINDER_UPDATE,
        }:
            reasoning = await self.reminder_agent.reason(
                text=goal_text,
                context=context,
            )

            decisions.append({
                "agent": "reminder_reasoning",
                "confidence": reasoning.get("confidence", 0.6),
                "result": reasoning,
                "primary": True,
            })

        # --------------------------------------------------
        # SAFE FALLBACK
        # --------------------------------------------------
        else:
            decisions.append({
                "agent": "system",
                "confidence": 0.6,
                "result": {
                    "type": "message",
                    "content": "I understand. Tell me what you’d like help with."
                },
                "primary": True,
            })

        # --------------------------------------------------
        # CENTRAL FINALIZATION
        # --------------------------------------------------
        return {
            "final": {
                "goal": goal_text,
                "intent": intent.value,
                "constraints": constraints,     # Phase 8
                "preferences": preferences,    # Phase 5
                "gym_context": gym_context,    # Phase 9.1
                "decisions": self._prune_and_rank(decisions),
            }
        }

    # ======================================================
    # TRAINING HANDLER (PRIMARY + MICRO ENRICHMENT)
    # ======================================================

    async def _handle_training(self, goal_text: str) -> List[Dict[str, Any]]:
        decisions: List[Dict[str, Any]] = []

        coach = self.registry.get_agent("coach")
        if not coach:
            return decisions

        coach_result = await coach.respond(goal_text)

        # --------------------------------------------------
        # MICRO NUTRITION ENRICHMENT (SUPPORT ONLY)
        # --------------------------------------------------
        if self._needs_nutrition_support(goal_text):
            dietician = self.registry.get_agent("dietician")
            if dietician:
                diet_result = await dietician.respond(goal_text)
                coach_result["nutrition_hint"] = {
                    "protein": (
                        diet_result.get("macros", {}).get("protein")
                        or "≈1.6–2.2 g per kg bodyweight"
                    ),
                    "note": "Adequate protein supports muscle recovery and growth"
                }

        decisions.append({
            "agent": "coach",
            "confidence": coach_result.get("confidence", 0.85),
            "result": coach_result,
            "primary": True,
        })

        return decisions

    # ======================================================
    # CENTRAL AUTHORITY RULES
    # ======================================================

    def _needs_nutrition_support(self, text: str) -> bool:
        keywords = {
            "diet", "nutrition", "protein",
            "calories", "meal", "food", "macro"
        }
        lowered = text.lower()
        return any(k in lowered for k in keywords)

    def _prune_and_rank(self, decisions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid = [
            d for d in decisions
            if d.get("result") and d.get("confidence", 0) >= 0.4
        ]

        if not valid:
            return []

        primary = next((d for d in valid if d.get("primary")), valid[0])
        return [primary]
