# RAG Service

Standalone Python service that answers guest questions classified as
`answerable_qa` by the hotel's backend classifier (e.g. "when is breakfast
ending?"). Retrieval-augmented, grounded in real hotel content, with source
citations — if it can't find a supported answer, it says so instead of
guessing, so the caller can defer to a human operator.

**Wired in:** `app/api/requests/route.ts` calls this service (via
`lib/rag.ts`) as the first step whenever the classifier tags an intent as
`answerable_qa`, before anything falls back to `defer_to_operator`. This
service still runs as its own independent process — see root `README.md` for
how the two are run together.

## How it works

1. **Ingestion** (`app/ingestion/`, run manually via `python -m
   app.ingestion.seed`): markdown docs in `app/data/seed_docs/` are split with
   `RecursiveCharacterTextSplitter`, each chunk gets a short LLM-generated
   summary of its source prepended before embedding ("contextual retrieval"),
   and both the raw and embedded text are stored in Supabase pgvector.
2. **Query time** (`POST /rag/answer`):
   - A small Claude call rewrites the guest's raw question into a better
     retrieval query.
   - Cosine-similarity search over pgvector retrieves the top 5 chunks.
   - A cross-encoder reranks those 5 to the best-ordered 5.
   - Claude generates an answer **only** from the retrieved chunks and must
     cite which ones it used. No citation → no answer.
   - If nothing supports an answer, the response says so explicitly.

## Setup

```bash
cd rag-service
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in ANTHROPIC_API_KEY, SUPABASE_DB_URL, RAG_SERVICE_API_KEY
```

Then, once in the Supabase SQL editor (manual, one-time — see
`sql/001_create_rag_tables.sql`):

```sql
create extension if not exists vector;
-- then run the rest of sql/001_create_rag_tables.sql
```

Seed the placeholder knowledge base:

```bash
python -m app.ingestion.seed
```

Run the service:

```bash
uvicorn app.main:app --reload --port 8000
```

Port `8000` matches `RAG_SERVICE_URL` in the root `.env.example` — change both together if you use a different port.

Run tests:

```bash
pytest
```

## API contract

### `POST /rag/answer`

Headers: `X-Internal-Api-Key: <RAG_SERVICE_API_KEY value>` (required)

Request body:

```json
{ "question": "when is breakfast ending?", "room_number": "412" }
```

`room_number` is optional and currently unused by the pipeline — accepted for
forward compatibility with callers that always send it.

**Answered (200):**

```json
{
  "answered": true,
  "answer": "Breakfast is served until 10:30 AM in the main restaurant.",
  "sources": [
    { "title": "Breakfast", "document_id": "...", "excerpt": "Breakfast is served ... 6:30 AM to 10:30 AM ..." }
  ],
  "query_used": "breakfast end time"
}
```

**Cannot answer (200)** — caller should treat this as "defer to operator":

```json
{
  "answered": false,
  "answer": null,
  "sources": [],
  "query_used": "pool chlorine level",
  "reason": "no_supporting_content"
}
```

**Errors:**
- `401` — missing/invalid `X-Internal-Api-Key`
- `422` — missing/empty `question`
- `502` — a downstream dependency (Anthropic, Supabase) failed; body is a generic `{"error": "..."}`, never internals or secrets

### `GET /health`

`{"status": "ok"}` — no auth required.

## Integration point

`app/api/requests/route.ts` (Next.js) calls `getRagAnswer()` from `lib/rag.ts`
as soon as the classifier tags an intent as `answerable_qa`:

```
guest question -> classifier: intent = "answerable_qa"
                -> POST /rag/answer { question }
                     -> answered: true  -> answer + sources returned to the caller
                     -> answered: false -> caller treats this as defer_to_operator
```

## Known assumptions (flagged for override)

- **Embeddings & reranker are local** (`sentence-transformers`:
  `all-MiniLM-L6-v2` + `cross-encoder/ms-marco-MiniLM-L-6-v2`), not a new paid
  vendor — keeps this self-contained with no extra API key. Swap for Voyage AI
  or Cohere Rerank if preferred; the embedding dimension in
  `sql/001_create_rag_tables.sql` (`vector(384)`) would need to change to
  match.
- **English-only.** No translation step here — the rest of the product
  handles language detection/translation at the classification step.
- **Seed knowledge base is placeholder content**, clearly marked as sample
  data in each file under `app/data/seed_docs/` — replace with real hotel
  content before production use.
- **No persistent audit table** for answered/deferred decisions — logged to
  stdout only for now (see `app/pipeline/answer_service.py`).
