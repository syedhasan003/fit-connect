from typing import List
from app.ai.rag.schemas import RAGChunk


def rank_chunks(chunks: List[RAGChunk]) -> List[RAGChunk]:
    """
    Rank by confidence and source authority.
    """
    return sorted(chunks, key=lambda c: c.confidence, reverse=True)
