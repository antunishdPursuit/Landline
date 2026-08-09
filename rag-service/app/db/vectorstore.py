"""Thin psycopg2 wrapper around the rag_documents / rag_chunks tables.

Deliberately raw SQL rather than an ORM: this service owns exactly two
tables, both created by sql/001_create_rag_tables.sql (a manual step — see
that file's header). Keeping this thin avoids pulling in SQLAlchemy for a
two-table service.
"""
from __future__ import annotations

from dataclasses import dataclass

import psycopg2
import psycopg2.extras

from app.config import Settings


@dataclass
class ChunkMatch:
    chunk_id: str
    document_id: str
    title: str
    raw_content: str
    similarity: float


def get_connection(settings: Settings):
    return psycopg2.connect(settings.supabase_db_url)


def insert_document(conn, source_name: str, title: str) -> str:
    with conn.cursor() as cur:
        cur.execute(
            "insert into rag_documents (source_name, title) values (%s, %s) returning id",
            (source_name, title),
        )
        document_id = cur.fetchone()[0]
    conn.commit()
    return str(document_id)


def insert_chunk(
    conn,
    document_id: str,
    chunk_index: int,
    raw_content: str,
    embedded_content: str,
    embedding: list[float],
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into rag_chunks
                (document_id, chunk_index, raw_content, embedded_content, embedding)
            values (%s, %s, %s, %s, %s)
            """,
            (document_id, chunk_index, raw_content, embedded_content, embedding),
        )
    conn.commit()


def similarity_search(conn, query_embedding: list[float], top_k: int) -> list[ChunkMatch]:
    """Cosine similarity search via pgvector's `<=>` (cosine distance) operator.

    similarity = 1 - cosine_distance, so higher is more similar.
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            select
                c.id as chunk_id,
                c.document_id as document_id,
                d.title as title,
                c.raw_content as raw_content,
                1 - (c.embedding <=> %s::vector) as similarity
            from rag_chunks c
            join rag_documents d on d.id = c.document_id
            order by c.embedding <=> %s::vector
            limit %s
            """,
            (query_embedding, query_embedding, top_k),
        )
        rows = cur.fetchall()

    return [
        ChunkMatch(
            chunk_id=str(row["chunk_id"]),
            document_id=str(row["document_id"]),
            title=row["title"],
            raw_content=row["raw_content"],
            similarity=float(row["similarity"]),
        )
        for row in rows
    ]
