from typing import List, Dict
from copy import deepcopy

from app.tasks.models.enums import TaskType
from app.exercise_intelligence.models.exercise import Exercise
from app.ai.central_adaptation.exercise_substitution import (
    suggest_exercise_substitution,
)


def apply_adaptive_decisions(
    *,
    tasks: List,
    decisions: List[Dict],
    all_exercises: List[Exercise],
) -> List[Dict]:
    """
    Applies adaptive decisions to today's tasks.

    Returns MODIFIED task payloads (no DB writes here).
    """

    updated_tasks = []

    for task in tasks:
        task_payload = deepcopy(task.planned_payload or {})
        task_type = task.task_type

        for decision in decisions:
            action = decision.get("action")

            # ------------------------------------
            # WORKOUT ADAPTATIONS
            # ------------------------------------
            if task_type == TaskType.workout:

                if action == "reduce_workout_intensity":
                    # Reduce volume safely
                    if "sets" in task_payload:
                        task_payload["sets"] = max(1, task_payload["sets"] - 1)

                    task_payload["intensity_note"] = "Reduced due to missed sessions"

                if action == "simplify_workout_plan":
                    task_payload["simplified"] = True

                if action == "substitute_exercise":
                    failed_id = task_payload.get("exercise_id")
                    failed = next(
                        (e for e in all_exercises if e.id == failed_id),
                        None
                    )
                    if failed:
                        replacement = suggest_exercise_substitution(
                            failed_exercise=failed,
                            all_exercises=all_exercises,
                        )
                        if replacement:
                            task_payload["exercise_id"] = replacement.id
                            task_payload["substituted"] = True

            # ------------------------------------
            # DIET ADAPTATIONS
            # ------------------------------------
            if task_type == TaskType.diet:

                if action == "simplify_diet_plan":
                    if "calories" in task_payload:
                        task_payload["calories"] = int(task_payload["calories"] * 0.9)

                    task_payload["note"] = "Simplified for better adherence"

        updated_tasks.append({
            "task_id": str(task.id),
            "task_type": task_type.value,
            "updated_payload": task_payload,
        })

    return updated_tasks
