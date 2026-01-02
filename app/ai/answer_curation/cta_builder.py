from typing import Optional


def build_cta(
    *,
    requires_confirmation: bool,
    action: str,
) -> Optional[str]:
    """
    Builds a call-to-action (CTA) if needed.
    """

    if not requires_confirmation:
        return None

    if action == "reduce_workout_intensity":
        return "Would you like me to keep workouts lighter for a few days?"

    if action == "simplify_diet_plan":
        return "Should I keep your diet plan simpler this week?"

    return "Would you like to proceed?"
