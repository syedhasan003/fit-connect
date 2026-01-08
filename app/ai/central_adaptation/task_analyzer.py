from typing import List, Dict
from app.tasks.models.enums import TaskStatus, TaskType


def analyze_tasks(tasks: List) -> Dict:
    """
    Analyzes planned vs actual tasks and extracts behavioral signals.
    """
    signals = {
        "missed_workouts": 0,
        "modified_workouts": 0,
        "missed_diets": 0,
    }

    for task in tasks:
        if task.task_type == TaskType.workout:
            if task.status == TaskStatus.missed:
                signals["missed_workouts"] += 1
            elif task.status == TaskStatus.modified:
                signals["modified_workouts"] += 1

        if task.task_type == TaskType.diet:
            if task.status == TaskStatus.missed:
                signals["missed_diets"] += 1

    return signals
