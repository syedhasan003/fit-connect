"""
Workout Session & Exercise Log Endpoints
Real-time workout tracking with AI feedback

✅ FIXED: Schema now accepts program_id and day_number from frontend
✅ FIXED: Exercises are flattened from muscles → areas → exercises (vault structure)
✅ FIXED: WorkoutSessionResponse.manual_workout_id is now Optional[int] = None
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# Short weekday abbreviations matching the WorkoutBuilder chips
_WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

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
    program_id: int
    day_number: int
    energy_level_start: Optional[str] = None
    soreness_level_start: Optional[int] = None


class WorkoutSessionUpdate(BaseModel):
    energy_level_end: Optional[str] = None
    soreness_level_end: Optional[int] = None
    notes: Optional[str] = None


class WorkoutSessionResponse(BaseModel):
    id: int
    manual_workout_id: Optional[int] = None   # ✅ FIXED: was `int`, caused 500 when null
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
# HELPER: Flatten vault exercise structure
# ============================================================================

def _flatten_exercises(day: dict) -> list:
    """
    The WorkoutBuilder saves exercises nested as:
        day.muscles[i].areas[j].exercises[k] = { name, sets: [{reps, weight, rir}] }

    This flattens and transforms them into the shape WorkoutTracking expects:
        { id, name, sets (count), reps (number), rest_seconds, muscle_group, area }
    """
    flat = []
    for muscle in day.get("muscles", []):
        for area in muscle.get("areas", []):
            for ex in area.get("exercises", []):
                sets_array = ex.get("sets", [])
                raw_reps = sets_array[0].get("reps", 10) if sets_array else 10
                try:
                    reps = int(raw_reps)
                except (ValueError, TypeError):
                    reps = 10
                flat.append({
                    "id": len(flat),
                    "name": ex.get("name", "Exercise"),
                    "sets": len(sets_array) if sets_array else 3,
                    "reps": reps,
                    "rest_seconds": 90,
                    "muscle_group": muscle.get("name", ""),
                    "area": area.get("name", ""),
                })
    return flat


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
    if not current_user.active_workout_program_id:
        raise HTTPException(
            status_code=404,
            detail="No active workout program. Please set a workout as active first."
        )

    from app.models.vault_item import VaultItem
    workout = db.query(VaultItem).filter(
        VaultItem.id == current_user.active_workout_program_id,
        VaultItem.user_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Active workout program not found in vault")

    workout_data = workout.content or {}
    days = workout_data.get("days", [])

    if not days or len(days) == 0:
        raise HTTPException(status_code=400, detail="This workout program has no days/exercises configured")

    total_days = len(days)

    # Fix: vault stores program name under "workoutName", not "name"
    program_name = (
        workout_data.get("workoutName")
        or workout_data.get("name")
        or workout.title
        or "Workout Program"
    )

    # ── 1. Real-time weekday matching ────────────────────────────────────────
    # If the user assigned weekday chips (Mon/Tue/…/Sun) to their days, serve
    # today's matching day automatically.  This works entirely with SQLite —
    # no Redis/Postgres needed.
    today_abbr = _WEEKDAY_ABBR[datetime.now().weekday()]   # 0=Mon … 6=Sun
    weekday_names_lower = {a.lower() for a in _WEEKDAY_ABBR}

    # Detect whether the user is using weekday-chip scheduling at all
    using_weekday_mode = any(
        (day.get("name") or "").strip().lower() in weekday_names_lower
        for day in days
    )

    weekday_match_index = None
    for i, day in enumerate(days):
        day_name = (day.get("name") or "").strip()
        if day_name.lower() == today_abbr.lower():
            weekday_match_index = i
            break

    if weekday_match_index is not None:
        # ✅ A day is assigned to today — serve it directly
        day_index = weekday_match_index
        next_day_number = day_index + 1

    elif using_weekday_mode:
        # ── 2. User uses weekday chips but today has no workout → Rest Day ──
        # Return a special rest_day marker instead of silently cycling forward.
        return {
            "rest_day":     True,
            "program_id":   workout.id,
            "program_name": program_name,
            "day_name":     "Rest Day",
            "matched_today": False,
        }

    else:
        # ── 3. Fallback: sequential cycling (no weekday chips used at all) ──
        completed_count = db.query(WorkoutSession).filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.status == SessionStatus.COMPLETED
        ).count()
        next_day_number = (completed_count % total_days) + 1
        day_index = next_day_number - 1

    next_day  = days[day_index]
    exercises = _flatten_exercises(next_day)

    return {
        "program_id":    workout.id,
        "program_name":  program_name,
        "day_number":    next_day_number,
        "day_name":      next_day.get("name", f"Day {next_day_number}"),
        "exercises":     exercises,
        "matched_today": weekday_match_index is not None,
        "rest_day":      False,
    }


@router.post("/sessions/start", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_workout_session(
    data: WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    ✅ FIXED: Now accepts program_id and day_number from frontend
    """
    active_session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.IN_PROGRESS
    ).first()

    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active workout session. Complete or abandon it first."
        )

    from app.models.vault_item import VaultItem
    workout = db.query(VaultItem).filter(
        VaultItem.id == data.program_id,
        VaultItem.user_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout program not found")

    workout_data = workout.content or {}
    days = workout_data.get("days", [])

    if data.day_number < 1 or data.day_number > len(days):
        raise HTTPException(status_code=400, detail=f"Invalid day number. Program has {len(days)} days.")

    day_index = data.day_number - 1
    flat_exercises = _flatten_exercises(days[day_index])
    planned_exercises_count = len(flat_exercises)

    session = WorkoutSession(
        user_id=current_user.id,
        manual_workout_id=data.program_id,
        status=SessionStatus.IN_PROGRESS,
        planned_exercises_count=planned_exercises_count,
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
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")

    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not in progress")

    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    session.duration_minutes = int((session.completed_at - session.started_at).total_seconds() / 60)
    session.energy_level_end = data.energy_level_end
    session.soreness_level_end = data.soreness_level_end
    session.notes = data.notes

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
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.IN_PROGRESS
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Active workout session not found")

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
    log = db.query(ExerciseLog).join(WorkoutSession).filter(
        ExerciseLog.id == log_id,
        WorkoutSession.user_id == current_user.id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Exercise log not found")

    log.completed_sets = data.completed_sets
    log.actual_reps = data.actual_reps
    log.actual_weights = data.actual_weights
    log.actual_rest_times = data.actual_rest_times
    log.form_quality = data.form_quality
    log.form_notes = data.form_notes
    log.skipped = data.skipped
    log.deviation_reason = data.deviation_reason
    log.completed_at = datetime.utcnow()

    session = log.workout_session
    if data.skipped:
        session.skipped_exercises_count += 1
    else:
        session.completed_exercises_count += 1

    if data.form_quality in ["poor", "needs_correction"]:
        log.needs_deload = True

    db.commit()
    db.refresh(log)

    return log


@router.get("/sessions/{session_id}/exercises")
async def get_session_exercises(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
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
# ACTIVATION ENDPOINTS
# ============================================================================

@router.patch("/programs/{program_id}/activate")
async def activate_workout_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.vault_item import VaultItem
    workout = db.query(VaultItem).filter(
        VaultItem.id == program_id,
        VaultItem.user_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout program not found in vault")

    current_user.active_workout_program_id = program_id
    db.commit()

    return {
        "message":      "Workout program activated",
        "program_id":   program_id,
        "program_name": (workout.content or {}).get("name", "Workout Program")
    }


@router.patch("/programs/deactivate")
async def deactivate_workout_program(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    current_user.active_workout_program_id = None
    db.commit()
    return {"message": "Workout program deactivated"}


# ============================================================================
# STATISTICS & INSIGHTS
# ============================================================================

@router.get("/stats/weekly")
async def get_weekly_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.started_at >= week_ago,
        WorkoutSession.status == SessionStatus.COMPLETED
    ).all()

    total_workouts = len(sessions)
    total_minutes  = sum(s.duration_minutes for s in sessions if s.duration_minutes)
    total_exercises = sum(s.completed_exercises_count for s in sessions)

    return {
        "total_workouts":  total_workouts,
        "total_minutes":   total_minutes,
        "total_exercises": total_exercises,
        "avg_duration":    total_minutes / total_workouts if total_workouts > 0 else 0,
        "adherence_rate":  sum(
            s.completed_exercises_count / s.planned_exercises_count
            for s in sessions if s.planned_exercises_count > 0
        ) / total_workouts if total_workouts > 0 else 0
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def generate_ai_feedback(session: WorkoutSession) -> str:
    adherence = session.completed_exercises_count / session.planned_exercises_count
    feedback_parts = []

    if adherence >= 0.9:
        feedback_parts.append("Great job completing the full workout!")
    elif adherence >= 0.7:
        feedback_parts.append("Good effort! You completed most of your planned exercises.")
    else:
        feedback_parts.append("You skipped several exercises today. Everything okay?")

    poor_form_count = sum(
        1 for log in session.exercise_logs
        if log.form_quality in ["poor", "needs_correction"]
    )

    if poor_form_count > 0:
        feedback_parts.append(f"I noticed form issues on {poor_form_count} exercises. Consider reducing weight.")

    return " ".join(feedback_parts)