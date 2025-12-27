from typing import List, Dict

# Hard-coded authority weights (demo-safe)
SOURCE_WEIGHTS = {
    "World Health Organization": 1.0,
    "American College of Sports Medicine": 0.95,
    "National Strength and Conditioning Association": 0.9,
    "International Society of Sports Nutrition": 0.9,
    "American Heart Association": 0.95,
    "National Sleep Foundation": 0.85,
}

def rank_chunks(chunks: List[Dict]) -> List[Dict]:
    """
    Deterministic ranking of RAG chunks by source authority.
    """

    def score(chunk: Dict) -> float:
        source = chunk.get("source", "")
        return SOURCE_WEIGHTS.get(source, 0.5)

    return sorted(chunks, key=score, reverse=True)
