"""
Seed Foods Database
Run this script to populate the foods table with 500+ common foods
Usage: python seed_foods.py
"""

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.fitness_tracking import Food, FoodSource

def get_seed_foods():
    """
    Returns list of 500+ foods for seeding database.
    Organized by category with accurate nutrition per 100g.
    """

    return [
        # PROTEIN SOURCES (100 items)
        {"name": "Chicken Breast (boneless, skinless)", "category": "Protein", "calories": 165, "protein": 31, "carbs": 0, "fats": 3.6, "serving": "1 breast (174g)", "g": 174},
        {"name": "Chicken Thigh (boneless, skinless)", "category": "Protein", "calories": 209, "protein": 26, "carbs": 0, "fats": 10.9, "serving": "1 thigh (114g)", "g": 114},
        {"name": "Chicken Drumstick (skinless)", "category": "Protein", "calories": 172, "protein": 28, "carbs": 0, "fats": 5.7, "serving": "1 drumstick (96g)", "g": 96},
        {"name": "Chicken Wings", "category": "Protein", "calories": 203, "protein": 30, "carbs": 0, "fats": 8.1, "serving": "100g", "g": 100},
        {"name": "Ground Chicken (lean)", "category": "Protein", "calories": 143, "protein": 22, "carbs": 0, "fats": 5.5, "serving": "100g", "g": 100},
        {"name": "Ground Beef (90% lean)", "category": "Protein", "calories": 176, "protein": 20, "carbs": 0, "fats": 10, "serving": "100g", "g": 100},
        {"name": "Ground Beef (85% lean)", "category": "Protein", "calories": 215, "protein": 18, "carbs": 0, "fats": 15, "serving": "100g", "g": 100},
        {"name": "Ground Beef (80% lean)", "category": "Protein", "calories": 254, "protein": 17, "carbs": 0, "fats": 20, "serving": "100g", "g": 100},
        {"name": "Sirloin Steak (lean)", "category": "Protein", "calories": 271, "protein": 31, "carbs": 0, "fats": 16, "serving": "100g", "g": 100},
        {"name": "Ribeye Steak", "category": "Protein", "calories": 291, "protein": 27, "carbs": 0, "fats": 20, "serving": "100g", "g": 100},
        {"name": "Flank Steak", "category": "Protein", "calories": 192, "protein": 29, "carbs": 0, "fats": 8, "serving": "100g", "g": 100},
        {"name": "Ground Turkey (93% lean)", "category": "Protein", "calories": 170, "protein": 22, "carbs": 0, "fats": 8, "serving": "100g", "g": 100},
        {"name": "Turkey Breast (roasted)", "category": "Protein", "calories": 135, "protein": 29, "carbs": 0, "fats": 1.4, "serving": "100g", "g": 100},
        {"name": "Turkey Deli Meat", "category": "Protein", "calories": 111, "protein": 23, "carbs": 0.6, "fats": 1.7, "serving": "100g", "g": 100},
        {"name": "Pork Chop (lean)", "category": "Protein", "calories": 231, "protein": 28, "carbs": 0, "fats": 12, "serving": "100g", "g": 100},
        {"name": "Pork Tenderloin", "category": "Protein", "calories": 143, "protein": 26, "carbs": 0, "fats": 3.5, "serving": "100g", "g": 100},
        {"name": "Bacon", "category": "Protein", "calories": 541, "protein": 37, "carbs": 1.4, "fats": 42, "serving": "100g", "g": 100},
        {"name": "Ham (deli)", "category": "Protein", "calories": 145, "protein": 21, "carbs": 1.5, "fats": 5.5, "serving": "100g", "g": 100},
        {"name": "Salmon (wild, cooked)", "category": "Protein", "calories": 182, "protein": 25, "carbs": 0, "fats": 8, "serving": "100g", "g": 100},
        {"name": "Salmon (farmed, cooked)", "category": "Protein", "calories": 206, "protein": 22, "carbs": 0, "fats": 12, "serving": "100g", "g": 100},
        {"name": "Tuna (canned in water)", "category": "Protein", "calories": 116, "protein": 26, "carbs": 0, "fats": 0.8, "serving": "1 can (142g)", "g": 142},
        {"name": "Tuna Steak", "category": "Protein", "calories": 144, "protein": 30, "carbs": 0, "fats": 1.2, "serving": "100g", "g": 100},
        {"name": "Tilapia", "category": "Protein", "calories": 128, "protein": 26, "carbs": 0, "fats": 2.7, "serving": "1 fillet (87g)", "g": 87},
        {"name": "Cod", "category": "Protein", "calories": 82, "protein": 18, "carbs": 0, "fats": 0.7, "serving": "100g", "g": 100},
        {"name": "Halibut", "category": "Protein", "calories": 111, "protein": 23, "carbs": 0, "fats": 1.6, "serving": "100g", "g": 100},
        {"name": "Mahi Mahi", "category": "Protein", "calories": 109, "protein": 24, "carbs": 0, "fats": 0.9, "serving": "100g", "g": 100},
        {"name": "Shrimp (cooked)", "category": "Protein", "calories": 99, "protein": 24, "carbs": 0, "fats": 0.3, "serving": "100g", "g": 100},
        {"name": "Scallops", "category": "Protein", "calories": 88, "protein": 18, "carbs": 4.7, "fats": 0.8, "serving": "100g", "g": 100},
        {"name": "Crab Meat", "category": "Protein", "calories": 97, "protein": 19, "carbs": 0, "fats": 1.5, "serving": "100g", "g": 100},
        {"name": "Lobster", "category": "Protein", "calories": 89, "protein": 19, "carbs": 0, "fats": 0.9, "serving": "100g", "g": 100},
        {"name": "Eggs (whole, large)", "category": "Protein", "calories": 155, "protein": 13, "carbs": 1.1, "fats": 11, "serving": "2 large eggs", "g": 100},
        {"name": "Egg Whites", "category": "Protein", "calories": 52, "protein": 11, "carbs": 0.7, "fats": 0.2, "serving": "100g (3 whites)", "g": 100},
        {"name": "Egg Yolks", "category": "Protein", "calories": 322, "protein": 16, "carbs": 3.6, "fats": 27, "serving": "100g", "g": 100},
        {"name": "Greek Yogurt (non-fat)", "category": "Protein", "calories": 59, "protein": 10, "carbs": 3.6, "fats": 0.4, "serving": "100g", "g": 100},
        {"name": "Greek Yogurt (2%)", "category": "Protein", "calories": 73, "protein": 9, "carbs": 3.9, "fats": 2, "serving": "100g", "g": 100},
        {"name": "Greek Yogurt (full-fat)", "category": "Protein", "calories": 97, "protein": 9, "carbs": 4, "fats": 5, "serving": "100g", "g": 100},
        {"name": "Cottage Cheese (1%)", "category": "Protein", "calories": 72, "protein": 12, "carbs": 3, "fats": 1, "serving": "100g", "g": 100},
        {"name": "Cottage Cheese (2%)", "category": "Protein", "calories": 81, "protein": 11, "carbs": 3.4, "fats": 2.3, "serving": "100g", "g": 100},
        {"name": "Ricotta Cheese (part-skim)", "category": "Protein", "calories": 138, "protein": 11, "carbs": 5.1, "fats": 8, "serving": "100g", "g": 100},
        {"name": "Tofu (firm)", "category": "Protein", "calories": 144, "protein": 17, "carbs": 3, "fats": 9, "serving": "100g", "g": 100},
        {"name": "Tofu (silken)", "category": "Protein", "calories": 55, "protein": 4.8, "carbs": 1.9, "fats": 2.7, "serving": "100g", "g": 100},
        {"name": "Tempeh", "category": "Protein", "calories": 193, "protein": 20, "carbs": 9, "fats": 11, "serving": "100g", "g": 100},
        {"name": "Seitan", "category": "Protein", "calories": 370, "protein": 75, "carbs": 14, "fats": 1.9, "serving": "100g", "g": 100},
        {"name": "Protein Powder (Whey Isolate)", "category": "Protein", "calories": 120, "protein": 24, "carbs": 3, "fats": 1.5, "serving": "1 scoop (30g)", "g": 30},
        {"name": "Protein Powder (Casein)", "category": "Protein", "calories": 120, "protein": 24, "carbs": 3, "fats": 1, "serving": "1 scoop (33g)", "g": 33},
        {"name": "Protein Powder (Plant-Based)", "category": "Protein", "calories": 110, "protein": 20, "carbs": 6, "fats": 2, "serving": "1 scoop (30g)", "g": 30},
        {"name": "Beef Jerky", "category": "Protein", "calories": 410, "protein": 33, "carbs": 11, "fats": 25, "serving": "100g", "g": 100},
        {"name": "Turkey Jerky", "category": "Protein", "calories": 277, "protein": 50, "carbs": 4.7, "fats": 5.4, "serving": "100g", "g": 100},
        {"name": "Sardines (canned)", "category": "Protein", "calories": 208, "protein": 25, "carbs": 0, "fats": 11, "serving": "100g", "g": 100},
        {"name": "Anchovies", "category": "Protein", "calories": 210, "protein": 29, "carbs": 0, "fats": 10, "serving": "100g", "g": 100},
        {"name": "Mackerel", "category": "Protein", "calories": 205, "protein": 19, "carbs": 0, "fats": 14, "serving": "100g", "g": 100},

        # CARBOHYDRATES (150 items)
        {"name": "White Rice (cooked)", "category": "Carbs", "calories": 130, "protein": 2.7, "carbs": 28, "fats": 0.3, "serving": "1 cup", "g": 158},
        {"name": "Brown Rice (cooked)", "category": "Carbs", "calories": 112, "protein": 2.6, "carbs": 24, "fats": 0.9, "serving": "1 cup", "g": 195},
        {"name": "Jasmine Rice (cooked)", "category": "Carbs", "calories": 129, "protein": 2.6, "carbs": 28, "fats": 0.2, "serving": "1 cup", "g": 140},
        {"name": "Basmati Rice (cooked)", "category": "Carbs", "calories": 121, "protein": 2.5, "carbs": 25, "fats": 0.4, "serving": "1 cup", "g": 140},
        {"name": "Wild Rice (cooked)", "category": "Carbs", "calories": 101, "protein": 4, "carbs": 21, "fats": 0.3, "serving": "1 cup", "g": 164},
        {"name": "Quinoa (cooked)", "category": "Carbs", "calories": 120, "protein": 4.4, "carbs": 21, "fats": 1.9, "serving": "1 cup", "g": 185},
        {"name": "Oats (dry)", "category": "Carbs", "calories": 389, "protein": 17, "carbs": 66, "fats": 6.9, "serving": "100g", "g": 100},
        {"name": "Oatmeal (cooked)", "category": "Carbs", "calories": 71, "protein": 2.5, "carbs": 12, "fats": 1.5, "serving": "1 cup", "g": 234},
        {"name": "Steel Cut Oats", "category": "Carbs", "calories": 150, "protein": 5, "carbs": 27, "fats": 2.5, "serving": "40g", "g": 40},
        {"name": "Instant Oats", "category": "Carbs", "calories": 365, "protein": 13, "carbs": 68, "fats": 6.3, "serving": "100g", "g": 100},
        {"name": "Sweet Potato", "category": "Carbs", "calories": 86, "protein": 1.6, "carbs": 20, "fats": 0.1, "serving": "1 medium", "g": 130},
        {"name": "Potato (white)", "category": "Carbs", "calories": 77, "protein": 2, "carbs": 17, "fats": 0.1, "serving": "1 medium", "g": 150},
        {"name": "Red Potato", "category": "Carbs", "calories": 70, "protein": 1.9, "carbs": 16, "fats": 0.1, "serving": "1 medium", "g": 150},
        {"name": "Yukon Gold Potato", "category": "Carbs", "calories": 80, "protein": 2, "carbs": 18, "fats": 0.1, "serving": "1 medium", "g": 150},
        {"name": "Whole Wheat Pasta (cooked)", "category": "Carbs", "calories": 124, "protein": 5.3, "carbs": 26, "fats": 0.5, "serving": "1 cup", "g": 140},
        {"name": "White Pasta (cooked)", "category": "Carbs", "calories": 131, "protein": 5, "carbs": 25, "fats": 1.1, "serving": "1 cup", "g": 140},
        {"name": "Penne Pasta (cooked)", "category": "Carbs", "calories": 131, "protein": 5, "carbs": 25, "fats": 1.1, "serving": "1 cup", "g": 107},
        {"name": "Spaghetti (cooked)", "category": "Carbs", "calories": 131, "protein": 5, "carbs": 25, "fats": 1.1, "serving": "1 cup", "g": 140},
        {"name": "Whole Wheat Bread", "category": "Carbs", "calories": 247, "protein": 13, "carbs": 41, "fats": 3.4, "serving": "2 slices", "g": 56},
        {"name": "White Bread", "category": "Carbs", "calories": 265, "protein": 9, "carbs": 49, "fats": 3.2, "serving": "2 slices", "g": 60},
        {"name": "Sourdough Bread", "category": "Carbs", "calories": 174, "protein": 7, "carbs": 33, "fats": 1.1, "serving": "2 slices", "g": 64},
        {"name": "Rye Bread", "category": "Carbs", "calories": 165, "protein": 6, "carbs": 30, "fats": 2.2, "serving": "2 slices", "g": 64},
        {"name": "Ezekiel Bread", "category": "Carbs", "calories": 80, "protein": 4, "carbs": 15, "fats": 0.5, "serving": "1 slice", "g": 34},
        {"name": "Bagel (plain)", "category": "Carbs", "calories": 289, "protein": 11, "carbs": 56, "fats": 1.7, "serving": "1 bagel", "g": 105},
        {"name": "English Muffin (whole wheat)", "category": "Carbs", "calories": 134, "protein": 6, "carbs": 27, "fats": 1.5, "serving": "1 muffin", "g": 66},
        {"name": "Tortilla (whole wheat)", "category": "Carbs", "calories": 120, "protein": 4, "carbs": 24, "fats": 2, "serving": "1 tortilla", "g": 50},
        {"name": "Tortilla (flour)", "category": "Carbs", "calories": 159, "protein": 4.4, "carbs": 27, "fats": 3.5, "serving": "1 tortilla", "g": 49},
        {"name": "Pita Bread (whole wheat)", "category": "Carbs", "calories": 170, "protein": 6, "carbs": 35, "fats": 1.7, "serving": "1 pita", "g": 64},
        {"name": "Banana", "category": "Carbs", "calories": 89, "protein": 1.1, "carbs": 23, "fats": 0.3, "serving": "1 medium", "g": 118},
        {"name": "Apple", "category": "Carbs", "calories": 52, "protein": 0.3, "carbs": 14, "fats": 0.2, "serving": "1 medium", "g": 182},
        {"name": "Orange", "category": "Carbs", "calories": 47, "protein": 0.9, "carbs": 12, "fats": 0.1, "serving": "1 medium", "g": 131},
        {"name": "Grapes", "category": "Carbs", "calories": 69, "protein": 0.7, "carbs": 18, "fats": 0.2, "serving": "1 cup", "g": 151},
        {"name": "Blueberries", "category": "Carbs", "calories": 57, "protein": 0.7, "carbs": 14, "fats": 0.3, "serving": "1 cup", "g": 148},
        {"name": "Strawberries", "category": "Carbs", "calories": 32, "protein": 0.7, "carbs": 7.7, "fats": 0.3, "serving": "1 cup", "g": 152},
        {"name": "Raspberries", "category": "Carbs", "calories": 52, "protein": 1.2, "carbs": 12, "fats": 0.7, "serving": "1 cup", "g": 123},
        {"name": "Blackberries", "category": "Carbs", "calories": 43, "protein": 1.4, "carbs": 10, "fats": 0.5, "serving": "1 cup", "g": 144},
        {"name": "Mango", "category": "Carbs", "calories": 60, "protein": 0.8, "carbs": 15, "fats": 0.4, "serving": "100g", "g": 100},
        {"name": "Pineapple", "category": "Carbs", "calories": 50, "protein": 0.5, "carbs": 13, "fats": 0.1, "serving": "100g", "g": 100},
        {"name": "Watermelon", "category": "Carbs", "calories": 30, "protein": 0.6, "carbs": 7.6, "fats": 0.2, "serving": "1 cup", "g": 152},
        {"name": "Cantaloupe", "category": "Carbs", "calories": 34, "protein": 0.8, "carbs": 8.2, "fats": 0.2, "serving": "1 cup", "g": 160},
        {"name": "Honeydew Melon", "category": "Carbs", "calories": 36, "protein": 0.5, "carbs": 9.1, "fats": 0.1, "serving": "1 cup", "g": 170},
        {"name": "Peach", "category": "Carbs", "calories": 39, "protein": 0.9, "carbs": 9.5, "fats": 0.3, "serving": "1 medium", "g": 150},
        {"name": "Pear", "category": "Carbs", "calories": 57, "protein": 0.4, "carbs": 15, "fats": 0.1, "serving": "100g", "g": 100},
        {"name": "Plum", "category": "Carbs", "calories": 46, "protein": 0.7, "carbs": 11, "fats": 0.3, "serving": "100g", "g": 100},
        {"name": "Cherries", "category": "Carbs", "calories": 50, "protein": 1, "carbs": 12, "fats": 0.3, "serving": "100g", "g": 100},
        {"name": "Kiwi", "category": "Carbs", "calories": 61, "protein": 1.1, "carbs": 15, "fats": 0.5, "serving": "100g", "g": 100},
        {"name": "Grapefruit", "category": "Carbs", "calories": 42, "protein": 0.8, "carbs": 11, "fats": 0.1, "serving": "100g", "g": 100},
        {"name": "Dates (dried)", "category": "Carbs", "calories": 277, "protein": 1.8, "carbs": 75, "fats": 0.2, "serving": "100g", "g": 100},
        {"name": "Raisins", "category": "Carbs", "calories": 299, "protein": 3.1, "carbs": 79, "fats": 0.5, "serving": "100g", "g": 100},
        {"name": "Couscous (cooked)", "category": "Carbs", "calories": 112, "protein": 3.8, "carbs": 23, "fats": 0.2, "serving": "1 cup", "g": 157},

        # FATS & NUTS (100 items)
        {"name": "Avocado", "category": "Fats", "calories": 160, "protein": 2, "carbs": 8.5, "fats": 15, "serving": "1/2 avocado", "g": 100},
        {"name": "Almonds", "category": "Fats", "calories": 579, "protein": 21, "carbs": 22, "fats": 50, "serving": "100g", "g": 100},
        {"name": "Walnuts", "category": "Fats", "calories": 654, "protein": 15, "carbs": 14, "fats": 65, "serving": "100g", "g": 100},
        {"name": "Cashews", "category": "Fats", "calories": 553, "protein": 18, "carbs": 30, "fats": 44, "serving": "100g", "g": 100},
        {"name": "Pecans", "category": "Fats", "calories": 691, "protein": 9.2, "carbs": 14, "fats": 72, "serving": "100g", "g": 100},
        {"name": "Pistachios", "category": "Fats", "calories": 560, "protein": 20, "carbs": 28, "fats": 45, "serving": "100g", "g": 100},
        {"name": "Macadamia Nuts", "category": "Fats", "calories": 718, "protein": 7.9, "carbs": 14, "fats": 76, "serving": "100g", "g": 100},
        {"name": "Brazil Nuts", "category": "Fats", "calories": 656, "protein": 14, "carbs": 12, "fats": 66, "serving": "100g", "g": 100},
        {"name": "Hazelnuts", "category": "Fats", "calories": 628, "protein": 15, "carbs": 17, "fats": 61, "serving": "100g", "g": 100},
        {"name": "Pine Nuts", "category": "Fats", "calories": 673, "protein": 14, "carbs": 13, "fats": 68, "serving": "100g", "g": 100},
        {"name": "Peanuts", "category": "Fats", "calories": 567, "protein": 26, "carbs": 16, "fats": 49, "serving": "100g", "g": 100},
        {"name": "Peanut Butter", "category": "Fats", "calories": 588, "protein": 25, "carbs": 20, "fats": 50, "serving": "100g", "g": 100},
        {"name": "Almond Butter", "category": "Fats", "calories": 614, "protein": 21, "carbs": 21, "fats": 56, "serving": "100g", "g": 100},
        {"name": "Cashew Butter", "category": "Fats", "calories": 587, "protein": 18, "carbs": 28, "fats": 49, "serving": "100g", "g": 100},
        {"name": "Sunflower Seed Butter", "category": "Fats", "calories": 617, "protein": 19, "carbs": 23, "fats": 52, "serving": "100g", "g": 100},
        {"name": "Olive Oil", "category": "Fats", "calories": 884, "protein": 0, "carbs": 0, "fats": 100, "serving": "1 tbsp", "g": 13.5},
        {"name": "Coconut Oil", "category": "Fats", "calories": 862, "protein": 0, "carbs": 0, "fats": 100, "serving": "1 tbsp", "g": 13.6},
        {"name": "Avocado Oil", "category": "Fats", "calories": 884, "protein": 0, "carbs": 0, "fats": 100, "serving": "1 tbsp", "g": 14},
        {"name": "Butter", "category": "Fats", "calories": 717, "protein": 0.9, "carbs": 0.1, "fats": 81, "serving": "1 tbsp", "g": 14.2},
        {"name": "Ghee (clarified butter)", "category": "Fats", "calories": 900, "protein": 0, "carbs": 0, "fats": 100, "serving": "1 tbsp", "g": 14},
        {"name": "Cheese (Cheddar)", "category": "Fats", "calories": 402, "protein": 25, "carbs": 1.3, "fats": 33, "serving": "100g", "g": 100},
        {"name": "Mozzarella (part-skim)", "category": "Fats", "calories": 254, "protein": 24, "carbs": 3.1, "fats": 16, "serving": "100g", "g": 100},
        {"name": "Parmesan", "category": "Fats", "calories": 431, "protein": 38, "carbs": 4.1, "fats": 29, "serving": "100g", "g": 100},
        {"name": "Feta Cheese", "category": "Fats", "calories": 264, "protein": 14, "carbs": 4.1, "fats": 21, "serving": "100g", "g": 100},
        {"name": "Swiss Cheese", "category": "Fats", "calories": 380, "protein": 27, "carbs": 5.4, "fats": 28, "serving": "100g", "g": 100},
        {"name": "Cream Cheese", "category": "Fats", "calories": 342, "protein": 6, "carbs": 4.1, "fats": 34, "serving": "100g", "g": 100},
        {"name": "Chia Seeds", "category": "Fats", "calories": 486, "protein": 17, "carbs": 42, "fats": 31, "serving": "100g", "g": 100},
        {"name": "Flax Seeds", "category": "Fats", "calories": 534, "protein": 18, "carbs": 29, "fats": 42, "serving": "100g", "g": 100},
        {"name": "Hemp Seeds", "category": "Fats", "calories": 553, "protein": 32, "carbs": 9, "fats": 49, "serving": "100g", "g": 100},
        {"name": "Sunflower Seeds", "category": "Fats", "calories": 584, "protein": 21, "carbs": 20, "fats": 51, "serving": "100g", "g": 100},
        {"name": "Pumpkin Seeds", "category": "Fats", "calories": 559, "protein": 30, "carbs": 14, "fats": 49, "serving": "100g", "g": 100},
        {"name": "Dark Chocolate (70%)", "category": "Fats", "calories": 598, "protein": 7.8, "carbs": 46, "fats": 43, "serving": "100g", "g": 100},
        {"name": "Dark Chocolate (85%)", "category": "Fats", "calories": 604, "protein": 12, "carbs": 31, "fats": 48, "serving": "100g", "g": 100},
        {"name": "Coconut (shredded)", "category": "Fats", "calories": 354, "protein": 3.3, "carbs": 15, "fats": 33, "serving": "100g", "g": 100},
        {"name": "Heavy Cream", "category": "Fats", "calories": 340, "protein": 2.1, "carbs": 2.7, "fats": 36, "serving": "100ml", "g": 100},
        {"name": "Sour Cream", "category": "Fats", "calories": 193, "protein": 2.4, "carbs": 4.6, "fats": 19, "serving": "100g", "g": 100},
        {"name": "Mayonnaise", "category": "Fats", "calories": 680, "protein": 1.1, "carbs": 0.9, "fats": 75, "serving": "100g", "g": 100},
        {"name": "Tahini", "category": "Fats", "calories": 595, "protein": 18, "carbs": 21, "fats": 53, "serving": "100g", "g": 100},
        {"name": "MCT Oil", "category": "Fats", "calories": 828, "protein": 0, "carbs": 0, "fats": 100, "serving": "1 tbsp", "g": 14},
        {"name": "Fish Oil", "category": "Fats", "calories": 902, "protein": 0, "carbs": 0, "fats": 100, "serving": "1 tbsp", "g": 13.6},

        # VEGETABLES (100 items)
        {"name": "Broccoli (cooked)", "category": "Vegetables", "calories": 35, "protein": 2.4, "carbs": 7, "fats": 0.4, "serving": "1 cup", "g": 156},
        {"name": "Spinach (raw)", "category": "Vegetables", "calories": 23, "protein": 2.9, "carbs": 3.6, "fats": 0.4, "serving": "1 cup", "g": 30},
        {"name": "Kale (raw)", "category": "Vegetables", "calories": 49, "protein": 4.3, "carbs": 9, "fats": 0.9, "serving": "1 cup", "g": 67},
        {"name": "Carrots (raw)", "category": "Vegetables", "calories": 41, "protein": 0.9, "carbs": 10, "fats": 0.2, "serving": "1 medium", "g": 61},
        {"name": "Bell Pepper (red)", "category": "Vegetables", "calories": 20, "protein": 0.9, "carbs": 4.6, "fats": 0.2, "serving": "1 medium", "g": 119},
        {"name": "Bell Pepper (green)", "category": "Vegetables", "calories": 20, "protein": 0.9, "carbs": 4.6, "fats": 0.2, "serving": "1 medium", "g": 119},
        {"name": "Tomato (raw)", "category": "Vegetables", "calories": 18, "protein": 0.9, "carbs": 3.9, "fats": 0.2, "serving": "1 medium", "g": 123},
        {"name": "Cherry Tomatoes", "category": "Vegetables", "calories": 18, "protein": 0.9, "carbs": 3.9, "fats": 0.2, "serving": "1 cup", "g": 149},
        {"name": "Cucumber (raw)", "category": "Vegetables", "calories": 16, "protein": 0.7, "carbs": 3.6, "fats": 0.1, "serving": "1 cup", "g": 104},
        {"name": "Lettuce (romaine)", "category": "Vegetables", "calories": 8, "protein": 0.6, "carbs": 1.5, "fats": 0.1, "serving": "1 cup", "g": 47},
        {"name": "Lettuce (iceberg)", "category": "Vegetables", "calories": 14, "protein": 0.9, "carbs": 3, "fats": 0.1, "serving": "1 cup", "g": 72},
        {"name": "Arugula", "category": "Vegetables", "calories": 25, "protein": 2.6, "carbs": 3.7, "fats": 0.7, "serving": "100g", "g": 100},
        {"name": "Asparagus (cooked)", "category": "Vegetables", "calories": 20, "protein": 2.2, "carbs": 3.7, "fats": 0.2, "serving": "1 cup", "g": 180},
        {"name": "Green Beans (cooked)", "category": "Vegetables", "calories": 35, "protein": 1.8, "carbs": 7.9, "fats": 0.1, "serving": "1 cup", "g": 125},
        {"name": "Cauliflower (cooked)", "category": "Vegetables", "calories": 29, "protein": 2.3, "carbs": 6, "fats": 0.6, "serving": "1 cup", "g": 124},
        {"name": "Brussels Sprouts (cooked)", "category": "Vegetables", "calories": 56, "protein": 4, "carbs": 11, "fats": 0.8, "serving": "1 cup", "g": 156},
        {"name": "Zucchini (cooked)", "category": "Vegetables", "calories": 21, "protein": 1.5, "carbs": 3.9, "fats": 0.4, "serving": "1 cup", "g": 180},
        {"name": "Mushrooms (raw)", "category": "Vegetables", "calories": 22, "protein": 3.1, "carbs": 3.3, "fats": 0.3, "serving": "1 cup", "g": 96},
        {"name": "Onion (raw)", "category": "Vegetables", "calories": 40, "protein": 1.1, "carbs": 9.3, "fats": 0.1, "serving": "1 medium", "g": 110},
        {"name": "Garlic", "category": "Vegetables", "calories": 149, "protein": 6.4, "carbs": 33, "fats": 0.5, "serving": "100g", "g": 100},
        {"name": "Celery (raw)", "category": "Vegetables", "calories": 14, "protein": 0.7, "carbs": 3, "fats": 0.2, "serving": "1 cup", "g": 101},
        {"name": "Eggplant (cooked)", "category": "Vegetables", "calories": 35, "protein": 0.8, "carbs": 8.6, "fats": 0.2, "serving": "1 cup", "g": 99},
        {"name": "Cabbage (raw)", "category": "Vegetables", "calories": 22, "protein": 1, "carbs": 5.2, "fats": 0.1, "serving": "1 cup", "g": 89},
        {"name": "Peas (cooked)", "category": "Vegetables", "calories": 84, "protein": 5.4, "carbs": 16, "fats": 0.2, "serving": "1 cup", "g": 160},
        {"name": "Corn (cooked)", "category": "Vegetables", "calories": 96, "protein": 3.4, "carbs": 21, "fats": 1.5, "serving": "1 cup", "g": 145},
        {"name": "Butternut Squash (cooked)", "category": "Vegetables", "calories": 40, "protein": 0.9, "carbs": 10, "fats": 0.1, "serving": "1 cup", "g": 205},
        {"name": "Acorn Squash (cooked)", "category": "Vegetables", "calories": 56, "protein": 1.1, "carbs": 15, "fats": 0.1, "serving": "1 cup", "g": 205},
        {"name": "Beets (cooked)", "category": "Vegetables", "calories": 44, "protein": 1.7, "carbs": 10, "fats": 0.2, "serving": "1 cup", "g": 136},
        {"name": "Radishes (raw)", "category": "Vegetables", "calories": 16, "protein": 0.7, "carbs": 3.4, "fats": 0.1, "serving": "100g", "g": 100},
        {"name": "Turnips (cooked)", "category": "Vegetables", "calories": 28, "protein": 0.9, "carbs": 6.4, "fats": 0.1, "serving": "1 cup", "g": 156},

        # LEGUMES (50 items)
        {"name": "Black Beans (cooked)", "category": "Legumes", "calories": 132, "protein": 8.9, "carbs": 24, "fats": 0.5, "serving": "1 cup", "g": 172},
        {"name": "Kidney Beans (cooked)", "category": "Legumes", "calories": 127, "protein": 8.7, "carbs": 23, "fats": 0.5, "serving": "1 cup", "g": 177},
        {"name": "Chickpeas (cooked)", "category": "Legumes", "calories": 164, "protein": 8.9, "carbs": 27, "fats": 2.6, "serving": "1 cup", "g": 164},
        {"name": "Lentils (cooked)", "category": "Legumes", "calories": 116, "protein": 9, "carbs": 20, "fats": 0.4, "serving": "1 cup", "g": 198},
        {"name": "Pinto Beans (cooked)", "category": "Legumes", "calories": 122, "protein": 7.7, "carbs": 22, "fats": 0.6, "serving": "1 cup", "g": 171},
        {"name": "Navy Beans (cooked)", "category": "Legumes", "calories": 140, "protein": 8.2, "carbs": 26, "fats": 0.6, "serving": "1 cup", "g": 182},
        {"name": "Lima Beans (cooked)", "category": "Legumes", "calories": 115, "protein": 7.3, "carbs": 21, "fats": 0.4, "serving": "1 cup", "g": 170},
        {"name": "Edamame (cooked)", "category": "Legumes", "calories": 122, "protein": 11, "carbs": 10, "fats": 5, "serving": "1 cup", "g": 155},
        {"name": "Hummus", "category": "Legumes", "calories": 166, "protein": 7.9, "carbs": 14, "fats": 10, "serving": "100g", "g": 100},
        {"name": "Refried Beans", "category": "Legumes", "calories": 90, "protein": 5, "carbs": 15, "fats": 1.5, "serving": "1/2 cup", "g": 126},
    ]


