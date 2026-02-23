"""
One-shot migration + food reseed script.

Run from the backend directory:
    python migrate.py

What this does:
  1. Adds missing columns to diet_plans  (start_date, end_date, rest/workout day calories, etc.)
  2. Adds missing meal_name column to meal_logs
  3. Adds missing columns to meal_templates (meal_time, target_calories, etc.)
  4. Adds missing columns to meal_foods    (food_id, quantity_grams, calories, etc.)
  5. Clears old Western-only seeded foods and reseeds with the full list
     including all Indian foods
"""

import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")


# ── Step 1: Schema migration via raw SQLite ───────────────────────────────────

def run_migrations():
    print("=" * 56)
    print("Step 1 — Schema migration")
    print("=" * 56)

    con = sqlite3.connect(DB_PATH, timeout=30)
    cur = con.cursor()

    migrations = [
        # diet_plans new columns
        ("diet_plans",  "start_date",           "ALTER TABLE diet_plans ADD COLUMN start_date DATE"),
        ("diet_plans",  "end_date",              "ALTER TABLE diet_plans ADD COLUMN end_date DATE"),
        ("diet_plans",  "rest_day_calories",     "ALTER TABLE diet_plans ADD COLUMN rest_day_calories INTEGER"),
        ("diet_plans",  "workout_day_calories",  "ALTER TABLE diet_plans ADD COLUMN workout_day_calories INTEGER"),
        ("diet_plans",  "dietary_restrictions",  "ALTER TABLE diet_plans ADD COLUMN dietary_restrictions JSON DEFAULT '[]'"),
        ("diet_plans",  "allergies",             "ALTER TABLE diet_plans ADD COLUMN allergies JSON DEFAULT '[]'"),
        ("diet_plans",  "notes",                 "ALTER TABLE diet_plans ADD COLUMN notes TEXT"),
        # meal_logs — columns that may have been added after initial DB creation
        ("meal_logs",        "meal_name",             "ALTER TABLE meal_logs ADD COLUMN meal_name VARCHAR(100)"),
        ("meal_logs",        "planned_time",          "ALTER TABLE meal_logs ADD COLUMN planned_time TIME"),
        ("meal_logs",        "time_deviation_minutes","ALTER TABLE meal_logs ADD COLUMN time_deviation_minutes INTEGER"),
        ("meal_logs",        "followed_plan",         "ALTER TABLE meal_logs ADD COLUMN followed_plan BOOLEAN NOT NULL DEFAULT 1"),
        ("meal_logs",        "deviation_reason",      "ALTER TABLE meal_logs ADD COLUMN deviation_reason TEXT"),
        ("meal_logs",        "foods_eaten",           "ALTER TABLE meal_logs ADD COLUMN foods_eaten JSON"),
        ("meal_logs",        "total_calories",        "ALTER TABLE meal_logs ADD COLUMN total_calories INTEGER NOT NULL DEFAULT 0"),
        ("meal_logs",        "total_protein",         "ALTER TABLE meal_logs ADD COLUMN total_protein FLOAT NOT NULL DEFAULT 0"),
        ("meal_logs",        "total_carbs",           "ALTER TABLE meal_logs ADD COLUMN total_carbs FLOAT NOT NULL DEFAULT 0"),
        ("meal_logs",        "total_fats",            "ALTER TABLE meal_logs ADD COLUMN total_fats FLOAT NOT NULL DEFAULT 0"),
        ("meal_logs",        "energy_level",          "ALTER TABLE meal_logs ADD COLUMN energy_level VARCHAR(20)"),
        ("meal_logs",        "hunger_level",          "ALTER TABLE meal_logs ADD COLUMN hunger_level VARCHAR(20)"),
        ("meal_logs",        "mood",                  "ALTER TABLE meal_logs ADD COLUMN mood VARCHAR(20)"),
        ("meal_logs",        "satisfaction_rating",   "ALTER TABLE meal_logs ADD COLUMN satisfaction_rating INTEGER"),
        ("meal_logs",        "too_much",              "ALTER TABLE meal_logs ADD COLUMN too_much BOOLEAN NOT NULL DEFAULT 0"),
        ("meal_logs",        "too_little",            "ALTER TABLE meal_logs ADD COLUMN too_little BOOLEAN NOT NULL DEFAULT 0"),
        ("meal_logs",        "workout_before",        "ALTER TABLE meal_logs ADD COLUMN workout_before BOOLEAN NOT NULL DEFAULT 0"),
        ("meal_logs",        "workout_after",         "ALTER TABLE meal_logs ADD COLUMN workout_after BOOLEAN NOT NULL DEFAULT 0"),
        ("meal_logs",        "ai_suggestion_followed","ALTER TABLE meal_logs ADD COLUMN ai_suggestion_followed BOOLEAN"),
        ("meal_logs",        "ai_feedback",           "ALTER TABLE meal_logs ADD COLUMN ai_feedback TEXT"),

        # users — columns that may have been added after initial DB creation
        ("users",            "active_diet_plan_id",   "ALTER TABLE users ADD COLUMN active_diet_plan_id INTEGER"),
        ("users",            "active_workout_program_id", "ALTER TABLE users ADD COLUMN active_workout_program_id INTEGER"),
        ("users",            "onboarding_completed",  "ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT 0"),

        # meal_templates — model renamed/added many columns
        # meal_time is an ENUM stored as VARCHAR in SQLite; default 'breakfast' for old rows
        ("meal_templates",   "meal_time",             "ALTER TABLE meal_templates ADD COLUMN meal_time VARCHAR(20) NOT NULL DEFAULT 'breakfast'"),
        ("meal_templates",   "scheduled_time",        "ALTER TABLE meal_templates ADD COLUMN scheduled_time TIME"),
        ("meal_templates",   "target_calories",       "ALTER TABLE meal_templates ADD COLUMN target_calories INTEGER NOT NULL DEFAULT 0"),
        ("meal_templates",   "target_protein",        "ALTER TABLE meal_templates ADD COLUMN target_protein FLOAT NOT NULL DEFAULT 0"),
        ("meal_templates",   "target_carbs",          "ALTER TABLE meal_templates ADD COLUMN target_carbs FLOAT NOT NULL DEFAULT 0"),
        ("meal_templates",   "target_fats",           "ALTER TABLE meal_templates ADD COLUMN target_fats FLOAT NOT NULL DEFAULT 0"),
        ("meal_templates",   "allow_substitutions",   "ALTER TABLE meal_templates ADD COLUMN allow_substitutions BOOLEAN NOT NULL DEFAULT 1"),
        ("meal_templates",   "is_flexible_timing",    "ALTER TABLE meal_templates ADD COLUMN is_flexible_timing BOOLEAN NOT NULL DEFAULT 0"),

        # meal_foods — model renamed/added columns
        ("meal_foods",       "food_id",               "ALTER TABLE meal_foods ADD COLUMN food_id INTEGER REFERENCES foods(id)"),
        ("meal_foods",       "quantity_grams",        "ALTER TABLE meal_foods ADD COLUMN quantity_grams FLOAT NOT NULL DEFAULT 0"),
        ("meal_foods",       "calories",              "ALTER TABLE meal_foods ADD COLUMN calories INTEGER NOT NULL DEFAULT 0"),
        ("meal_foods",       "protein",               "ALTER TABLE meal_foods ADD COLUMN protein FLOAT NOT NULL DEFAULT 0"),
        ("meal_foods",       "carbs",                 "ALTER TABLE meal_foods ADD COLUMN carbs FLOAT NOT NULL DEFAULT 0"),
        ("meal_foods",       "fats",                  "ALTER TABLE meal_foods ADD COLUMN fats FLOAT NOT NULL DEFAULT 0"),
        ("meal_foods",       "is_optional",           "ALTER TABLE meal_foods ADD COLUMN is_optional BOOLEAN NOT NULL DEFAULT 0"),
        ("meal_foods",       "substitution_group",    "ALTER TABLE meal_foods ADD COLUMN substitution_group VARCHAR(50)"),
    ]

    for table, col, sql in migrations:
        # Check if column already exists
        cur.execute(f"PRAGMA table_info({table})")
        existing = [row[1] for row in cur.fetchall()]
        if col in existing:
            print(f"  already exists — {table}.{col}")
            continue
        try:
            cur.execute(sql)
            print(f"  added — {table}.{col}")
        except Exception as e:
            print(f"  ERROR adding {table}.{col}: {e}")

    con.commit()
    con.close()
    print()


