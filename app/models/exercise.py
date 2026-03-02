"""
Exercise — the master exercise library.

Seeded from free-exercise-db (800+ exercises).
Each exercise has animated GIF, muscle targeting, instructions, tips.
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, Float
from app.db.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id                  = Column(Integer, primary_key=True, index=True)
    external_id         = Column(String, unique=True, nullable=True)   # original ID from seed source

    # Core info
    name                = Column(String, nullable=False, index=True)
    category            = Column(String, nullable=True)                 # e.g. strength, cardio, stretching
    force               = Column(String, nullable=True)                 # push / pull / static
    mechanic            = Column(String, nullable=True)                 # compound / isolation
    equipment           = Column(String, nullable=True)                 # barbell, dumbbell, bodyweight…
    difficulty          = Column(String, nullable=True)                 # beginner / intermediate / expert

    # Muscles (stored as JSON strings: '["Chest","Triceps"]')
    primary_muscles     = Column(Text, nullable=True)
    secondary_muscles   = Column(Text, nullable=True)

    # Content
    instructions        = Column(Text, nullable=True)                  # JSON array of instruction steps
    tips                = Column(Text, nullable=True)                  # JSON array of form tips
    common_mistakes     = Column(Text, nullable=True)                  # JSON array

    # Media
    gif_url             = Column(Text, nullable=True)                  # animated GIF URL
    image_urls          = Column(Text, nullable=True)                  # JSON array of image URLs

    # Meta
    is_active           = Column(Boolean, default=True)
    calories_per_min    = Column(Float, nullable=True)                 # rough estimate

    # YouTube — cached on first view, never re-fetched
    youtube_video_id    = Column(String, nullable=True)                # e.g. "dQw4w9WgXcQ"
