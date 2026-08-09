from unittest.mock import MagicMock

from app.ingestion.contextual_summary import build_embedded_content, generate_context_summary


def test_generate_context_summary_calls_claude_and_returns_text():
    mock_client = MagicMock()
    mock_client.messages.create.return_value.content = [
        MagicMock(text="This chunk is from the breakfast policy document.")
    ]

    summary = generate_context_summary(
        mock_client,
        settings=MagicMock(rag_context_summary_model="claude-haiku-4-5-20251001"),
        document_title="Breakfast",
        chunk_text="Breakfast is served 6:30 AM to 10:30 AM.",
    )

    assert summary == "This chunk is from the breakfast policy document."
    mock_client.messages.create.assert_called_once()


def test_build_embedded_content_differs_from_raw_chunk():
    raw_chunk = "Breakfast is served 6:30 AM to 10:30 AM."
    context_summary = "This chunk is from the breakfast policy document."

    embedded_content = build_embedded_content(context_summary, raw_chunk)

    assert embedded_content != raw_chunk
    assert context_summary in embedded_content
    assert raw_chunk in embedded_content
