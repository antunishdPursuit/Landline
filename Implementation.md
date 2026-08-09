# Pipeline & flow

1. **Guest opens the web widget** → clicks "pick up phone" → mic access requested → connects to the ElevenLabs Conversational AI agent via a signed WebSocket URL (fetched from your API, not exposed client-side).

2. **Live conversation** runs entirely through ElevenLabs — STT, turn-taking, TTS. As the agent identifies a completed request, it fires a client tool call (`log_request`) — this is ElevenLabs' function-calling mechanism, defined in the agent config with the JSON schema from the agent prompt.

3. **Tool call → your API.** The client tool POSTs to `/api/requests` with:
   ```json
   {
     "intent": "answerable_qa | defer_to_operator | physical_request",
     "room_number": "string",
     "summary": "string",
     "urgency": "low | medium | high",
     "language_detected": "string",
     "requires_human": "boolean"
   }
   ```

4. **Your API branches on `intent`:**
   - `answerable_qa` → nothing written, call ends normally (answer already spoken by the agent using its knowledge base/RAG context — no ticket needed)
   - `defer_to_operator` → insert row with `requires_human = true`, `department = front_desk`
   - `physical_request` → insert row with the mapped department (`housekeeping` / `room_service` / `maintenance` / `front_desk`)

5. **Insert → Supabase Realtime** broadcasts the change automatically (table is in the `supabase_realtime` publication) — no polling anywhere.

6. **Dashboard** is subscribed via `supabase.channel('requests').on('postgres_changes', ...)`, filtered/grouped client-side by department. New rows animate in live — this is your demo's core visual moment.

7. **Multilingual support** is computed at step 4, not step 2 — one Claude call on the transcript (or the ElevenLabs-provided partial transcript) doing translation-to-English in the same structured-output pass, so staff always see English summaries regardless of call language.

## Implementation direction — the one big simplification

Given a 3-4 person team and one day, collapse the separate Fastify backend into **Next.js API routes** (App Router route handlers). There's no real reason to run two services here — `/app/api/requests/route.ts` can validate, call Claude, and write to Supabase directly. One repo, one Vercel deploy, everyone working in the same language and framework instead of context-switching between a Node backend and a Next frontend. This also removes an entire deploy target that could fail during the demo.

If someone on the team is much stronger in Python and wants to own classification independently, that's the one case worth carving out a separate FastAPI service for — otherwise, stay unified.

## Tools & languages

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 14 (App Router), TypeScript | One stack, one deploy, matches existing skillset |
| Voice | ElevenLabs Conversational AI, JS/React client SDK | Core prize requirement, handles STT/TTS/turn-taking |
| Classification/translation | Anthropic Claude API, structured JSON output | Same call does translation + urgency classification |
| DB + Realtime | Supabase (Postgres + Realtime) | No websocket server to build yourself |
| Auth | Clerk | Minimal setup, hosted sign-in UI |
| Styling | Tailwind | Matches existing stack |
| Hosting | Vercel (app) + Supabase Cloud (data) | Zero-config deploy, good for demo-day reliability |

Skip BullMQ/queues entirely — direct inserts are fine at hackathon call volume, and a queue adds a failure point with no demo-visible benefit.

## Schema

One `requests` table keeps the realtime subscription simple (one channel, one filter by department) rather than splitting tickets across multiple tables.

```sql
create type department as enum ('housekeeping','room_service','maintenance','front_desk');
create type intent_type as enum ('answerable_qa','defer_to_operator','physical_request');
create type urgency_level as enum ('low','medium','high');
create type request_status as enum ('new','in_progress','done');

create table rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text unique not null,
  language_pref text default 'en',
  created_at timestamptz default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  room_number text not null,
  intent intent_type not null,
  department department,              -- null for answerable_qa
  summary text not null,
  urgency urgency_level default 'low',
  language_detected text default 'en',
  status request_status default 'new',
  requires_human boolean default false, -- true for defer_to_operator
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table call_logs (
  id uuid primary key default gen_random_uuid(),
  room_number text,
  transcript text,
  request_id uuid references requests(id),
  created_at timestamptz default now()
);

alter publication supabase_realtime add table requests;
```

`requires_human` is what lets the dashboard visually distinguish "needs a live human pickup right now" (deferred questions) from a normal queued ticket, without needing a separate table or status enum for it.

**RLS:** staff (authenticated via Clerk, verified through a Supabase JWT template) get read access to all rows; inserts happen only via the service-role key from your API route, never from the client — keeps the write path locked down without needing per-room policies.