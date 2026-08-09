# Landline — Contributor Overview

> Hotel voice agent platform. Guests pick up a virtual phone, speak their request, and the system routes it to the right department or answers it directly via RAG.

---

## Architecture at a Glance

```
Guest browser
    │
    │  WebRTC audio stream
    ▼
ElevenLabs Conversational AI  ←── signed URL (keeps API key server-only)
    │
    │  client tool call: log_request { intent, room_number, summary }
    ▼
POST /api/requests  (Next.js route handler)
    │
    ├─► classifyRequest()  →  intent → department + requires_human flag
    │       answerable_qa  →  skips DB write (agent answers inline via RAG)
    │       physical_request / defer_to_operator  →  writes to Supabase `requests` table
    │
    └─► Supabase (pgvector)  ←──────────────────────────  rag-service (Python)
                                                            POST /rag/answer
                                                            (not yet wired into Next.js flow)
```

Two independently deployable services share the same Supabase project:

| Service | Runtime | Port |
|---------|---------|------|
| **Next.js app** | Node.js 18+ | 3000 |
| **rag-service** | Python 3.11+ / FastAPI | 8000 |

---

## Repository Layout

```
landline/
├── app/                        # Next.js App Router pages and API routes
├── components/                 # React UI components
├── hooks/                      # Custom React hooks
├── lib/                        # Server-side and shared utilities
├── types/                      # Shared TypeScript interfaces
├── middleware.ts               # Clerk route protection
├── docs/                       # Architecture and planning documents
├── __tests__/                  # Jest test suites
├── __mocks__/                  # Jest module stubs
├── rag-service/                # Standalone Python RAG service
├── tailwind.config.ts
├── next.config.mjs
├── jest.config.js
├── tsconfig.json
├── postcss.config.js
├── package.json
├── .env.example                # Template — copy to .env.local to develop
└── .gitignore
```

---

## Next.js App (`app/`)

### `app/page.tsx`
**Guest landing page.** Client component (`"use client"`). Composes `AgentConfigCard` and `PhoneButton`. Shows a loading state while the agent config hydrates from `localStorage`. Hides `PhoneButton` while the user is in config-edit mode.

### `app/layout.tsx`
**Root layout.** Wraps the app in `ClerkProvider`. Imports the three Google Fonts (Cormorant Garamond, DM Sans, JetBrains Mono) and applies them as CSS variables (`--font-cormorant`, `--font-dm-sans`, `--font-jetbrains`) on `<html>`.

### `app/globals.css`
**Global styles.** Sets body background (`espresso`), default text color (`ivory`), font smoothing, and a gold `outline` for keyboard focus via `@layer base`.

### `app/api/elevenlabs/signed-url/route.ts`
**GET** — Returns a short-lived signed URL for the client to open a WebRTC session with ElevenLabs. Calls `getSignedUrl()` from `lib/elevenlabs.ts`. Returns `{ url: string }` or HTTP 500. The API key never leaves the server.

### `app/api/requests/route.ts`
**POST** — Receives `{ intent, room_number, summary, requires_human }` from the ElevenLabs `log_request` client tool. Validates all fields, calls `classifyRequest()`, and writes a row to Supabase `requests` for physical/defer intents. Returns the classifier result. `requires_human` from the client is always discarded; the server recomputes it authoritatively.

---

## Components (`components/`)

### `components/AgentConfigCard.tsx`
**Property configuration UI.** Two rendering modes:

- **View mode** (`CardView`): Full-bleed thumbnail (192 px), property name in italic Cormorant Garamond, address in DM Sans taupe, DMS coordinates (e.g. `40°44′52″N / 73°59′08″W`) in JetBrains Mono gold. "Edit" link top-right.
- **Edit mode** (`CardEdit`): Thumbnail upload zone (FileReader → base64 data URL), bottom-border-only text inputs for name / address / lat / lng, live DMS coordinate preview as the user types, "Save property" gold button, "Cancel" link.

