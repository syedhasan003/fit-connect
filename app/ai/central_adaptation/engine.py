from typing import Dict, List

from app.ai.central_adaptation.task_analyzer import analyze_tasks
from app.ai.central_adaptation.exercise_substitution import (
    suggest_exercise_substitution,
)
from app.exercise_intelligence.models.exercise import Exercise


def build_adaptive_decisions(
    *,
    tasks: List,
    exercises: List[Exercise],
) -> Dict:
    """
    Builds agentic decisions based on task failures and exercise intelligence.
    """

    signals = analyze_tasks(tasks)

    decisions = []

    if signals["missed_workouts"] >= 2:
        decisions.append({
            "action": "reduce_workout_intensity",
            "reason": "Multiple workouts missed recently"
        })

    if signals["missed_diets"] >= 2:
        decisions.append({
            "action": "simplify_diet_plan",
            "reason": "Diet adherence is low"
        })

    return {
        "signals": signals,
        "decisions": decisions
    }
