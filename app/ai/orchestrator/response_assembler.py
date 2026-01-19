from typing import List, Dict, Any


def assemble_curated_responses(
    *,
    decisions: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Central-authoritative response assembler.

    RULES (NON-NEGOTIABLE):
    - ONLY the primary decision is exposed to the user
    - Secondary agent outputs are hidden (kept for memory / adaptation)
    - This layer performs PRESENTATION ONLY
    - No business logic, no intent logic, no agent logic
    """

    if not decisions:
        return []

    # Central guarantees decisions are pre-ranked
    primary = decisions[0]
    result = primary.get("result", {})

    response_type = result.get("type", "inform")

    if response_type == "workout_plan":
        return [_assemble_workout(result)]

    if response_type == "nutrition":
        return [_assemble_nutrition(result)]

    # ------------------------------
    # SAFE GENERIC FALLBACK
    # ------------------------------
    return [{
        "type": "message",
        "source": "central",
        "content": result
    }]


# ======================================================
# WORKOUT PRESENTATION (STRICT ISOLATION, ENRICHED)
# ======================================================

def _assemble_workout(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Presentation-only workout assembler.

    - NO new exercises
    - NO new muscle groups
    - ONLY ergonomic, safety, and clarity enrichment
    """

    return {
        "type": "workout_plan",
        "source": "coach",
        "title": result.get("title", "Workout Plan"),
        "exercises": result.get("workout", []),

        # -------------------------------------------------
        # PRESENTATION ENRICHMENT (ALLOWED)
        # -------------------------------------------------
        "guidance": {
            "rest_between_sets": "60–90 seconds between sets",
            "hydration": (
                "Sip water between sets. "
                "Aim for ~500–750 ml during the workout."
            ),
            "warmup": (
                "5–10 minutes of light cardio and mobility "
                "focused only on the trained muscle group."
            ),
            "cooldown": (
                "3–5 minutes of light stretching "
                "for the worked muscles only."
            ),
            "form_cues": [
                "Use a controlled tempo",
                "Maintain full range of motion",
                "Stop the set if form breaks down"
            ],
            "safety_notes": [
                "Muscle fatigue is expected; sharp pain is not",
                "Reduce volume or intensity if you are new or returning"
            ]
        }
    }


# ======================================================
# NUTRITION PRESENTATION (ISOLATED, FUTURE-SAFE)
# ======================================================

def _assemble_nutrition(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Nutrition presentation.

    Central guarantees this is only called
    when nutrition is explicitly requested or approved.
    """

    return {
        "type": "nutrition",
        "source": "dietician",
        "summary": result.get("summary"),
        "calories": result.get("calories"),
        "macros": result.get("macros"),
        "food_examples": result.get("food_examples"),
        "hydration": result.get("hydration"),
        "safety_notes": result.get("safety_notes"),
    }
