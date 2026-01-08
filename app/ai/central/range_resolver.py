from datetime import datetime, timedelta
from typing import Tuple


def resolve_range(
    range_label: str,
    now: datetime
) -> Tuple[datetime, datetime, str]:
    """
    Converts human range → datetime window.
    """

    label = range_label.lower()

    if label in ("day", "daily", "today"):
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now, "daily"

    if label in ("week", "weekly"):
        start = now - timedelta(days=7)
        return start, now, "weekly"

    if label in ("10d", "10days", "10 days"):
        start = now - timedelta(days=10)
        return start, now, "10_days"

    if label in ("month", "monthly"):
        start = now - timedelta(days=30)
        return start, now, "monthly"

    if label in ("quarter", "3months"):
        start = now - timedelta(days=90)
        return start, now, "quarterly"

    if label in ("year", "yearly"):
        start = now - timedelta(days=365)
        return start, now, "yearly"

    # fallback
    start = now - timedelta(days=7)
    return start, now, "weekly"
