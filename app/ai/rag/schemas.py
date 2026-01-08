from typing import List, Dict, Literal, Optional
from pydantic import BaseModel


class Source(BaseModel):
    source: str
    url: str


class WorkoutExercise(BaseModel):
    name: str
    sets: int
    reps: str
    rest: str
    equipment: List[str]


class WorkoutPlan(BaseModel):
    goal: str
    experience_level: str
    exercises: List[WorkoutExercise]


class DietItem(BaseModel):
    meal: str
    foods: List[str]
    protein_g: Optional[int] = None


class DietPlan(BaseModel):
    goal: str
    total_protein_g: Optional[int]
    meals: List[DietItem]


class StructuredAnswer(BaseModel):
    type: Literal["workout_plan", "diet_plan", "general"]
    summary: str
    data: Dict
    saveable: bool
    confidence: float
    sources: List[Source]
