def build_follow_up(action: str) -> str | None:
    """
    Optional follow-up question when confirmation is needed.
    """

    followups = {
        "reduce_workout_intensity":
            "Do you want me to keep workouts lighter this week, or return to your original plan?",

        "simplify_diet_plan":
            "Would you like to keep this simpler plan going forward?",
    }

    return followups.get(action)
