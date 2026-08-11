# Landline

A single-browser hotel voice-agent demo. Guests speak with an ElevenLabs agent
or submit a manual request, the app routes requests, and Clerk-authenticated
staff handle local tickets. Tavily supplies source-backed current information,
and Stay22 supplies live accommodation options and booking deeplinks.

Landline began at Checkout — The Travel & Hospitality Hackathon and now
continues as an independent active project.

**Source:** [Moises-ITS/Landline](https://github.com/Moises-ITS/Landline)

Landline is intentionally a demo, not a live multi-user service. It uses one
versioned browser store instead of a shared database.

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
| Stay22 | Live accommodation results, full-stay prices, and booking deeplinks |

There is no Supabase database, Python service, pgvector store, or production
realtime backend.

## Requirements

- Node.js 18+
- A Clerk application
- An ElevenLabs account and configured agent
- A Tavily API key for live current-information search

Stay22 demo mode requires no API key and permits five requests per minute per
IP address. The manual request and local dashboard still work when an optional
vendor is unavailable.

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
| `STAY22_API_BASE_URL` | Stay22 no-key accommodations endpoint; use `https://api.stay22.com/v2/accommodations` |

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

Configure these case-sensitive ElevenLabs client tools and enable waiting for
each client response:

- `log_request`: physical hotel requests.
- `search_concierge`: current local information through Tavily.
- `find_stays`: Stay22 accommodation searches.
- `defer_to_staff`: requests that need a person.

`find_stays` must collect and confirm every field before it runs:

```json
{
  "address": "SoHo, New York",
  "checkin": "2026-09-12",
  "checkout": "2026-09-15",
  "adults": 2,
  "children": 0,
  "rooms": 1
}
```

Dates use `YYYY-MM-DD`. Landline requests at most three results and returns
full-stay totals in USD. The agent may describe only returned options and must
say that prices and availability can change and that no reservation was made.
See the [Stay22 Direct Travel API quickstart](https://dev.stay22.com/docs/api/quickstart).

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
- Stay22 demo mode is limited to five requests per minute per IP address.
- Landline displays Stay22 results and deeplinks but never makes reservations.

## Repository layout

```text
app/          Next.js pages and route handlers
components/   Guest and staff UI
hooks/        Browser configuration and ElevenLabs session lifecycle
lib/          Classification, browser store, integrations, and read models
__tests__/    Jest unit and acceptance tests
```