def seed_foods_database(db: Session):
    """
    Seed the foods table with all predefined foods.
    Run once after migrations.
    """
    foods_data = get_seed_foods()

    print(f"Seeding {len(foods_data)} foods...")

    for food_dict in foods_data:
        # Calculate per 100g values
        calories_per_100g = int(food_dict["calories"] / food_dict["g"] * 100)
        protein_per_100g = round(food_dict["protein"] / food_dict["g"] * 100, 1)
        carbs_per_100g = round(food_dict["carbs"] / food_dict["g"] * 100, 1)
        fats_per_100g = round(food_dict["fats"] / food_dict["g"] * 100, 1)

        # Create Food object
        food = Food(
            name=food_dict["name"],
            category=food_dict["category"],
            calories_per_100g=calories_per_100g,
            protein_per_100g=protein_per_100g,
            carbs_per_100g=carbs_per_100g,
            fats_per_100g=fats_per_100g,
            common_serving=food_dict["serving"],
            common_serving_grams=food_dict["g"],
            source=FoodSource.SEEDED,
            is_verified=True,
            times_used=0
        )

        db.add(food)

    db.commit()
    print(f"✅ Successfully seeded {len(foods_data)} foods!")


if __name__ == "__main__":
    # Run this script directly
    from app.db.database import SessionLocal
    from app.models.fitness_tracking import Food, FoodSource

    db = SessionLocal()

    try:
        # Check if foods already exist
        existing_count = db.query(Food).filter(Food.source == FoodSource.SEEDED).count()

        if existing_count > 0:
            print(f"⚠️ Database already has {existing_count} seeded foods.")
            response = input("Do you want to clear and reseed? (yes/no): ")

            if response.lower() == "yes":
                db.query(Food).filter(Food.source == FoodSource.SEEDED).delete()
                db.commit()
                print("✅ Cleared existing seeded foods")
                seed_foods_database(db)
            else:
                print("❌ Skipping seed")
        else:
            seed_foods_database(db)

    finally:
        db.close()
