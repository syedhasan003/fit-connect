import json
from pathlib import Path

BASE_DIR = Path(__file__).parent

SOURCE_FILES = [
    "nutrition.json",
    "workouts.json",
    "recovery.json",
    "safety.json",
]


def load_canonical_sources():
    """
    Load all authoritative fitness sources used for RAG.
    Each source MUST include: id, category, content, source
    """
    sources = []

    for filename in SOURCE_FILES:
        file_path = BASE_DIR / filename
        if not file_path.exists():
            continue

        with open(file_path, "r") as f:
            data = json.load(f)

        if isinstance(data, list):
            sources.extend(data)
        else:
            sources.append(data)

    return sources
