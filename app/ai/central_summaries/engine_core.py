from datetime import datetime
from typing import List, Dict


def build_summary_from_events(
    workouts: List[Dict],
    reminders: List[Dict],
    nutrition_logs: List[Dict],
    health_memory: List[Dict],
    start_date: datetime,
    end_date: datetime,
    granularity: str,
) -> Dict:
    # -------------------------
    # WORKOUTS
    # -------------------------
    total_workouts = len(workouts)
    completed_workouts = sum(1 for w in workouts if w.get("completed") is True)
    missed_workouts = total_workouts - completed_workouts

    # -------------------------
    # REMINDERS
    # -------------------------
    sent = len(reminders)
    acknowledged = sum(1 for r in reminders if r.get("status") == "acknowledged")
    missed = sum(1 for r in reminders if r.get("status") == "missed")

    # -------------------------
    # NUTRITION
    # -------------------------
    nutrition_days_logged = len(nutrition_logs)

    # -------------------------
    # CONSISTENCY SCORE (simple, explainable)
    # -------------------------
    consistency_score = 0
    if total_workouts > 0:
        consistency_score += completed_workouts / total_workouts
    if sent > 0:
        consistency_score += acknowledged / sent
    if nutrition_days_logged > 0:
        consistency_score += 0.25

    consistency_score = round(min(consistency_score / 2, 1.0), 2)

    # -------------------------
    # SUMMARY OUTPUT (NO LLM)
    # -------------------------
    return {
        "time_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "granularity": granularity,
        },
        "workouts": {
            "total": total_workouts,
            "completed": completed_workouts,
            "missed": missed_workouts,
        },
        "reminders": {
            "sent": sent,
            "acknowledged": acknowledged,
            "missed": missed,
        },
        "nutrition": {
            "logged_days": nutrition_days_logged,
        },
        "consistency": {
            "score": consistency_score,
            "label": _consistency_label(consistency_score),
        },
        "signals": _extract_signals(
            completed_workouts,
            missed_workouts,
            acknowledged,
            missed,
            nutrition_days_logged,
        ),
    }


def _consistency_label(score: float) -> str:
    if score >= 0.8:
        return "excellent"
    if score >= 0.6:
        return "good"
    if score >= 0.4:
        return "inconsistent"
    return "needs_attention"


def _extract_signals(
    completed_workouts: int,
    missed_workouts: int,
    acknowledged: int,
    missed_reminders: int,
    nutrition_days: int,
) -> List[str]:
    signals = []

    if missed_workouts > completed_workouts:
        signals.append("workout_drop")

    if missed_reminders > acknowledged:
        signals.append("reminder_fatigue")

    if nutrition_days == 0:
        signals.append("nutrition_not_logged")

    if not signals:
        signals.append("stable_behavior")

    return signals
