"""
Run this ONCE to fix the onboarding_completed column.
The server_default was set to the string 'false' instead of 0,
so every user appeared as already-onboarded.

Usage (with server stopped):
  python3 fix_onboarding_flag.py
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT id, email, onboarding_completed FROM users")
rows = cur.fetchall()
print("Current state:")
for r in rows:
    print(f"  id={r[0]}  email={r[1]}  onboarding_completed={r[2]!r}")

cur.execute(
    "UPDATE users SET onboarding_completed = 0 "
    "WHERE onboarding_completed = 'false' OR onboarding_completed IS NULL"
)
print(f"\nReset {cur.rowcount} rows to 0 (not onboarded)")
conn.commit()

cur.execute("SELECT id, email, onboarding_completed FROM users")
print("\nAfter fix:")
for r in cur.fetchall():
    print(f"  id={r[0]}  email={r[1]}  onboarding_completed={r[2]!r}")

conn.close()
print("\nDone. Restart the server.")
