from unittest.mock import MagicMock

from app.pipeline.query_rewrite import rewrite_query


def test_rewrite_query_uses_claude_output(settings):
    mock_client = MagicMock()
    mock_client.messages.create.return_value.content = [
        MagicMock(text="breakfast end time hours")
    ]

    result = rewrite_query(mock_client, settings, "uh when's like breakfast gonna be over")

    assert result == "breakfast end time hours"
    mock_client.messages.create.assert_called_once()


def test_rewrite_query_falls_back_to_original_on_empty_response(settings):
    mock_client = MagicMock()
    mock_client.messages.create.return_value.content = [MagicMock(text="   ")]

    original_question = "when is breakfast ending?"
    result = rewrite_query(mock_client, settings, original_question)

    assert result == original_question
