# Landline

A hotel voice-agent platform. Guests call in through a browser widget,
[ElevenLabs](https://elevenlabs.io) Conversational AI handles the live
conversation, a backend classifier routes the resulting intent, and a
grounded RAG pipeline answers questions the agent can't answer from memory
alone. Anything that can't be answered — or that needs a person — becomes a
ticket on a live staff dashboard.

For the full architecture, file-by-file breakdown, and data flow, see
[`docs/overview.md`](docs/overview.md). This README covers getting the whole
system running locally.

## Architecture at a glance

```
Guest browser ──WebRTC──▶ ElevenLabs Conversational AI
                                  │ client tool: log_request { intent, room_number, summary }
                                  ▼
                     POST /api/requests (Next.js)
                                  │
                classifyRequest() routes on intent
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
  answerable_qa           physical_request           defer_to_operator
        │                         │                         │
        ▼                         ▼                         ▼
  POST /rag/answer         Supabase `requests`        Supabase `requests`
  (rag-service, Python)    (department-routed)         (requires_human)
        │                         │                         │
        ▼                         └───────────┬─────────────┘
  answered ? speak it                          ▼
  : defer to operator              Realtime → staff dashboard (Clerk-gated)
```

Three things run together, sharing one Supabase project:

| Service | Stack | Default port |
|---|---|---|
| Next.js app (guest widget + staff dashboard) | Node.js 18+, Next.js 14 App Router | 3000 |
| RAG service | Python 3.11+, FastAPI | 8000 |
| Database | Supabase (Postgres + Realtime + pgvector) | managed |

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- An [ElevenLabs](https://elevenlabs.io) Conversational AI agent
- An [Anthropic](https://console.anthropic.com) API key

## 1. Clone and install the Next.js app

```bash
git clone <this repo>
cd landline
npm install
```

## 2. Set up Supabase

Two independent SQL files need to be run against your Supabase project's SQL
editor, in either order — copy each file's contents in directly:

- [`sql/002_create_requests_table.sql`](sql/002_create_requests_table.sql) — the staff dashboard's ticket table, plus enabling the Realtime publication it subscribes to.
- [`rag-service/sql/001_create_rag_tables.sql`](rag-service/sql/001_create_rag_tables.sql) — enables the `pgvector` extension and creates the RAG service's vector store tables.

Both are one-time, manual steps — neither the Next.js app nor the RAG
service runs migrations automatically. Grab the direct Postgres connection
string too (Project Settings → Database) — the RAG service needs it
separately from the `SUPABASE_URL`/anon-key pair the Next.js app uses.

> **Heads up:** `sql/002_create_requests_table.sql`'s `status` column allows
> `'open' | 'in_progress' | 'resolved'`, but the dashboard code
> (`lib/types.ts`, `app/dashboard/page.tsx`) expects `'new' | 'in_progress' |
> 'done'`. As shipped, new tickets land with `status = 'open'` and won't
> match the dashboard's "Waiting for Pickup" column. This predates this
> README update and hasn't been reconciled yet — worth fixing one way or the
> other before relying on the dashboard.

## 3. Set up Clerk

The staff dashboard (`/dashboard`) is Clerk-gated; the guest widget (`/`) is
fully public and needs no Clerk session.

1. Create a Clerk application, grab the publishable + secret keys.
2. Staff **roles are admin-assigned, not self-service**: for each staff
   member's Clerk user, set `publicMetadata.role` (via the Clerk dashboard or
   Backend API) to one of `front_desk`, `housekeeping`, `room_service`,
   `maintenance`, or `manager`. `manager` sees every department; the rest see
   only their own. A signed-in user with no `role` set sees a "contact an
   admin" message instead of the dashboard — that's expected until you
   assign one.
3. Background on why Clerk was chosen for this: [`docs/clerk-setup.md`](docs/clerk-setup.md).

## 4. Set up ElevenLabs

1. Create a Conversational AI agent in the ElevenLabs dashboard.
2. Give it a `log_request` client tool with the JSON schema described in
   [`docs/Implementation.md`](docs/Implementation.md) (`intent`,
   `room_number`, `summary`, `urgency`, `language_detected`,
   `requires_human`) — this is what `hooks/usePhoneSession.ts` wires up to
   `POST /api/requests`.
3. Grab the API key and agent ID.

## 5. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where it's from |
|---|---|
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | ElevenLabs dashboard |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page, client-safe pair |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard` | already set correctly in `.env.example` |
| `RAG_SERVICE_URL` | `http://localhost:8000` for local dev |
| `RAG_SERVICE_API_KEY` | any random string — must match the RAG service's own `.env` (step 6) |

## 6. Set up the RAG service

```bash
cd rag-service
python -m venv .venv
.venv\Scripts\activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env
```

Fill in `rag-service/.env`:

| Variable | Where it's from |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic console |
| `SUPABASE_DB_URL` | Supabase → Project Settings → Database → connection string (direct Postgres, not the REST URL) |
| `RAG_SERVICE_API_KEY` | must match the root `.env.local`'s value from step 5 |

Then seed the placeholder knowledge base (breakfast hours, checkout, wifi,
amenities, policies — replace with real property content before production):

```bash
python -m app.ingestion.seed
```

Full API contract and pipeline details: [`rag-service/README.md`](rag-service/README.md).

## Running everything

Two processes, run in separate terminals:

```bash
# Terminal 1 — Next.js app (guest widget + staff dashboard)
npm run dev              # http://localhost:3000

# Terminal 2 — RAG service
cd rag-service
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Guest widget: `http://localhost:3000/`
Staff dashboard: `http://localhost:3000/dashboard` (requires Clerk sign-in + an assigned role)

## Tests

```bash
npm test                 # Jest — 115 tests: classifier, API routes, components, acceptance

cd rag-service
pytest                   # 26 tests: chunking, retrieval/rerank, grounding, API auth/validation
```

## Repository layout

```
landline/
├── app/                  # Next.js App Router: guest page, staff dashboard, API routes
├── components/           # React UI components
├── hooks/                # Custom React hooks
├── lib/                  # Server/shared utilities (classifier, Clerk auth, Supabase clients, RAG client)
├── types/                # Shared TypeScript interfaces
├── middleware.ts         # Clerk route protection (/dashboard only)
├── __tests__/            # Jest test suites
├── docs/                 # Architecture, planning docs, contributor overview
├── sql/                  # Staff dashboard schema migration
├── rag-service/          # Standalone Python RAG service (own README, own tests)
└── .env.example
```

More docs: [`docs/architecture.md`](docs/architecture.md) ·
[`docs/Implementation.md`](docs/Implementation.md) ·
[`docs/clerk-setup.md`](docs/clerk-setup.md) ·
[`docs/overview.md`](docs/overview.md) (deep file-by-file reference).
