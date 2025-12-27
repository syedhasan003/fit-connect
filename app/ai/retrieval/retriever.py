from typing import List
from app.ai.rag.schemas import RAGChunk


def retrieve_chunks(query: str) -> List[RAGChunk]:
    """
    Deterministic retrieval layer.
    Later we plug embeddings / DB here.
    """
    # Placeholder: no hallucinations allowed
    return []
