"""
migrate_places.py
─────────────────
Adds Google Places columns to the gyms table.
Safe to run multiple times (checks before adding each column).

Usage:
    python migrate_places.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")

# SQLite does NOT allow ADD COLUMN with UNIQUE — add as plain TEXT, then index separately
NEW_COLUMNS = [
    ("place_id",              "TEXT"),        # unique index added separately below
    ("places_fetched_at",     "TEXT"),
    ("rating",                "REAL"),
    ("user_ratings_total",    "INTEGER"),
    ("phone_number",          "TEXT"),
    ("website",               "TEXT"),
    ("opening_hours_json",    "TEXT"),
    ("photo_references_json", "TEXT"),
    ("price_level",           "INTEGER"),
    ("is_claimed",            "INTEGER DEFAULT 0"),
]


def run():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("PRAGMA table_info(gyms)")
    existing_columns = {row[1] for row in c.fetchall()}

    added = []
    for col_name, col_type in NEW_COLUMNS:
        if col_name not in existing_columns:
            c.execute(f"ALTER TABLE gyms ADD COLUMN {col_name} {col_type}")
            added.append(col_name)

    # Create unique index on place_id (IF NOT EXISTS is safe to re-run)
    c.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_gyms_place_id ON gyms (place_id) "
        "WHERE place_id IS NOT NULL"
    )

    conn.commit()
    conn.close()

    if added:
        print(f"✅ Added columns to gyms: {', '.join(added)}")
    else:
        print("✅ All Places columns already exist — nothing to do.")
    print("✅ Unique index on place_id ensured.")


if __name__ == "__main__":
    run()
