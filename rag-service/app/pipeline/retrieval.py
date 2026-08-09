from sentence_transformers import SentenceTransformer

from app.config import Settings
from app.db.vectorstore import ChunkMatch, similarity_search


def retrieve_candidates(
    conn, embedder: SentenceTransformer, settings: Settings, query: str
) -> list[ChunkMatch]:
    query_embedding = embedder.encode(query).tolist()
    return similarity_search(conn, query_embedding, top_k=settings.retrieval_top_k)
