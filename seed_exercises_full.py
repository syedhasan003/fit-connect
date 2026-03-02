"""
seed_exercises_full.py — Phase 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Downloads ALL 800+ exercises from yuhonas/free-exercise-db (MIT licence) and
seeds them into the exercises table.

Each exercise gets:
  • gif_url    → frame 0 (start position JPG, displayed as main preview)
  • image_urls → JSON list of all frame JPG URLs (frame 0 + frame 1 for animation)
  • instructions, primary/secondary muscles, equipment, difficulty, category

The frontend ExerciseDetail screen animates between frame 0 and frame 1
using a React interval to simulate motion.

Usage:
  cd backend
  python seed_exercises_full.py

  # To clear existing exercises and reseed from scratch:
  python seed_exercises_full.py --reset
"""

import json
import sys
import os
import time
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))

# ── Import ALL models before any db.query() ──────────────────────────────────
import app.models.fitness_tracking   # noqa: F401
import app.models.user               # noqa: F401
import app.models.food               # noqa: F401  (FoodItem)
import app.models.reminder           # noqa: F401
import app.models.medication         # noqa: F401
import app.models.vault_item         # noqa: F401
import app.models.exercise           # noqa: F401  (Exercise — what we're seeding)

from app.db.database import SessionLocal, engine, Base
from app.models.exercise import Exercise

Base.metadata.create_all(bind=engine)

# ── Source ────────────────────────────────────────────────────────────────────
EXERCISES_JSON_URL = (
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
)
IMAGE_BASE = (
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"
)

# ── Calories-per-minute estimates by category ─────────────────────────────────
CALORIE_MAP = {
    "cardio":                    10.0,
    "plyometrics":                9.0,
    "powerlifting":               8.0,
    "strongman":                  8.0,
    "olympic weightlifting":      7.5,
    "strength":                   6.0,
    "stretching":                 3.5,
}

DEFAULT_CALORIES = 5.5


def fetch_exercises_json():
    print(f"⬇️  Fetching exercises from GitHub…")
    req = urllib.request.Request(
        EXERCISES_JSON_URL,
        headers={"User-Agent": "fit-connect-seed/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    print(f"   Got {len(data)} exercises from free-exercise-db")
    return data


def build_image_urls(ex_id, images):
    """
    Construct absolute GitHub raw URLs for each frame.
    images is a list like ["Barbell_Curl/0.jpg", "Barbell_Curl/1.jpg"]
    We rebuild them from ex_id to be safe.
    """
    urls = []
    for img in images:
        filename = img.split("/")[-1]           # "0.jpg"
        urls.append(f"{IMAGE_BASE}/{ex_id}/images/{filename}")
    return urls


def calories_for(category):
    if not category:
        return DEFAULT_CALORIES
    return CALORIE_MAP.get(category.lower(), DEFAULT_CALORIES)


def seed(reset=False):
    db = SessionLocal()
    try:
        existing_count = db.query(Exercise).count()

        if reset and existing_count > 0:
            print(f"🗑️  Deleting {existing_count} existing exercises…")
            db.query(Exercise).delete()
            db.commit()
            existing_count = 0

        # Build a set of already-seeded external IDs for fast duplicate checks
        seeded_ids = {
            row[0]
            for row in db.query(Exercise.external_id)
            .filter(Exercise.external_id.isnot(None))
            .all()
        }
        print(f"   {len(seeded_ids)} exercises already in DB — will skip duplicates")

        data = fetch_exercises_json()

        seeded = 0
        skipped = 0
        batch_size = 50

        for ex in data:
            ex_id = ex.get("id", "")

            if ex_id in seeded_ids:
                skipped += 1
                continue

            images = ex.get("images", [])
            image_urls = build_image_urls(ex_id, images)
            # frame 0 = main preview / start position
            gif_url = image_urls[0] if image_urls else None

            exercise = Exercise(
                external_id   = ex_id,
                name          = ex.get("name", ex_id.replace("_", " ")),
                category      = ex.get("category"),
                force         = ex.get("force"),
                mechanic      = ex.get("mechanic"),
                equipment     = ex.get("equipment"),
                difficulty    = ex.get("level"),          # "level" in source → "difficulty" in model
                primary_muscles   = json.dumps(ex.get("primaryMuscles", [])),
                secondary_muscles = json.dumps(ex.get("secondaryMuscles", [])),
                instructions  = json.dumps(ex.get("instructions", [])),
                tips          = json.dumps([]),
                common_mistakes = json.dumps([]),
                gif_url       = gif_url,
                image_urls    = json.dumps(image_urls),
                is_active     = True,
                calories_per_min = calories_for(ex.get("category")),
            )
            db.add(exercise)
            seeded += 1

            # Commit in batches to avoid holding a huge transaction
            if seeded % batch_size == 0:
                db.commit()
                print(f"   ✓ {seeded} exercises committed…")

        db.commit()
        print(f"\n✅ Done!")
        print(f"   Seeded  : {seeded}")
        print(f"   Skipped : {skipped} (already existed)")
        print(f"   Total   : {db.query(Exercise).count()} exercises in DB")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding exercises: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    if reset:
        print("⚠️  --reset flag detected — all existing exercises will be deleted first.")
    seed(reset=reset)
