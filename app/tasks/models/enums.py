from enum import Enum


class TaskType(str, Enum):
    workout = "workout"
    diet = "diet"
    recovery = "recovery"


class TaskStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    missed = "missed"
    modified = "modified"
