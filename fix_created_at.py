"""
Remove server_default from created_at columns in fitness_tracking.py
Let Python handle datetime defaults instead of database
"""

file_path = "app/models/fitness_tracking.py"

print(f"🔧 Fixing created_at defaults in {file_path}...")

try:
    with open(file_path, 'r') as f:
        content = f.read()

    # Replace all created_at with server_default to use default=datetime.utcnow
    content = content.replace(
        "created_at = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))",
        "created_at = Column(DateTime, nullable=False, default=datetime.utcnow)"
    )

    # Also catch the old version if it exists
    content = content.replace(
        "created_at = Column(DateTime, nullable=False, server_default=func.now())",
        "created_at = Column(DateTime, nullable=False, default=datetime.utcnow)"
    )

    # Make sure datetime is imported
    if 'from datetime import datetime' not in content:
        # Add after the first import block
        content = content.replace(
            'import enum',
            'import enum\nfrom datetime import datetime'
        )

    with open(file_path, 'w') as f:
        f.write(content)

    print("✅ Fixed successfully!")
    print("\nChanges made:")
    print("  • Removed server_default from created_at columns")
    print("  • Using Python datetime.utcnow() instead")
    print("  • Added datetime import")
    print("\nYou can now run: python3 seed_foods.py")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
