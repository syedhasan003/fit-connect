"""
Fix SQLite datetime compatibility in fitness_tracking.py
Changes func.now() to 'CURRENT_TIMESTAMP' for SQLite
"""

file_path = "app/models/fitness_tracking.py"

print(f"🔧 Fixing SQLite datetime in {file_path}...")

try:
    with open(file_path, 'r') as f:
        content = f.read()

    # Replace all func.now() with text('CURRENT_TIMESTAMP')
    content = content.replace(
        'server_default=func.now()',
        "server_default=text('CURRENT_TIMESTAMP')"
    )

    # Make sure text is imported
    if 'from sqlalchemy import text' not in content and "text('CURRENT_TIMESTAMP')" in content:
        # Add text import
        content = content.replace(
            'from sqlalchemy import (',
            'from sqlalchemy import text, ('
        )

    with open(file_path, 'w') as f:
        f.write(content)

    print("✅ Fixed successfully!")
    print("\nChanges made:")
    print("  • Replaced func.now() with text('CURRENT_TIMESTAMP') for SQLite compatibility")
    print("  • Added 'text' import if needed")
    print("\nYou can now run: python3 seed_foods.py")

except FileNotFoundError:
    print(f"❌ Error: {file_path} not found!")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
