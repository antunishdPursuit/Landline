# Landline

[Try Landline live](https://landline-eta.vercel.app)

Landline is an in-room hotel concierge demo. A guest approaches a bedside
phone and control panel, speaks with an ElevenLabs agent, and then reviews the
resulting request or transcript in a Clerk-protected staff dashboard.

The agent can route physical hotel requests, use Tavily for current local
information, and use Stay22 for accommodation options. The demo uses
tab-scoped browser storage instead of a shared production database.

## Demo Flow

1. Open Landline in current desktop Chrome or Safari, or mobile Safari.
2. Follow the **Call room service. Pick one.** prompt to the bedside view.
3. Select the phone or the panel's Phone button.
4. Follow one of the displayed test scripts. The agent identifies the
   experience as a demo before giving the hotel and room greeting.
5. Complete the call within 60 seconds. The agent receives a closing
   instruction after 55 seconds.
6. Review the completion message over the phone and panel, then select
   **Continue**.
7. Sign in with the dedicated demo credentials when prompted.
8. Review the automatically opened Agent Calls entry, its tab-scoped
   transcript, and any ending issue.

Slack and other embedded browsers can block the cookies Clerk needs for
authentication. Use **Open in Browser** and continue in Safari or Chrome.

## What Landline Does

- Presents a responsive SVG hotel-room view and bedside close-up.
- Guides guests to the synchronized phone and panel call controls.
- Starts the same ElevenLabs flow from the phone or panel phone button.
- Prevents the phone and panel from starting overlapping calls.
- Opens the staff dashboard directly from the bedside panel without requiring
  a call.
- Routes physical requests to a department-aware staff request board.
- Uses Tavily for current nearby businesses, hours, events, and transportation.
- Uses Stay22 for confirmed accommodation searches and booking deeplinks.
- Explains completed calls and failed starts before authentication.
- Records tab-scoped call metadata, transcripts, and ending issues without
  storing call audio in Landline.
- Opens the matching transcript after a completed call.
- Protects the staff dashboard with Clerk roles.

## Project Lineage

Landline began at Checkout — The Travel & Hospitality Hackathon. This
repository is the independent active project used for the current demo,
security work, interface, and integrations.

**Repository:** [antunishdPursuit/Landline](https://github.com/antunishdPursuit/Landline)

## How It Works

```text
Guest browser ──signed session──▶ ElevenLabs agent
      │                                  │
      │                                  ├── log_request / defer_to_staff
      │                                  ├── search_concierge ──▶ Tavily route
      │                                  └── find_stays ────────▶ Stay22 route
      │
      └──────────────┬───────────────────────────────────────────┘
                     ▼
            tab-scoped demo state
               │             │
               ▼             ▼
       vendor results     Clerk-gated dashboard
```

There is no Supabase database, Python service, pgvector store, or production
realtime backend. The session store contains the current tab's tickets,
calls, assignments, statuses, and returned vendor metadata.

## Technology

| Area | Implementation |
| --- | --- |
| Application | Next.js 16, React 18, TypeScript |
| Interface | Tailwind CSS and responsive SVG scenes |
| Authentication | Clerk |
| Voice agent | ElevenLabs Agents |
| Current local information | Tavily |
| Accommodation search | Stay22 Direct Travel API |
| Demo persistence | Versioned browser session storage |
| Hosting | Vercel |
| Testing | Jest and Testing Library |

## Run Locally

### Requirements

- Node.js 22.13–22.x; Node 22.23.2 is the tested version
- A Clerk application
- An ElevenLabs account and configured agent
- A Tavily API key for live current-information search

Stay22 demo mode requires no API key and permits five requests per minute per
IP address.

### Install and start

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

Open the guest experience at [http://localhost:3000](http://localhost:3000)
and the staff dashboard at
[http://localhost:3000/dashboard](http://localhost:3000/dashboard).

Set the environment values used by the features you want to test:

| Variable | Purpose |
| --- | --- |
| `ELEVENLABS_API_KEY` | Requests a short-lived signed conversation URL server-side |
| `ELEVENLABS_AGENT_ID` | Selects the configured voice agent |
| `CLERK_SECRET_KEY` | Clerk server authentication |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser configuration |
| `NEXT_PUBLIC_DEMO_USERNAME` | Demo-only username shown on the sign-in page |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Demo-only password shown on the sign-in page; never reuse it elsewhere |
| `TAVILY_API_KEY` | Server-side current-information search |
| `STAY22_API_BASE_URL` | Stay22 no-key endpoint; use `https://api.stay22.com/v2/accommodations` |

Do not commit `.env` or use the public demo password for another account.

## Configure Integrations

### Clerk

Assign each staff user one supported `publicMetadata.role` value:

- `front_desk`
- `housekeeping`
- `room_service`
- `maintenance`
- `manager`

Managers see every dashboard view. Department staff see only their assigned
department. A signed-in user without a supported role sees the contact-admin
state.

### ElevenLabs

Configure these case-sensitive client tools and wait for every client result:

- `log_request` for physical hotel requests
- `search_concierge` for current local information through Tavily
- `find_stays` for Stay22 accommodation searches
- `defer_to_staff` for requests that require a person

Use these agent settings for the public demo:

- Enable authentication so Landline must request a short-lived signed URL.
- Set the maximum conversation duration to 60 seconds.
- Keep the client maximum-duration override disabled.
- Configure a short closing message and the End Conversation system tool.
- Disable file attachments and call-audio storage.
- Set the concurrent call limit to seven and keep bursting disabled.

Landline sends each client-tool request with a separate short-lived token. The
Tavily, Stay22, staff-request, and conversation-detail routes reject direct
requests without that token.

### Stay22

Before `find_stays` runs, the agent must collect, repeat, and confirm every
field:

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

Dates use `YYYY-MM-DD`. Landline makes one Stay22 request, retains five
candidates, and ranks them locally using review strength, distance, rating,
review volume, and price. The agent recommends one option and keeps the other
results as backups without making another request.

Prices are full-stay totals in USD. The agent must state that prices and
availability can change and that no reservation was made. See the
[Stay22 Direct Travel API quickstart](https://dev.stay22.com/docs/api/quickstart).

## Deployment

The public demo runs on Vercel with Clerk development credentials and synthetic
hotel data. Add the variables from `.env.example` to the Vercel project before
deploying.

Configure a Vercel WAF rate-limit rule for
`GET /api/elevenlabs/signed-url`: allow two requests per IP address in a fixed
10-minute window and return `429` for the third request. Landline does not store
or count IP addresses.

## Verification

```bash
npm run lint
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --incremental false
npm test
npm run build
npm audit --omit=dev
```

Provider-dependent ElevenLabs, Tavily, and Stay22 behavior requires valid
configuration and must be tested separately from the automated suite.

## Current Limits

- Landline is a controlled demo, not a live hotel service.
- Demo state does not synchronize between tabs, browsers, or devices.
- A shared demo login does not create shared call or request data.
- Call metadata and transcripts remain in the current tab and are removed when
  that tab closes. Landline does not store call audio; provider transcript
  retention follows the ElevenLabs account configuration.
- Calls have a 60-second maximum and no voice fallback when ElevenLabs is
  unavailable.
- Staff presence is representative demo content.
- Tavily results can contain a generated claim that is not fully supported by
  the linked sources.
- Stay22 demo mode is limited to five requests per minute per IP address.
- Landline displays accommodation results and deeplinks but never makes a
  reservation or accepts payment.
- The ElevenLabs tool definitions and agent prompt must be configured in the
  ElevenLabs dashboard.

## Status

Landline is feature-complete for its current public-demo scope. Automated
checks pass, the Vercel deployment is available, and the remaining release work
is limited to final manual browser, call, and rate-limit checks.
