from typing import List, Dict

from app.tasks.models.enums import TaskType, TaskStatus


def build_adaptive_context_from_tasks(tasks: List) -> Dict:
    """
    Converts recent user tasks into adaptive decisions
    that Central Reasoning can understand.
    """

    missed_workouts = 0
    missed_diets = 0
    modified_workouts = 0

    for task in tasks:
        if task.task_type == TaskType.workout:
            if task.status == TaskStatus.missed:
                missed_workouts += 1
            elif task.status == TaskStatus.modified:
                modified_workouts += 1

        if task.task_type == TaskType.diet:
            if task.status == TaskStatus.missed:
                missed_diets += 1

    decisions = []

    if missed_workouts >= 2:
        decisions.append({
            "action": "reduce_workout_intensity",
            "reason": "Multiple workouts were missed recently"
        })

    if modified_workouts >= 2:
        decisions.append({
            "action": "simplify_workout_plan",
            "reason": "Workout plans were frequently modified"
        })

    if missed_diets >= 2:
        decisions.append({
            "action": "simplify_diet_plan",
            "reason": "Diet adherence has been low"
        })

    return {
        "decisions": decisions,
        "signals": {
            "missed_workouts": missed_workouts,
            "modified_workouts": modified_workouts,
            "missed_diets": missed_diets,
        }
    }
