from unittest.mock import MagicMock

from app.db.vectorstore import ChunkMatch
from app.pipeline.generation import NO_ANSWER_SENTINEL, generate_grounded_answer


def _ranked(chunk_id: str, content: str, score: float = 0.9):
    chunk = ChunkMatch(
        chunk_id=chunk_id, document_id=f"doc-{chunk_id}", title="Breakfast", raw_content=content, similarity=score
    )
    return (chunk, score)


def test_generate_grounded_answer_returns_answer_and_used_sources(settings):
    mock_client = MagicMock()
    mock_client.messages.create.return_value.content = [
        MagicMock(text="Breakfast ends at 10:30 AM.\nSOURCES: [1]")
    ]

    ranked = [_ranked("1", "Breakfast is served 6:30 AM to 10:30 AM.")]

    answer, used_indices = generate_grounded_answer(mock_client, settings, "when does breakfast end?", ranked)

    assert answer == "Breakfast ends at 10:30 AM."
    assert used_indices == [0]


def test_generate_grounded_answer_returns_none_on_sentinel(settings):
    mock_client = MagicMock()
    mock_client.messages.create.return_value.content = [MagicMock(text=NO_ANSWER_SENTINEL)]

    ranked = [_ranked("1", "The pool closes at 10 PM.")]

    answer, used_indices = generate_grounded_answer(
        mock_client, settings, "what's the chlorine level in the pool?", ranked
    )

    assert answer is None
    assert used_indices == []


def test_generate_grounded_answer_returns_none_when_no_sources_cited(settings):
    # Model answered without citing any source -> treated as ungrounded, not trusted.
    mock_client = MagicMock()
    mock_client.messages.create.return_value.content = [MagicMock(text="Breakfast ends around 10ish.")]

    ranked = [_ranked("1", "Breakfast is served 6:30 AM to 10:30 AM.")]

    answer, used_indices = generate_grounded_answer(mock_client, settings, "when does breakfast end?", ranked)

    assert answer is None
    assert used_indices == []


def test_generate_grounded_answer_returns_none_for_empty_candidates(settings):
    mock_client = MagicMock()

    answer, used_indices = generate_grounded_answer(mock_client, settings, "anything?", [])

    assert answer is None
    assert used_indices == []
    mock_client.messages.create.assert_not_called()
