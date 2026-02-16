"""
Quick fix script to remove problematic references in fitness_tracking.py
Run this from your backend directory
"""

import sys

file_path = "app/models/fitness_tracking.py"

print(f"🔧 Fixing {file_path}...")

try:
    with open(file_path, 'r') as f:
        content = f.read()

    # Remove ForeignKey from manual_workout_id
    content = content.replace(
        'manual_workout_id = Column(Integer, ForeignKey("manual_workouts.id"), nullable=False)',
        'manual_workout_id = Column(Integer, nullable=True)  # ForeignKey removed temporarily'
    )

    # Remove ForeignKey from exercise_id
    content = content.replace(
        'exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)',
        'exercise_id = Column(Integer, nullable=True)  # ForeignKey removed temporarily'
    )

    # Comment out manual_workout relationship
    content = content.replace(
        'manual_workout = relationship("ManualWorkout", back_populates="workout_sessions")',
        '# manual_workout = relationship("ManualWorkout", back_populates="workout_sessions")  # Temporarily disabled'
    )

    # Comment out exercise relationship
    content = content.replace(
        'exercise = relationship("Exercise")',
        '# exercise = relationship("Exercise")  # Temporarily disabled'
    )

    with open(file_path, 'w') as f:
        f.write(content)

    print("✅ Fixed successfully!")
    print("\nChanges made:")
    print("  • Removed ForeignKey from manual_workout_id")
    print("  • Removed ForeignKey from exercise_id")
    print("  • Commented out ManualWorkout relationship")
    print("  • Commented out Exercise relationship")
    print("\nYou can now run: python3 seed_foods.py")

except FileNotFoundError:
    print(f"❌ Error: {file_path} not found!")
    print("Make sure you're in the backend directory")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
