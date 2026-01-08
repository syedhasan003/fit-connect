from app.exercise_intelligence.taxonomy.enums import (
    ExerciseCategory,
    MovementPattern,
    DifficultyLevel,
    SkillRequirement,
    FatigueProfile,
)

BASE_EXERCISES = [
    {
        "name": "Barbell Back Squat",
        "category": ExerciseCategory.strength,
        "movement_pattern": MovementPattern.squat,
        "primary_muscles": ["quadriceps", "glutes"],
        "secondary_muscles": ["hamstrings", "core"],
        "equipment": ["barbell", "rack"],
        "difficulty_level": DifficultyLevel.intermediate,
        "skill_requirement": SkillRequirement.moderate,
        "stimulus": ["strength", "hypertrophy"],
        "fatigue_profile": FatigueProfile.systemic,
        "joint_stress": {"knee": "high", "lower_back": "moderate"},
        "risk_flags": ["knee_pain"],
        "tags": ["compound", "lower_body"]
    },
    {
        "name": "Barbell Bench Press",
        "category": ExerciseCategory.strength,
        "movement_pattern": MovementPattern.horizontal_push,
        "primary_muscles": ["chest"],
        "secondary_muscles": ["triceps", "shoulders"],
        "equipment": ["barbell", "bench"],
        "difficulty_level": DifficultyLevel.intermediate,
        "skill_requirement": SkillRequirement.moderate,
        "stimulus": ["strength", "hypertrophy"],
        "fatigue_profile": FatigueProfile.systemic,
        "joint_stress": {"shoulder": "moderate"},
        "risk_flags": ["shoulder_pain"],
        "tags": ["compound", "upper_body"]
    },
    {
        "name": "Deadlift",
        "category": ExerciseCategory.strength,
        "movement_pattern": MovementPattern.hinge,
        "primary_muscles": ["glutes", "hamstrings"],
        "secondary_muscles": ["lower_back", "core"],
        "equipment": ["barbell"],
        "difficulty_level": DifficultyLevel.advanced,
        "skill_requirement": SkillRequirement.high,
        "stimulus": ["strength"],
        "fatigue_profile": FatigueProfile.systemic,
        "joint_stress": {"lower_back": "high"},
        "risk_flags": ["lower_back_pain"],
        "tags": ["compound", "posterior_chain"]
    },
]