Internal `toDMS(decimal, isLat)` helper converts decimal degrees to the `°′″` notation.

Accepts all state and callbacks from the `useAgentConfig` hook: `config`, `draft`, `isEditing`, `isLoaded`, `startEditing`, `cancelEditing`, `save`, `updateDraft`.

### `components/PhoneButton.tsx`
**Circular phone button.** Accepts `config: AgentConfig`. Derives `dynamicVariables` (property name, address, lat, lng) via `toDynamicVariables()` and passes them to `usePhoneSession`. Renders a 64 px gold-bordered circle with a phone-handset SVG. In `in-call` state an `animate-ping` pulse layer plays. A text label sits below the button. The `aria-label` matches the label text for accessibility and test compatibility.

---

## Hooks (`hooks/`)

### `hooks/useAgentConfig.ts`
**Agent config state + persistence.** Reads `landline_agent_config` from `localStorage` on mount. If missing, opens edit mode immediately so the user is prompted to set up their property. Exports:

| Export | Type | Purpose |
|--------|------|---------|
| `config` | `AgentConfig` | Last saved config |
| `draft` | `AgentConfig` | In-progress edits |
| `isEditing` | `boolean` | Whether edit mode is open |
| `isLoaded` | `boolean` | False during SSR / initial hydration |
| `startEditing` | `() => void` | Open edit mode |
| `cancelEditing` | `() => void` | Discard draft, close edit mode |
| `save` | `() => void` | Persist draft to state + localStorage |
| `updateDraft` | `(field, value) => void` | Immutable draft field update |

### `hooks/usePhoneSession.ts`
**ElevenLabs session lifecycle.** Fetches a signed URL from `/api/elevenlabs/signed-url`, calls `Conversation.startSession({ signedUrl, dynamicVariables, clientTools })`, manages session state (`idle | connecting | in-call | ended`), and wires the `log_request` client tool to `POST /api/requests`. Returns `{ status, startCall, endCall, error }`.

`dynamicVariables` is forwarded straight to `Conversation.startSession`, so the ElevenLabs agent receives property context (name, address, coordinates) before the guest speaks their first word.

---

## Library (`lib/`)

### `lib/classifier.ts`
**Pure request classifier.** No I/O. Maps `(intent: string, summary: string) → ClassifierResult`:

```
answerable_qa      → { department: "concierge", requires_human: false }
defer_to_operator  → { department: "front_desk", requires_human: true }
physical_request   → keyword scan on summary → { department: "housekeeping" | "maintenance" | "room_service" | "front_desk", requires_human: true }
```

Throws `Error` on unknown intent. The `requires_human` field is always computed here, never trusted from the client.

### `lib/elevenlabs.ts`
**Signed-URL helper.** `import "server-only"` — cannot be imported in client components. `getSignedUrl()` POSTs to the ElevenLabs token endpoint with the `xi-api-key` header. Throws descriptively on missing `ELEVENLABS_API_KEY` or a non-2xx response.

### `lib/supabase.server.ts`
**Admin Supabase client.** `import "server-only"`. Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Throws on missing vars — no silent fallback. Use this client in API route handlers and server actions only.

### `lib/supabase.client.ts`
**Anon Supabase client.** Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Safe to import in client components. Throws on missing vars.

---

## Types (`types/`)

### `types/agent.ts`
**Shared TypeScript interfaces.**

```typescript
interface AgentConfig {
  name: string;         // Property display name
  address: string;      // Street address
  lat: string;          // Decimal latitude  (e.g. "40.7484")
  lng: string;          // Decimal longitude (e.g. "-73.9857")
  thumbnailUrl: string; // Base64 data URL or empty string
}

const EMPTY_CONFIG: AgentConfig  // all fields ""
```

Both `AgentConfigCard` and `PhoneButton` import from here. Tests use `EMPTY_CONFIG` as a prop default.

---

