from typing import List
from app.ai.rag.schemas import RAGChunk


def rank_chunks(chunks: List[RAGChunk]) -> List[RAGChunk]:
    """
    Rank by confidence and source authority.
    """
    return sorted(chunks, key=lambda c: c.confidence, reverse=True)


"""
DEPRECATED (Phase 3+)

Ranking will be re-enabled once RAGChunk objects
carry confidence + authority metadata.

Do not use in demo path.
"""
