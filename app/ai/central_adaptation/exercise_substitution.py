from typing import Optional
from app.exercise_intelligence.models.exercise import Exercise


def suggest_exercise_substitution(
    *,
    failed_exercise: Exercise,
    all_exercises: list[Exercise],
) -> Optional[Exercise]:
    """
    Suggests a safer/lower-fatigue alternative
    within the same movement pattern.
    """

    candidates = [
        ex for ex in all_exercises
        if ex.movement_pattern == failed_exercise.movement_pattern
        and ex.fatigue_profile != failed_exercise.fatigue_profile
        and ex.id != failed_exercise.id
    ]

    if not candidates:
        return None

    # Prefer lower fatigue options
    candidates.sort(key=lambda e: e.fatigue_profile.value)
    return candidates[0]
