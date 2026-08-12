# Landline

A single-browser hotel voice-agent demo. Guests speak with an ElevenLabs agent,
the app routes requests, and Clerk-authenticated staff handle local tickets.
Tavily supplies current local information, and Stay22 supplies live
accommodation options and booking deeplinks.

Landline began at Checkout — The Travel & Hospitality Hackathon and now
continues as an independent active project.

**Source:** [Moises-ITS/Landline](https://github.com/Moises-ITS/Landline)

Landline is intentionally a demo, not a live multi-user service. It uses one
versioned browser store instead of a shared database.

**Demo:** [landline-eta.vercel.app](https://landline-eta.vercel.app)

## Try the demo

1. Open the demo in current desktop Chrome or Safari, or mobile Safari.
2. Use the dedicated demo username and password shown on the sign-in page.
3. Open the guest room, approach the bedside devices, and use the phone or the
   panel phone button.
4. Follow one of the displayed test scripts. Calls have a 60-second limit and
   begin closing after 55 seconds.
5. After the call, review the browser-local transcript and any ending issue in
   Agent Calls.

Slack and other embedded browsers can block Clerk authentication. Use their
**Open in Browser** action and continue in Safari or Chrome. Demo data remains
in the browser that created it and does not synchronize to another browser or
device.

## Current architecture

```text
Guest browser ──signed session──▶ ElevenLabs agent
      │                                  │
      │                                  ├── log_request / defer_to_staff
      │                                  ├── search_concierge ──▶ Tavily route
      │                                  └── find_stays ────────▶ Stay22 route
      │
      └──────────────┬───────────────────────────────────────────┘
                     ▼
             browser demo state
               │             │
               ▼             ▼
       vendor results     Clerk-gated dashboard
```

| System | Responsibility |
|---|---|
| Clerk | Staff sign-in, name, and role |
| ElevenLabs | Voice conversation and tool selection |
| Browser store | Same-browser tickets, calls, assignments, statuses, and returned vendor metadata |
| Next.js routes | Secret handling, validation, classification, and vendor adapters |
| Tavily | Source-backed current concierge information |
| Stay22 | Live accommodation results, full-stay prices, and booking deeplinks |

There is no Supabase database, Python service, pgvector store, or production
realtime backend.

## Requirements

- Node.js 20.19+ or 22.13+
- A Clerk application
- An ElevenLabs account and configured agent
- A Tavily API key for live current-information search

Stay22 demo mode requires no API key and permits five requests per minute per
IP address. Seed dashboard data remains usable when an optional vendor is
unavailable.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set the values used by the features you want to demonstrate:

| Variable | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | Requests a short-lived signed conversation URL server-side |
| `ELEVENLABS_AGENT_ID` | Selects the configured voice agent |
| `CLERK_SECRET_KEY` | Clerk server authentication |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser configuration |
| `NEXT_PUBLIC_DEMO_USERNAME` | Public demo-only username shown on the sign-in page |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Public demo-only password shown on the sign-in page; never reuse it elsewhere |
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

Dates use `YYYY-MM-DD`. Landline makes one Stay22 request after confirmation,
retrieves five hotel candidates, and ranks them locally using review strength,
distance, rating, review volume, and price. If the search location names the
current hotel, Landline removes that hotel before ranking alternatives. The
agent recommends one hotel and retains the remaining results as backups without
another API call. Prices are full-stay totals in USD. The agent must say that
prices and availability can change and that no reservation was made.
See the [Stay22 Direct Travel API quickstart](https://dev.stay22.com/docs/api/quickstart).

Configure the ElevenLabs agent with a 60-second maximum conversation duration,
a short closing message, and the End Conversation system tool. The browser asks
the agent to close at 55 seconds and ends the session at 60 seconds if needed.

For a public Vercel deployment, add a WAF rate-limit rule for
`GET /api/elevenlabs/signed-url`: two requests per IP address in a fixed
10-minute window, with a `429` response when exceeded. Landline does not store
or count IP addresses. The production host must enforce this limit.

## Commands

```bash
npm run dev
npm test
npm run build
```

## Current limitations

- Demo state does not synchronize between browsers or devices.
- Landline stores call metadata and transcripts in the current browser; it does
  not store call audio. ElevenLabs retention follows the agent and account
  configuration.
- Staff presence is representative demo content.
- The ElevenLabs tool definitions and agent prompt must be configured in the ElevenLabs dashboard.
- Stay22 demo mode is limited to five requests per minute per IP address.
- Landline displays Stay22 results and deeplinks but never makes reservations.

## Repository layout

```text
app/          Next.js pages and route handlers
components/   Guest and staff UI
hooks/        ElevenLabs session lifecycle
lib/          Classification, browser store, integrations, and read models
__tests__/    Jest unit and acceptance tests
```
