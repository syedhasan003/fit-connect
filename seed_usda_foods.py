"""
seed_usda_foods.py — Phase 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seeds the food_items table from USDA FoodData Central (FDC).

Datasets imported:
  • SR Legacy      — ~8,700 basic foods (the gold standard reference DB)
  • Foundation     — ~1,100 thoroughly researched single-ingredient foods
  Total           : ~9,800 additional foods on top of our hand-seeded Indian items

USDA FDC API is FREE — get your key in ~30 seconds:
  https://fdc.nal.usda.gov/api-key-signup.html

Usage:
  cd backend

  # With your own key (1,000 requests/hour — finishes in ~10 min):
  USDA_API_KEY=your_key_here python seed_usda_foods.py

  # Without a key (DEMO_KEY — 30 requests/minute — slower, ~2 hours):
  python seed_usda_foods.py

  # Skip a dataset you don't want:
  python seed_usda_foods.py --no-sr-legacy
  python seed_usda_foods.py --no-foundation

Notes:
  • Script is safe to re-run — it skips foods already in the DB (by FDC ID).
  • Nutrients stored per serving (servingSize field from FDC); if no servingSize
    is returned the value defaults to 100 g.
  • SR Legacy foods are unbranded (e.g. "Chicken, broilers or fryers, breast,
    meat only, cooked, roasted"). We clean up the name but keep it readable.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

# ── Load .env so USDA_API_KEY is available without shell export ───────────────
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

# ── Import ALL models before any db.query() ──────────────────────────────────
import app.models.fitness_tracking   # noqa: F401
import app.models.user               # noqa: F401
import app.models.exercise           # noqa: F401
import app.models.reminder           # noqa: F401
import app.models.medication         # noqa: F401
import app.models.vault_item         # noqa: F401
import app.models.food               # noqa: F401

from app.db.database import SessionLocal, engine, Base
from app.models.food import FoodItem

Base.metadata.create_all(bind=engine)

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY  = os.environ.get("USDA_API_KEY", "DEMO_KEY")
BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Page size: max 200 per USDA docs
PAGE_SIZE = 200

# Sleep between requests (seconds). DEMO_KEY: 1 req/sec is safe.
# With a real key set to 0.1 or 0.0 for full speed.
SLEEP_BETWEEN_PAGES = 2.0 if API_KEY == "DEMO_KEY" else 0.5

# ── Nutrient name → FoodItem field mapping ────────────────────────────────────
# Nutrient number → FoodItem field.
# Using nutrient NUMBER (stable) rather than name (varies by dataset).
# Key USDA numbers:
#   208 = Energy (kcal)   203 = Protein       205 = Carbohydrate
#   204 = Total fat       291 = Fiber          269 = Total Sugars
#   307 = Sodium          606 = Saturated fat
NUTRIENT_NUMBER_MAP = {
    "208": "calories",      # Energy, KCAL  (skip 268 which is kJ)
    "203": "protein",
    "205": "carbs",
    "204": "fat",
    "291": "fiber",
    "269": "sugar",         # "Total Sugars" (SR Legacy)  or "Sugars, total including NLEA"
    "307": "sodium",
    "606": "saturated_fat",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def fetch_page(data_type: str, page_num: int) -> list:
    """Fetch one page of foods from the USDA /foods/list endpoint."""
    params = urllib.parse.urlencode({
        "api_key":    API_KEY,
        "dataType":   data_type,
        "pageSize":   PAGE_SIZE,
        "pageNumber": page_num,
    })
    url = f"{BASE_URL}/foods/list?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "fit-connect-seed/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def extract_nutrients(food_nutrients: list) -> dict:
    """
    Pull the macros we care about from the foodNutrients array.

    The /foods/list endpoint returns each nutrient as:
      { "number": "208", "name": "Energy", "amount": 69.0, "unitName": "KCAL" }

    We key off 'number' (stable across datasets) and read 'amount'.
    """
    result = {v: 0.0 for v in NUTRIENT_NUMBER_MAP.values()}
    for n in food_nutrients:
        num = str(n.get("number", "")).strip()
        if num in NUTRIENT_NUMBER_MAP:
            result[NUTRIENT_NUMBER_MAP[num]] = float(n.get("amount") or 0)
    return result


def clean_name(raw: str) -> str:
    """
    SR Legacy names are long and comma-reversed:
      "Beef, ground, 85% lean meat / 15% fat, patty, cooked, pan-broiled"
    We keep them as-is but truncate at 200 chars.
    """
    return (raw or "").strip()[:200]


def is_indian_category(category: str) -> bool:
    """Best-effort flag — USDA doesn't have Indian-specific categories."""
    if not category:
        return False
    cats = category.lower()
    return any(kw in cats for kw in ("indian", "curry", "dhal", "dal", "chapati", "roti"))


