"""
Seed Foods Database — Phase 4
Populates the `food_items` table with 300+ Indian & global foods.

Uses the FoodItem model (app.models.food) introduced in Phase 4.
Note: FoodItem ≠ the legacy Food model in fitness_tracking.py (user-custom foods).

Usage:
  cd backend
  python seed_foods.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# ── Import ALL models first so SQLAlchemy can resolve all relationships ──────
# The User model references WorkoutSession, BehavioralPattern etc. — they must
# be imported before any db.query() is called.
import app.models.fitness_tracking   # noqa: F401 — loads WorkoutSession, Food, etc.
import app.models.user               # noqa: F401 — loads User relationships
import app.models.exercise           # noqa: F401
import app.models.reminder           # noqa: F401
import app.models.medication         # noqa: F401
import app.models.vault_item         # noqa: F401

from app.db.database import SessionLocal, engine, Base
from app.models.food import FoodItem  # Phase-4 food database model

# ──────────────────────────────────────────────────────────────────────────────
# DATA
# Each tuple: (name, brand, category, tags_json, is_indian,
#              serving_size, serving_unit, serving_label,
#              calories, protein, carbs, fat, fiber, sugar, sodium, sat_fat)
# All macro values are PER SERVING (not per 100 g).
# ──────────────────────────────────────────────────────────────────────────────

FOODS = [

    # ── SOUTH INDIAN ──────────────────────────────────────────────────────────
    ("Idli (steamed)", None, "South Indian", '["vegetarian","vegan","gluten-free"]', True,
     2, "piece", "2 idlis (60 g)", 78, 3.8, 15.8, 0.4, 0.6, 0.2, 180, 0.1),
    ("Dosa (plain)", None, "South Indian", '["vegetarian","vegan"]', True,
     1, "piece", "1 dosa (80 g)", 133, 3.0, 25.0, 2.5, 0.5, 0.5, 210, 0.5),
    ("Masala Dosa", None, "South Indian", '["vegetarian"]', True,
     1, "piece", "1 masala dosa (180 g)", 300, 7.5, 48.0, 8.0, 2.0, 2.0, 420, 2.0),
    ("Uttapam (onion-tomato)", None, "South Indian", '["vegetarian"]', True,
     1, "piece", "1 uttapam (100 g)", 140, 4.5, 25.0, 3.0, 1.0, 1.5, 280, 0.8),
    ("Medu Vada", None, "South Indian", '["vegetarian"]', True,
     2, "piece", "2 vadas (80 g)", 240, 6.5, 22.0, 14.0, 1.5, 0.5, 310, 2.0),
    ("Sambar (1 katori)", None, "South Indian", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 90, 5.3, 15.0, 2.3, 3.5, 3.0, 400, 0.5),
    ("Coconut Chutney", None, "South Indian", '["vegetarian","vegan","gluten-free"]', True,
     30, "g", "2 tbsp (30 g)", 65, 0.7, 3.2, 5.5, 1.2, 0.8, 90, 5.0),
    ("Rasam", None, "South Indian", '["vegetarian","vegan","gluten-free"]', True,
     200, "ml", "1 bowl (200 ml)", 55, 2.5, 9.5, 0.8, 1.2, 2.0, 350, 0.1),
    ("Pongal (ven)", None, "South Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 290, 9.0, 50.0, 5.5, 2.0, 1.0, 320, 2.0),
    ("Upma", None, "South Indian", '["vegetarian"]', True,
     200, "g", "1 serving (200 g)", 240, 7.0, 44.0, 4.0, 2.5, 1.5, 380, 1.0),
    ("Poha (cooked)", None, "South Indian", '["vegetarian","gluten-free"]', True,
     150, "g", "1 serving (150 g)", 194, 3.8, 42.0, 2.3, 1.0, 1.2, 290, 0.4),
    ("Appam (1 piece)", None, "South Indian", '["vegetarian","vegan"]', True,
     1, "piece", "1 appam (60 g)", 100, 2.5, 20.0, 1.5, 0.5, 0.8, 150, 0.3),
    ("Puttu (with coconut)", None, "South Indian", '["vegetarian","gluten-free"]', True,
     150, "g", "1 serving (150 g)", 225, 5.0, 40.0, 5.0, 2.0, 1.5, 180, 4.0),
    ("Curd Rice", None, "South Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 210, 6.0, 38.0, 3.5, 0.5, 3.0, 260, 2.0),
    ("Tamarind Rice / Puliyodarai", None, "South Indian", '["vegetarian","vegan"]', True,
     150, "g", "1 serving (150 g)", 270, 4.5, 50.0, 6.0, 1.5, 2.5, 480, 1.0),
    ("Lemon Rice", None, "South Indian", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 serving (150 g)", 235, 4.0, 44.0, 5.0, 1.0, 1.0, 320, 0.8),
    ("Chicken Chettinad Curry", None, "South Indian", '["non-veg","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 310, 30.0, 8.0, 18.0, 1.5, 2.0, 680, 4.5),
    ("Fish Curry (Kerala style)", None, "South Indian", '["non-veg","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 245, 24.0, 7.0, 14.0, 1.2, 2.5, 750, 8.0),
    ("Prawn Masala", None, "South Indian", '["non-veg","gluten-free"]', True,
     150, "g", "1 serving (150 g)", 195, 22.0, 6.5, 10.0, 1.0, 2.0, 650, 2.5),

    # ── NORTH INDIAN ──────────────────────────────────────────────────────────
    ("Roti / Chapati (whole wheat)", None, "North Indian", '["vegetarian","vegan"]', True,
     1, "piece", "1 roti (40 g)", 71, 2.7, 13.0, 0.9, 1.5, 0.3, 120, 0.2),
    ("Paratha (plain)", None, "North Indian", '["vegetarian"]', True,
     1, "piece", "1 paratha (80 g)", 190, 4.5, 28.0, 7.0, 2.0, 0.5, 200, 2.5),
    ("Aloo Paratha", None, "North Indian", '["vegetarian"]', True,
     1, "piece", "1 paratha (130 g)", 260, 6.0, 40.0, 9.0, 2.5, 1.0, 310, 3.0),
    ("Puri (fried)", None, "North Indian", '["vegetarian"]', True,
     2, "piece", "2 puris (80 g)", 290, 5.5, 35.0, 15.0, 1.5, 0.5, 220, 3.5),
    ("Naan (plain)", None, "North Indian", '["vegetarian"]', True,
     1, "piece", "1 naan (90 g)", 262, 8.7, 45.0, 5.0, 1.5, 2.0, 480, 1.2),
    ("Kulcha (butter naan)", None, "North Indian", '["vegetarian"]', True,
     1, "piece", "1 kulcha (100 g)", 300, 9.0, 50.0, 8.0, 1.5, 2.5, 510, 3.0),
    ("Dal Tadka", None, "North Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 katori (200 g)", 195, 11.5, 28.0, 4.5, 6.0, 2.0, 480, 1.0),
    ("Dal Makhani", None, "North Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 katori (200 g)", 280, 12.0, 30.0, 12.0, 7.0, 2.5, 620, 5.0),
    ("Palak Paneer", None, "North Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 320, 16.0, 14.0, 23.0, 3.0, 2.0, 560, 9.0),
    ("Paneer Butter Masala", None, "North Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 380, 17.0, 18.0, 28.0, 2.0, 5.0, 720, 12.0),
    ("Rajma Masala", None, "North Indian", '["vegetarian","vegan","gluten-free"]', True,
     200, "g", "1 katori (200 g)", 240, 14.0, 38.0, 5.0, 8.0, 2.5, 580, 1.0),
    ("Chole Masala", None, "North Indian", '["vegetarian","vegan","gluten-free"]', True,
     200, "g", "1 katori (200 g)", 270, 15.0, 44.0, 6.5, 9.0, 3.0, 640, 1.2),
    ("Chicken Tikka Masala", None, "North Indian", '["non-veg","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 340, 32.0, 12.0, 18.0, 1.5, 4.0, 820, 5.0),
    ("Butter Chicken (Murgh Makhani)", None, "North Indian", '["non-veg","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 380, 30.0, 14.0, 24.0, 1.2, 5.0, 900, 9.0),
    ("Mutton Rogan Josh", None, "North Indian", '["non-veg","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 420, 35.0, 9.0, 27.0, 1.5, 2.5, 780, 9.5),
    ("Aloo Gobi", None, "North Indian", '["vegetarian","vegan","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 185, 5.5, 30.0, 6.0, 4.0, 3.0, 420, 1.0),
    ("Matar Paneer", None, "North Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 serving (200 g)", 295, 14.0, 22.0, 18.0, 4.0, 3.5, 540, 7.0),
    ("Khichdi", None, "North Indian", '["vegetarian","gluten-free"]', True,
     200, "g", "1 katori (200 g)", 265, 10.0, 44.0, 5.0, 4.0, 1.0, 380, 1.5),
    ("Chicken Biryani", None, "North Indian", '["non-veg"]', True,
     300, "g", "1 plate (300 g)", 520, 38.0, 65.0, 12.0, 2.5, 3.5, 980, 3.5),

    # ── STREET FOOD / SNACKS ──────────────────────────────────────────────────
    ("Samosa (1 piece)", None, "Street Food", '["vegetarian"]', True,
     1, "piece", "1 samosa (80 g)", 262, 4.5, 32.0, 13.0, 2.0, 1.5, 420, 3.5),
    ("Pakora / Bhajiya", None, "Street Food", '["vegetarian"]', True,
     100, "g", "1 serving (100 g)", 274, 6.5, 30.0, 15.0, 2.5, 1.0, 380, 2.5),
    ("Pav Bhaji", None, "Street Food", '["vegetarian"]', True,
     250, "g", "1 plate (250 g)", 420, 10.0, 68.0, 13.0, 5.0, 6.0, 920, 4.5),
    ("Bhel Puri", None, "Street Food", '["vegetarian","vegan"]', True,
     150, "g", "1 serving (150 g)", 270, 6.5, 51.0, 6.0, 3.0, 4.0, 540, 1.0),
    ("Sev Puri", None, "Street Food", '["vegetarian"]', True,
     100, "g", "1 serving (100 g)", 230, 5.0, 35.0, 8.5, 2.0, 3.5, 480, 1.5),
    ("Pani Puri / Golgappa (6 pcs)", None, "Street Food", '["vegetarian","vegan"]', True,
     6, "piece", "6 pieces (80 g)", 185, 3.5, 36.0, 3.5, 1.5, 3.0, 360, 0.8),
    ("Dhokla (2 pieces)", None, "Street Food", '["vegetarian"]', True,
     2, "piece", "2 pieces (80 g)", 115, 5.2, 21.0, 1.5, 1.2, 2.0, 480, 0.3),
    ("Vada Pav", None, "Street Food", '["vegetarian"]', True,
     1, "piece", "1 vada pav (120 g)", 295, 7.5, 43.0, 11.0, 2.5, 2.0, 650, 2.5),
    ("Poha (street style)", None, "Street Food", '["vegetarian"]', True,
     150, "g", "1 plate (150 g)", 245, 5.0, 44.0, 6.5, 2.0, 2.5, 480, 1.5),
    ("Roasted Makhana / Fox Nuts", None, "Street Food", '["vegetarian","vegan","gluten-free"]', True,
     30, "g", "1 cup (30 g)", 107, 3.7, 22.0, 0.5, 0.3, 0.2, 55, 0.1),
    ("Roasted Chana", None, "Street Food", '["vegetarian","vegan","gluten-free"]', True,
     50, "g", "1 serving (50 g)", 182, 11.0, 26.0, 2.5, 5.5, 1.5, 90, 0.3),

    # ── PROTEINS / MEAT / FISH ────────────────────────────────────────────────
    ("Chicken Breast (cooked, boneless)", None, "Protein", '["non-veg","gluten-free","high-protein"]', False,
     100, "g", "100 g", 165, 31.0, 0.0, 3.6, 0.0, 0.0, 74, 1.0),
    ("Chicken Thigh (cooked, boneless)", None, "Protein", '["non-veg","gluten-free"]', False,
     100, "g", "100 g", 209, 26.0, 0.0, 11.0, 0.0, 0.0, 95, 3.0),
    ("Ground Chicken (cooked)", None, "Protein", '["non-veg","gluten-free"]', False,
     100, "g", "100 g", 148, 21.0, 0.0, 7.0, 0.0, 0.0, 85, 2.0),
    ("Mutton / Goat (cooked, boneless)", None, "Protein", '["non-veg","gluten-free"]', False,
     100, "g", "100 g", 234, 28.0, 0.0, 13.0, 0.0, 0.0, 72, 5.0),
    ("Lamb Mince (cooked)", None, "Protein", '["non-veg","gluten-free"]', False,
     100, "g", "100 g", 215, 22.0, 2.0, 13.0, 0.0, 0.0, 78, 5.5),
    ("Egg (whole, large)", None, "Protein", '["vegetarian","gluten-free"]', False,
     1, "piece", "1 large egg (50 g)", 78, 6.3, 0.6, 5.3, 0.0, 0.3, 62, 1.6),
    ("Egg White", None, "Protein", '["vegetarian","gluten-free","low-fat"]', False,
     3, "piece", "3 egg whites (99 g)", 52, 10.9, 0.7, 0.2, 0.0, 0.4, 163, 0.0),
    ("Rohu Fish (cooked)", None, "Protein", '["non-veg","gluten-free"]', True,
     100, "g", "100 g", 97, 17.0, 0.0, 2.8, 0.0, 0.0, 68, 0.8),
    ("Pomfret (cooked)", None, "Protein", '["non-veg","gluten-free"]', True,
     100, "g", "100 g", 86, 17.0, 0.0, 1.7, 0.0, 0.0, 65, 0.5),
    ("Surmai / Kingfish (cooked)", None, "Protein", '["non-veg","gluten-free"]', True,
     100, "g", "100 g", 108, 21.0, 0.0, 2.5, 0.0, 0.0, 90, 0.7),
    ("Prawn (cooked)", None, "Protein", '["non-veg","gluten-free"]', True,
     100, "g", "100 g", 99, 21.0, 0.9, 1.1, 0.0, 0.0, 230, 0.3),
    ("Tuna (canned in water)", None, "Protein", '["non-veg","gluten-free","high-protein"]', False,
     100, "g", "100 g (drained)", 116, 26.0, 0.0, 0.8, 0.0, 0.0, 230, 0.2),
    ("Salmon (cooked)", None, "Protein", '["non-veg","gluten-free","omega-3"]', False,
     100, "g", "100 g", 206, 22.0, 0.0, 13.0, 0.0, 0.0, 59, 3.0),
    ("Paneer (full fat)", None, "Protein", '["vegetarian","gluten-free"]', True,
     100, "g", "100 g", 265, 18.0, 1.2, 21.0, 0.0, 0.5, 30, 13.0),
    ("Tofu (firm)", None, "Protein", '["vegan","gluten-free","high-protein"]', False,
     100, "g", "100 g", 76, 8.1, 1.9, 4.8, 0.3, 0.5, 7, 0.7),

    # ── LEGUMES / PULSES ──────────────────────────────────────────────────────
    ("Toor Dal (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 174, 11.3, 30.0, 0.6, 6.5, 2.0, 290, 0.1),
    ("Moong Dal (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 158, 10.5, 27.0, 0.6, 6.0, 1.5, 200, 0.1),
    ("Chana Dal (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 246, 13.0, 40.5, 4.0, 8.5, 3.0, 250, 0.4),
    ("Masoor Dal (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 174, 13.5, 30.0, 0.6, 6.5, 2.0, 185, 0.1),
    ("Urad Dal (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 190, 13.5, 33.0, 0.9, 7.0, 1.5, 225, 0.2),
    ("Rajma / Kidney Beans (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 190, 12.0, 34.5, 0.8, 8.5, 1.5, 210, 0.1),
    ("Chole / Chickpeas (cooked)", None, "Legumes", '["vegetarian","vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 246, 13.4, 40.5, 3.9, 9.0, 2.5, 245, 0.4),
    ("Moong Sprouts (raw)", None, "Legumes", '["vegetarian","vegan","gluten-free","low-calorie"]', True,
     100, "g", "1 katori (100 g)", 30, 3.0, 5.9, 0.2, 1.8, 0.0, 14, 0.1),
    ("Lentils / Red Lentils (cooked)", None, "Legumes", '["vegan","gluten-free","high-protein"]', False,
     150, "g", "1 cup (150 g)", 174, 13.5, 30.0, 0.6, 6.5, 2.0, 185, 0.1),
    ("Black Beans (cooked)", None, "Legumes", '["vegan","gluten-free"]', False,
     150, "g", "1 cup (150 g)", 198, 13.4, 36.0, 0.8, 10.0, 1.5, 165, 0.2),
    ("Edamame (cooked)", None, "Legumes", '["vegan","gluten-free"]', False,
     100, "g", "1 serving (100 g)", 122, 11.0, 10.0, 5.0, 5.0, 2.0, 63, 0.7),

    # ── GRAINS & CARBS ────────────────────────────────────────────────────────
    ("White Rice (cooked)", None, "Grains", '["vegan","gluten-free"]', False,
     200, "g", "1 katori (200 g)", 260, 5.4, 56.0, 0.6, 0.4, 0.0, 2, 0.2),
    ("Brown Rice (cooked)", None, "Grains", '["vegan","gluten-free"]', False,
     200, "g", "1 katori (200 g)", 218, 5.0, 46.0, 1.8, 3.2, 0.0, 10, 0.4),
    ("Oats (raw / dry)", None, "Grains", '["vegan"]', False,
     50, "g", "½ cup dry (50 g)", 195, 6.7, 34.0, 3.5, 4.5, 0.5, 2, 0.6),
    ("Quinoa (cooked)", None, "Grains", '["vegan","gluten-free"]', False,
     150, "g", "1 cup (150 g)", 180, 6.6, 31.5, 2.9, 2.5, 0.9, 9, 0.4),
    ("Whole Wheat Pasta (cooked)", None, "Grains", '["vegan"]', False,
     150, "g", "1 serving (150 g)", 187, 8.0, 39.0, 0.8, 5.0, 2.0, 5, 0.1),
    ("Sweet Potato (boiled)", None, "Grains", '["vegan","gluten-free"]', False,
     150, "g", "1 medium (150 g)", 129, 2.4, 30.0, 0.2, 3.8, 9.4, 36, 0.0),
    ("White Bread (slice)", None, "Grains", '["vegetarian"]', False,
     2, "slice", "2 slices (60 g)", 159, 5.4, 29.4, 1.9, 1.2, 2.4, 265, 0.4),
    ("Whole Wheat Bread (slice)", None, "Grains", '["vegan"]', False,
     2, "slice", "2 slices (60 g)", 148, 7.8, 24.6, 2.0, 4.2, 2.2, 280, 0.3),
    ("Semolina / Sooji (raw)", None, "Grains", '["vegan"]', True,
     50, "g", "½ cup dry (50 g)", 180, 6.0, 36.5, 0.5, 1.5, 0.5, 1, 0.1),
    ("Whole Wheat Flour / Atta (raw)", None, "Grains", '["vegan"]', True,
     50, "g", "½ cup (50 g)", 171, 6.0, 35.5, 0.9, 3.8, 0.5, 1, 0.1),
    ("Maize / Corn Flour (raw)", None, "Grains", '["vegan","gluten-free"]', False,
     50, "g", "½ cup (50 g)", 182, 3.5, 39.0, 0.9, 2.0, 0.5, 2, 0.1),
    ("Millet / Bajra (cooked)", None, "Grains", '["vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 207, 5.5, 42.0, 1.5, 3.0, 0.5, 2, 0.3),
    ("Jowar / Sorghum (cooked)", None, "Grains", '["vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 194, 5.4, 41.0, 1.1, 4.0, 0.5, 3, 0.2),
    ("Ragi / Finger Millet (cooked)", None, "Grains", '["vegan","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 175, 3.8, 38.0, 1.1, 3.5, 0.5, 5, 0.2),

    # ── VEGETABLES ────────────────────────────────────────────────────────────
    ("Spinach / Palak (raw)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', True,
     100, "g", "1 cup (100 g)", 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, 0.1),
    ("Broccoli (cooked)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     150, "g", "1 cup (150 g)", 55, 3.7, 11.2, 0.6, 5.1, 3.0, 64, 0.1),
    ("Cauliflower / Gobi (cooked)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', True,
     150, "g", "1 cup (150 g)", 36, 2.9, 7.5, 0.4, 3.5, 3.2, 52, 0.1),
    ("Cabbage (raw)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     100, "g", "1 cup (100 g)", 22, 1.0, 5.2, 0.1, 2.5, 2.8, 18, 0.0),
    ("Carrot / Gajar (raw)", None, "Vegetables", '["vegan","gluten-free"]', True,
     100, "g", "1 medium (100 g)", 41, 0.9, 9.6, 0.2, 2.8, 4.7, 69, 0.0),
    ("Okra / Bhindi (cooked)", None, "Vegetables", '["vegan","gluten-free"]', True,
     100, "g", "1 katori (100 g)", 33, 1.9, 7.5, 0.2, 3.2, 1.5, 8, 0.0),
    ("Bitter Gourd / Karela (cooked)", None, "Vegetables", '["vegan","gluten-free","diabetic-friendly"]', True,
     100, "g", "1 katori (100 g)", 20, 1.0, 4.3, 0.2, 2.8, 1.8, 5, 0.0),
    ("Bottle Gourd / Lauki (cooked)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', True,
     100, "g", "1 katori (100 g)", 14, 0.6, 3.4, 0.0, 1.6, 1.5, 3, 0.0),
    ("Tomato (raw)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     100, "g", "1 medium (100 g)", 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5, 0.0),
    ("Onion / Pyaaz (raw)", None, "Vegetables", '["vegan","gluten-free"]', True,
     100, "g", "1 medium (100 g)", 40, 1.1, 9.3, 0.1, 1.7, 4.2, 4, 0.0),
    ("Beetroot (cooked)", None, "Vegetables", '["vegan","gluten-free"]', False,
     100, "g", "½ cup (100 g)", 44, 1.7, 10.0, 0.2, 2.0, 8.0, 77, 0.0),
    ("Cucumber (raw)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     100, "g", "½ cup (100 g)", 16, 0.7, 3.6, 0.1, 0.5, 1.7, 2, 0.0),
    ("Bell Pepper / Capsicum (raw)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', True,
     100, "g", "1 medium (100 g)", 20, 0.9, 4.6, 0.2, 1.7, 2.4, 4, 0.0),
    ("Mushroom (raw)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     100, "g", "1 cup (100 g)", 22, 3.1, 3.3, 0.3, 1.0, 1.5, 5, 0.0),
    ("Peas / Matar (cooked)", None, "Vegetables", '["vegan","gluten-free"]', True,
     100, "g", "½ cup (100 g)", 81, 5.4, 14.5, 0.4, 5.5, 5.7, 5, 0.1),
    ("Green Beans (cooked)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     100, "g", "½ cup (100 g)", 35, 1.8, 7.9, 0.1, 3.4, 1.5, 6, 0.0),
    ("Zucchini (cooked)", None, "Vegetables", '["vegan","gluten-free","low-calorie"]', False,
     100, "g", "½ cup (100 g)", 21, 1.5, 3.9, 0.4, 1.3, 3.1, 2, 0.1),
    ("Drumstick / Moringa (cooked)", None, "Vegetables", '["vegan","gluten-free","superfood"]', True,
     100, "g", "1 katori (100 g)", 37, 2.1, 8.5, 0.2, 3.2, 3.5, 42, 0.0),
    ("Fenugreek Leaves / Methi (raw)", None, "Vegetables", '["vegan","gluten-free"]', True,
     30, "g", "1 small bunch (30 g)", 15, 1.3, 1.8, 0.3, 1.2, 0.5, 20, 0.0),
    ("Sweet Corn (cooked)", None, "Vegetables", '["vegan","gluten-free"]', False,
     100, "g", "½ cup (100 g)", 96, 3.4, 21.0, 1.5, 2.4, 4.5, 15, 0.2),

    # ── FRUITS ────────────────────────────────────────────────────────────────
    ("Banana (medium)", None, "Fruits", '["vegan","gluten-free"]', False,
     1, "piece", "1 medium banana (120 g)", 107, 1.3, 27.5, 0.4, 3.1, 14.4, 1, 0.1),
    ("Mango (Alphonso)", None, "Fruits", '["vegan","gluten-free"]', True,
     150, "g", "1 cup (150 g)", 99, 1.4, 24.7, 0.6, 2.6, 22.5, 2, 0.1),
    ("Apple (medium)", None, "Fruits", '["vegan","gluten-free"]', False,
     1, "piece", "1 medium apple (182 g)", 95, 0.5, 25.1, 0.3, 4.4, 18.9, 2, 0.0),
    ("Orange (medium)", None, "Fruits", '["vegan","gluten-free"]', False,
     1, "piece", "1 medium orange (131 g)", 62, 1.2, 15.4, 0.2, 3.1, 12.2, 0, 0.0),
    ("Papaya (medium slice)", None, "Fruits", '["vegan","gluten-free"]', True,
     150, "g", "1 cup (150 g)", 65, 0.8, 16.5, 0.4, 2.5, 11.5, 12, 0.1),
    ("Guava (medium)", None, "Fruits", '["vegan","gluten-free"]', True,
     1, "piece", "1 medium guava (100 g)", 68, 2.5, 14.3, 1.0, 5.4, 8.9, 2, 0.3),
    ("Watermelon (slice)", None, "Fruits", '["vegan","gluten-free","low-calorie"]', False,
     300, "g", "1 slice (300 g)", 90, 1.8, 22.8, 0.6, 1.2, 18.6, 3, 0.1),
    ("Grapes (red/green)", None, "Fruits", '["vegan","gluten-free"]', False,
     100, "g", "½ cup (100 g)", 69, 0.7, 18.1, 0.2, 0.9, 15.5, 2, 0.1),
    ("Pomegranate seeds", None, "Fruits", '["vegan","gluten-free"]', True,
     100, "g", "½ cup (100 g)", 83, 1.7, 18.7, 1.2, 4.0, 13.7, 3, 0.1),
    ("Pineapple", None, "Fruits", '["vegan","gluten-free"]', False,
     150, "g", "1 cup (150 g)", 83, 0.9, 21.6, 0.2, 2.3, 16.3, 2, 0.0),
    ("Strawberry", None, "Fruits", '["vegan","gluten-free","low-calorie"]', False,
     150, "g", "1 cup (150 g)", 48, 1.0, 11.5, 0.5, 2.9, 7.4, 2, 0.0),
    ("Blueberry", None, "Fruits", '["vegan","gluten-free","antioxidant"]', False,
     100, "g", "½ cup (100 g)", 57, 0.7, 14.5, 0.3, 2.4, 10.0, 1, 0.0),
    ("Kiwi (medium)", None, "Fruits", '["vegan","gluten-free"]', False,
     1, "piece", "1 kiwi (75 g)", 46, 0.9, 11.1, 0.4, 2.2, 6.8, 3, 0.0),
    ("Coconut (fresh, grated)", None, "Fruits", '["vegan","gluten-free"]', True,
     30, "g", "2 tbsp grated (30 g)", 106, 1.0, 4.5, 9.9, 2.5, 1.9, 7, 8.8),
    ("Amla / Indian Gooseberry", None, "Fruits", '["vegan","gluten-free","superfood"]', True,
     100, "g", "5–6 pieces (100 g)", 44, 0.9, 10.2, 0.6, 4.3, 0.0, 1, 0.0),
    ("Sapota / Chikoo (medium)", None, "Fruits", '["vegan","gluten-free"]', True,
     1, "piece", "1 medium (100 g)", 83, 0.4, 19.9, 1.1, 5.3, 14.7, 12, 0.3),

    # ── DAIRY ─────────────────────────────────────────────────────────────────
    ("Cow Milk (full fat)", None, "Dairy", '["vegetarian","gluten-free"]', True,
     250, "ml", "1 glass (250 ml)", 150, 7.9, 11.7, 8.0, 0.0, 12.4, 98, 5.1),
    ("Cow Milk (toned / 1.5%)", None, "Dairy", '["vegetarian","gluten-free"]', True,
     250, "ml", "1 glass (250 ml)", 103, 8.1, 12.3, 3.5, 0.0, 12.3, 102, 2.2),
    ("Skimmed Milk", None, "Dairy", '["vegetarian","gluten-free","low-fat"]', False,
     250, "ml", "1 glass (250 ml)", 83, 8.3, 12.5, 0.2, 0.0, 12.3, 103, 0.1),
    ("Greek Yogurt (full fat)", None, "Dairy", '["vegetarian","gluten-free","high-protein"]', False,
     150, "g", "½ cup (150 g)", 148, 13.5, 6.0, 7.5, 0.0, 4.5, 56, 4.8),
    ("Curd / Dahi (full fat)", None, "Dairy", '["vegetarian","gluten-free"]', True,
     150, "g", "1 katori (150 g)", 92, 5.3, 7.1, 5.0, 0.0, 5.4, 70, 3.2),
    ("Ghee (pure)", None, "Dairy", '["vegetarian","gluten-free"]', True,
     5, "g", "1 tsp (5 g)", 44, 0.0, 0.0, 5.0, 0.0, 0.0, 0, 3.1),
    ("Butter (salted)", None, "Dairy", '["vegetarian","gluten-free"]', False,
     10, "g", "1 tbsp (10 g)", 72, 0.1, 0.0, 8.1, 0.0, 0.0, 65, 5.1),
    ("Paneer (low fat)", None, "Dairy", '["vegetarian","gluten-free"]', True,
     100, "g", "100 g", 170, 22.0, 3.0, 8.0, 0.0, 0.5, 40, 5.0),
    ("Buttermilk / Chaas", None, "Dairy", '["vegetarian","gluten-free","low-calorie"]', True,
     200, "ml", "1 glass (200 ml)", 37, 2.4, 4.6, 0.9, 0.0, 4.6, 128, 0.6),
    ("Whey Protein (Isolate)", None, "Dairy", '["vegetarian","high-protein"]', False,
     30, "g", "1 scoop (30 g)", 110, 25.0, 2.0, 0.5, 0.0, 1.0, 160, 0.2),

    # ── NUTS & SEEDS ──────────────────────────────────────────────────────────
    ("Almonds / Badam (raw)", None, "Nuts & Seeds", '["vegan","gluten-free"]', True,
     30, "g", "~22 almonds (30 g)", 174, 6.3, 6.6, 15.0, 3.5, 1.5, 0, 1.1),
    ("Walnuts / Akhrot", None, "Nuts & Seeds", '["vegan","gluten-free","omega-3"]', True,
     30, "g", "~14 halves (30 g)", 196, 4.6, 4.2, 19.6, 2.0, 0.6, 0, 1.8),
    ("Cashews / Kaju (raw)", None, "Nuts & Seeds", '["vegan","gluten-free"]', True,
     30, "g", "~18 nuts (30 g)", 166, 5.4, 9.0, 13.1, 0.9, 1.7, 3, 2.6),
    ("Peanuts / Moongphali (roasted)", None, "Nuts & Seeds", '["vegan","gluten-free"]', True,
     30, "g", "1 small handful (30 g)", 170, 7.8, 4.8, 14.8, 2.4, 1.1, 2, 2.1),
    ("Pistachios", None, "Nuts & Seeds", '["vegan","gluten-free"]', False,
     30, "g", "~49 nuts (30 g)", 168, 6.0, 8.4, 13.5, 3.0, 2.2, 0, 1.6),
    ("Chia Seeds", None, "Nuts & Seeds", '["vegan","gluten-free","omega-3","superfood"]', False,
     20, "g", "2 tbsp (20 g)", 97, 3.3, 8.4, 6.1, 6.8, 0.0, 4, 0.7),
    ("Flaxseeds / Alsi", None, "Nuts & Seeds", '["vegan","gluten-free","omega-3"]', True,
     15, "g", "1 tbsp (15 g)", 80, 2.7, 4.4, 6.3, 3.8, 0.2, 4, 0.5),
    ("Sesame Seeds / Til", None, "Nuts & Seeds", '["vegan","gluten-free"]', True,
     15, "g", "1 tbsp (15 g)", 86, 2.7, 3.5, 7.5, 1.2, 0.1, 2, 1.0),
    ("Sunflower Seeds", None, "Nuts & Seeds", '["vegan","gluten-free"]', False,
     30, "g", "¼ cup (30 g)", 175, 6.3, 6.0, 15.3, 2.4, 1.0, 1, 1.6),
    ("Pumpkin Seeds / Pepitas", None, "Nuts & Seeds", '["vegan","gluten-free"]', False,
     30, "g", "¼ cup (30 g)", 168, 9.0, 4.2, 14.7, 1.8, 0.5, 5, 2.5),
    ("Hemp Seeds", None, "Nuts & Seeds", '["vegan","gluten-free","omega-3"]', False,
     30, "g", "3 tbsp (30 g)", 166, 9.5, 2.7, 14.6, 1.2, 0.5, 1, 1.5),
    ("Peanut Butter (natural, unsweetened)", None, "Nuts & Seeds", '["vegan","gluten-free"]', True,
     32, "g", "2 tbsp (32 g)", 188, 8.0, 6.4, 16.0, 2.0, 1.8, 147, 3.0),

    # ── BEVERAGES ─────────────────────────────────────────────────────────────
    ("Chai (with milk & sugar)", None, "Beverages", '["vegetarian"]', True,
     150, "ml", "1 cup (150 ml)", 56, 1.8, 9.5, 1.5, 0.0, 9.0, 25, 0.9),
    ("Black Coffee (unsweetened)", None, "Beverages", '["vegan","gluten-free","low-calorie"]', False,
     240, "ml", "1 mug (240 ml)", 5, 0.3, 0.0, 0.0, 0.0, 0.0, 5, 0.0),
    ("Coconut Water (fresh)", None, "Beverages", '["vegan","gluten-free"]', True,
     200, "ml", "1 glass (200 ml)", 38, 0.4, 9.0, 0.2, 1.0, 6.0, 105, 0.0),
    ("Orange Juice (fresh)", None, "Beverages", '["vegan","gluten-free"]', False,
     200, "ml", "1 glass (200 ml)", 88, 1.4, 20.4, 0.4, 0.4, 16.4, 2, 0.0),
    ("Mango Shake (with milk, no sugar)", None, "Beverages", '["vegetarian","gluten-free"]', True,
     300, "ml", "1 glass (300 ml)", 210, 6.0, 38.0, 5.0, 1.5, 32.0, 70, 3.0),
    ("Protein Shake (whey + water)", None, "Beverages", '["vegetarian","gluten-free","high-protein"]', False,
     350, "ml", "1 shaker (350 ml)", 120, 24.0, 5.0, 1.5, 0.0, 2.0, 150, 0.5),
    ("Green Tea (unsweetened)", None, "Beverages", '["vegan","gluten-free","low-calorie"]', False,
     240, "ml", "1 cup (240 ml)", 2, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0.0),
    ("Turmeric Milk / Haldi Doodh", None, "Beverages", '["vegetarian","gluten-free"]', True,
     200, "ml", "1 glass (200 ml)", 108, 3.8, 12.0, 5.0, 0.3, 10.0, 62, 3.2),
    ("Sports Drink (e.g., Gatorade)", None, "Beverages", '["vegan"]', False,
     500, "ml", "1 bottle (500 ml)", 130, 0.0, 34.0, 0.0, 0.0, 34.0, 270, 0.0),

    # ── HEALTHY / FITNESS FOODS ───────────────────────────────────────────────
    ("Avocado (half)", None, "Healthy Foods", '["vegan","gluten-free","keto"]', False,
     100, "g", "½ avocado (100 g)", 160, 2.0, 8.5, 14.7, 6.7, 0.7, 7, 2.1),
    ("Olive Oil (extra virgin)", None, "Healthy Foods", '["vegan","gluten-free","keto"]', False,
     10, "ml", "1 tbsp (10 ml)", 88, 0.0, 0.0, 10.0, 0.0, 0.0, 0, 1.4),
    ("Coconut Oil (virgin)", None, "Healthy Foods", '["vegan","gluten-free","keto"]', False,
     10, "g", "1 tbsp (10 g)", 86, 0.0, 0.0, 10.0, 0.0, 0.0, 0, 8.8),
    ("Dark Chocolate (85%)", None, "Healthy Foods", '["vegan","gluten-free"]', False,
     30, "g", "3 squares (30 g)", 180, 2.5, 9.3, 14.5, 3.4, 3.9, 15, 8.9),
    ("Overnight Oats (basic)", None, "Healthy Foods", '["vegetarian"]', False,
     250, "g", "1 jar (250 g)", 310, 12.0, 52.0, 6.0, 7.0, 12.0, 125, 2.0),
    ("Oatmeal (cooked with water)", None, "Healthy Foods", '["vegan","gluten-free"]', False,
     250, "g", "1 bowl (250 g)", 150, 5.0, 27.0, 2.5, 3.5, 0.5, 5, 0.4),
    ("Boiled Sweet Potato", None, "Healthy Foods", '["vegan","gluten-free"]', False,
     150, "g", "1 medium (150 g)", 129, 2.4, 30.0, 0.2, 3.8, 9.4, 36, 0.0),
    ("Hummus", None, "Healthy Foods", '["vegan","gluten-free"]', False,
     40, "g", "2 tbsp (40 g)", 70, 3.2, 5.6, 4.4, 1.9, 0.4, 150, 0.6),
    ("Egg Salad (no mayo)", None, "Healthy Foods", '["vegetarian","gluten-free","high-protein"]', False,
     150, "g", "1 serving (150 g)", 185, 15.0, 3.5, 12.0, 0.0, 1.0, 210, 3.5),
    ("Sprout Salad (moong + veggies)", None, "Healthy Foods", '["vegan","gluten-free","low-calorie"]', True,
     150, "g", "1 bowl (150 g)", 95, 6.5, 16.0, 0.8, 4.0, 2.5, 80, 0.1),
    ("Mixed Vegetable Salad", None, "Healthy Foods", '["vegan","gluten-free","low-calorie"]', False,
     200, "g", "1 bowl (200 g)", 72, 3.0, 14.0, 0.8, 4.5, 6.0, 120, 0.1),
    ("Grilled Chicken Salad", None, "Healthy Foods", '["non-veg","gluten-free","high-protein"]', False,
     250, "g", "1 bowl (250 g)", 285, 32.0, 12.0, 12.0, 4.0, 4.0, 480, 2.5),

    # ── FAST FOOD / RESTAURANT ────────────────────────────────────────────────
    ("Burger (chicken, fast food)", None, "Fast Food", '["non-veg"]', False,
     1, "piece", "1 burger (~180 g)", 420, 25.0, 42.0, 18.0, 2.0, 6.0, 830, 5.0),
    ("Pizza (1 slice, cheese)", None, "Fast Food", '["vegetarian"]', False,
     1, "slice", "1 slice (~107 g)", 272, 12.0, 33.0, 10.0, 2.0, 3.5, 551, 4.5),
    ("French Fries (medium portion)", None, "Fast Food", '["vegan"]', False,
     120, "g", "1 medium portion (120 g)", 365, 3.4, 48.0, 17.0, 4.0, 0.4, 290, 3.0),
    ("Fried Chicken (1 piece)", None, "Fast Food", '["non-veg"]', False,
     1, "piece", "1 piece (~85 g)", 245, 17.0, 11.0, 15.0, 0.5, 0.3, 430, 4.0),
    ("Shawarma (chicken wrap)", None, "Fast Food", '["non-veg"]', False,
     1, "piece", "1 wrap (~200 g)", 425, 28.0, 40.0, 16.0, 3.0, 4.0, 780, 4.5),
    ("Paneer Wrap / Kathi Roll", None, "Fast Food", '["vegetarian"]', True,
     1, "piece", "1 roll (~180 g)", 385, 15.0, 50.0, 14.0, 3.0, 4.5, 620, 4.5),
    ("Pasta (cream sauce, restaurant)", None, "Fast Food", '["vegetarian"]', False,
     300, "g", "1 plate (300 g)", 490, 16.0, 62.0, 20.0, 3.0, 6.0, 680, 9.0),
]


def create_tables():
    """Create tables if they don't exist yet."""
    Base.metadata.create_all(bind=engine)


def seed():
    create_tables()
    db = SessionLocal()
    try:
        existing = db.query(FoodItem).count()
        if existing > 0:
            print(f"ℹ️  food_items table already has {existing} rows. Skipping seed.")
            print("   To reseed, delete all rows first (DELETE FROM food_items;)")
            return

        print(f"🌱 Seeding {len(FOODS)} food items …")

        for row in FOODS:
            (name, brand, category, tags, is_indian,
             serving_size, serving_unit, serving_label,
             calories, protein, carbs, fat,
             fiber, sugar, sodium, sat_fat) = row

            food = FoodItem(
                name=name,
                brand=brand,
                category=category,
                tags=tags,
                is_indian=is_indian,
                serving_size=float(serving_size),
                serving_unit=serving_unit,
                serving_label=serving_label,
                calories=float(calories),
                protein=float(protein),
                carbs=float(carbs),
                fat=float(fat),
                fiber=float(fiber),
                sugar=float(sugar),
                sodium=float(sodium),
                saturated_fat=float(sat_fat),
                is_active=True,
            )
            db.add(food)

        db.commit()
        print(f"✅ {len(FOODS)} food items seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding foods: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
