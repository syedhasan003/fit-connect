"""
Workout Session & Exercise Log Endpoints
Real-time workout tracking with AI feedback

✅ FIXED: Schema now accepts program_id and day_number from frontend
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.fitness_tracking import (
    WorkoutSession, ExerciseLog, SessionStatus,
    FormQuality, EnergyLevel
)
from app.deps import get_current_user

router = APIRouter(prefix="/api/workouts", tags=["Workout Tracking"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class ExerciseLogCreate(BaseModel):
    exercise_id: int
    sequence_order: int
    planned_sets: int
    planned_reps_per_set: Optional[int] = None
    planned_weight: Optional[float] = None
    planned_rest_seconds: Optional[int] = 60


class ExerciseLogUpdate(BaseModel):
    completed_sets: int
    actual_reps: List[int]
    actual_weights: List[float]
    actual_rest_times: List[int]
    form_quality: Optional[str] = None
    form_notes: Optional[str] = None
    skipped: bool = False
    deviation_reason: Optional[str] = None


class WorkoutSessionCreate(BaseModel):
    """
    ✅ FIXED: Now accepts program_id and day_number (what frontend sends)
    Backend will look up exercises and calculate planned_exercises_count
    """
    program_id: int  # ✅ Changed from manual_workout_id
    day_number: int  # ✅ Added to get correct exercises
    energy_level_start: Optional[str] = None
    soreness_level_start: Optional[int] = None


class WorkoutSessionUpdate(BaseModel):
    energy_level_end: Optional[str] = None
    soreness_level_end: Optional[int] = None
    notes: Optional[str] = None


class WorkoutSessionResponse(BaseModel):
    id: int
    manual_workout_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration_minutes: Optional[int]
    planned_exercises_count: int
    completed_exercises_count: int
    skipped_exercises_count: int
    energy_level_start: Optional[str]
    energy_level_end: Optional[str]
    notes: Optional[str]
    ai_feedback: Optional[str]

    class Config:
        from_attributes = True


# ============================================================================
# WORKOUT SESSION ENDPOINTS
# ============================================================================

@router.get("/next-day")
async def get_next_workout_day(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get the next workout day user should do based on their active program and history.
    Returns program details and exercises for the next day.
    """
    # Check if user has active workout program
    if not current_user.active_workout_program_id:
        raise HTTPException(
            status_code=404,
            detail="No active workout program. Please set a workout as active first."
        )

    # Get the workout program from vault
    from app.models.vault_item import VaultItem
    workout = db.query(VaultItem).filter(
        VaultItem.id == current_user.active_workout_program_id,
        VaultItem.user_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(
            status_code=404,
            detail="Active workout program not found in vault"
        )

    # Get workout data (FIXED: using 'content' instead of 'data')
    workout_data = workout.content or {}
    days = workout_data.get("days", [])

    if not days or len(days) == 0:
        raise HTTPException(
            status_code=400,
            detail="This workout program has no days/exercises configured"
        )

    # Get last completed session to determine next day
    last_session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.COMPLETED
    ).order_by(WorkoutSession.started_at.desc()).first()

    # Determine next day number
    total_days = len(days)

    if not last_session:
        # First workout - start from day 1
        next_day_number = 1
    else:
        # Get last day from session (we need to track this)
        # For now, cycle through days (1, 2, 3, 1, 2, 3, ...)
        # TODO: Store day_number in WorkoutSession for accurate tracking

        # Simple rotation for now
        # Count completed sessions for this workout program
        completed_count = db.query(WorkoutSession).filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.COMPLETED
        ).count()

        # Rotate through days
        next_day_number = (completed_count % total_days) + 1

    # Get the day data
    day_index = next_day_number - 1
    next_day = days[day_index]

    return {
        "program_id": workout.id,
        "program_name": workout_data.get("name", "Workout Program"),
        "day_number": next_day_number,
        "day_name": next_day.get("name", f"Day {next_day_number}"),
        "exercises": next_day.get("exercises", [])
    }


