"""
Exercise Seed Script — Phase 4
Seeds 30+ exercises covering all major muscle groups.
GIF URLs point to free-exercise-db hosted on GitHub (yuhonas/free-exercise-db).

Run: python3 seed_exercises.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

# ── Import ALL models first so SQLAlchemy resolves all relationships ──────────
# User model references WorkoutSession, BehavioralPattern, etc. in relationships.
# These must be loaded before any db.query() to avoid mapper init errors.
import app.models.fitness_tracking   # noqa: F401 — WorkoutSession, Food (legacy), etc.
import app.models.user               # noqa: F401 — User + all its relationships
import app.models.food               # noqa: F401 — FoodItem
import app.models.reminder           # noqa: F401
import app.models.medication         # noqa: F401
import app.models.vault_item         # noqa: F401
import app.models.exercise           # noqa: F401 — Exercise (the one we're seeding)

from app.db.database import SessionLocal, engine, Base
Base.metadata.create_all(bind=engine)

from app.models.exercise import Exercise

# ── GIF base URL ──────────────────────────────────────────────────────────────
BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

def gif(folder, n=0):
    return f"{BASE}/{folder}/images/{n}.gif"

# ── Exercise data ─────────────────────────────────────────────────────────────
EXERCISES = [

    # ════════════════════════ CHEST ════════════════════════
    {
        "external_id": "Barbell_Bench_Press",
        "name": "Barbell Bench Press",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Shoulders", "Triceps"],
        "instructions": [
            "Lie flat on a bench, grip the barbell slightly wider than shoulder-width.",
            "Unrack the bar and lower it slowly to your mid-chest.",
            "Press back up explosively until arms are fully extended.",
            "Keep your feet flat on the floor and back slightly arched."
        ],
        "tips": ["Keep wrists straight", "Don't bounce the bar off chest", "Squeeze shoulder blades together"],
        "common_mistakes": ["Flaring elbows too wide", "Lifting feet off floor", "Partial range of motion"],
        "gif_url": gif("Barbell_Bench_Press_-_Medium_Grip"),
        "calories_per_min": 8.0,
    },
    {
        "external_id": "Dumbbell_Bench_Press",
        "name": "Dumbbell Bench Press",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "dumbbell", "difficulty": "beginner",
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Shoulders", "Triceps"],
        "instructions": [
            "Lie on a flat bench holding a dumbbell in each hand at chest level.",
            "Press the dumbbells up until arms are fully extended.",
            "Lower slowly back to starting position.",
            "Keep a neutral wrist and controlled movement throughout."
        ],
        "tips": ["Press in a slight arc", "Don't lock elbows at top", "Full range of motion"],
        "common_mistakes": ["Using too much weight", "Uneven pressing", "Not lowering fully"],
        "gif_url": gif("Dumbbell_Bench_Press"),
        "calories_per_min": 7.5,
    },
    {
        "external_id": "Incline_Dumbbell_Press",
        "name": "Incline Dumbbell Press",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "dumbbell", "difficulty": "intermediate",
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Shoulders", "Triceps"],
        "instructions": [
            "Set bench to 30-45 degree incline.",
            "Hold dumbbells at shoulder level with palms facing forward.",
            "Press up and slightly inward until arms extended.",
            "Lower with control."
        ],
        "tips": ["Angle targets upper chest", "Control the descent", "Keep core tight"],
        "common_mistakes": ["Too steep an incline", "Flaring elbows", "Rushing the movement"],
        "gif_url": gif("Incline_Dumbbell_Press"),
        "calories_per_min": 7.0,
    },
    {
        "external_id": "Push_Up",
        "name": "Push-Up",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Shoulders", "Triceps", "Core"],
        "instructions": [
            "Start in high plank with hands slightly wider than shoulders.",
            "Lower your chest toward the floor, keeping body straight.",
            "Push back up to starting position.",
            "Keep core engaged throughout."
        ],
        "tips": ["Keep hips level", "Full range — chest nearly touches floor", "Elbows at 45 degrees"],
        "common_mistakes": ["Hips sagging", "Partial reps", "Flaring elbows"],
        "gif_url": gif("Push-Up"),
        "calories_per_min": 7.0,
    },
    {
        "external_id": "Cable_Fly",
        "name": "Cable Fly",
        "category": "strength", "force": "push", "mechanic": "isolation",
        "equipment": "cable", "difficulty": "intermediate",
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Shoulders"],
        "instructions": [
            "Set cables to chest height. Stand in centre holding a handle in each hand.",
            "With a slight bend in elbows, bring hands together in front of chest.",
            "Squeeze chest at the centre, then return with control.",
        ],
        "tips": ["Don't straighten arms fully", "Feel the stretch at the sides", "Slow and controlled"],
        "common_mistakes": ["Using arms too much", "Standing too close", "Rushing"],
        "gif_url": gif("Cable_Fly"),
        "calories_per_min": 6.0,
    },

    # ════════════════════════ BACK ════════════════════════
    {
        "external_id": "Deadlift",
        "name": "Deadlift",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Lower Back", "Glutes"],
        "secondary_muscles": ["Hamstrings", "Trapezius", "Forearms"],
        "instructions": [
            "Stand with feet hip-width, barbell over mid-foot.",
            "Hinge at hips and grip bar just outside legs.",
            "Keep back flat, chest up. Drive through the floor to lift.",
            "Lock hips and knees at top. Lower with control."
        ],
        "tips": ["Bar stays close to body", "Don't round your lower back", "Breathe deep before lifting"],
        "common_mistakes": ["Rounding the back", "Bar drifting forward", "Jerking the weight"],
        "gif_url": gif("Barbell_Deadlift"),
        "calories_per_min": 9.0,
    },
    {
        "external_id": "Pull_Up",
        "name": "Pull-Up",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "bodyweight", "difficulty": "intermediate",
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Rear Deltoids", "Core"],
        "instructions": [
            "Hang from bar with overhand grip, hands shoulder-width apart.",
            "Pull yourself up until chin clears the bar.",
            "Lower slowly back to full hang.",
            "Avoid swinging or kipping."
        ],
        "tips": ["Initiate with lats not arms", "Full dead hang at bottom", "Cross feet to reduce swing"],
        "common_mistakes": ["Half reps", "Shrugging shoulders", "Swinging for momentum"],
        "gif_url": gif("Pull-up"),
        "calories_per_min": 8.0,
    },
    {
        "external_id": "Barbell_Row",
        "name": "Barbell Bent-Over Row",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Middle Back"],
        "secondary_muscles": ["Lats", "Biceps", "Rear Deltoids"],
        "instructions": [
            "Stand with feet hip-width. Hinge forward 45 degrees, back flat.",
            "Grip barbell shoulder-width with overhand grip.",
            "Row the bar to your lower chest/upper abdomen.",
            "Lower with control, keeping back still."
        ],
        "tips": ["Keep chest up", "Pull elbows back not up", "Don't use momentum"],
        "common_mistakes": ["Rounding back", "Using momentum", "Pulling to wrong height"],
        "gif_url": gif("Barbell_Bent_Over_Row"),
        "calories_per_min": 8.0,
    },
    {
        "external_id": "Lat_Pulldown",
        "name": "Lat Pulldown",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "cable", "difficulty": "beginner",
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Rear Deltoids"],
        "instructions": [
            "Sit at pulldown machine, grip bar wider than shoulders.",
            "Lean back slightly, pull bar to upper chest.",
            "Squeeze lats at bottom, return slowly.",
        ],
        "tips": ["Don't pull behind neck", "Lead with elbows", "Slight lean back only"],
        "common_mistakes": ["Pulling behind neck", "Using too much momentum", "Narrow grip"],
        "gif_url": gif("Wide-Grip_Lat_Pulldown"),
        "calories_per_min": 6.0,
    },
    {
        "external_id": "Seated_Cable_Row",
        "name": "Seated Cable Row",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "cable", "difficulty": "beginner",
        "primary_muscles": ["Middle Back"],
        "secondary_muscles": ["Lats", "Biceps"],
        "instructions": [
            "Sit at cable row station with feet on platform, knees slightly bent.",
            "Grip handle with both hands, back straight.",
            "Pull handle to your abdomen, squeezing shoulder blades together.",
            "Extend arms back out with control."
        ],
        "tips": ["Don't lean back excessively", "Keep chest up", "Full stretch at front"],
        "common_mistakes": ["Rounding lower back", "Leaning too far back", "Rushing the rep"],
        "gif_url": gif("Seated_Cable_Rows"),
        "calories_per_min": 6.0,
    },

    # ════════════════════════ SHOULDERS ════════════════════════
    {
        "external_id": "Overhead_Press",
        "name": "Barbell Overhead Press",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Shoulders"],
        "secondary_muscles": ["Triceps", "Upper Chest", "Core"],
        "instructions": [
            "Stand with barbell at upper chest, grip slightly wider than shoulders.",
            "Press bar straight overhead until arms lock out.",
            "Lower back to collarbone level with control.",
            "Keep core braced throughout."
        ],
        "tips": ["Don't lean back excessively", "Bar path should be vertical", "Squeeze glutes"],
        "common_mistakes": ["Excessive lower back arch", "Partial range", "Bar drifting forward"],
        "gif_url": gif("Barbell_Shoulder_Press"),
        "calories_per_min": 8.0,
    },
    {
        "external_id": "Dumbbell_Lateral_Raise",
        "name": "Dumbbell Lateral Raise",
        "category": "strength", "force": "push", "mechanic": "isolation",
        "equipment": "dumbbell", "difficulty": "beginner",
        "primary_muscles": ["Shoulders"],
        "secondary_muscles": [],
        "instructions": [
            "Stand holding dumbbells at your sides, slight bend in elbows.",
            "Raise arms out to sides until parallel with floor.",
            "Lower slowly back down.",
        ],
        "tips": ["Lead with pinkies slightly up", "Don't shrug traps", "Slow on the way down"],
        "common_mistakes": ["Using momentum", "Raising too high", "Shrugging"],
        "gif_url": gif("Side_Lateral_Raise"),
        "calories_per_min": 5.0,
    },
    {
        "external_id": "Face_Pull",
        "name": "Face Pull",
        "category": "strength", "force": "pull", "mechanic": "isolation",
        "equipment": "cable", "difficulty": "beginner",
        "primary_muscles": ["Rear Deltoids"],
        "secondary_muscles": ["Trapezius", "Rotator Cuff"],
        "instructions": [
            "Set cable at head height with rope attachment.",
            "Pull rope toward your face, separating hands at the end.",
            "External rotate so hands end beside ears.",
            "Return slowly."
        ],
        "tips": ["Great for shoulder health", "Don't rush", "Elbows stay high"],
        "common_mistakes": ["Pulling too low", "Not externally rotating", "Too much weight"],
        "gif_url": gif("Face_Pull"),
        "calories_per_min": 4.5,
    },

    # ════════════════════════ ARMS — BICEPS ════════════════════════
    {
        "external_id": "Barbell_Curl",
        "name": "Barbell Curl",
        "category": "strength", "force": "pull", "mechanic": "isolation",
        "equipment": "barbell", "difficulty": "beginner",
        "primary_muscles": ["Biceps"],
        "secondary_muscles": ["Forearms"],
        "instructions": [
            "Stand holding barbell with underhand grip, shoulder-width.",
            "Curl bar up toward your shoulders, keeping elbows at sides.",
            "Squeeze at the top, lower with control.",
        ],
        "tips": ["Don't swing", "Full extension at bottom", "Slow negative"],
        "common_mistakes": ["Swinging torso", "Partial reps", "Elbows moving forward"],
        "gif_url": gif("Barbell_Curl"),
        "calories_per_min": 5.0,
    },
    {
        "external_id": "Hammer_Curl",
        "name": "Hammer Curl",
        "category": "strength", "force": "pull", "mechanic": "isolation",
        "equipment": "dumbbell", "difficulty": "beginner",
        "primary_muscles": ["Biceps"],
        "secondary_muscles": ["Brachialis", "Forearms"],
        "instructions": [
            "Hold dumbbells with palms facing each other (neutral grip).",
            "Curl both dumbbells up alternately or together.",
            "Lower with control."
        ],
        "tips": ["Great for forearm thickness", "Keep wrist neutral", "No swinging"],
        "common_mistakes": ["Rotating wrist", "Using momentum", "Too heavy"],
        "gif_url": gif("Hammer_Curls"),
        "calories_per_min": 4.5,
    },

    # ════════════════════════ ARMS — TRICEPS ════════════════════════
    {
        "external_id": "Tricep_Pushdown",
        "name": "Tricep Pushdown",
        "category": "strength", "force": "push", "mechanic": "isolation",
        "equipment": "cable", "difficulty": "beginner",
        "primary_muscles": ["Triceps"],
        "secondary_muscles": [],
        "instructions": [
            "Stand at cable machine with bar/rope at head height.",
            "Keeping elbows at sides, push down until arms fully extend.",
            "Squeeze at bottom, return slowly."
        ],
        "tips": ["Elbows stay tucked", "Full lockout at bottom", "Don't lean forward"],
        "common_mistakes": ["Moving elbows", "Partial lockout", "Using body weight"],
        "gif_url": gif("Triceps_Pushdown"),
        "calories_per_min": 5.0,
    },
    {
        "external_id": "Skull_Crusher",
        "name": "Skull Crusher (Lying Tricep Extension)",
        "category": "strength", "force": "push", "mechanic": "isolation",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Triceps"],
        "secondary_muscles": [],
        "instructions": [
            "Lie on bench holding barbell/EZ bar with arms extended over chest.",
            "Lower bar toward forehead by bending elbows only.",
            "Extend back up without moving upper arms."
        ],
        "tips": ["Keep upper arms vertical", "Control the descent", "Spotter recommended with heavy weight"],
        "common_mistakes": ["Flaring elbows out", "Letting elbows drift", "Bouncing"],
        "gif_url": gif("Lying_Triceps_Press"),
        "calories_per_min": 5.5,
    },

    # ════════════════════════ LEGS — QUADS ════════════════════════
    {
        "external_id": "Barbell_Squat",
        "name": "Barbell Back Squat",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Quadriceps"],
        "secondary_muscles": ["Glutes", "Hamstrings", "Core", "Lower Back"],
        "instructions": [
            "Position bar on upper traps, feet shoulder-width apart, toes slightly out.",
            "Brace core, push hips back and bend knees to lower.",
            "Keep chest up, go until thighs are parallel or below.",
            "Drive through heels to stand back up."
        ],
        "tips": ["Knees track over toes", "Keep weight in heels", "Breathe at top"],
        "common_mistakes": ["Knees caving in", "Heels rising", "Good morning (leaning too far)"],
        "gif_url": gif("Barbell_Full_Squat"),
        "calories_per_min": 9.0,
    },
    {
        "external_id": "Leg_Press",
        "name": "Leg Press",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "machine", "difficulty": "beginner",
        "primary_muscles": ["Quadriceps"],
        "secondary_muscles": ["Glutes", "Hamstrings"],
        "instructions": [
            "Sit in leg press machine, feet shoulder-width on platform.",
            "Release safety and lower platform until knees at 90 degrees.",
            "Press back up without locking knees fully."
        ],
        "tips": ["Don't let knees cave", "Feet higher = more glutes", "Full range of motion"],
        "common_mistakes": ["Locking knees", "Lifting hips off seat", "Too shallow depth"],
        "gif_url": gif("Leg_Press"),
        "calories_per_min": 7.0,
    },
    {
        "external_id": "Lunge",
        "name": "Dumbbell Lunge",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "dumbbell", "difficulty": "beginner",
        "primary_muscles": ["Quadriceps"],
        "secondary_muscles": ["Glutes", "Hamstrings", "Core"],
        "instructions": [
            "Stand holding dumbbells. Step one foot forward.",
            "Lower back knee toward floor until front thigh is parallel.",
            "Push off front foot to return. Alternate legs."
        ],
        "tips": ["Keep torso upright", "Front knee over ankle, not past toes", "Even stride length"],
        "common_mistakes": ["Knee caving in", "Leaning forward", "Short stride"],
        "gif_url": gif("Dumbbell_Lunge"),
        "calories_per_min": 7.5,
    },

    # ════════════════════════ LEGS — HAMSTRINGS ════════════════════════
    {
        "external_id": "Romanian_Deadlift",
        "name": "Romanian Deadlift",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Hamstrings"],
        "secondary_muscles": ["Glutes", "Lower Back"],
        "instructions": [
            "Stand holding barbell at hips, slight knee bend.",
            "Hinge at hips, pushing them back. Lower bar along legs.",
            "Feel stretch in hamstrings, then drive hips forward to stand.",
        ],
        "tips": ["Hinge at hips not knees", "Bar stays close to legs", "Feel hamstring stretch"],
        "common_mistakes": ["Rounding back", "Bending knees too much", "Bar drifting forward"],
        "gif_url": gif("Romanian_Deadlift"),
        "calories_per_min": 7.5,
    },
    {
        "external_id": "Leg_Curl",
        "name": "Lying Leg Curl",
        "category": "strength", "force": "pull", "mechanic": "isolation",
        "equipment": "machine", "difficulty": "beginner",
        "primary_muscles": ["Hamstrings"],
        "secondary_muscles": [],
        "instructions": [
            "Lie face down on leg curl machine, pad behind ankles.",
            "Curl heels toward glutes as far as possible.",
            "Lower with control."
        ],
        "tips": ["Don't lift hips", "Full range of motion", "Slow negative"],
        "common_mistakes": ["Hips rising", "Partial reps", "Rushing"],
        "gif_url": gif("Leg_Curl"),
        "calories_per_min": 5.0,
    },

    # ════════════════════════ LEGS — GLUTES ════════════════════════
    {
        "external_id": "Hip_Thrust",
        "name": "Barbell Hip Thrust",
        "category": "strength", "force": "push", "mechanic": "compound",
        "equipment": "barbell", "difficulty": "intermediate",
        "primary_muscles": ["Glutes"],
        "secondary_muscles": ["Hamstrings", "Core"],
        "instructions": [
            "Sit on floor with upper back against bench, barbell over hips.",
            "Plant feet flat on floor. Drive hips up until body is flat.",
            "Squeeze glutes hard at top, lower with control."
        ],
        "tips": ["Chin tucked", "Drive through heels", "Full hip extension at top"],
        "common_mistakes": ["Hyperextending lower back", "Partial range", "Feet too close"],
        "gif_url": gif("Barbell_Hip_Thrust"),
        "calories_per_min": 7.0,
    },
    {
        "external_id": "Glute_Kickback",
        "name": "Cable Glute Kickback",
        "category": "strength", "force": "push", "mechanic": "isolation",
        "equipment": "cable", "difficulty": "beginner",
        "primary_muscles": ["Glutes"],
        "secondary_muscles": ["Hamstrings"],
        "instructions": [
            "Attach ankle cuff to cable. Face the machine holding for balance.",
            "Kick leg back and up, squeezing glute at top.",
            "Lower with control. Complete reps then switch legs."
        ],
        "tips": ["Don't lean excessively", "Squeeze at top", "Slow controlled movement"],
        "common_mistakes": ["Swinging leg", "Leaning too far forward", "Bent knee"],
        "gif_url": gif("Cable_Kickback"),
        "calories_per_min": 4.5,
    },

    # ════════════════════════ CORE ════════════════════════
    {
        "external_id": "Plank",
        "name": "Plank",
        "category": "strength", "force": "static", "mechanic": "compound",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Core"],
        "secondary_muscles": ["Shoulders", "Glutes"],
        "instructions": [
            "Get into forearm plank position, elbows under shoulders.",
            "Keep body in a straight line from head to heels.",
            "Brace core and hold."
        ],
        "tips": ["Don't let hips sag or rise", "Breathe normally", "Squeeze glutes"],
        "common_mistakes": ["Hips too high or low", "Holding breath", "Looking up"],
        "gif_url": gif("Plank"),
        "calories_per_min": 4.0,
    },
    {
        "external_id": "Crunch",
        "name": "Crunch",
        "category": "strength", "force": "pull", "mechanic": "isolation",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Core"],
        "secondary_muscles": [],
        "instructions": [
            "Lie on back with knees bent, feet flat.",
            "Place hands behind head or across chest.",
            "Curl shoulders toward knees, squeezing abs.",
            "Lower with control."
        ],
        "tips": ["Don't pull neck", "Short range of motion", "Exhale as you crunch"],
        "common_mistakes": ["Pulling neck forward", "Full sit-up motion", "Momentum"],
        "gif_url": gif("Crunch"),
        "calories_per_min": 4.5,
    },
    {
        "external_id": "Leg_Raise",
        "name": "Hanging Leg Raise",
        "category": "strength", "force": "pull", "mechanic": "compound",
        "equipment": "bodyweight", "difficulty": "intermediate",
        "primary_muscles": ["Core"],
        "secondary_muscles": ["Hip Flexors"],
        "instructions": [
            "Hang from pull-up bar with straight arms.",
            "Raise legs until parallel with floor or higher.",
            "Lower with control, avoiding swinging."
        ],
        "tips": ["Posterior pelvic tilt at top", "Slow and controlled", "No kipping"],
        "common_mistakes": ["Swinging", "Bending knees", "Using momentum"],
        "gif_url": gif("Hanging_Leg_Raise"),
        "calories_per_min": 5.0,
    },
    {
        "external_id": "Russian_Twist",
        "name": "Russian Twist",
        "category": "strength", "force": "static", "mechanic": "isolation",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Core"],
        "secondary_muscles": ["Obliques"],
        "instructions": [
            "Sit on floor with knees bent, lean back 45 degrees.",
            "Clasp hands together or hold weight.",
            "Rotate torso side to side."
        ],
        "tips": ["Keep feet off floor for more challenge", "Rotate from core not arms", "Slow and deliberate"],
        "common_mistakes": ["Moving arms not torso", "Feet flat", "Too fast"],
        "gif_url": gif("Russian_Twist"),
        "calories_per_min": 5.0,
    },

    # ════════════════════════ CALVES ════════════════════════
    {
        "external_id": "Standing_Calf_Raise",
        "name": "Standing Calf Raise",
        "category": "strength", "force": "push", "mechanic": "isolation",
        "equipment": "machine", "difficulty": "beginner",
        "primary_muscles": ["Calves"],
        "secondary_muscles": [],
        "instructions": [
            "Stand on calf raise platform with balls of feet on edge.",
            "Rise up onto tiptoes as high as possible.",
            "Lower heels below platform for full stretch.",
        ],
        "tips": ["Full range of motion", "Pause at top and bottom", "Single leg for more challenge"],
        "common_mistakes": ["Partial range", "Bouncing", "Bent knees"],
        "gif_url": gif("Standing_Calf_Raises"),
        "calories_per_min": 4.0,
    },

    # ════════════════════════ CARDIO ════════════════════════
    {
        "external_id": "Burpee",
        "name": "Burpee",
        "category": "cardio", "force": "push", "mechanic": "compound",
        "equipment": "bodyweight", "difficulty": "intermediate",
        "primary_muscles": ["Core"],
        "secondary_muscles": ["Chest", "Shoulders", "Quadriceps", "Glutes"],
        "instructions": [
            "Stand, then squat and place hands on floor.",
            "Jump feet back to plank. Do a push-up.",
            "Jump feet back to hands. Jump up with arms overhead.",
        ],
        "tips": ["Modify by stepping instead of jumping", "Stay explosive", "Breathe throughout"],
        "common_mistakes": ["Skipping push-up", "Landing heavily", "Not fully extending at top"],
        "gif_url": gif("Burpee"),
        "calories_per_min": 12.0,
    },
    {
        "external_id": "Jump_Rope",
        "name": "Jump Rope",
        "category": "cardio", "force": "push", "mechanic": "compound",
        "equipment": "other", "difficulty": "beginner",
        "primary_muscles": ["Calves"],
        "secondary_muscles": ["Shoulders", "Core"],
        "instructions": [
            "Hold rope handles at hip height, rope behind you.",
            "Swing rope overhead and jump as it passes under feet.",
            "Land softly on balls of feet. Keep rhythm consistent."
        ],
        "tips": ["Small wrist rotations", "Stay on balls of feet", "Start slow"],
        "common_mistakes": ["Jumping too high", "Arm movements too big", "Landing flat-footed"],
        "gif_url": gif("Jump_Rope"),
        "calories_per_min": 13.0,
    },
    {
        "external_id": "Mountain_Climber",
        "name": "Mountain Climber",
        "category": "cardio", "force": "push", "mechanic": "compound",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Core"],
        "secondary_muscles": ["Shoulders", "Hip Flexors"],
        "instructions": [
            "Start in high plank position.",
            "Drive one knee toward chest, then quickly alternate.",
            "Keep hips level throughout."
        ],
        "tips": ["Keep pace fast for cardio benefit", "Don't let hips rise", "Breathe rhythmically"],
        "common_mistakes": ["Hips bouncing", "Slow pace", "Looking down"],
        "gif_url": gif("Mountain_Climber"),
        "calories_per_min": 10.0,
    },

    # ════════════════════════ STRETCHING ════════════════════════
    {
        "external_id": "Pigeon_Pose",
        "name": "Pigeon Pose (Hip Flexor Stretch)",
        "category": "stretching", "force": "static", "mechanic": "isolation",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Hip Flexors"],
        "secondary_muscles": ["Glutes", "Piriformis"],
        "instructions": [
            "From plank, bring one knee forward and place outside your same-side hand.",
            "Extend back leg straight behind you.",
            "Lower hips toward floor, hold for 30-60 seconds.",
            "Switch sides."
        ],
        "tips": ["Great for tight hips", "Keep hips square", "Breathe into the stretch"],
        "common_mistakes": ["Hips rotating", "Rushing through", "Foot too close"],
        "gif_url": gif("Pigeon_Pose"),
        "calories_per_min": 1.5,
    },
    {
        "external_id": "Child_Pose",
        "name": "Child's Pose",
        "category": "stretching", "force": "static", "mechanic": "isolation",
        "equipment": "bodyweight", "difficulty": "beginner",
        "primary_muscles": ["Lower Back"],
        "secondary_muscles": ["Hips", "Shoulders"],
        "instructions": [
            "Kneel on floor, knees wide or together.",
            "Extend arms forward and lower torso to ground.",
            "Hold and breathe deeply for 30-60 seconds."
        ],
        "tips": ["Excellent recovery pose", "Breathe into your back", "Arms extended or by sides"],
        "common_mistakes": ["Holding breath", "Knees too narrow", "Rushing"],
        "gif_url": gif("Childs_Pose"),
        "calories_per_min": 1.0,
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Exercise).count()
        if existing > 0:
            print(f"✅ {existing} exercises already seeded. Skipping.")
            return

        added = 0
        for data in EXERCISES:
            ex = Exercise(
                external_id       = data.get("external_id"),
                name              = data["name"],
                category          = data.get("category"),
                force             = data.get("force"),
                mechanic          = data.get("mechanic"),
                equipment         = data.get("equipment"),
                difficulty        = data.get("difficulty"),
                primary_muscles   = json.dumps(data.get("primary_muscles", [])),
                secondary_muscles = json.dumps(data.get("secondary_muscles", [])),
                instructions      = json.dumps(data.get("instructions", [])),
                tips              = json.dumps(data.get("tips", [])),
                common_mistakes   = json.dumps(data.get("common_mistakes", [])),
                gif_url           = data.get("gif_url"),
                image_urls        = json.dumps([]),
                calories_per_min  = data.get("calories_per_min"),
            )
            db.add(ex)
            added += 1

        db.commit()
        print(f"✅ Seeded {added} exercises successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding exercises: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
