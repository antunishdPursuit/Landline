from pathlib import Path

from app.ingestion.seed import SEED_DOCS_DIR, _title_from_markdown

EXPECTED_SEED_FILES = {
    "breakfast.md",
    "checkout.md",
    "wifi.md",
    "amenities.md",
    "policies.md",
}


def test_seed_docs_directory_contains_expected_files():
    actual_files = {p.name for p in SEED_DOCS_DIR.glob("*.md")}
    assert EXPECTED_SEED_FILES.issubset(actual_files)


def test_every_seed_doc_is_marked_as_placeholder_content():
    for path in SEED_DOCS_DIR.glob("*.md"):
        text = path.read_text(encoding="utf-8")
        assert "SAMPLE / PLACEHOLDER CONTENT" in text, f"{path.name} is missing the placeholder-data disclaimer"


def test_title_from_markdown_extracts_h1():
    text = "# Breakfast\n\nSome content here."
    assert _title_from_markdown(text, fallback="fallback") == "Breakfast"


def test_title_from_markdown_falls_back_when_no_h1():
    text = "No heading here."
    assert _title_from_markdown(text, fallback="fallback-title") == "fallback-title"
