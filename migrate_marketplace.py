"""
migrate_marketplace.py
──────────────────────
Adds marketplace columns to the gyms table:
  - category       TEXT DEFAULT 'gym'
  - chain_name     TEXT
  - is_sponsored   INTEGER DEFAULT 0
  - sponsored_rank INTEGER DEFAULT 9999

Then back-fills category and chain_name for all existing rows
by matching gym names against known keywords and premium chains.

Safe to run multiple times (idempotent).
"""

import sqlite3
import os
import re

DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")

# ── Known premium chains (case-insensitive substring match) ─────────────────
PREMIUM_CHAINS = [
    "cult.fit", "cult fit", "curefit",
    "gold's gym", "golds gym", "gold gym",
    "anytime fitness",
    "snap fitness",
    "fitness first",
    "talwalkars",
    "true fitness",
    "f45",
    "crossfit",
    "physique 57",
    "powerhouse gym",
    "la fitness",
    "pure gym",
    "crunch fitness",
    "24 hour fitness",
    "planet fitness",
    "nuffield",
    "vi fitness",
    "iron world",
    "bodyfit",
    "transform",
    "energy fitness",
    "fitness one",
]

# ── Category keyword inference ───────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "swimming":  ["swimming", "pool", "aquatic", "natatorium", "swim"],
    "yoga":      ["yoga", "pilates", "wellness center", "meditation", "zen", "stretch"],
    "boxing":    ["boxing", "mma", "muay thai", "martial art", "karate", "judo",
                  "taekwondo", "kickboxing", "combat"],
    "cricket":   ["cricket"],
    "football":  ["football", "soccer"],
    "badminton": ["badminton"],
    "squash":    ["squash"],
    "turf":      ["turf", "arena", "ground", "field sports", "sports complex",
                  "sports village"],
    "crossfit":  ["crossfit", "cross fit"],
    "trainer":   ["personal trainer", "pt studio", "coaching studio"],
}

def infer_category(name: str) -> str:
    low = name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in low for kw in keywords):
            return category
    return "gym"

def infer_chain(name: str) -> str | None:
    low = name.lower()
    for chain in PREMIUM_CHAINS:
        if chain in low:
            # Return pretty-cased chain name
            return chain.title().replace(".Fit", ".fit").replace("F45", "F45")
    return None

def column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def run():
    print(f"[migrate_marketplace] Opening DB at: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("  ERROR: DB not found. Run the backend first to create it.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # ── 1. Add new columns (idempotent) ─────────────────────────────────────
    new_columns = [
        ("category",       "TEXT    DEFAULT 'gym'"),
        ("chain_name",     "TEXT"),
        ("is_sponsored",   "INTEGER DEFAULT 0"),
        ("sponsored_rank", "INTEGER DEFAULT 9999"),
    ]

    for col_name, col_def in new_columns:
        if not column_exists(c, "gyms", col_name):
            c.execute(f"ALTER TABLE gyms ADD COLUMN {col_name} {col_def}")
            print(f"  + Added column: {col_name}")
        else:
            print(f"  ✓ Column already exists: {col_name}")

    conn.commit()

    # ── 2. Back-fill category + chain_name for all existing rows ────────────
    c.execute("SELECT id, name FROM gyms WHERE category IS NULL OR category = 'gym'")
    rows = c.fetchall()
    print(f"\n[migrate_marketplace] Back-filling {len(rows)} gyms...")

    updated = 0
    for gym_id, name in rows:
        if not name:
            continue
        cat   = infer_category(name)
        chain = infer_chain(name)

        # Mark premium chains via gym_amenities is_premium flag too
        if chain:
            # Upsert into gym_amenities — ensure is_premium = 1
            c.execute(
                "INSERT INTO gym_amenities (gym_id, is_premium) VALUES (?, 1) "
                "ON CONFLICT(gym_id) DO UPDATE SET is_premium = 1",
                (gym_id,)
            )

        c.execute(
            "UPDATE gyms SET category = ?, chain_name = ? WHERE id = ?",
            (cat, chain, gym_id)
        )
        updated += 1

    conn.commit()
    print(f"  ✓ Back-filled {updated} rows")

    # ── 3. Report summary ───────────────────────────────────────────────────
    c.execute("SELECT category, COUNT(*) FROM gyms GROUP BY category ORDER BY COUNT(*) DESC")
    print("\n[migrate_marketplace] Category breakdown:")
    for row in c.fetchall():
        print(f"  {row[0] or 'NULL':15s} → {row[1]} gyms")

    c.execute("SELECT chain_name, COUNT(*) FROM gyms WHERE chain_name IS NOT NULL GROUP BY chain_name ORDER BY COUNT(*) DESC")
    chains = c.fetchall()
    if chains:
        print("\n[migrate_marketplace] Chains detected:")
        for row in chains:
            print(f"  {row[0]:25s} → {row[1]} branches")
    else:
        print("\n[migrate_marketplace] No known chains found in current data (normal for local indie gyms)")

    conn.close()
    print("\n[migrate_marketplace] Done.")

if __name__ == "__main__":
    run()