@router.post("/sessions/start", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_workout_session(
    data: WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    ✅ FIXED: Now accepts program_id and day_number from frontend
    Looks up the workout program, gets exercises for the day, and calculates planned_exercises_count
    """
    # Check if user has active session
    active_session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.IN_PROGRESS
    ).first()

    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active workout session. Complete or abandon it first."
        )

    # ✅ NEW: Get workout program and exercises to calculate planned_exercises_count
    from app.models.vault_item import VaultItem
    workout = db.query(VaultItem).filter(
        VaultItem.id == data.program_id,
        VaultItem.user_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(
            status_code=404,
            detail="Workout program not found"
        )

    # Get exercises for the day
    workout_data = workout.content or {}
    days = workout_data.get("days", [])

    if data.day_number < 1 or data.day_number > len(days):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid day number. Program has {len(days)} days."
        )

    day_index = data.day_number - 1
    day_exercises = days[day_index].get("exercises", [])
    planned_exercises_count = len(day_exercises)

    # Create new session
    session = WorkoutSession(
        user_id=current_user.id,
        manual_workout_id=data.program_id,  # Store program_id as manual_workout_id
        status=SessionStatus.IN_PROGRESS,
        planned_exercises_count=planned_exercises_count,  # ✅ Calculated from exercises
        completed_exercises_count=0,
        skipped_exercises_count=0,
        energy_level_start=data.energy_level_start,
        soreness_level_start=data.soreness_level_start
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("/sessions/active", response_model=Optional[WorkoutSessionResponse])
async def get_active_session(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get user's current active workout session.
    Returns null if no active session.
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.IN_PROGRESS
    ).first()

    return session


@router.patch("/sessions/{session_id}/complete", response_model=WorkoutSessionResponse)
async def complete_workout_session(
    session_id: int,
    data: WorkoutSessionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Complete a workout session.
    Calculates duration, updates status, triggers AI feedback.
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")

    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not in progress"
        )

    # Update session
    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    session.duration_minutes = int((session.completed_at - session.started_at).total_seconds() / 60)
    session.energy_level_end = data.energy_level_end
    session.soreness_level_end = data.soreness_level_end
    session.notes = data.notes

    # TODO: Trigger AI feedback generation based on session data
    # session.ai_feedback = await generate_ai_feedback(session)

    db.commit()
    db.refresh(session)

    return session


@router.patch("/sessions/{session_id}/abandon")
async def abandon_workout_session(
    session_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Abandon a workout session mid-workout.
    Marks as abandoned, stores reason.
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")

    session.status = SessionStatus.ABANDONED
    session.completed_at = datetime.utcnow()
    session.duration_minutes = int((session.completed_at - session.started_at).total_seconds() / 60)
    session.notes = reason

    db.commit()

    return {"message": "Workout session abandoned", "session_id": session_id}


@router.get("/sessions/history", response_model=List[WorkoutSessionResponse])
async def get_workout_history(
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get user's workout history.
    Returns most recent sessions first.
    """
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id
    ).order_by(WorkoutSession.started_at.desc()).offset(skip).limit(limit).all()

    return sessions


# ============================================================================
# EXERCISE LOG ENDPOINTS
# ============================================================================

@router.post("/sessions/{session_id}/exercises", status_code=status.HTTP_201_CREATED)
async def log_exercise(
    session_id: int,
    data: ExerciseLogCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add an exercise to the current workout session.
    Called when starting a new exercise.
    """
    # Verify session belongs to user and is active
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.IN_PROGRESS
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Active workout session not found"
        )

    # Create exercise log
    log = ExerciseLog(
        workout_session_id=session_id,
        exercise_id=data.exercise_id,
        sequence_order=data.sequence_order,
        planned_sets=data.planned_sets,
        planned_reps_per_set=data.planned_reps_per_set,
        planned_weight=data.planned_weight,
        planned_rest_seconds=data.planned_rest_seconds,
        completed_sets=0,
        started_at=datetime.utcnow()
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@router.patch("/exercises/{log_id}", status_code=status.HTTP_200_OK)
async def update_exercise_log(
    log_id: int,
    data: ExerciseLogUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update exercise log with actual performance.
    Called in real-time as user completes sets.
    """
    log = db.query(ExerciseLog).join(WorkoutSession).filter(
        ExerciseLog.id == log_id,
        WorkoutSession.user_id == current_user.id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Exercise log not found")

    # Update with actual data
    log.completed_sets = data.completed_sets
    log.actual_reps = data.actual_reps
    log.actual_weights = data.actual_weights
    log.actual_rest_times = data.actual_rest_times
    log.form_quality = data.form_quality
    log.form_notes = data.form_notes
    log.skipped = data.skipped
    log.deviation_reason = data.deviation_reason
    log.completed_at = datetime.utcnow()

    # Update session counts
    session = log.workout_session
    if data.skipped:
        session.skipped_exercises_count += 1
    else:
        session.completed_exercises_count += 1

    # Check for deviations and form issues
    if data.form_quality in ["poor", "needs_correction"]:
        log.needs_deload = True

    db.commit()
    db.refresh(log)

    # TODO: Trigger real-time AI analysis
    # - Check rest times (too long? too short?)
    # - Check weight progression
    # - Check form degradation
    # - Send notification if intervention needed

    return log


@router.get("/sessions/{session_id}/exercises")
async def get_session_exercises(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all exercises for a workout session.
    Used to display real-time progress.
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")

    logs = db.query(ExerciseLog).filter(
        ExerciseLog.workout_session_id == session_id
    ).order_by(ExerciseLog.sequence_order).all()

    return logs


# ============================================================================
# STATISTICS & INSIGHTS
# ============================================================================

@router.get("/stats/weekly")
async def get_weekly_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get workout statistics for the current week.
    Used for Smart Today Card.
    """
    from datetime import timedelta

    week_ago = datetime.utcnow() - timedelta(days=7)

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.started_at >= week_ago,
        WorkoutSession.status == SessionStatus.COMPLETED
    ).all()

    total_workouts = len(sessions)
    total_minutes = sum(s.duration_minutes for s in sessions if s.duration_minutes)
    total_exercises = sum(s.completed_exercises_count for s in sessions)

    return {
        "total_workouts": total_workouts,
        "total_minutes": total_minutes,
        "total_exercises": total_exercises,
        "avg_duration": total_minutes / total_workouts if total_workouts > 0 else 0,
        "adherence_rate": sum(
            s.completed_exercises_count / s.planned_exercises_count
            for s in sessions if s.planned_exercises_count > 0
        ) / total_workouts if total_workouts > 0 else 0
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def generate_ai_feedback(session: WorkoutSession) -> str:
    """
    Generate AI feedback based on workout session data.
    TODO: Integrate with your AI system (Central?)
    """
    # Analyze session data
    adherence = session.completed_exercises_count / session.planned_exercises_count

    feedback_parts = []

    if adherence >= 0.9:
        feedback_parts.append("Great job completing the full workout!")
    elif adherence >= 0.7:
        feedback_parts.append("Good effort! You completed most of your planned exercises.")
    else:
        feedback_parts.append("You skipped several exercises today. Everything okay?")

    # Check for form issues
    poor_form_count = sum(
        1 for log in session.exercise_logs
        if log.form_quality in ["poor", "needs_correction"]
    )

    if poor_form_count > 0:
        feedback_parts.append(f"I noticed form issues on {poor_form_count} exercises. Consider reducing weight.")

    return " ".join(feedback_parts)