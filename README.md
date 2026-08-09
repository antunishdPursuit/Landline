# Landline

A single-browser hotel voice-agent demo. Guests speak with an ElevenLabs agent
or submit a manual request, the app routes the request, and Clerk-authenticated
staff pick it up on a local dashboard. Tavily concierge search and Stay22
accommodation links are the next planned integrations.

Landline is intentionally a demo, not a live multi-user service. It uses
same-browser state instead of a shared database. See
[`docs/architecture.md`](docs/architecture.md) for the system boundaries and
[`docs/Implementation.md`](docs/Implementation.md) for the implementation
sequence.

## Current architecture

```
Guest browser ──WebRTC──▶ ElevenLabs agent
      │                         │
      │                         └── client tool: log_request
      ▼
manual demo request      POST /api/requests
      │                         │ validate + classify
      └──────────────┬──────────┘
                     ▼
             browser demo state
                     │
                     ▼
       Clerk-gated staff dashboard
```

Responsibilities:

| System | Responsibility |
|---|---|
| Clerk | Staff sign-in, name, and role |
| ElevenLabs | Voice conversation and tool selection |
| Browser | Same-browser tickets, assignments, statuses, and demo data |
| Next.js routes | Secret handling, validation, classification, and vendor adapters |
| Tavily | Planned source-backed current concierge information |
| Stay22 | Planned accommodation destinations and tracked links |

There is no Supabase database, Python service, pgvector store, or production
realtime backend.

## Requirements

- Node.js 18+
- A Clerk application
- An ElevenLabs account and agent

Planned feature credentials:

- Tavily API key
- Stay22 affiliate ID (`aid`)

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the core values in `.env.local`:

| Variable | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | Requests a short-lived conversation token server-side |
| `ELEVENLABS_AGENT_ID` | Selects the configured voice agent |
| `CLERK_SECRET_KEY` | Clerk server authentication |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser configuration |

Optional future features use `TAVILY_API_KEY` and `STAY22_AID`.

Guest page: `http://localhost:3000/`

Staff dashboard: `http://localhost:3000/dashboard`

Assign each Clerk staff user a `publicMetadata.role` value:

- `front_desk`
- `housekeeping`
- `room_service`
- `maintenance`
- `manager`

Managers see all dashboard views. Department staff see only their assigned
department. A signed-in user without a supported role sees the contact-admin
state.

## Commands

```bash
npm run dev
npm test
npm run build
```

## Current limitations

- Demo state does not synchronize between browsers or devices.
- Ticket persistence is being consolidated into one versioned browser store.
- Tavily and Stay22 adapters are planned but not implemented.
- Call history and staff presence are representative demo content.
- The manual request remains the reliable fallback when voice configuration is unavailable.

## Repository layout

```
app/          Next.js pages and route handlers
components/   Guest and staff UI
hooks/        Browser configuration and ElevenLabs session lifecycle
lib/          Classification, Clerk helpers, types, and demo read models
__tests__/    Jest unit and acceptance tests
docs/         Architecture and implementation guidance
```

