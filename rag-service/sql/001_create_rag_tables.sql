-- Manual step. Run this once in the Supabase SQL editor.
-- This is NOT run automatically by the application — same category as the
-- existing manual `alter publication supabase_realtime add table requests;`
-- step documented in docs/Implementation.md.
--
-- Table names (rag_documents, rag_chunks) are deliberately namespaced with a
-- `rag_` prefix and do not collide with the existing rooms/requests/call_logs
-- tables owned by the rest of the application.

create extension if not exists vector;

create table if not exists rag_documents (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references rag_documents(id) not null,
  chunk_index int not null,
  raw_content text not null,
  embedded_content text not null,
  embedding vector(384) not null,
  created_at timestamptz default now()
);

create index if not exists rag_chunks_embedding_idx
  on rag_chunks using ivfflat (embedding vector_cosine_ops);
