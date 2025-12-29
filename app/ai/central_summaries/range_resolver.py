from datetime import datetime, timedelta, timezone
from typing import Dict


def resolve_time_range(query: str) -> Dict:
    """
    Resolves natural language time ranges like:
    - today
    - yesterday
    - this week
    - last week
    - last 30 days
    - last 3 months
    - yearly / annually
    """

    q = query.lower()
    now = datetime.now(timezone.utc)

    # ---------------- DAILY ----------------
    if "today" in q:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return _pack(start, now, "daily")

    if "yesterday" in q:
        end = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start = end - timedelta(days=1)
        return _pack(start, end, "daily")

    # ---------------- WEEKLY ----------------
    if "this week" in q:
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        return _pack(start, now, "weekly")

    if "last week" in q:
        end = now - timedelta(days=now.weekday())
        end = end.replace(hour=0, minute=0, second=0, microsecond=0)
        start = end - timedelta(days=7)
        return _pack(start, end, "weekly")

    # ---------------- MONTH / RANGE ----------------
    if "last 30 days" in q:
        start = now - timedelta(days=30)
        return _pack(start, now, "30_days")

    if "last 3 months" in q:
        start = now - timedelta(days=90)
        return _pack(start, now, "quarterly")

    if "last 6 months" in q:
        start = now - timedelta(days=180)
        return _pack(start, now, "half_year")

    if "year" in q or "annual" in q:
        start = now - timedelta(days=365)
        return _pack(start, now, "yearly")

    # ---------------- FALLBACK ----------------
    start = now - timedelta(days=7)
    return _pack(start, now, "weekly")


def _pack(start: datetime, end: datetime, granularity: str) -> Dict:
    return {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "granularity": granularity,
    }
