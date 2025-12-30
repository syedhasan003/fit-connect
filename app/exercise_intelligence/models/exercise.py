import uuid
from sqlalchemy import (
    Column,
    String,
    Enum,
    JSON,
    ForeignKey,
    DateTime,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.exercise_intelligence.taxonomy.enums import (
    ExerciseCategory,
    MovementPattern,
    DifficultyLevel,
    SkillRequirement,
    FatigueProfile,
)


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, nullable=False, unique=True)

    category = Column(Enum(ExerciseCategory), nullable=False)

    movement_pattern = Column(Enum(MovementPattern), nullable=False)

    primary_muscles = Column(JSON, nullable=False)
    secondary_muscles = Column(JSON, nullable=True)

    equipment = Column(JSON, nullable=True)

    difficulty_level = Column(Enum(DifficultyLevel), nullable=False)
    skill_requirement = Column(Enum(SkillRequirement), nullable=False)

    stimulus = Column(JSON, nullable=False)

    fatigue_profile = Column(Enum(FatigueProfile), nullable=False)

    joint_stress = Column(JSON, nullable=True)

    risk_flags = Column(JSON, nullable=True)

    tags = Column(JSON, nullable=True)

    is_variation = Column(Boolean, default=False)
    base_exercise_id = Column(
        UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=True
    )

    base_exercise = relationship(
        "Exercise", remote_side=[id], backref="variations"
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
