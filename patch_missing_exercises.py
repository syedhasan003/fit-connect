"""
Run this once to add instructions/tips/common_mistakes for the 5 exercises
that shipped without any content.

Usage:
  cd backend
  python patch_missing_exercises.py
"""
import sqlite3, json, os

DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")

exercises = {
    "Iron Cross": {
        "instructions": [
            "Stand with feet shoulder-width apart, holding a dumbbell in each hand with arms fully extended to your sides at shoulder height.",
            "Keep a slight bend in both elbows throughout the movement — never lock them straight.",
            "Engage your core and keep your chest tall. This is your starting position.",
            "Slowly lower both arms forward and inward until the dumbbells meet in front of your torso.",
            "Squeeze your chest and front deltoids at the top of the movement.",
            "Slowly return your arms back out to the starting position under full control."
        ],
        "tips": [
            "Use very light dumbbells — the leverage is extreme on the shoulder joint at full extension.",
            "Keep your torso upright and avoid leaning forward as fatigue sets in.",
            "Think 'lead with the elbows' not the hands to keep tension on the right muscles.",
            "If you feel shoulder impingement, reduce the range of motion or drop the weight."
        ],
        "common_mistakes": [
            "Going too heavy — 5–10 lb feels like 40 lb at full extension.",
            "Locking the elbows straight, shifting stress onto the joint rather than the muscle.",
            "Rushing the eccentric — the return phase should be just as slow and controlled."
        ]
    },
    "One-Arm Kettlebell Swings": {
        "instructions": [
            "Stand with feet shoulder-width apart, kettlebell on the floor about a foot in front of you.",
            "Hinge at the hips and grip the kettlebell with one hand, tilting it toward you slightly.",
            "Hike the kettlebell back between your legs — keep your back flat and core braced.",
            "Explosively drive your hips forward to propel the kettlebell up to chest height. Your glutes and hamstrings do the work, not your arm.",
            "Let the kettlebell float to about chest/shoulder height — your arm guides it, not lifts it.",
            "As the bell descends, hinge your hips back and guide it between your legs to reload the next rep.",
            "Complete all reps on one side before switching hands."
        ],
        "tips": [
            "Power comes from the hip hinge — think of it as a horizontal jump, not a squat.",
            "Keep the non-working arm out to your side for balance.",
            "Your shoulder stays packed (not shrugged) throughout — think 'armpit forward'.",
            "Master two-arm swings before progressing to single-arm."
        ],
        "common_mistakes": [
            "Squatting instead of hinging — knees should only bend slightly, not deeply.",
            "Using the arm to lift the kettlebell rather than letting the hip drive propel it.",
            "Letting the lower back round at the bottom — always maintain a neutral spine."
        ]
    },
    "Push Press": {
        "instructions": [
            "Stand with feet hip-width apart. Hold a barbell at collar-bone height with a shoulder-width grip, elbows slightly in front of the bar.",
            "Brace your core and take a breath into your belly. This is the rack position.",
            "Perform a small, controlled dip by bending your knees 2–4 inches — hips back slightly, torso upright.",
            "Explosively reverse the dip by driving through your legs and hips to generate momentum.",
            "As the bar accelerates off your shoulders, press it straight overhead, locking out your elbows at the top.",
            "Keep your head slightly back during the press so the bar travels in a straight vertical path.",
            "Lower the bar back to the rack position under control, absorbing with a slight knee bend."
        ],
        "tips": [
            "The dip should be shallow and fast — a deep squat kills the elastic energy.",
            "Think 'push yourself under the bar' rather than pressing the bar up.",
            "The leg drive does 30–40% of the work — use it deliberately.",
            "Keep your wrists straight and stacked over your elbows throughout."
        ],
        "common_mistakes": [
            "Letting the torso lean back during the dip — stresses the spine.",
            "A slow, lazy dip — it must be fast and sharp to generate the elastic rebound.",
            "Pressing too early before the leg drive transfers fully."
        ]
    },
    "Side Bridge": {
        "instructions": [
            "Lie on your side on a mat with your legs stacked and straight. Prop yourself up on your forearm, elbow directly under your shoulder.",
            "Place your top hand on your hip or extend it toward the ceiling.",
            "Lift your hips off the floor so your body forms a straight line from head to heels.",
            "Squeeze your glutes and brace your entire core — pull your belly button toward your spine.",
            "Hold this position while breathing steadily. Your body should feel like a rigid plank on its side.",
            "Lower your hips back to the floor with control to end the set."
        ],
        "tips": [
            "Stack your feet directly on top of each other — staggering them reduces the core demand.",
            "Drive your supporting elbow into the floor to keep your shoulder stable.",
            "Progress to a full side plank on your hand once you can hold this for 60 seconds.",
            "For extra difficulty, add hip dips or raise your top leg."
        ],
        "common_mistakes": [
            "Letting the hips sag toward the floor — the whole purpose is a straight body line.",
            "Rotating the torso forward or backward — stay square.",
            "Holding your breath — breathe normally throughout the hold."
        ]
    },
    "Side Jackknife": {
        "instructions": [
            "Lie on your side on a mat with your legs stacked. Place your bottom arm extended along the floor or bent under your head.",
            "Put your top hand lightly behind your top ear — don't pull on your neck.",
            "Keeping both legs together and straight, simultaneously raise your legs off the floor and crunch your torso sideways toward your legs.",
            "Your top elbow and your legs move toward each other, contracting your obliques hard at the peak.",
            "Hold the contraction for one second at the top.",
            "Slowly lower back to the starting position. Complete all reps on one side, then switch."
        ],
        "tips": [
            "Think about your ribcage moving toward your hip — the contraction is lateral, not forward.",
            "Keep your legs together and toes pointed for better engagement.",
            "Control the descent — don't drop your legs back down.",
            "If too difficult, bend your knees to reduce the lever arm."
        ],
        "common_mistakes": [
            "Pulling on the neck with the hand — keep it light and use your obliques.",
            "Only moving the legs without the torso, or vice versa — both should crunch toward each other.",
            "Rotating onto your back during the movement — stay on your side throughout."
        ]
    }
}

conn = sqlite3.connect(DB_PATH, timeout=10)
cur  = conn.cursor()

for name, content in exercises.items():
    cur.execute(
        "UPDATE exercises SET instructions=?, tips=?, common_mistakes=? WHERE name=?",
        (json.dumps(content["instructions"]), json.dumps(content["tips"]), json.dumps(content["common_mistakes"]), name)
    )
    print(f"  ✓ {name} — {cur.rowcount} row updated")

conn.commit()
conn.close()
print("\nDone. All 5 exercises now have instructions, tips, and common mistakes.")
