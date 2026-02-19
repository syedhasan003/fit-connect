"""
Database Migration: Add Missing Columns to workout_sessions Table

Run this in backend folder:
    python migrate_db.py
"""

import sqlite3
import os
from datetime import datetime

DATABASE_PATH = "test.db"

def run_migration():
    print("=" * 60)
    print("WORKOUT TRACKING DATABASE MIGRATION")
    print("=" * 60)
    print()

    if not os.path.exists(DATABASE_PATH):
        print(f"Error: Database not found at: {DATABASE_PATH}")
        print()
        print("Please update DATABASE_PATH in this script.")
        print("Common names: test.db, app.db, fitnova.db")
        return False

    print(f"Database found: {DATABASE_PATH}")
    print()

    backup_path = f"{DATABASE_PATH}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    print("Creating backup...")
    try:
        import shutil
        shutil.copy2(DATABASE_PATH, backup_path)
        print(f"Backup saved: {backup_path}")
    except Exception as e:
        print(f"Backup failed: {e}")
        proceed = input("Continue without backup? (yes/no): ")
        if proceed.lower() != 'yes':
            print("Migration cancelled.")
            return False
    print()

    print("Connecting to database...")
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    print("Connected!")
    print()

    print("Checking current table structure...")
    cursor.execute("PRAGMA table_info(workout_sessions)")
    columns = cursor.fetchall()
    existing_columns = {col[1] for col in columns}
    print(f"Existing columns: {', '.join(sorted(existing_columns))}")
    print()

    columns_to_add = [
        ("manual_workout_id", "INTEGER"),
        ("completed_at", "DATETIME"),
        ("duration_minutes", "INTEGER"),
        ("planned_exercises_count", "INTEGER DEFAULT 0"),
        ("completed_exercises_count", "INTEGER DEFAULT 0"),
        ("skipped_exercises_count", "INTEGER DEFAULT 0"),
        ("energy_level_start", "VARCHAR(20)"),
        ("energy_level_end", "VARCHAR(20)"),
        ("soreness_level_start", "INTEGER"),
        ("soreness_level_end", "INTEGER"),
        ("notes", "TEXT"),
        ("ai_feedback", "TEXT"),
    ]

    print("Adding missing columns...")
    added_count = 0
    skipped_count = 0

    for column_name, column_type in columns_to_add:
        if column_name in existing_columns:
            print(f"  {column_name:30s} (already exists)")
            skipped_count += 1
        else:
            try:
                sql = f"ALTER TABLE workout_sessions ADD COLUMN {column_name} {column_type}"
                cursor.execute(sql)
                print(f"  Added: {column_name:30s} {column_type}")
                added_count += 1
            except sqlite3.OperationalError as e:
                print(f"  Error: {column_name:30s} - {e}")

    print()

    if added_count > 0:
        print("Saving changes...")
        conn.commit()
        print("Changes saved!")
    else:
        print("No changes needed - all columns already exist")

    print()

    print("Verifying final table structure...")
    cursor.execute("PRAGMA table_info(workout_sessions)")
    final_columns = cursor.fetchall()
    print(f"Total columns: {len(final_columns)}")
    print()

    conn.close()

    print("=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Columns added:   {added_count}")
    print(f"Columns skipped: {skipped_count}")
    print()

    if added_count > 0:
        print("Migration completed successfully!")
        print()
        print("Next steps:")
        print("1. Replace backend/app/routers/workout_endpoints.py")
        print("2. Replace backend/app/models/fitness_tracking.py")
        print("3. Restart your FastAPI backend")
    else:
        print("Database already up to date!")

    print()
    return True

if __name__ == "__main__":
    print()
    success = run_migration()
    print()
    if not success:
        exit(1)
