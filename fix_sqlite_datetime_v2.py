"""
Fix SQLite datetime compatibility in fitness_tracking.py
Changes func.now() to 'CURRENT_TIMESTAMP' for SQLite
"""

file_path = "app/models/fitness_tracking.py"

print(f"🔧 Fixing SQLite datetime in {file_path}...")

try:
    with open(file_path, 'r') as f:
        lines = f.readlines()

    new_lines = []
    import_fixed = False

    for line in lines:
        # Fix the import line if it exists
        if 'from sqlalchemy import text, (' in line:
            # Remove the duplicate text,
            line = line.replace('from sqlalchemy import text, (', 'from sqlalchemy import (')

        # Add text to the imports properly
        if 'from sqlalchemy import (' in line and not import_fixed and 'text' not in line:
            line = line.replace(
                'from sqlalchemy import (',
                'from sqlalchemy import (\n    text,'
            )
            import_fixed = True

        # Replace func.now() with text('CURRENT_TIMESTAMP')
        if 'server_default=func.now()' in line:
            line = line.replace(
                'server_default=func.now()',
                "server_default=text('CURRENT_TIMESTAMP')"
            )

        new_lines.append(line)

    with open(file_path, 'w') as f:
        f.writelines(new_lines)

    print("✅ Fixed successfully!")
    print("\nChanges made:")
    print("  • Added 'text' to SQLAlchemy imports")
    print("  • Replaced func.now() with text('CURRENT_TIMESTAMP')")
    print("\nYou can now run: python3 seed_foods.py")

except FileNotFoundError:
    print(f"❌ Error: {file_path} not found!")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
