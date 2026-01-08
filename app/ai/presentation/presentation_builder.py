from typing import Dict, List


# -------------------------------------------------
# Deterministic action → UX mapping
# -------------------------------------------------

ACTION_PRESENTATION_MAP = {
    "reduce_workout_intensity": {
        "title": "Workout adjusted",
        "severity": "low",
        "requires_confirmation": False,
        "summary": "I slightly reduced today’s workout intensity.",
        "what_it_means": "This helps you stay consistent without overloading your body."
    },
    "simplify_workout_plan": {
        "title": "Workout simplified",
        "severity": "medium",
        "requires_confirmation": False,
        "summary": "I simplified today’s workout plan.",
        "what_it_means": "This makes today’s session easier to complete."
    },
    "substitute_exercise": {
        "title": "Exercise substituted",
        "severity": "medium",
        "requires_confirmation": True,
        "summary": "I swappedrcise for a safer alternative.",
        "what_it_means": "The replacement targets the same muscles with less fatigue."
    },
    "simplify_diet_plan": {
        "title": "Diet adjusted",
        "severity": "low",
        "requires_confirmation": False,
        "summary": "I slightly simplified today’s calorie target.",
        "what_it_means": "This improves adherence without affecting progress."
    },
}


# -------------------------------------------------
# Presentation Builder
# -------------------------------------------------

def build_presentation(decision: Dict) -> Dict:
    """
    Converts a machine decision into a user-facing explanation block.
    No LLM. No side effects.
    """

    action = decision.get("action")
    reason = decision.get("reason", "")

    meta = ACTION_PRESENTATION_MAP.get(action)

    if not meta:
        # Fallback — never break UX
        return {
            "title": "Plan updated",
            "summary": "Your plan was updated to better support you.",
            "why": re,
            "what_it_means": "This change was made to improve consistency.",
            "severity": "low",
            "requires_confirmation": False,
        }

    return {
        "title": meta["title"],
        "summary": meta["summary"],
        "why": reason,
        "what_it_means": meta["what_it_means"],
        "severity": meta["severity"],
        "requires_confirmation": meta["requires_confirmation"],
    }


def build_presentations(decisions: List[Dict]) -> List[Dict]:
    """
    Builds presentation blocks for multiple decisions.
    """
    return [build_presentation(d) for d in decisions]
