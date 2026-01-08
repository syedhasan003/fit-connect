from typing import List, Dict
from copy import deepcopy
from datetime import date

from app.tasks.models.task import Task
from app.tasks.models.enums import TaskType, TaskStatus
from app.exercise_intelligence.models.exercise import Exercise
from app.ai.central_adaptation.exercise_substitution import (
    suggest_exercise_substitution,
)


def apply_adaptive_decisions(
    *,
    tasks: List[Task],
    decisions: List[Dict],
    all_exercises: List[Exercise],
) -> List[Dict]:
    """
    PRODUCTION Plan Executor.

    - Applies at most ONE safe mutation per eligible task
    - NEVER writes to DB
    - NEVER mutates completed or future tasks
    - Returns explainable diffs only
    """

    results: List[Dict] = []

    for task in tasks:
        if not _is_task_eligible(task):
            continue

        original_payload = task.planned_payload or {}
        updated_payload = deepcopy(original_payload)

        applied_action = None
        applied_reason = None
        requires_confirmation = False

        for decision in decisions:
            action = decision.get("action")
            reason = decision.get("reason", "Behavioral adjustment")

            # ---------------- WORKOUT ----------------
            if task.task_type == TaskType.workout:

                if action == "reduce_workout_intensity":
                    _reduce_workout_intensity(updated_payload)
                    applied_action = action
                    applied_reason = reason
                    break

                if action == "substitute_exercise":
                    substituted = _substitute_exercise(
                        updated_payload,
                        all_exercises,
                    )
                    if substituted:
                        applied_action = action
                        applied_reason = reason
                        requires_confirmation = True
                        break

            # ---------------- DIET ----------------
            if task.task_type == TaskType.diet:

                if action == "simplify_diet_plan":
                    _simplify_diet_plan(updated_payload)
                    applied_action = action
                    applied_reason = reason
                    break

        if applied_action:
            results.append({
                "task_id": str(task.id),
                "task_type": task.task_type.value,
                "original_payload": original_payload,
                "updated_payload": updated_payload,
                "action": applied_action,
                "reason": applied_reason,
                "requires_confirmation": requires_confirmation,
                "applied_at": date.today().isoformat(),
            })

    return results


# -------------------------------------------------
# Eligibility Rules
# -------------------------------------------------

def _is_task_eligible(task: Task) -> bool:
    if task.status == TaskStatus.completed:
        return False

    if not task.planned_payload:
        return False

    if task.scheduled_for != date.today():
        return False

    return True


# -------------------------------------------------
# Action Handlers (SAFE MUTATIONS ONLY)
# -------------------------------------------------

def _reduce_workout_intensity(payload: Dict) -> None:
    if "sets" in payload and isinstance(payload["sets"], int):
        payload["sets"] = max(1, payload["sets"] - 1)

    payload["ai_modified"] = True
    payload["ai_note"] = "Workout intensity reduced due to missed sessions"


def _simplify_diet_plan(payload: Dict) -> None:
    if "calories" in payload and isinstance(payload["calories"], int):
        payload["calories"] = int(payload["calories"] * 0.9)

    payload["ai_modified"] = True
    payload["ai_note"] = "Diet plan simplified for better adherence"


def _substitute_exercise(
    payload: Dict,
    all_exercises: List[Exercise],
) -> bool:
    exercise_id = payload.get("exercise_id")
    if not exercise_id:
        return False

    failed = next((e for e in all_exercises if e.id == exercise_id), None)
    if not failed:
        return False

    replacement = suggest_exercise_substitution(
        failed_exercise=failed,
        all_exercises=all_exercises,
    )

    if not replacement:
        return False

    payload["exercise_id"] = replacement.id
    payload["ai_modified"] = True
    payload["ai_note"] = "Exercise substituted to reduce fatigue"

    return True
