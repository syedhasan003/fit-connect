from enum import Enum


class ExerciseCategory(str, Enum):
    strength = "strength"
    cardio = "cardio"
    mobility = "mobility"
    sport = "sport"
    combat = "combat"
    recovery = "recovery"


class MovementPattern(str, Enum):
    squat = "squat"
    hinge = "hinge"
    horizontal_push = "horizontal_push"
    vertical_push = "vertical_push"
    horizontal_pull = "horizontal_pull"
    vertical_pull = "vertical_pull"
    carry = "carry"
    rotation = "rotation"
    locomotion = "locomotion"


class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class SkillRequirement(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


class FatigueProfile(str, Enum):
    local = "local"
    systemic = "systemic"
    neural = "neural"
