"""
migrate_youtube.py
──────────────────
Adds youtube_video_id column to the exercises table.
Safe to run multiple times (checks before adding).

Usage:
    python migrate_youtube.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")


def run():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Check if column already exists
    c.execute("PRAGMA table_info(exercises)")
    columns = [row[1] for row in c.fetchall()]

    if "youtube_video_id" in columns:
        print("✅ youtube_video_id column already exists — nothing to do.")
    else:
        c.execute("ALTER TABLE exercises ADD COLUMN youtube_video_id TEXT")
        conn.commit()
        print("✅ Added youtube_video_id column to exercises table.")

    conn.close()


if __name__ == "__main__":
    run()
