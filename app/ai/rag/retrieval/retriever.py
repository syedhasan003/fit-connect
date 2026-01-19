import json
from typing import List, Dict
from pathlib import Path


RAG_INDEX_PATH = Path("app/ai/rag/data/rag_index.json")


class RagRetriever:
    def __init__(self):
        if not RAG_INDEX_PATH.exists():
            raise RuntimeError("RAG index not found. Run ingestion first.")

        with open(RAG_INDEX_PATH, "r") as f:
            self.records: List[Dict] = json.load(f)

    def retrieve(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        Deterministic retrieval:
        - Strict muscle group filtering
        - NO implicit crossover
        """

        query_l = query.lower()

        muscle_map = {
            "chest": "chest",
            "shoulder": "shoulders",
            "shoulders": "shoulders",
            "back": "back",
            "biceps": "biceps",
            "triceps": "triceps",
            "legs": "legs",
            "quads": "legs",
            "hamstrings": "legs",
        }

        requested = {
            v for k, v in muscle_map.items()
            if k in query_l
        }

        matched: List[Dict] = []

        for r in self.records:
            record_muscles = set(
                [r.get("primary_muscle_group", "").lower()]
                + [m.lower() for m in r.get("muscle_groups", [])]
            )

            record_muscles.discard("")

            # 🔒 STRICT MATCH
            if requested:
                if record_muscles.issubset(requested):
                    matched.append(r)
            else:
                matched.append(r)

        return matched[:top_k]
