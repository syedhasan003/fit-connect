"""
body_composition_service.py
===========================
Computes TDEE (Total Daily Energy Expenditure), estimated body-fat %,
lean mass, and a personalised calorie target for a given user.

Uses Mifflin-St Jeor when height + age + gender are available,
falls back to the WHO weight-only equation otherwise.

All functions are pure Python (no DB access) so they can be called
from any layer without a SQLAlchemy session.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


# ─────────────────────────────────────────────────────────────
# Activity level multipliers (ACSM / standard)
# ─────────────────────────────────────────────────────────────
_ACTIVITY_MULTIPLIERS: dict[str, float] = {
    "sedentary":    1.20,   # desk job, no exercise
    "light":        1.375,  # 1–2 workouts/week
    "moderate":     1.55,   # 3–4 workouts/week
    "active":       1.725,  # 5–6 workouts/week
    "very_active":  1.90,   # 2× daily or heavy physical job
}

# Goal-based calorie adjustments (kcal/day from TDEE)
_GOAL_ADJUSTMENTS: dict[str, int] = {
    "cut":      -350,   # moderate deficit — preserves muscle
    "maintain":    0,
    "bulk":      250,   # lean bulk
}

# Workout goal strings → normalised goal key
_GOAL_MAP: dict[str, str] = {
    "build muscle":     "bulk",
    "gain muscle":      "bulk",
    "bulk":             "bulk",
    "lose fat":         "cut",
    "lose weight":      "cut",
    "cut":              "cut",
    "weight loss":      "cut",
    "get stronger":     "maintain",  # strength with maintenance calories
    "general fitness":  "maintain",
    "maintain":         "maintain",
    "maintain weight":  "maintain",
}

# Experience level → activity base (used when days/week unknown)
_EXPERIENCE_ACTIVITY: dict[str, str] = {
    "beginner":     "light",
    "intermediate": "moderate",
    "advanced":     "active",
}


# ─────────────────────────────────────────────────────────────
# Result dataclass
# ─────────────────────────────────────────────────────────────

@dataclass
class BodyComposition:
    bmr: int                        # Basal Metabolic Rate (kcal)
    tdee: int                       # Total Daily Energy Expenditure (kcal)
    calorie_target: int             # TDEE ± goal adjustment (kcal)
    goal: str                       # "bulk" | "cut" | "maintain"
    activity_level: str             # e.g. "moderate"

    # Estimated body composition (None if height/age/gender unavailable)
    bf_pct_estimate: Optional[float] = None   # body fat percentage
    lean_mass_kg: Optional[float] = None       # lean body mass (kg)

    # Input echoed back for transparency in prompts
    weight_kg: float = 0.0
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None

    # Human-readable summary for AI prompts
    summary: str = field(init=False)

    def __post_init__(self):
        bf_str = (
            f"~{self.bf_pct_estimate:.1f}% BF | lean {self.lean_mass_kg:.1f} kg"
            if self.bf_pct_estimate is not None else "body-fat unknown (no height/age)"
        )
        direction = {"bulk": "+250 kcal surplus", "cut": "-350 kcal deficit", "maintain": "maintenance"}
        self.summary = (
            f"BMR {self.bmr} kcal | TDEE {self.tdee} kcal | "
            f"Target {self.calorie_target} kcal ({direction.get(self.goal, self.goal)}) | "
            f"{bf_str}"
        )


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

def compute_body_composition(
    weight_kg: float,
    height_cm: Optional[float] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,     # "male" | "female" | "other"
    activity_level: str = "moderate",
    goal: str = "maintain",
) -> BodyComposition:
    """
    Compute full body composition metrics.

    Falls back gracefully when height/age/gender are missing.
    """
    weight_kg = max(30.0, float(weight_kg or 70.0))
    activity_level = activity_level.lower() if activity_level else "moderate"
    goal = goal.lower() if goal else "maintain"

    # ── BMR ────────────────────────────────────────────────────
    bmr = _calc_bmr(weight_kg, height_cm, age, gender)

    # ── TDEE ───────────────────────────────────────────────────
    multiplier = _ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    tdee = round(bmr * multiplier)

    # ── Calorie target ─────────────────────────────────────────
    adjustment = _GOAL_ADJUSTMENTS.get(goal, 0)
    calorie_target = tdee + adjustment

    # ── Body fat estimate (Deurenberg formula) ─────────────────
    bf_pct: Optional[float] = None
    lean_mass: Optional[float] = None
    if height_cm and age and gender:
        bmi = weight_kg / ((height_cm / 100) ** 2)
        sex_factor = 1 if gender.lower() == "male" else 0
        bf_pct = round((1.20 * bmi) + (0.23 * age) - (10.8 * sex_factor) - 5.4, 1)
        bf_pct = max(3.0, min(60.0, bf_pct))  # clamp to physiologically sane range
        lean_mass = round(weight_kg * (1 - bf_pct / 100), 1)

    return BodyComposition(
        bmr=bmr,
        tdee=tdee,
        calorie_target=calorie_target,
        goal=goal,
        activity_level=activity_level,
        bf_pct_estimate=bf_pct,
        lean_mass_kg=lean_mass,
        weight_kg=weight_kg,
        height_cm=height_cm,
        age=age,
        gender=gender,
    )


def activity_level_from_prefs(prefs: dict) -> str:
    """
    Derive activity level from workout preferences.
    Priority: days_per_week → experience level → default 'moderate'.
    """
    days_raw = prefs.get("days_per_week", "")
    try:
        days = int(str(days_raw).split()[0])
        if days <= 2:
            return "light"
        elif days <= 4:
            return "moderate"
        elif days <= 5:
            return "active"
        else:
            return "very_active"
    except (ValueError, AttributeError):
        pass
    exp = (prefs.get("experience") or "").lower()
    return _EXPERIENCE_ACTIVITY.get(exp, "moderate")


def goal_from_prefs(prefs: dict) -> str:
    """Map a workout preference goal string to 'bulk' | 'cut' | 'maintain'."""
    raw = (prefs.get("goal") or "maintain").lower().strip()
    for key, val in _GOAL_MAP.items():
        if key in raw:
            return val
    return "maintain"


# ─────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────

def _calc_bmr(
    weight_kg: float,
    height_cm: Optional[float],
    age: Optional[int],
    gender: Optional[str],
) -> int:
    """
    Mifflin-St Jeor when height + age + gender known.
    WHO equation (weight-only) as fallback — slightly less accurate
    but still actionable.
    """
    if height_cm and age and gender:
        # Mifflin-St Jeor (kcal/day)
        base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
        if gender.lower() == "male":
            return round(base + 5)
        else:
            return round(base - 161)
    else:
        # WHO weight-only fallback (average adult)
        # Men 18–30: 15.3w + 679  |  30–60: 11.6w + 879
        # Women 18–30: 14.7w + 496 | 30–60: 8.7w + 829
        # We default to male 18–30 when gender unknown — acceptable approximation
        return round(15.3 * weight_kg + 679)
