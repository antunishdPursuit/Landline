from sentence_transformers import CrossEncoder

from app.db.vectorstore import ChunkMatch


def rerank(cross_encoder: CrossEncoder, query: str, candidates: list[ChunkMatch]) -> list[tuple[ChunkMatch, float]]:
    if not candidates:
        return []

    pairs = [(query, candidate.raw_content) for candidate in candidates]
    scores = cross_encoder.predict(pairs)

    ranked = sorted(zip(candidates, scores), key=lambda pair: pair[1], reverse=True)
    return [(candidate, float(score)) for candidate, score in ranked]
