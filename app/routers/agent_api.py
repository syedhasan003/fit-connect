"""
agent_api.py
============
REST endpoints the frontend polls on app open / page load.

GET  /api/agent/morning-brief     — Latest morning brief for the authenticated user
GET  /api/agent/notifications     — Pending offline notifications
GET  /api/agent/weekly-adaptation — Latest weekly adaptation report
GET  /api/agent/correlations      — Latest correlation insights
POST /api/agent/trigger/{job}     — Manually trigger a job (dev/admin only)
"""

import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.health_memory import HealthMemory

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agent", tags=["Agent API"])


# ──────────────────────────────────────────────────────────────
# Morning Brief
# ──────────────────────────────────────────────────────────────

@router.get("/morning-brief")
async def get_morning_brief(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the latest morning brief for the user.
    The Home screen calls this on mount to display the brief card.
    """
    brief = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == current_user.id,
            HealthMemory.category == "morning_brief",
        )
        .order_by(HealthMemory.created_at.desc())
        .first()
    )

    if not brief:
        return {
            "available": False,
            "brief": None,
            "stats": None,
            "generated_at": None,
        }

    return {
        "available": True,
        "brief": brief.content.get("brief"),
        "stats": brief.content.get("stats"),
        "generated_at": brief.created_at.isoformat() if brief.created_at else None,
        "date": brief.content.get("date"),
    }


# ──────────────────────────────────────────────────────────────
# Pending Notifications (offline fallback)
# ──────────────────────────────────────────────────────────────

@router.get("/notifications")
async def get_pending_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns and clears pending notifications for users who were offline.
    Frontend polls this on app startup as a fallback to WebSocket delivery.
    """
    pending = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == current_user.id,
            HealthMemory.category == "notification",
        )
        .order_by(HealthMemory.created_at.asc())
        .limit(20)
        .all()
    )

    results = []
    for mem in pending:
        c = mem.content or {}
        if c.get("pending"):
            results.append({
                "id": mem.id,
                "type": c.get("event_type", "notification"),
                "title": c.get("title", ""),
                "body": c.get("body", ""),
                "data": c.get("data", {}),
                "created_at": mem.created_at.isoformat() if mem.created_at else None,
            })
            # Mark delivered
            mem.content = {**c, "pending": False}

    if results:
        db.commit()

    return {"notifications": results, "count": len(results)}


# ──────────────────────────────────────────────────────────────
# Weekly Adaptation
# ──────────────────────────────────────────────────────────────

@router.get("/weekly-adaptation")
async def get_weekly_adaptation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the latest weekly adaptation report."""
    report = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == current_user.id,
            HealthMemory.category == "weekly_adaptation",
        )
        .order_by(HealthMemory.created_at.desc())
        .first()
    )

    if not report:
        return {"available": False, "report": None}

    return {
        "available": True,
        "report": report.content.get("report"),
        "adherence": report.content.get("adherence"),
        "correlations_found": report.content.get("correlations_found", 0),
        "date": report.content.get("date"),
        "generated_at": report.created_at.isoformat() if report.created_at else None,
    }


# ──────────────────────────────────────────────────────────────
# Correlation Insights
# ──────────────────────────────────────────────────────────────

@router.get("/correlations")
async def get_correlations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the latest correlation insights for display in the app."""
    insight = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == current_user.id,
            HealthMemory.category == "correlation_insight",
        )
        .order_by(HealthMemory.created_at.desc())
        .first()
    )

    if not insight:
        return {"available": False, "insights": [], "days_analysed": 0}

    return {
        "available": True,
        "insights": insight.content.get("insights", []),
        "days_analysed": insight.content.get("days_analysed", 0),
        "date": insight.content.get("date"),
        "generated_at": insight.created_at.isoformat() if insight.created_at else None,
    }


# ──────────────────────────────────────────────────────────────
# Manual job trigger (dev/testing)
# ──────────────────────────────────────────────────────────────

@router.post("/trigger/{job_name}")
async def trigger_job(
    job_name: str,
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger a background job. Useful for testing without waiting
    for the scheduler clock. Only available to active users.

    Valid job names: morning_brief, narrative, nudge, adaptation
    """
    valid_jobs = {
        "morning_brief": "app.agent.jobs.morning_brief_job.run_morning_brief",
        "narrative": "app.agent.jobs.narrative_job.run_daily_narrative_synthesis",
        "nudge": "app.agent.jobs.nudge_job.run_nudge_check",
        "adaptation": "app.agent.jobs.adaptation_job.run_weekly_adaptation",
    }

    if job_name not in valid_jobs:
        return {"error": f"Unknown job. Valid: {list(valid_jobs.keys())}"}

    try:
        import importlib
        module_path, func_name = valid_jobs[job_name].rsplit(".", 1)
        module = importlib.import_module(module_path)
        func = getattr(module, func_name)
        await func()
        return {"triggered": True, "job": job_name}
    except Exception as e:
        logger.error(f"[AgentAPI] Trigger error: {e}")
        return {"triggered": False, "error": str(e)}
