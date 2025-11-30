# app/cron/aggregate_daily.py
"""
Simple daily aggregator script.
Run manually: python -m app.cron.aggregate_daily
"""
from datetime import date, datetime, timedelta
from collections import defaultdict
import uuid

from app.database.deps import get_db_engine, SessionLocal
from app import models

def compute_engagement(views, saves, leads):
    # same formula we discussed: configurable later
    return (views * 0.2) + (saves * 2) + (leads * 3.5)

def aggregate_for_date(target_date: date):
    db = SessionLocal()
    try:
        start = datetime.combine(target_date, datetime.min.time())
        end = datetime.combine(target_date, datetime.max.time())

        # fetch events of the day
        events = db.query(models.GymEvent).filter(
            models.GymEvent.created_at >= start,
            models.GymEvent.created_at <= end
        ).all()

        summary = defaultdict(lambda: {"views":0, "saves":0, "leads":0, "premium_views":0})
        for e in events:
            g = summary[e.gym_id]
            if e.event_type == "view":
                g["views"] += 1
            elif e.event_type == "save":
                g["saves"] += 1
            elif e.event_type in ("click_whatsapp", "click_call", "click_location", "membership_interest"):
                g["leads"] += 1
            elif e.event_type == "premium_view":
                g["premium_views"] += 1
            else:
                # handle unknown event types safely
                pass

        # upsert daily analytics
        for gym_id, vals in summary.items():
            engagement = compute_engagement(vals["views"], vals["saves"], vals["leads"])
            # try find existing
            row = db.query(models.GymDailyAnalytics).filter(
                models.GymDailyAnalytics.gym_id == gym_id,
                models.GymDailyAnalytics.date == target_date
            ).first()
            if row:
                row.views = vals["views"]
                row.saves = vals["saves"]
                row.leads = vals["leads"]
                row.premium_views = vals["premium_views"]
                row.engagement_score = engagement
            else:
                row = models.GymDailyAnalytics(
                    id=str(uuid.uuid4()),
                    gym_id=gym_id,
                    date=target_date,
                    views=vals["views"],
                    saves=vals["saves"],
                    leads=vals["leads"],
                    premium_views=vals["premium_views"],
                    engagement_score=engagement
                )
                db.add(row)
        db.commit()
        print(f"Aggregated {len(summary)} gyms for {target_date}")
    finally:
        db.close()

if __name__ == "__main__":
    # aggregate for yesterday by default
    target = date.today() - timedelta(days=1)
    aggregate_for_date(target)
