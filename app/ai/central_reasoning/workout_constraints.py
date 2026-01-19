from enum import Enum
from typing import Dict, Any


# ======================================================
# ENUMS — CANONICAL CONSTRAINTS
# ======================================================

class WorkoutLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class WorkoutEnvironment(str, Enum):
    GYM = "gym"
    HOME = "home"
    CALISTHENICS = "calisthenics"
    HYBRID = "hybrid"


class EquipmentAvailability(str, Enum):
    BODYWEIGHT = "bodyweight"
    LIMITED = "limited"
    FULL_GYM = "full_gym"


# ======================================================
# KEYWORD MAPS (DETERMINISTIC)
# ======================================================

LEVEL_KEYWORDS = {
    "beginner": WorkoutLevel.BEGINNER,
    "intermediate": WorkoutLevel.INTERMEDIATE,
    "advanced": WorkoutLevel.ADVANCED,
    "expert": WorkoutLevel.ADVANCED,
}

ENVIRONMENT_KEYWORDS = {
    "gym": WorkoutEnvironment.GYM,
    "home": WorkoutEnvironment.HOME,
    "at home": WorkoutEnvironment.HOME,
    "bodyweight": WorkoutEnvironment.CALISTHENICS,
    "calisthenics": WorkoutEnvironment.CALISTHENICS,
}

EQUIPMENT_KEYWORDS = {
    "bodyweight": EquipmentAvailability.BODYWEIGHT,
    "no equipment": EquipmentAvailability.BODYWEIGHT,
    "dumbbells": EquipmentAvailability.LIMITED,
    "bands": EquipmentAvailability.LIMITED,
    "full gym": EquipmentAvailability.FULL_GYM,
    "machines": EquipmentAvailability.FULL_GYM,
}


# ======================================================
# EXTRACTION LOGIC (PURE, READ-ONLY)
# ======================================================

def extract_workout_constraints(text: str) -> Dict[str, Any]:
    """
    Extracts workout constraints from user text.
    - Never guesses
    - Never fills missing fields
    - Never enforces defaults
    """

    lowered = text.lower()

    constraints: Dict[str, Any] = {}

    # ---------------- LEVEL ----------------
    for k, v in LEVEL_KEYWORDS.items():
        if k in lowered:
            constraints["level"] = v.value
            break

    # ------------- ENVIRONMENT -------------
    for k, v in ENVIRONMENT_KEYWORDS.items():
        if k in lowered:
            constraints["environment"] = v.value
            break

    # ------------- EQUIPMENT ----------------
    for k, v in EQUIPMENT_KEYWORDS.items():
        if k in lowered:
            constraints["equipment"] = v.value
            break

    return constraints
