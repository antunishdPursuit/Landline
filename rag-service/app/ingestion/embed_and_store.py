from anthropic import Anthropic
from sentence_transformers import SentenceTransformer

from app.config import Settings
from app.db import vectorstore
from app.ingestion.chunking import split_document
from app.ingestion.contextual_summary import build_embedded_content, generate_context_summary


def ingest_document(
    conn,
    embedder: SentenceTransformer,
    anthropic_client: Anthropic,
    settings: Settings,
    source_name: str,
    title: str,
    text: str,
) -> str:
    document_id = vectorstore.insert_document(conn, source_name=source_name, title=title)

    chunks = split_document(text, settings)
    for index, raw_chunk in enumerate(chunks):
        context_summary = generate_context_summary(
            anthropic_client, settings, document_title=title, chunk_text=raw_chunk
        )
        embedded_content = build_embedded_content(context_summary, raw_chunk)
        embedding = embedder.encode(embedded_content).tolist()

        vectorstore.insert_chunk(
            conn,
            document_id=document_id,
            chunk_index=index,
            raw_content=raw_chunk,
            embedded_content=embedded_content,
            embedding=embedding,
        )

    return document_id