# ── Step 2: Reseed foods ──────────────────────────────────────────────────────

def reseed_foods():
    print("=" * 56)
    print("Step 2 — Food database reseed (Indian + Western)")
    print("=" * 56)

    from app.db.database import SessionLocal
    from app.models.fitness_tracking import Food, FoodSource
    from seed_foods import get_seed_foods, seed_foods_database

    db = SessionLocal()
    try:
        existing = db.query(Food).filter(Food.source == FoodSource.SEEDED).count()
        print(f"  Existing seeded foods: {existing}")
        print("  Clearing old seeded foods ...")
        db.query(Food).filter(Food.source == FoodSource.SEEDED).delete()
        db.commit()
        print("  Cleared. Seeding fresh ...")
        seed_foods_database(db)
        new_count = db.query(Food).filter(Food.source == FoodSource.SEEDED).count()
        print(f"  Done — {new_count} foods in DB")

        # Show breakdown by category group
        from sqlalchemy import func
        rows = (
            db.query(Food.category, func.count(Food.id))
            .filter(Food.source == FoodSource.SEEDED)
            .group_by(Food.category)
            .order_by(Food.category)
            .all()
        )
        print()
        print("  Category breakdown:")
        for cat, cnt in rows:
            print(f"    {cat:<30} {cnt:>3}")
    finally:
        db.close()
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    print()
    print("fit-connect migration script")
    print()

    run_migrations()
    reseed_foods()

    print("=" * 56)
    print("All done — restart your backend server now.")
    print("=" * 56)
