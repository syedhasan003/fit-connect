from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import asyncio
import json
import os
import logging
from datetime import date

import httpx

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.exercise import Exercise

logger = logging.getLogger(__name__)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# ── YouTube rate limiter ───────────────────────────────────────────────────────
# Free quota: 10,000 units/day.  Each search costs 100 units.
# We cap at 85 searches/day (8,500 units) — leaves buffer for spikes / manual queries.
_YT_MAX_SEARCHES_PER_DAY = int(os.getenv("YT_DAILY_SEARCH_LIMIT", "85"))
_yt_semaphore   = asyncio.Semaphore(3)   # max 3 concurrent YouTube API calls
_yt_quota_lock  = asyncio.Lock()
_yt_quota_date: Optional[date] = None
_yt_quota_used  = 0                      # searches consumed today


async def _yt_quota_ok() -> bool:
    """Return True if we still have quota remaining today."""
    global _yt_quota_date, _yt_quota_used
    today = date.today()
    async with _yt_quota_lock:
        if _yt_quota_date != today:
            _yt_quota_date = today
            _yt_quota_used = 0
        return _yt_quota_used < _YT_MAX_SEARCHES_PER_DAY


async def _yt_consume_quota():
    """Increment the daily search counter (call after a successful API request)."""
    global _yt_quota_used
    async with _yt_quota_lock:
        _yt_quota_used += 1
        logger.debug(f"[YouTube] quota used today: {_yt_quota_used}/{_YT_MAX_SEARCHES_PER_DAY}")

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


def serialize(e: Exercise) -> dict:
    def parse(val):
        if not val:
            return []
        try:
            return json.loads(val)
        except Exception:
            return [val]

    return {
        "id":                e.id,
        "external_id":       e.external_id,
        "name":              e.name,
        "category":          e.category,
        "force":             e.force,
        "mechanic":          e.mechanic,
        "equipment":         e.equipment,
        "difficulty":        e.difficulty,
        "primary_muscles":   parse(e.primary_muscles),
        "secondary_muscles": parse(e.secondary_muscles),
        "instructions":      parse(e.instructions),
        "tips":              parse(e.tips),
        "common_mistakes":   parse(e.common_mistakes),
        "gif_url":           e.gif_url,
        "image_urls":        parse(e.image_urls),
        "calories_per_min":  e.calories_per_min,
        "youtube_video_id":  e.youtube_video_id,
    }


# ── LIST / SEARCH ─────────────────────────────────────────────────────────────

@router.get("/", response_model=list)
def list_exercises(
    search:     Optional[str] = Query(None),
    muscle:     Optional[str] = Query(None),   # primary muscle filter
    equipment:  Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    category:   Optional[str] = Query(None),
    limit:      int = Query(40, le=100),
    offset:     int = Query(0),
    db:         Session = Depends(get_db),
    _:          any = Depends(get_current_user),
):
    q = db.query(Exercise).filter(Exercise.is_active == True)

    if search:
        q = q.filter(Exercise.name.ilike(f"%{search}%"))
    if muscle:
        q = q.filter(
            or_(
                Exercise.primary_muscles.ilike(f"%{muscle}%"),
                Exercise.secondary_muscles.ilike(f"%{muscle}%"),
            )
        )
    if equipment:
        q = q.filter(Exercise.equipment.ilike(f"%{equipment}%"))
    if difficulty:
        q = q.filter(Exercise.difficulty.ilike(f"%{difficulty}%"))
    if category:
        q = q.filter(Exercise.category.ilike(f"%{category}%"))

    exercises = q.order_by(Exercise.name.asc()).offset(offset).limit(limit).all()
    return [serialize(e) for e in exercises]


# ── SINGLE EXERCISE ───────────────────────────────────────────────────────────

@router.get("/{exercise_id}", response_model=dict)
def get_exercise(
    exercise_id: int,
    db:          Session = Depends(get_db),
    _:           any = Depends(get_current_user),
):
    e = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Exercise not found")
    return serialize(e)


# ── FILTER OPTIONS ────────────────────────────────────────────────────────────

