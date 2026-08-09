from app.ingestion.chunking import split_document


def test_split_document_produces_multiple_chunks_for_long_text(settings):
    settings.chunk_size = 50
    settings.chunk_overlap = 10
    text = "Sentence one is here. " * 20

    chunks = split_document(text, settings)

    assert len(chunks) > 1
    assert all(len(chunk) <= 60 for chunk in chunks)  # allows small overshoot at boundaries


def test_split_document_single_chunk_for_short_text(settings):
    text = "Breakfast ends at 10:30 AM."

    chunks = split_document(text, settings)

    assert len(chunks) == 1
    assert chunks[0] == text
