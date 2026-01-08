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
        1. Hard filter by muscle group if present
        2. Otherwise return topic-matched records
        """

        query_l = query.lower()

        # ----------------------------
        # MUSCLE GROUP LOCK
        # ----------------------------
        muscle_map = {
            "chest": "chest",
            "shoulder": "shoulders",
            "shoulders": "shoulders",
            "delts": "shoulders",
            "back": "back",
            "biceps": "biceps",
            "triceps": "triceps",
            "legs": "legs",
            "quads": "legs",
            "hamstrings": "legs",
        }

        requested = None
        for k, v in muscle_map.items():
            if k in query_l:
                requested = v
                break

        matched: List[Dict] = []

        for r in self.records:
            pmg = (r.get("primary_muscle_group") or "").lower()
            mgs = [x.lower() for x in r.get("muscle_groups", [])]

            if requested:
                if requested in pmg or requested in mgs:
                    matched.append(r)
            else:
                matched.append(r)

        return matched[:top_k]
