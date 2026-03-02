"""
Phase 3 migration — run ONCE with the server stopped.

Adds:
  - New columns to `reminders` table
  - New `medication_schedules` table
  - New `medication_logs` table
  - New `health_records` table

Usage:
    python3 migrate_phase3.py
"""
import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), "test.db")

def col_exists(cur, table, col):
    cur.execute(f"PRAGMA table_info({table})")
    return any(r[1] == col for r in cur.fetchall())

def table_exists(cur, table):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cur.fetchone() is not None

conn = sqlite3.connect(DB)
cur  = conn.cursor()

print("=== Phase 3 Migration ===\n")

# ── 1. Update reminders table ─────────────────────────────────────────────
new_reminder_cols = [
    ("recurrence_days",     "TEXT"),
    ("recurrence_interval", "INTEGER"),
    ("category_meta",       "TEXT"),
]
for col, col_type in new_reminder_cols:
    if not col_exists(cur, "reminders", col):
        cur.execute(f"ALTER TABLE reminders ADD COLUMN {col} {col_type}")
        print(f"  ✅ reminders.{col} added")
    else:
        print(f"  ⏭  reminders.{col} already exists")

# ── 2. medication_schedules ───────────────────────────────────────────────
if not table_exists(cur, "medication_schedules"):
    cur.execute("""
        CREATE TABLE medication_schedules (
            id                          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id                     INTEGER NOT NULL REFERENCES users(id),
            name                        TEXT    NOT NULL,
            scheduled_time              TEXT    NOT NULL,
            recurrence                  TEXT    NOT NULL DEFAULT 'daily',
            recurrence_days             TEXT,
            tablets                     TEXT    NOT NULL DEFAULT '[]',
            is_active                   INTEGER NOT NULL DEFAULT 1,
            escalation_interval_mins    INTEGER NOT NULL DEFAULT 5,
            max_escalations             INTEGER NOT NULL DEFAULT 3,
            emergency_contact_name      TEXT,
            emergency_contact_phone     TEXT,
            emergency_contact_relation  TEXT,
            created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at                  DATETIME
        )
    """)
    print("  ✅ medication_schedules table created")
else:
    print("  ⏭  medication_schedules already exists")

# ── 3. medication_logs ────────────────────────────────────────────────────
if not table_exists(cur, "medication_logs"):
    cur.execute("""
        CREATE TABLE medication_logs (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id         INTEGER NOT NULL REFERENCES medication_schedules(id),
            user_id             INTEGER NOT NULL REFERENCES users(id),
            log_date            TEXT    NOT NULL,
            tablets_status      TEXT    NOT NULL DEFAULT '{}',
            escalation_count    INTEGER NOT NULL DEFAULT 0,
            contact_alerted     INTEGER NOT NULL DEFAULT 0,
            fully_acknowledged  INTEGER NOT NULL DEFAULT 0,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at          DATETIME
        )
    """)
    print("  ✅ medication_logs table created")
else:
    print("  ⏭  medication_logs already exists")

# ── 4. health_records ─────────────────────────────────────────────────────
if not table_exists(cur, "health_records"):
    cur.execute("""
        CREATE TABLE health_records (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL REFERENCES users(id),
            record_date         DATE    NOT NULL,
            record_type         TEXT    NOT NULL,
            title               TEXT    NOT NULL,
            doctor_name         TEXT,
            facility_name       TEXT,
            notes               TEXT,
            file_paths          TEXT    DEFAULT '[]',
            tags                TEXT    DEFAULT '[]',
            extracted_values    TEXT,
            linked_reminder_id  INTEGER REFERENCES reminders(id),
            is_archived         INTEGER NOT NULL DEFAULT 0,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at          DATETIME
        )
    """)
    print("  ✅ health_records table created")
else:
    print("  ⏭  health_records already exists")

conn.commit()
conn.close()
print("\n✅ Phase 3 migration complete. Restart the server.")
