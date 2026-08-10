# Landline

A single-browser hotel voice-agent demo. Guests speak with an ElevenLabs agent
or submit a manual request, the app routes requests, and Clerk-authenticated
staff handle local tickets. Tavily supplies source-backed current information,
and Stay22 supplies tracked links for viewing stays.

**Origin:** [Checkout — The Travel & Hospitality Hackathon](../../Hackathons/Checkout%20Travel%20Hack%20NYC/FINAL_CLOSEOUT.md)

**Status:** Active post-event continuation. The best available reference for
the judged source is shared commit `0c2937c`. Later commits are post-event work
and must not be described as part of the judged build.

**Source:** [Moises-ITS/Landline](https://github.com/Moises-ITS/Landline)

Landline is intentionally a demo, not a live multi-user service. It uses one
versioned browser store instead of a shared database. See
[`docs/architecture.md`](docs/architecture.md) for system boundaries,
[`docs/Implementation.md`](docs/Implementation.md) for the completed sequence,
and [`docs/elevenlabs-tools.md`](docs/elevenlabs-tools.md) for agent setup.

## Current architecture

```text
Guest browser ──signed session──▶ ElevenLabs agent
      │                                  │
      │                                  ├── log_request / defer_to_staff
      │                                  ├── search_concierge ──▶ Tavily route
      │                                  └── find_stays ────────▶ Stay22 route
      │
      ├── manual fallback
      └──────────────┬───────────────────────────────────────────┘
                     ▼
             browser demo state
               │             │
               ▼             ▼
     guest source links   Clerk-gated dashboard
```

| System | Responsibility |
|---|---|
| Clerk | Staff sign-in, name, and role |
| ElevenLabs | Voice conversation and tool selection |
| Browser store | Same-browser tickets, calls, assignments, statuses, and displayed links |
| Next.js routes | Secret handling, validation, classification, and vendor adapters |
| Tavily | Source-backed current concierge information |
| Stay22 | Tracked accommodation-search destinations |

There is no Supabase database, Python service, pgvector store, or production
realtime backend.

## Requirements

- Node.js 18+
- A Clerk application
- An ElevenLabs account and configured agent
- A Tavily API key for live current-information search
- A Stay22 affiliate ID (`aid`) for tracked stay links

The manual request and local dashboard still work when optional vendor
configuration is absent.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the values used by the features you want to demonstrate:

| Variable | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | Requests a short-lived signed conversation URL server-side |
| `ELEVENLABS_AGENT_ID` | Selects the configured voice agent |
| `CLERK_SECRET_KEY` | Clerk server authentication |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser configuration |
| `TAVILY_API_KEY` | Server-side current-information search |
| `STAY22_AID` | Generates tracked Stay22 Allez destinations |

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

Configure the four case-sensitive ElevenLabs client tools described in
[`docs/elevenlabs-tools.md`](docs/elevenlabs-tools.md). Tool responses must be
enabled so the agent waits for and uses each result.

## Commands

```bash
npm run dev
npm test
npm run build
```

## Current limitations

- Demo state does not synchronize between browsers or devices.
- Voice calls and call transcripts remain local browser metadata; audio is not stored.
- Staff presence is representative demo content.
- The ElevenLabs tool definitions and agent prompt must be configured in the ElevenLabs dashboard.
- Landline provides external Stay22 search links and never makes reservations.

## Repository layout

```text
app/          Next.js pages and route handlers
components/   Guest and staff UI
hooks/        Browser configuration and ElevenLabs session lifecycle
lib/          Classification, browser store, integrations, and read models
__tests__/    Jest unit and acceptance tests
docs/         Architecture, implementation, and vendor setup guidance
```
