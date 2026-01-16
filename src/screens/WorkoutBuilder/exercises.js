const EXERCISES = {
  Chest: {
    Upper: [
      "Incline Barbell Press",
      "Incline Dumbbell Press",
      "Incline Smith Machine Press",
      "Incline Dumbbell Fly",
      "Incline Cable Fly",
      "Low-to-High Cable Fly",
      "Reverse-Grip Bench Press",
      "Landmine Press",
      "Incline Chest Press Machine",
      "Incline Hammer Strength Press"
    ],
    Middle: [
      "Flat Barbell Bench Press",
      "Flat Dumbbell Bench Press",
      "Smith Machine Bench Press",
      "Chest Press Machine",
      "Flat Dumbbell Fly",
      "Pec Deck",
      "Cable Chest Fly",
      "Svend Press",
      "Push-Ups",
      "Tempo Push-Ups"
    ],
    Lower: [
      "Decline Barbell Bench Press",
      "Decline Dumbbell Bench Press",
      "Decline Smith Machine Press",
      "High-to-Low Cable Fly",
      "Chest Dips",
      "Weighted Chest Dips",
      "Assisted Chest Dips",
      "Decline Dumbbell Fly",
      "Decline Push-Ups",
      "Cable Decline Press"
    ]
  },

  Back: {
    Lats: [
      "Pull-Ups",
      "Assisted Pull-Ups",
      "Wide-Grip Lat Pulldown",
      "Neutral-Grip Lat Pulldown",
      "Close-Grip Pulldown",
      "Single-Arm Lat Pulldown",
      "Straight Arm Pulldown",
      "Kneeling Lat Pulldown",
      "Machine Lat Row",
      "Weighted Pull-Ups"
    ],
    UpperBack: [
      "Barbell Row",
      "Pendlay Row",
      "Chest-Supported Dumbbell Row",
      "Seated Cable Row",
      "Wide-Grip Seated Row",
      "T-Bar Row",
      "Machine High Row",
      "Inverted Row",
      "Smith Machine Row",
      "Landmine Row"
    ],
    LowerBack: [
      "Deadlift",
      "Romanian Deadlift",
      "Rack Pull",
      "Back Extension",
      "Reverse Hyperextension",
      "Good Morning",
      "Cable Pull-Through",
      "Barbell Hip Hinge",
      "Trap Bar Deadlift",
      "Isometric Back Extension Hold"
    ]
  },

  Shoulders: {
    Front: [
      "Barbell Overhead Press",
      "Dumbbell Shoulder Press",
      "Smith Machine Shoulder Press",
      "Arnold Press",
      "Seated Dumbbell Press",
      "Machine Shoulder Press",
      "Landmine Press",
      "Front Raise (Plate)",
      "Front Raise (Dumbbell)",
      "Push Press"
    ],
    Lateral: [
      "Dumbbell Lateral Raise",
      "Cable Lateral Raise",
      "Machine Lateral Raise",
      "Leaning Lateral Raise",
      "Seated Lateral Raise",
      "Partial Lateral Raise",
      "Resistance Band Lateral Raise",
      "Wide-Grip Upright Row",
      "Isometric Lateral Hold",
      "Cross-Body Cable Raise"
    ],
    Rear: [
      "Rear Delt Fly (Dumbbell)",
      "Reverse Pec Deck",
      "Face Pull",
      "Cable Rear Delt Fly",
      "Bent-Over Rear Delt Raise",
      "Rear Delt Row",
      "Chest-Supported Rear Fly",
      "Resistance Band Pull-Apart",
      "Suspension Trainer Rear Fly",
      "Isometric Rear Delt Hold"
    ]
  },

  Biceps: {
    LongHead: [
      "Incline Dumbbell Curl",
      "Bayesian Cable Curl",
      "Drag Curl",
      "Narrow-Grip Barbell Curl",
      "Spider Curl",
      "High Cable Curl",
      "Alternating Dumbbell Curl",
      "Concentration Curl",
      "EZ-Bar Curl (Narrow)",
      "Zottman Curl"
    ],
    ShortHead: [
      "Preacher Curl",
      "EZ-Bar Curl",
      "Wide-Grip Barbell Curl",
      "Cable Curl",
      "Machine Curl",
      "Seated Dumbbell Curl",
      "Resistance Band Curl",
      "Tempo Curl",
      "Partial Rep Curl",
      "Spider Curl (Wide Grip)"
    ]
  },

  Triceps: {
    LongHead: [
      "Overhead Dumbbell Extension",
      "Overhead Cable Extension",
      "Skull Crushers",
      "EZ-Bar Skull Crushers",
      "Incline Dumbbell Extension",
      "JM Press",
      "Tate Press",
      "Resistance Band Overhead Extension"
    ],
    Lateral: [
      "Cable Pushdown",
      "Straight Bar Pushdown",
      "V-Bar Pushdown",
      "Machine Pushdown",
      "Rope Pushdown",
      "Resistance Band Pushdown",
      "Close-Grip Push-Ups",
      "Tempo Pushdowns"
    ],
    Medial: [
      "Reverse-Grip Pushdown",
      "Close-Grip Bench Press",
      "Diamond Push-Ups",
      "Bench Dips",
      "Assisted Bench Dips",
      "Smith Close-Grip Press",
      "Isometric Pushdown Hold",
      "Partial Range Pushdowns"
    ]
  },

  Legs: {
    Quads: [
      "Back Squat",
      "Front Squat",
      "Hack Squat",
      "Leg Press",
      "Bulgarian Split Squat",
      "Walking Lunges",
      "Reverse Lunges",
      "Step-Ups",
      "Leg Extension",
      "Goblet Squat"
    ],
    Hamstrings: [
      "Romanian Deadlift",
      "Lying Leg Curl",
      "Seated Leg Curl",
      "Nordic Curl",
      "Good Morning",
      "Stability Ball Curl",
      "Single-Leg RDL",
      "Cable Leg Curl",
      "Glute-Ham Raise",
      "Kettlebell Swing"
    ],
    Glutes: [
      "Hip Thrust",
      "Barbell Glute Bridge",
      "Cable Kickback",
      "Step-Ups",
      "Reverse Lunge",
      "Sumo Deadlift",
      "Frog Pumps",
      "Banded Walks",
      "Smith Hip Thrust",
      "Single-Leg Hip Thrust"
    ]
  },

  Calves: {
    Gastrocnemius: [
      "Standing Calf Raise",
      "Smith Standing Calf Raise",
      "Donkey Calf Raise",
      "Single-Leg Standing Raise",
      "Farmer Walk on Toes"
    ],
    Soleus: [
      "Seated Calf Raise",
      "Seated Smith Calf Raise",
      "Resistance Band Calf Raise",
      "Tempo Seated Raise",
      "Leg Press Calf Raise"
    ]
  },

  Core: {
    Abs: [
      "Crunch",
      "Cable Crunch",
      "Hanging Leg Raise",
      "Captain’s Chair Raise",
      "Decline Sit-Up",
      "Weighted Sit-Up",
      "Ab Wheel Rollout",
      "Reverse Crunch",
      "V-Ups",
      "Stability Ball Crunch"
    ],
    Obliques: [
      "Russian Twist",
      "Cable Woodchopper",
      "Pallof Press",
      "Side Plank",
      "Copenhagen Plank",
      "Suitcase Carry",
      "Farmer Carry",
      "Dead Bug"
    ]
  }
};

export default EXERCISES;
