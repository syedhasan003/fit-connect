from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from sqlalchemy import func

_WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

from app.models.user import User
from app.models.workout_log import WorkoutLog
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.models.evaluator_state import EvaluatorState
from app.models.fitness_tracking import WorkoutSession, MealLog, DietPlan, SessionStatus


class HomeService:
    def build_home(self, db: Session, user: User) -> dict:
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # -------------------------
        # NEW WORKOUT STATUS (using workout_sessions)
        # -------------------------
        workout_status = self._get_workout_status(db, user, today_start, today_end)

        # -------------------------
        # NEW DIET STATUS (using meal_logs)
        # -------------------------
        diet_status = self._get_diet_status(db, user, today_start, today_end)

        # -------------------------
        # REMINDERS
        # -------------------------
        missed_reminders = (
            db.query(ReminderLog)
            .filter(
                ReminderLog.user_id == user.id,
                ReminderLog.acknowledged == False
            )
            .count()
        )

        upcoming_reminders = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user.id,
                Reminder.scheduled_at >= datetime.utcnow(),
                Reminder.is_active == True
            )
            .count()
        )

        # -------------------------
        # CONSISTENCY (14 DAYS) - Using new workout_sessions
        # -------------------------
        consistency = self._get_consistency(db, user, today)

        # -------------------------
        # EVALUATOR STATE
        # -------------------------
        evaluator = (
            db.query(EvaluatorState)
            .filter(EvaluatorState.user_id == user.id)
            .first()
        )

        evaluator_payload = None
        if evaluator:
            evaluator_payload = {
                "focus": evaluator.focus,
                "consistency_score": evaluator.consistency_score,
                "missed_reminders": evaluator.missed_reminders,
                "pending_tasks": evaluator.pending_tasks,
                "ai_summary": evaluator.ai_summary,
            }

        # -------------------------
        # FINAL HOME PAYLOAD
        # -------------------------
        return {
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "active_workout_program_id": user.active_workout_program_id if hasattr(user, 'active_workout_program_id') else None,
                "active_diet_plan_id": user.active_diet_plan_id if hasattr(user, 'active_diet_plan_id') else None,
            },
            "evaluator": evaluator_payload,
            "today": {
                "workout": workout_status,
                "diet": diet_status,
                "reminders": {
                    "missed": missed_reminders,
                    "upcoming": upcoming_reminders
                }
            },
            "consistency": consistency,
            "quick_actions": ["workout", "diet", "central"]
        }

    def _is_rest_day(self, db: Session, user: User) -> bool:
        """
        Returns True when the user's active program uses weekday-chip scheduling
        AND today has no assigned day — meaning it's a genuine rest day.
        """
        if not hasattr(user, 'active_workout_program_id') or not user.active_workout_program_id:
            return False

        from app.models.vault_item import VaultItem
        workout = db.query(VaultItem).filter(
            VaultItem.id == user.active_workout_program_id,
            VaultItem.user_id == user.id
        ).first()

        if not workout:
            return False

        days = (workout.content or {}).get("days", [])
        if not days:
            return False

        today_abbr = _WEEKDAY_ABBR[datetime.now().weekday()]   # 0=Mon … 6=Sun
        weekday_names_lower = {a.lower() for a in _WEEKDAY_ABBR}

        using_weekday_mode = any(
            (day.get("name") or "").strip().lower() in weekday_names_lower
            for day in days
        )
        if not using_weekday_mode:
            return False  # Sequential program — never a "rest day" from our side

        # Weekday mode active: check whether today has a matching day
        for day in days:
            day_name = (day.get("name") or "").strip()
            if day_name.lower() == today_abbr.lower():
                return False  # Today has a workout assigned

        return True  # Weekday mode, no match → rest day

    def _get_workout_status(self, db: Session, user: User, today_start: datetime, today_end: datetime) -> str:
        """
        Get today's workout status based on workout_sessions table.
        Returns: "completed", "in_progress", "rest_day", "pending", or "not_set"
        """
        # Check if user has an active workout program
        if not hasattr(user, 'active_workout_program_id') or not user.active_workout_program_id:
            return "not_set"

        # Check for today's workout session
        session = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user.id,
                WorkoutSession.started_at >= today_start,
                WorkoutSession.started_at <= today_end
            )
            .first()
        )

        if not session:
            # No session yet — could be a rest day or just not done yet
            if self._is_rest_day(db, user):
                return "rest_day"
            return "pending"

        # Return status based on session status
        if session.status.value == "completed":
            return "completed"
        elif session.status.value == "in_progress":
            return "in_progress"
        else:
            return "pending"

    def _get_diet_status(self, db: Session, user: User, today_start: datetime, today_end: datetime) -> dict:
        """
        Get today's diet status based on meal_logs table.
        Returns: {"status": "...", "calories": {...}, "macros": {...}}
        """
        # Check if user has an active diet plan
        if not hasattr(user, 'active_diet_plan_id') or not user.active_diet_plan_id:
            return {
                "status": "not_set",
                "calories": {"logged": 0, "target": 0},
                "macros": {"protein": 0, "carbs": 0, "fats": 0}
            }

        # Get the active diet plan for targets
        diet_plan = (
            db.query(DietPlan)
            .filter(DietPlan.id == user.active_diet_plan_id)
            .first()
        )

        target_calories = diet_plan.target_calories if diet_plan else 2000
        target_protein = diet_plan.target_protein if diet_plan else 150

        # Get today's meal logs and sum up the macros
        meals = (
            db.query(
                func.sum(MealLog.total_calories).label('total_calories'),
                func.sum(MealLog.total_protein).label('total_protein'),
                func.sum(MealLog.total_carbs).label('total_carbs'),
                func.sum(MealLog.total_fats).label('total_fats'),
            )
            .filter(
                MealLog.user_id == user.id,
                MealLog.logged_at >= today_start,
                MealLog.logged_at <= today_end
            )
            .first()
        )

        logged_calories = int(meals.total_calories or 0)
        logged_protein = int(meals.total_protein or 0)
        logged_carbs = int(meals.total_carbs or 0)
        logged_fats = int(meals.total_fats or 0)

        # Determine status
        if logged_calories == 0:
            status = "pending"
        elif logged_calories >= target_calories * 0.9:  # Within 10% of target
            status = "completed"
        else:
            status = "in_progress"

        return {
            "status": status,
            "calories": {
                "logged": logged_calories,
                "target": target_calories
            },
            "macros": {
                "protein": {"logged": logged_protein, "target": target_protein},
                "carbs": logged_carbs,
                "fats": logged_fats
            }
        }

    def _get_consistency(self, db: Session, user: User, today: date) -> list:
        """
        Get 14-day consistency data using workout_sessions table.
        """
        start_date = today - timedelta(days=13)

        # Query workout sessions from the last 14 days
        sessions = (
            db.query(WorkoutSession.started_at)
            .filter(
                WorkoutSession.user_id == user.id,
                WorkoutSession.started_at >= start_date,
                WorkoutSession.status == SessionStatus.COMPLETED
            )
            .all()
        )

        # Create a set of dates where workouts were completed
        days_logged = {session.started_at.date().isoformat() for session in sessions}

        # Build consistency array
        consistency = []
        for i in range(14):
            d = start_date + timedelta(days=i)
            consistency.append({
                "date": d.isoformat(),
                "worked_out": d.isoformat() in days_logged
            })

        return consistency