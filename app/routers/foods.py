from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import json

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.food import FoodItem

router = APIRouter(prefix="/api/foods", tags=["Foods"])


def serialize(f: FoodItem) -> dict:
    def parse(val):
        if not val:
            return []
        try:
            return json.loads(val)
        except Exception:
            return []

    return {
        "id":            f.id,
        "name":          f.name,
        "brand":         f.brand,
        "category":      f.category,
        "tags":          parse(f.tags),
        "is_indian":     f.is_indian,
        "serving_size":  f.serving_size,
        "serving_unit":  f.serving_unit,
        "serving_label": f.serving_label,
        "calories":      f.calories,
        "protein":       f.protein,
        "carbs":         f.carbs,
        "fat":           f.fat,
        "fiber":         f.fiber,
        "sugar":         f.sugar,
        "sodium":        f.sodium,
        "saturated_fat": f.saturated_fat,
    }


# ── SEARCH ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list)
def search_foods(
    search:    Optional[str] = Query(None),
    category:  Optional[str] = Query(None),
    is_indian: Optional[bool] = Query(None),
    limit:     int = Query(30, le=100),
    offset:    int = Query(0),
    db:        Session = Depends(get_db),
    _:         any = Depends(get_current_user),
):
    q = db.query(FoodItem).filter(FoodItem.is_active == True)

    if search:
        q = q.filter(
            or_(
                FoodItem.name.ilike(f"%{search}%"),
                FoodItem.brand.ilike(f"%{search}%"),
            )
        )
    if category:
        q = q.filter(FoodItem.category.ilike(f"%{category}%"))
    if is_indian is not None:
        q = q.filter(FoodItem.is_indian == is_indian)

    foods = q.order_by(FoodItem.name.asc()).offset(offset).limit(limit).all()
    return [serialize(f) for f in foods]


# ── SINGLE FOOD ───────────────────────────────────────────────────────────────

@router.get("/meta/categories", response_model=list)
def get_categories(
    db: Session = Depends(get_db),
    _:  any = Depends(get_current_user),
):
    """Must be defined BEFORE /{food_id} to avoid route shadowing."""
    foods = db.query(FoodItem.category).filter(FoodItem.is_active == True).distinct().all()
    return sorted([f[0] for f in foods if f[0]])


@router.get("/{food_id}", response_model=dict)
def get_food(
    food_id: int,
    db:      Session = Depends(get_db),
    _:       any = Depends(get_current_user),
):
    f = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not f:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Food not found")
    return serialize(f)