## Middleware (`middleware.ts`)
**Clerk route protection.** Uses `clerkMiddleware` + `createRouteMatcher`. Only `/dashboard` (and sub-paths) requires authentication. The guest page at `/` is fully public — no Clerk session needed to initiate a voice call.

---

## Tests (`__tests__/`)

All tests use **Jest** + **@testing-library/react** with jsdom. Run with `npm test`.

### `__tests__/acceptance/voice-agent-api.test.ts`
Acceptance tests for all 13 API acceptance criteria: correct HTTP codes, classifier routing, Supabase write behaviour, `requires_human` server authority, and error handling.

### `__tests__/acceptance/voice-agent-ui.test.tsx`
UI acceptance tests: button renders, state transitions (idle → connecting → in-call → ended), `Conversation.startSession` rejection, network-level fetch rejection, `dynamicVariables` forwarding.

### `__tests__/api/requests.test.ts`
Unit tests for `POST /api/requests`: field validation, classifier integration, Supabase write call, early return for `answerable_qa`.

### `__tests__/api/signed-url.test.ts`
Unit tests for `GET /api/elevenlabs/signed-url`: happy path, ElevenLabs error propagation, missing env var.

### `__tests__/components/PhoneButton.test.tsx`
Component tests: renders correct `aria-label`, label text transitions, error display.

### `__tests__/lib/classifier.test.ts`
Pure unit tests for `classifyRequest()`: all three intents, every physical_request keyword path, unknown-intent throw.

### `__mocks__/server-only.js`
Empty Jest stub. Prevents `import "server-only"` from throwing in the jsdom test environment.

---

## Python RAG Service (`rag-service/`)

Standalone FastAPI service. **Not yet wired into the Next.js classifier flow** — the integration point is documented in `rag-service/README.md`. Deploy independently; share only the Supabase connection.

### `rag-service/app/main.py`
FastAPI entry point. Two routes:
- `POST /rag/answer` — authenticated, runs the full RAG pipeline
- `GET /health` — unauthenticated liveness probe

### `rag-service/app/schemas.py`
Pydantic models: `AnswerRequest { query, property_id?, top_k? }`, `AnswerResponse { answer, sources, query_used }`, `Source { chunk_id, content, similarity }`.

### `rag-service/app/config.py`
`Settings` (Pydantic BaseSettings). Reads from environment:
- `ANTHROPIC_API_KEY`, `SUPABASE_DB_URL`, `RAG_SERVICE_API_KEY`
- Claude model names (configurable without code changes)
- Embedding model (`all-MiniLM-L6-v2`) and cross-encoder reranker model names

### `rag-service/app/auth.py`
API key authentication dependency. Validates `X-API-Key` header against `RAG_SERVICE_API_KEY`.

### `rag-service/app/pipeline/`
The RAG pipeline — each stage is a separate module:

| File | Role |
|------|------|
| `answer_service.py` | Orchestrates the four stages below |
| `query_rewrite.py` | Claude call to expand/clarify the raw guest query |
| `retrieval.py` | pgvector cosine similarity search against `rag_chunks` |
| `reranker.py` | Cross-encoder reranking of retrieved chunks |
| `generation.py` | Claude grounded-answer generation; requires citation |

### `rag-service/app/db/vectorstore.py`
pgvector connection pool. Uses `SUPABASE_DB_URL` (direct Postgres, not the REST API).

### `rag-service/app/ingestion/`
Offline pipeline for populating the vector store:

| File | Role |
|------|------|
| `chunker.py` | Splits markdown documents into overlapping chunks |
| `contextual_summary.py` | Claude call to generate a summary per chunk for richer embeddings |
| `embed_and_store.py` | Embeds chunks with SentenceTransformer; upserts to pgvector |
| `seed.py` | Entry point — reads `data/seed_docs/`, runs the full ingestion pipeline |

### `rag-service/app/data/seed_docs/`
Placeholder hotel knowledge base (Markdown files):
- `amenities.md`, `breakfast.md`, `checkout.md`, `policies.md`, `wifi.md`

Replace with real property content before production use.

