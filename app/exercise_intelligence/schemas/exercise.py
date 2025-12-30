from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

from app.exercise_intelligence.taxonomy.enums import (
    ExerciseCategory,
    MovementPattern,
    DifficultyLevel,
    SkillRequirement,
    FatigueProfile,
)


class ExerciseBase(BaseModel):
    name: str
    category: ExerciseCategory
    movement_pattern: MovementPattern
    primary_muscles: List[str]
    secondary_muscles: Optional[List[str]]
    equipment: Optional[List[str]]
    difficulty_level: DifficultyLevel
    skill_requirement: SkillRequirement
    stimulus: List[str]
    fatigue_profile: FatigueProfile
    joint_stress: Optional[dict]
    risk_flags: Optional[List[str]]
    tags: Optional[List[str]]


class ExerciseCreate(ExerciseBase):
    is_variation: bool = False
    base_exercise_id: Optional[UUID]


class ExerciseOut(ExerciseBase):
    id: UUID
    is_variation: bool
    base_exercise_id: Optional[UUID]

    class Config:
        orm_mode = True
