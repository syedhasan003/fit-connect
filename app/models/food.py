"""
FoodItem — master food/nutrition database (Phase 4).

Renamed from Food → FoodItem to avoid conflict with the legacy Food model
in fitness_tracking.py (which handles user-custom foods for meal logging).

Seeded with 300+ items covering global + Indian foods.
Used for food search, nutrition lookup, and meal logging autocomplete.
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, Float
from app.db.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id              = Column(Integer, primary_key=True, index=True)
    external_id     = Column(String, nullable=True)                   # USDA FDC id or similar

    # Identity
    name            = Column(String, nullable=False, index=True)
    brand           = Column(String, nullable=True)                   # brand name if packaged
    category        = Column(String, nullable=True, index=True)       # Grains, Protein, Dairy…
    tags            = Column(Text, nullable=True)                     # JSON: ["vegan","gluten-free"]
    is_indian       = Column(Boolean, default=False, index=True)

    # Serving
    serving_size    = Column(Float, nullable=False, default=100.0)
    serving_unit    = Column(String, nullable=False, default="g")     # g, ml, piece, cup…
    serving_label   = Column(String, nullable=True)                   # "1 medium bowl", "1 roti"

    # Macros (per serving)
    calories        = Column(Float, nullable=False, default=0)
    protein         = Column(Float, nullable=True, default=0)         # grams
    carbs           = Column(Float, nullable=True, default=0)         # grams
    fat             = Column(Float, nullable=True, default=0)         # grams
    fiber           = Column(Float, nullable=True, default=0)         # grams
    sugar           = Column(Float, nullable=True, default=0)         # grams
    sodium          = Column(Float, nullable=True, default=0)         # mg
    saturated_fat   = Column(Float, nullable=True, default=0)         # grams

    # Meta
    is_active       = Column(Boolean, default=True)