def seed_dataset(db, data_type: str, label: str, existing_ids: set,
                 update_existing: bool = False) -> int:
    """
    Pages through all pages of `data_type` and inserts/updates FoodItem rows.
    Returns the number of newly inserted or updated rows.
    """
    page    = 1
    seeded  = 0

    # Build a lookup of external_id → FoodItem.id for update mode
    existing_map: dict = {}
    if update_existing:
        for row in db.query(FoodItem.id, FoodItem.external_id).filter(
            FoodItem.external_id.isnot(None)
        ).all():
            existing_map[row.external_id] = row.id

    while True:
        try:
            foods = fetch_page(data_type, page)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"   ⚠️  Rate-limited on page {page}. Sleeping 60 s…")
                time.sleep(60)
                continue
            print(f"   ❌ HTTP {e.code} on page {page}: {e}")
            break
        except Exception as e:
            print(f"   ❌ Error fetching page {page}: {e}")
            break

        if not foods:
            break  # API returns empty list on last+1 page

        for f in foods:
            fdc_id = str(f.get("fdcId", ""))

            # In normal mode skip existing; in update mode patch nutrients
            if fdc_id in existing_ids and not update_existing:
                continue

            nutrients = extract_nutrients(f.get("foodNutrients", []))

            serving_size = float(f.get("servingSize") or 100)
            serving_unit = (f.get("servingSizeUnit") or "g").lower()
            serving_label = f.get("householdServingFullText") or None

            # Clamp unreasonably large servings (API sometimes returns raw 100g)
            if serving_size <= 0:
                serving_size = 100.0

            category = f.get("foodCategory") or label
            brand    = f.get("brandName") or f.get("brandOwner") or None

            item = FoodItem(
                external_id   = fdc_id,
                name          = clean_name(f.get("description", "Unknown food")),
                brand         = brand,
                category      = category,
                tags          = json.dumps([]),
                is_indian     = is_indian_category(category),
                serving_size  = serving_size,
                serving_unit  = serving_unit,
                serving_label = serving_label,
                calories      = nutrients["calories"],
                protein       = nutrients["protein"],
                carbs         = nutrients["carbs"],
                fat           = nutrients["fat"],
                fiber         = nutrients["fiber"],
                sugar         = nutrients["sugar"],
                sodium        = nutrients["sodium"],
                saturated_fat = nutrients["saturated_fat"],
                is_active     = True,
            )

            if update_existing and fdc_id in existing_map:
                # Patch only the nutrient columns on the existing row
                db.query(FoodItem).filter(
                    FoodItem.id == existing_map[fdc_id]
                ).update({
                    "calories":      nutrients["calories"],
                    "protein":       nutrients["protein"],
                    "carbs":         nutrients["carbs"],
                    "fat":           nutrients["fat"],
                    "fiber":         nutrients["fiber"],
                    "sugar":         nutrients["sugar"],
                    "sodium":        nutrients["sodium"],
                    "saturated_fat": nutrients["saturated_fat"],
                })
            else:
                db.add(item)
                existing_ids.add(fdc_id)

            seeded += 1

        db.commit()
        print(f"   Page {page:>3}  |  +{len(foods)} fetched  |  {seeded} new so far")

        if len(foods) < PAGE_SIZE:
            break  # Last page (partial)

        page += 1
        time.sleep(SLEEP_BETWEEN_PAGES)

    return seeded


# ── Main ──────────────────────────────────────────────────────────────────────

def seed(do_sr_legacy=True, do_foundation=True, update_existing=False):
    if API_KEY == "DEMO_KEY":
        print("ℹ️  Running with DEMO_KEY (30 req/min). Get a free key at:")
        print("   https://fdc.nal.usda.gov/api-key-signup.html")
        print("   Then add USDA_API_KEY=your_key to backend/.env\n")
    else:
        print(f"✅ Using API key: {API_KEY[:8]}… (1,000 req/hour)\n")

    if update_existing:
        print("🔄 UPDATE mode — nutrients will be patched on existing rows.\n")

    db = SessionLocal()
    try:
        existing_count = db.query(FoodItem).count()
        print(f"food_items currently has {existing_count} rows.\n")

        # Collect all existing external_ids for fast duplicate check
        existing_ids = {
            row[0]
            for row in db.query(FoodItem.external_id)
            .filter(FoodItem.external_id.isnot(None))
            .all()
        }

        total = 0

        # ── SR Legacy ─────────────────────────────────────────────────────────
        if do_sr_legacy:
            print("=" * 60)
            print("📦 SR Legacy  (~8,700 basic reference foods)")
            print("=" * 60)
            n = seed_dataset(db, "SR Legacy", "SR Legacy", existing_ids,
                             update_existing=update_existing)
            verb = "updated" if update_existing else "added"
            print(f"   → {n} SR Legacy foods {verb}\n")
            total += n

        # ── Foundation Foods ──────────────────────────────────────────────────
        if do_foundation:
            print("=" * 60)
            print("📦 Foundation Foods  (~1,100 premium single-ingredient foods)")
            print("=" * 60)
            n = seed_dataset(db, "Foundation", "Foundation Foods", existing_ids,
                             update_existing=update_existing)
            verb = "updated" if update_existing else "added"
            print(f"   → {n} Foundation foods {verb}\n")
            total += n

        print("=" * 60)
        action = "updated" if update_existing else "added"
        print(f"✅ Total USDA foods {action} this run : {total}")
        print(f"   Total food_items in DB            : {db.query(FoodItem).count()}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Fatal error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    do_sr_legacy      = "--no-sr-legacy"  not in sys.argv
    do_foundation     = "--no-foundation" not in sys.argv
    update_existing   = "--update"        in sys.argv
    seed(do_sr_legacy=do_sr_legacy, do_foundation=do_foundation,
         update_existing=update_existing)
