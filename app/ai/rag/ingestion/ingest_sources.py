import json
from pathlib import Path

SOURCES_DIR = Path("app/ai/sources")
INDEX_PATH = Path("app/ai/rag/data/rag_index.json")

def ingest():
    records = []

    for file in SOURCES_DIR.glob("*.json"):
        with open(file, "r") as f:
            data = json.load(f)

            if isinstance(data, dict):
                data = [data]

            for record in data:
                # 🚨 IMPORTANT: store FULL record
                records.append(record)

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(INDEX_PATH, "w") as f:
        json.dump(records, f, indent=2)

    print(f"[RAG] Indexed {len(records)} records")
    print(f"[RAG] Saved index to {INDEX_PATH}")

if __name__ == "__main__":
    ingest()
