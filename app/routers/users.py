from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.user_gym import UserGymLink
from app.models.gym import Gym

router = APIRouter(prefix="/users", tags=["Users"])


# ============================================================================
# REQUEST MODELS
# ============================================================================

class SetActiveWorkoutRequest(BaseModel):
    workout_id: int


class SetActiveDietRequest(BaseModel):
    diet_plan_id: int


# ============================================================================
# EXISTING ENDPOINTS
# ============================================================================

# ---------------------------------------------------
# GET CURRENT USER (FOUNDATIONAL)
# ---------------------------------------------------
@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name if hasattr(current_user, "name") else None,
        "full_name": current_user.full_name if hasattr(current_user, "full_name") else None,
        "role": current_user.role,
        "active_workout_program_id": current_user.active_workout_program_id if hasattr(current_user, "active_workout_program_id") else None,
        "active_diet_plan_id": current_user.active_diet_plan_id if hasattr(current_user, "active_diet_plan_id") else None,
        "onboarding_completed": current_user.onboarding_completed if hasattr(current_user, "onboarding_completed") else False,
    }


# ---------------------------------------------------
# SELECT GYM (user)
# ---------------------------------------------------
@router.post("/select-gym")
def select_gym(
    gym_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")

    existing_link = db.query(UserGymLink).filter(
        UserGymLink.user_id == current_user.id
    ).first()

    if existing_link:
        existing_link.gym_id = gym_id
    else:
        link = UserGymLink(user_id=current_user.id, gym_id=gym_id)
        db.add(link)

    db.commit()
    return {"message": "Gym selected successfully"}


# ---------------------------------------------------
# GET MY GYM (user)
# ---------------------------------------------------
@router.get("/my-gym")
def get_my_gym(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(UserGymLink).filter(
        UserGymLink.user_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="No gym selected")

    gym = db.query(Gym).filter(Gym.id == link.gym_id).first()
    return gym


# ============================================================================
# NEW ENDPOINTS - ACTIVE PROGRAM MANAGEMENT
# ============================================================================

# ---------------------------------------------------
# SET ACTIVE WORKOUT PROGRAM
# ---------------------------------------------------
@router.post("/active-workout")
def set_active_workout_program(
    data: SetActiveWorkoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Set the user's active workout program.
    This is the workout that will be tracked on the home screen.
    """
    # Verify the workout exists and belongs to the user
    from app.models.vault_item import VaultItem
    workout = db.query(VaultItem).filter(
        VaultItem.id == data.workout_id,
        VaultItem.user_id == current_user.id,
        VaultItem.type == "workout"
    ).first()

    if not workout:
        raise HTTPException(
            status_code=404,
            detail="Workout not found or does not belong to you"
        )

    # Update user's active workout program
    current_user.active_workout_program_id = data.workout_id
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "active_workout_program_id": current_user.active_workout_program_id,
        "active_diet_plan_id": current_user.active_diet_plan_id if hasattr(current_user, "active_diet_plan_id") else None,
        "message": "Active workout program set successfully"
    }


# ---------------------------------------------------
# SET ACTIVE DIET PLAN
# ---------------------------------------------------
@router.post("/active-diet")
def set_active_diet_plan(
    data: SetActiveDietRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Set the user's active diet plan.
    This is the diet plan that will be tracked on the home screen.
    """
    # Verify the diet plan exists and belongs to the user
    from app.models.fitness_tracking import DietPlan
    diet_plan = db.query(DietPlan).filter(
        DietPlan.id == data.diet_plan_id,
        DietPlan.user_id == current_user.id
    ).first()

    if not diet_plan:
        raise HTTPException(
            status_code=404,
            detail="Diet plan not found or does not belong to you"
        )

    # Update user's active diet plan
    current_user.active_diet_plan_id = data.diet_plan_id
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "active_workout_program_id": current_user.active_workout_program_id if hasattr(current_user, "active_workout_program_id") else None,
        "active_diet_plan_id": current_user.active_diet_plan_id,
        "message": "Active diet plan set successfully"
    }


# ---------------------------------------------------
# CLEAR ACTIVE WORKOUT PROGRAM
# ---------------------------------------------------
@router.delete("/active-workout")
def clear_active_workout_program(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear the user's active workout program.
    Use this when the user wants to stop tracking a program.
    """
    current_user.active_workout_program_id = None
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "active_workout_program_id": None,
        "message": "Active workout program cleared"
    }


# ---------------------------------------------------
# CLEAR ACTIVE DIET PLAN
# ---------------------------------------------------
@router.delete("/active-diet")
def clear_active_diet_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear the user's active diet plan.
    Use this when the user wants to stop tracking a plan.
    """
    current_user.active_diet_plan_id = None
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "active_diet_plan_id": None,
        "message": "Active diet plan cleared"
    }