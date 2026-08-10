# Landline Contributor Overview

Landline is a single-browser hotel voice-agent demo. ElevenLabs runs the guest
conversation, Clerk protects staff screens, and one versioned browser store
holds demo data. Tavily and Stay22 provide current information and tracked stay
destinations through server-owned routes.

The authoritative system boundaries and failure rules are in
[`architecture.md`](architecture.md). The completed implementation sequence is
in [`Implementation.md`](Implementation.md). The approved in-room visual flow
and interaction boundaries are in
[`guest-experience.md`](guest-experience.md).

## Runtime

| Area | Technology | Responsibility |
|---|---|---|
| Web application | Next.js 14, React, TypeScript | Guest and staff UI plus server-only vendor routes |
| Authentication | Clerk | Staff sign-in, display name, and role |
| Voice | ElevenLabs Agents | Signed browser conversation and client tools |
| Demo state | Versioned browser storage | Same-browser tickets, calls, and displayed links |
| Current information | Tavily | Bounded, source-backed concierge web search |
| Accommodation links | Stay22 Allez | Tracked destinations for viewing stays |

There is no shared database, realtime server, Python service, or production
call-log store.

## Current source areas

### Guest experience

- `app/page.tsx` provides the fixed full-viewport guest shell.
- `components/GuestRoomExperience.tsx` owns the View 1/View 2 transition and
  connects both bedside phone actions to one voice session.
- `components/HotelRoomOverview.tsx` renders the responsive room scene and its
  accessible bedside approach hotspot.
- `components/BedsideCloseup.tsx` renders the physical phone, hotel-details
  panel, disabled demonstration controls, and enabled panel phone control.
- `components/DemoRequestButton.tsx` provides the same-browser fallback path.
- `components/TravelRecommendations.tsx` presents Tavily sources and Stay22 links.
- `hooks/usePhoneSession.ts` owns the browser conversation lifecycle and local call capture.

### Server routes

- `app/api/elevenlabs/signed-url/route.ts` returns a short-lived conversation URL.
- `app/api/requests/route.ts` validates, classifies, and normalizes tool payloads.
- `app/api/concierge/search/route.ts` returns source-backed Tavily answers.
- `app/api/stays/route.ts` returns validated Stay22 Allez destinations.

Routes do not persist demo data. The browser validates and saves normalized
results through `lib/demo-store.ts`.

### Staff experience

- `app/dashboard/page.tsx` renders department or manager ticket views.
- `app/dashboard/calls/page.tsx` renders seeded examples and local voice sessions.
- `app/dashboard/team/page.tsx` renders the static demo staff roster.
- `lib/useRequests.ts`, `lib/useCallLogs.ts`, and `lib/useStaffRoster.ts` expose
  browser-store read models.

### Rules and identity

- `lib/classifier.ts` owns department and human-escalation decisions.
- `lib/auth.ts` reads Clerk identity and `publicMetadata.role`.
- `lib/voice-tools.ts` connects case-sensitive ElevenLabs tools to server routes
  and the browser store.
- `middleware.ts` protects `/dashboard` and its child routes.

## Intentional limitations

- State does not synchronize across browsers or devices.
- Call history stores local metadata and transcript text, not audio.
- Staff presence remains representative demo content.
- ElevenLabs agent tool definitions remain external account configuration.
- Stay22 links open an external search; Landline does not book rooms.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Environment variables

Core voice and authentication:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Vendor integrations:

- `TAVILY_API_KEY`
- `STAY22_AID`

Use `.env.example` as the local template. Never prefix an API secret with
`NEXT_PUBLIC_`. A Stay22 `aid` is included in the tracked destination by design.

## Contribution rule

Implement one independently testable path at a time. Preserve the ownership in
`architecture.md`: Clerk owns identity, the classifier owns routing, the
browser store owns demo state, and server routes own vendor configuration.
