"""
Diet Plan & Meal Logging Endpoints
Meal planning, tracking, and food search
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from app.db.database import get_db
from app.models.fitness_tracking import (
    DietPlan, MealTemplate, MealFood, MealLog, Food, FoodPreference,
    GoalType, MealTime, FoodSource
)
from app.deps import get_current_user

router = APIRouter(prefix="/api/diet", tags=["Diet & Nutrition"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class DietPlanCreate(BaseModel):
    name: str
    goal_type: str  # "maintain", "cut", "bulk"
    target_calories: int
    target_protein: float
    target_carbs: float
    target_fats: float
    meals_per_day: int = 3
    is_active: bool = True
    # Optional rest-day / training-day calorie splits
    rest_day_calories: Optional[int] = None
    workout_day_calories: Optional[int] = None
    dietary_restrictions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    notes: Optional[str] = None


class DietPlanResponse(BaseModel):
    id: int
    name: str
    goal_type: str
    is_active: bool
    target_calories: int
    target_protein: float
    target_carbs: float
    target_fats: float
    meals_per_day: int
    rest_day_calories: Optional[int] = None
    workout_day_calories: Optional[int] = None
    start_date: Optional[date] = None       # nullable — old plans may not have this
    created_at: Optional[datetime] = None   # nullable — some rows pre-date the column

    class Config:
        from_attributes = True


class MealFoodCreate(BaseModel):
    food_id: Optional[int] = None
    food_name: str
    quantity_grams: float
    calories: int
    protein: float
    carbs: float
    fats: float
    is_optional: bool = False


class MealTemplateCreate(BaseModel):
    meal_time: str  # "breakfast", "lunch", "dinner", "snack"
    meal_name: Optional[str] = None
    scheduled_time: Optional[str] = None  # "07:00"
    target_calories: int
    target_protein: float
    target_carbs: float
    target_fats: float
    foods: List[MealFoodCreate]


class MealLogCreate(BaseModel):
    meal_name: Optional[str] = None  # "breakfast", "lunch", "dinner", "snack", or custom
    meal_template_id: Optional[int] = None
    actual_time: Optional[str] = None
    foods_eaten: List[dict]  # [{name, grams, calories, protein, carbs, fats}]
    followed_plan: bool = True
    deviation_reason: Optional[str] = None
    energy_level: Optional[str] = None
    hunger_level: Optional[str] = None
    mood: Optional[str] = None
    satisfaction_rating: Optional[int] = None
    workout_before: bool = False
    workout_after: bool = False


class FoodSearchResponse(BaseModel):
    id: int
    name: str
    brand: Optional[str]
    category: Optional[str]
    calories_per_100g: int
    protein_per_100g: float
    carbs_per_100g: float
    fats_per_100g: float
    common_serving: Optional[str]
    common_serving_grams: Optional[float]
    times_used: int
    source: str

    class Config:
        from_attributes = True


# ============================================================================
# DIET PLAN ENDPOINTS
# ============================================================================

@router.post("/plans", response_model=DietPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_diet_plan(
    data: DietPlanCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new diet plan for the user.
    Can have multiple plans, but only one active at a time.
    """
    # If setting this as active, deactivate other plans
    if data.is_active:
        db.query(DietPlan).filter(
            DietPlan.user_id == current_user.id,
            DietPlan.is_active == True
        ).update({"is_active": False})

    plan = DietPlan(
        user_id=current_user.id,
        name=data.name,
        goal_type=data.goal_type,
        is_active=True,
        start_date=date.today(),
        created_at=datetime.utcnow(),
        target_calories=data.target_calories,
        target_protein=data.target_protein,
        target_carbs=data.target_carbs,
        target_fats=data.target_fats,
        meals_per_day=data.meals_per_day,
        rest_day_calories=data.rest_day_calories,
        workout_day_calories=data.workout_day_calories,
        dietary_restrictions=data.dietary_restrictions,
        allergies=data.allergies,
        notes=data.notes
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Update user's active_diet_plan_id
    current_user.active_diet_plan_id = plan.id
    db.commit()

    return plan


@router.get("/plans/active", response_model=Optional[DietPlanResponse])
async def get_active_diet_plan(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get user's currently active diet plan.
    """
    plan = db.query(DietPlan).filter(
        DietPlan.user_id == current_user.id,
        DietPlan.is_active == True
    ).first()

    return plan


@router.get("/plans", response_model=List[DietPlanResponse])
async def get_all_diet_plans(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all diet plans (active and historical).
    """
    plans = db.query(DietPlan).filter(
        DietPlan.user_id == current_user.id
    ).order_by(DietPlan.created_at.desc()).all()

    return plans


@router.patch("/plans/{plan_id}/activate")
async def activate_diet_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Switch to a different diet plan.
    """
    plan = db.query(DietPlan).filter(
        DietPlan.id == plan_id,
        DietPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    # Deactivate all other plans
    db.query(DietPlan).filter(
        DietPlan.user_id == current_user.id,
        DietPlan.id != plan_id
    ).update({"is_active": False})

    # Activate this plan
    plan.is_active = True
    current_user.active_diet_plan_id = plan.id

    db.commit()

    return {"message": "Diet plan activated", "plan_id": plan_id}


@router.patch("/plans/deactivate")
async def deactivate_diet_plan(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Clear the user's active diet plan.
    Home card will show 'Not Set' state.
    """
    # Deactivate all plans
    db.query(DietPlan).filter(
        DietPlan.user_id == current_user.id
    ).update({"is_active": False})

    # Clear pointer on user
    current_user.active_diet_plan_id = None
    db.commit()

    return {"message": "Diet plan deactivated"}


@router.get("/plans/{plan_id}", response_model=DietPlanResponse)
async def get_diet_plan_by_id(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a single diet plan by ID."""
    plan = db.query(DietPlan).filter(
        DietPlan.id == plan_id,
        DietPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    return plan


@router.delete("/plans/{plan_id}")
async def delete_diet_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a diet plan and all its meal templates.
    If it was the active plan, clears the user's active_diet_plan_id.
    """
    plan = db.query(DietPlan).filter(
        DietPlan.id == plan_id,
        DietPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    # Clear active pointer if this was the active plan
    if current_user.active_diet_plan_id == plan_id:
        current_user.active_diet_plan_id = None

    db.delete(plan)
    db.commit()

    return {"message": "Diet plan deleted", "plan_id": plan_id}


# ============================================================================
# MEAL TEMPLATE ENDPOINTS
# ============================================================================

@router.post("/plans/{plan_id}/meals", status_code=status.HTTP_201_CREATED)
async def add_meal_to_plan(
    plan_id: int,
    data: MealTemplateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add a meal template to a diet plan.
    Creates meal + all foods in one request.
    """
    plan = db.query(DietPlan).filter(
        DietPlan.id == plan_id,
        DietPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    # Create meal template
    meal = MealTemplate(
        diet_plan_id=plan_id,
        meal_time=data.meal_time,
        meal_name=data.meal_name,
        scheduled_time=data.scheduled_time,
        target_calories=data.target_calories,
        target_protein=data.target_protein,
        target_carbs=data.target_carbs,
        target_fats=data.target_fats
    )

    db.add(meal)
    db.flush()  # Get meal.id without committing

    # Add foods to meal
    for food_data in data.foods:
        meal_food = MealFood(
            meal_template_id=meal.id,
            food_id=food_data.food_id,
            food_name=food_data.food_name,
            quantity_grams=food_data.quantity_grams,
            calories=food_data.calories,
            protein=food_data.protein,
            carbs=food_data.carbs,
            fats=food_data.fats,
            is_optional=food_data.is_optional
        )
        db.add(meal_food)

    db.commit()
    db.refresh(meal)

    return meal


@router.get("/plans/{plan_id}/meals")
async def get_plan_meals(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all meal templates for a diet plan.
    """
    plan = db.query(DietPlan).filter(
        DietPlan.id == plan_id,
        DietPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    meals = db.query(MealTemplate).filter(
        MealTemplate.diet_plan_id == plan_id
    ).all()

    # Include foods for each meal
    result = []
    for meal in meals:
        foods = db.query(MealFood).filter(
            MealFood.meal_template_id == meal.id
        ).all()

        result.append({
            **meal.__dict__,
            "foods": foods
        })

    return result


# ============================================================================
# MEAL LOGGING ENDPOINTS
# ============================================================================

@router.post("/logs", status_code=status.HTTP_201_CREATED)
async def log_meal(
    data: MealLogCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Log a meal that was eaten.
    Can be from template or manual entry.
    """
    # Get active diet plan
    diet_plan = db.query(DietPlan).filter(
        DietPlan.user_id == current_user.id,
        DietPlan.is_active == True
    ).first()

    if not diet_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active diet plan. Create one first."
        )

    # Calculate totals
    total_calories = sum(f["calories"] for f in data.foods_eaten)
    total_protein = sum(f["protein"] for f in data.foods_eaten)
    total_carbs = sum(f["carbs"] for f in data.foods_eaten)
    total_fats = sum(f["fats"] for f in data.foods_eaten)

    # Create meal log
    # logged_at is set explicitly (not via server_default) because the original
    # DB column was created with DEFAULT now() which SQLite doesn't support.
    log = MealLog(
        user_id=current_user.id,
        diet_plan_id=diet_plan.id,
        logged_at=datetime.utcnow(),
        meal_name=data.meal_name,
        meal_template_id=data.meal_template_id,
        actual_time=data.actual_time,
        foods_eaten=data.foods_eaten,
        followed_plan=data.followed_plan,
        deviation_reason=data.deviation_reason,
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fats=total_fats,
        energy_level=data.energy_level,
        hunger_level=data.hunger_level,
        mood=data.mood,
        satisfaction_rating=data.satisfaction_rating,
        workout_before=data.workout_before,
        workout_after=data.workout_after
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    # ── Update FoodPreference for each food eaten ─────────────────────────────
    for food_item in data.foods_eaten:
        food_name = food_item.get("name", "")
        food_category = food_item.get("category")
        if not food_name:
            continue

        pref = db.query(FoodPreference).filter(
            FoodPreference.user_id == current_user.id,
            FoodPreference.food_name == food_name
        ).first()

        if pref:
            pref.times_eaten += 1
            pref.last_observed = datetime.utcnow()
            # Rolling average satisfaction if provided
            if data.satisfaction_rating is not None:
                if pref.avg_satisfaction_rating is not None:
                    pref.avg_satisfaction_rating = (
                        (pref.avg_satisfaction_rating * (pref.times_eaten - 1) + data.satisfaction_rating)
                        / pref.times_eaten
                    )
                else:
                    pref.avg_satisfaction_rating = float(data.satisfaction_rating)
        else:
            pref = FoodPreference(
                user_id=current_user.id,
                food_name=food_name,
                food_category=food_category,
                times_eaten=1,
                avg_satisfaction_rating=float(data.satisfaction_rating) if data.satisfaction_rating else None,
                first_observed=datetime.utcnow(),
                last_observed=datetime.utcnow()
            )
            db.add(pref)

    db.commit()

    return log


@router.get("/logs/today")
async def get_todays_meals(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all meals logged today.
    Used for Smart Today Card.
    """
    from datetime import datetime

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    logs = db.query(MealLog).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at >= today_start
    ).order_by(MealLog.logged_at.desc()).all()

    # Calculate daily totals
    total_calories = sum(log.total_calories for log in logs)
    total_protein = sum(log.total_protein for log in logs)
    total_carbs = sum(log.total_carbs for log in logs)
    total_fats = sum(log.total_fats for log in logs)

    # Get targets from active diet plan
    diet_plan = db.query(DietPlan).filter(
        DietPlan.user_id == current_user.id,
        DietPlan.is_active == True
    ).first()

    # Resolve meal_name from template when not explicitly set
    serialized_logs = []
    for log in logs:
        meal_name = log.meal_name
        if not meal_name and log.meal_template_id:
            tmpl = db.query(MealTemplate).filter(MealTemplate.id == log.meal_template_id).first()
            if tmpl:
                meal_name = tmpl.meal_time
        serialized_logs.append({
            "id": log.id,
            "meal_name": meal_name or "extra",
            "meal_template_id": log.meal_template_id,
            "foods_eaten": log.foods_eaten or [],
            "total_calories": log.total_calories,
            "total_protein": log.total_protein,
            "total_carbs": log.total_carbs,
            "total_fats": log.total_fats,
            "followed_plan": log.followed_plan,
            "energy_level": log.energy_level.value if log.energy_level else None,
            "hunger_level": log.hunger_level.value if log.hunger_level else None,
            "logged_at": log.logged_at.isoformat() if log.logged_at else None,
        })

    return {
        "meals": serialized_logs,
        "totals": {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fats": total_fats
        },
        "targets": {
            "calories": diet_plan.target_calories if diet_plan else None,
            "protein": diet_plan.target_protein if diet_plan else None,
            "carbs": diet_plan.target_carbs if diet_plan else None,
            "fats": diet_plan.target_fats if diet_plan else None
        } if diet_plan else None
    }


# ============================================================================
# FOOD SEARCH & DATABASE
# ============================================================================

@router.get("/foods/search", response_model=List[FoodSearchResponse])
async def search_foods(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Search foods database.
    Prioritizes: user's custom foods > frequently used > seeded database.
    """
    search_term = f"%{q.lower()}%"

    # Search with priority
    foods = db.query(Food).filter(
        or_(
            Food.name.ilike(search_term),
            Food.brand.ilike(search_term)
        )
    ).order_by(
        # Prioritize user's custom foods
        (Food.user_id == current_user.id).desc(),
        # Then by usage frequency
        Food.times_used.desc(),
        # Then verified foods
        Food.is_verified.desc()
    ).limit(limit).all()

    return foods


@router.post("/foods/custom", response_model=FoodSearchResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_food(
    name: str,
    calories_per_100g: int,
    protein_per_100g: float,
    carbs_per_100g: float,
    fats_per_100g: float,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    common_serving: Optional[str] = None,
    common_serving_grams: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a custom food entry.
    User can add foods not in the database.
    """
    food = Food(
        name=name,
        brand=brand,
        category=category,
        calories_per_100g=calories_per_100g,
        protein_per_100g=protein_per_100g,
        carbs_per_100g=carbs_per_100g,
        fats_per_100g=fats_per_100g,
        common_serving=common_serving,
        common_serving_grams=common_serving_grams,
        source=FoodSource.USER_CUSTOM,
        user_id=current_user.id,
        is_verified=False
    )

    db.add(food)
    db.commit()
    db.refresh(food)

    return food


@router.get("/foods/popular", response_model=List[FoodSearchResponse])
async def get_popular_foods(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get most commonly used foods.
    Used for quick meal building.
    """
    foods = db.query(Food).filter(
        or_(
            Food.source == FoodSource.SEEDED,
            Food.user_id == current_user.id
        )
    ).order_by(Food.times_used.desc()).limit(limit).all()

    return foods


@router.patch("/foods/{food_id}/use")
async def increment_food_usage(
    food_id: int,
    db: Session = Depends(get_db)
):
    """
    Increment times_used counter.
    Called automatically when food is added to a meal.
    """
    food = db.query(Food).filter(Food.id == food_id).first()

    if food:
        food.times_used += 1
        db.commit()

    return {"message": "Usage incremented"}


# ============================================================================
# STATISTICS & INSIGHTS
# ============================================================================

@router.get("/stats/weekly")
async def get_weekly_nutrition_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get nutrition statistics for the current week.
    """
    from datetime import timedelta

    week_ago = datetime.utcnow() - timedelta(days=7)

    logs = db.query(MealLog).filter(
        MealLog.user_id == current_user.id,
        MealLog.logged_at >= week_ago
    ).all()

    # Calculate averages
    days_logged = len(set(log.logged_at.date() for log in logs))
    total_meals = len(logs)

    if total_meals == 0:
        return {
            "days_logged": 0,
            "meals_per_day": 0,
            "avg_calories": 0,
            "adherence_rate": 0
        }

    avg_calories = sum(log.total_calories for log in logs) / total_meals
    adherence_rate = sum(1 for log in logs if log.followed_plan) / total_meals

    return {
        "days_logged": days_logged,
        "meals_per_day": total_meals / days_logged if days_logged > 0 else 0,
        "avg_calories": avg_calories,
        "avg_protein": sum(log.total_protein for log in logs) / total_meals,
        "avg_carbs": sum(log.total_carbs for log in logs) / total_meals,
        "avg_fats": sum(log.total_fats for log in logs) / total_meals,
        "adherence_rate": adherence_rate * 100
    }