### `rag-service/sql/001_create_rag_tables.sql`
DDL for the `rag_chunks` table with the `pgvector` extension and a cosine-similarity index. Run against the Supabase project once.

### `rag-service/tests/`
pytest suite for the RAG pipeline. Run with `pytest` inside `rag-service/`.

### `rag-service/requirements.txt`
Python dependencies: `fastapi`, `uvicorn`, `anthropic`, `supabase`, `sentence-transformers`, `psycopg2-binary`, `pgvector`, `pydantic-settings`, `python-dotenv`.

---

## Planning Docs (`docs/`)

| File | Contents |
|------|---------|
| `architecture.md` | High-level system design decisions |
| `clerk-setup.md` | Clerk authentication integration notes |
| `Implementation.md` | Feature implementation plan produced by the project-manager agent |
| `research.md` | Pre-implementation research (ElevenLabs, Supabase, Clerk APIs) |
| `sqlalchemy.md` | Notes on SQLAlchemy vs. Prisma decision |
| `overview.md` | This file |

---

## Environment Variables

### Next.js app (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key — server-only, never sent to client |
| `ELEVENLABS_AGENT_ID` | Yes | The Conversational AI agent ID |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — server-only |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same URL, exposed to client bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key — safe for client |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key — server-only |

### RAG service (`.env` inside `rag-service/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | For query rewriting and answer generation |
| `SUPABASE_DB_URL` | Yes | Direct Postgres URL (not the REST URL) |
| `RAG_SERVICE_API_KEY` | Yes | Bearer token for authenticating requests to this service |

---

## Development Commands

```bash
# Next.js app
npm run dev          # Start dev server on :3000
npm test             # Run all Jest tests
npx prisma migrate dev   # Run DB migrations (if Prisma is wired up)

# RAG service
cd rag-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Seed the vector store (run once after setting up Supabase)
python -m app.ingestion.seed

# RAG tests
pytest
```

---

## Data Flow — Guest Call End to End

```
1. Guest opens browser → page.tsx loads
2. useAgentConfig hydrates from localStorage
   └─ if no config → AgentConfigCard opens in edit mode
3. Guest clicks phone button
4. usePhoneSession POSTs to /api/elevenlabs/signed-url
   └─ lib/elevenlabs.ts → ElevenLabs token endpoint → signed URL
5. Conversation.startSession({ signedUrl, dynamicVariables })
   └─ dynamicVariables = { property_name, property_address, property_lat, property_lng }
6. WebRTC audio stream opens ↔ ElevenLabs agent
7. Agent processes speech, determines intent
8. Agent calls log_request client tool { intent, room_number, summary }
9. usePhoneSession POSTs to /api/requests
10. lib/classifier.ts → classifies intent → department + requires_human
    ├─ answerable_qa → returns result, no DB write
    └─ physical / defer → writes row to Supabase `requests`
11. Result returned to ElevenLabs agent → agent speaks response to guest
```

---

## Key Design Decisions

**Signed-URL pattern** — The ElevenLabs API key lives only in the server environment. The client fetches a short-lived signed URL; if it leaks it expires quickly and cannot be used to reconfigure the agent.

**`requires_human` is server-authoritative** — The ElevenLabs tool call schema includes `requires_human` so the agent can send it, but the route handler always discards it and recomputes from `classifyRequest()`. This prevents a client from falsely flagging or suppressing human escalation.

**`import "server-only"`** — `lib/elevenlabs.ts` and `lib/supabase.server.ts` both carry this guard. Next.js will throw a build error if either module is accidentally imported in a client component or page.

**localStorage for agent config** — The property config (name, address, coordinates, thumbnail) is stored client-side only. No backend persistence is needed for a single-property deployment. For multi-property SaaS, move config to a Supabase table behind Clerk authentication.

**RAG service is a separate process** — Embedding models and the cross-encoder reranker are too heavy for a serverless Next.js function. The Python service runs as a long-lived process and can be scaled independently from the web tier.