@router.get("/meta/filters", response_model=dict)
def get_filter_options(
    db: Session = Depends(get_db),
    _:  any = Depends(get_current_user),
):
    """Return all unique filter values for the UI filter chips."""
    exercises = db.query(Exercise).filter(Exercise.is_active == True).all()

    muscles    = set()
    equipments = set()
    categories = set()
    levels     = set()

    for e in exercises:
        if e.equipment:  equipments.add(e.equipment)
        if e.category:   categories.add(e.category)
        if e.difficulty: levels.add(e.difficulty)
        for m in (json.loads(e.primary_muscles) if e.primary_muscles else []):
            muscles.add(m)

    return {
        "muscles":    sorted(muscles),
        "equipment":  sorted(equipments),
        "categories": sorted(categories),
        "difficulty": sorted(levels),
    }


# ── YOUTUBE VIDEO ─────────────────────────────────────────────────────────────

@router.get("/{exercise_id}/video")
async def get_exercise_video(
    exercise_id: int,
    db:          Session = Depends(get_db),
    _:           any     = Depends(get_current_user),
):
    """
    Return a YouTube video ID for this exercise demonstrating proper form.

    Strategy:
      1. Check DB cache (youtube_video_id column) — return instantly if found.
      2. Call YouTube Data API v3 search to find the best form tutorial.
      3. Cache the video ID in the DB so we never call the API for this exercise again.
      4. If YouTube API key is missing or quota exceeded, return null gracefully.

    Cost: 100 YouTube API units per uncached exercise (free quota: 10,000/day).
    Once cached, zero API cost forever.
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # ── 1. Return cached video immediately ───────────────────────────────────
    if exercise.youtube_video_id:
        return {"video_id": exercise.youtube_video_id, "cached": True}

    # ── 2. No API key → return null gracefully ───────────────────────────────
    if not YOUTUBE_API_KEY:
        logger.warning("[YouTube] YOUTUBE_API_KEY not set — skipping video fetch")
        return {"video_id": None, "cached": False}

    # ── 3a. Daily quota guard ─────────────────────────────────────────────────
    if not await _yt_quota_ok():
        logger.warning(
            f"[YouTube] Daily quota limit ({_YT_MAX_SEARCHES_PER_DAY} searches) reached "
            f"— returning null for '{exercise.name}'"
        )
        return {"video_id": None, "cached": False, "quota_exceeded": True}

    # ── 3b. Concurrency guard + API call ─────────────────────────────────────
    # Semaphore ensures at most 3 concurrent YouTube calls regardless of traffic.
    query   = f"{exercise.name} proper form technique tutorial"
    api_url = "https://www.googleapis.com/youtube/v3/search"
    params  = {
        "part":              "snippet",
        "q":                 query,
        "type":              "video",
        "maxResults":        5,
        "videoDuration":     "medium",    # 4–20 min — proper tutorials
        "relevanceLanguage": "en",
        "safeSearch":        "strict",
        "key":               YOUTUBE_API_KEY,
    }

    try:
        async with _yt_semaphore:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(api_url, params=params)
                resp.raise_for_status()
                data = resp.json()
            await _yt_consume_quota()

        items = data.get("items", [])
        if not items:
            logger.info(f"[YouTube] No results for '{exercise.name}'")
            return {"video_id": None, "cached": False}

        # Pick best result — prefer videos whose title contains the exercise name
        video_id = None
        ex_name_lower = exercise.name.lower()
        for item in items:
            title = item["snippet"]["title"].lower()
            if ex_name_lower in title or any(w in title for w in ex_name_lower.split()):
                video_id = item["id"]["videoId"]
                break
        # Fall back to first result if none matched by name
        if not video_id:
            video_id = items[0]["id"]["videoId"]

        # ── 4. Cache in DB — permanent, no re-fetch ever ─────────────────────
        exercise.youtube_video_id = video_id
        db.commit()
        logger.info(f"[YouTube] Cached video {video_id} for '{exercise.name}'")

        return {"video_id": video_id, "cached": False}

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            logger.warning("[YouTube] Quota exceeded or API key invalid (HTTP 403)")
        else:
            logger.error(f"[YouTube] API error: {e}")
        return {"video_id": None, "cached": False}
    except asyncio.TimeoutError:
        logger.warning(f"[YouTube] Timeout fetching video for '{exercise.name}'")
        return {"video_id": None, "cached": False}
    except Exception as e:
        logger.error(f"[YouTube] Unexpected error: {e}")
        return {"video_id": None, "cached": False}
