"""CLI entry point: ingests every markdown file in app/data/seed_docs into
Supabase pgvector. Run manually after applying sql/001_create_rag_tables.sql:

    python -m app.ingestion.seed
"""
from pathlib import Path

from anthropic import Anthropic
from sentence_transformers import SentenceTransformer

from app.config import get_settings
from app.db.vectorstore import get_connection
from app.ingestion.embed_and_store import ingest_document

SEED_DOCS_DIR = Path(__file__).resolve().parent.parent / "data" / "seed_docs"


def _title_from_markdown(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def main() -> None:
    settings = get_settings()
    embedder = SentenceTransformer(settings.embedding_model_name)
    anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
    conn = get_connection(settings)

    try:
        for path in sorted(SEED_DOCS_DIR.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            title = _title_from_markdown(text, fallback=path.stem)
            document_id = ingest_document(
                conn,
                embedder=embedder,
                anthropic_client=anthropic_client,
                settings=settings,
                source_name=path.name,
                title=title,
                text=text,
            )
            print(f"Ingested {path.name} -> document_id={document_id}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
