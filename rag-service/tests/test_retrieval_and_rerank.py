from unittest.mock import MagicMock, patch

from app.db.vectorstore import ChunkMatch
from app.pipeline.reranker import rerank
from app.pipeline.retrieval import retrieve_candidates


def _chunk(chunk_id: str, similarity: float, content: str = "some content") -> ChunkMatch:
    return ChunkMatch(
        chunk_id=chunk_id,
        document_id=f"doc-{chunk_id}",
        title="Breakfast",
        raw_content=content,
        similarity=similarity,
    )


def test_retrieve_candidates_embeds_query_and_calls_similarity_search(settings):
    mock_embedder = MagicMock()
    mock_embedder.encode.return_value.tolist.return_value = [0.1, 0.2, 0.3]

    fake_matches = [_chunk("1", 0.9), _chunk("2", 0.8)]

    with patch(
        "app.pipeline.retrieval.similarity_search", return_value=fake_matches
    ) as mock_search:
        result = retrieve_candidates(conn=MagicMock(), embedder=mock_embedder, settings=settings, query="breakfast hours")

    mock_embedder.encode.assert_called_once_with("breakfast hours")
    mock_search.assert_called_once()
    assert mock_search.call_args.kwargs.get("top_k") == settings.retrieval_top_k or \
        mock_search.call_args.args[-1] == settings.retrieval_top_k
    assert result == fake_matches


def test_rerank_orders_by_cross_encoder_score_not_similarity():
    # Similarity search ranked "1" first, but the cross-encoder disagrees.
    candidates = [_chunk("1", similarity=0.95), _chunk("2", similarity=0.10)]

    mock_cross_encoder = MagicMock()
    mock_cross_encoder.predict.return_value = [0.2, 0.9]  # candidate "2" scores higher

    ranked = rerank(mock_cross_encoder, query="breakfast hours", candidates=candidates)

    assert ranked[0][0].chunk_id == "2"
    assert ranked[1][0].chunk_id == "1"
    mock_cross_encoder.predict.assert_called_once()


def test_rerank_handles_empty_candidates():
    mock_cross_encoder = MagicMock()

    ranked = rerank(mock_cross_encoder, query="anything", candidates=[])

    assert ranked == []
    mock_cross_encoder.predict.assert_not_called()
