# Landline Contributor Overview

Landline is a single-browser hotel voice-agent demo. ElevenLabs runs the guest
conversation, Clerk protects staff screens, and the browser holds demo data.
Tavily and Stay22 are planned external tools for current concierge information
and accommodation links.

The authoritative system boundaries and failure rules are in
[`architecture.md`](architecture.md). This file describes the current source
tree after removal of the production database and Python retrieval service.

## Runtime

| Area | Technology | Responsibility |
|---|---|---|
| Web application | Next.js 14, React, TypeScript | Guest and staff UI plus server-only vendor routes |
| Authentication | Clerk | Staff sign-in, display name, and role |
| Voice | ElevenLabs Agents | WebRTC conversation and browser client tools |
| Demo state | React state and browser storage | Same-browser tickets and presentation data |
| Current information | Tavily, planned | Source-backed concierge web search |
| Accommodation links | Stay22, planned | Tracked destinations for viewing stays |

There is no shared database, realtime server, Python service, or production
call-log store.

## Current source areas

### Guest experience

- `app/page.tsx` renders the property configuration and current demo request.
- `components/PhoneButton.tsx` contains the ElevenLabs call control UI.
- `components/DemoRequestButton.tsx` provides the same-browser fallback path.
- `hooks/useAgentConfig.ts` persists property configuration locally.
- `hooks/usePhoneSession.ts` owns the browser conversation lifecycle and client tools.

### Server routes

- `app/api/elevenlabs/signed-url/route.ts` returns a short-lived conversation URL.
- `app/api/requests/route.ts` validates, classifies, and normalizes tool payloads.
  It does not persist tickets.

### Staff experience

- `app/dashboard/page.tsx` renders department or manager ticket views.
- `app/dashboard/calls/page.tsx` renders representative demo call data.
- `app/dashboard/team/page.tsx` renders the static demo staff roster.
- `lib/useRequests.ts`, `lib/useCallLogs.ts`, and `lib/useStaffRoster.ts` expose
  current demo read models. A single versioned local store is the next planned
  state change.

### Rules and identity

- `lib/classifier.ts` owns department and human-escalation decisions.
- `lib/auth.ts` reads Clerk identity and `publicMetadata.role`.
- `lib/types.ts` contains the shared demo domain types.
- `middleware.ts` protects `/dashboard` and its child routes.

## Current limitations

- The manual request and ticket status flows do not yet share one persistent store.
- The voice button is not currently the primary guest-page action.
- Tavily and Stay22 adapters are not implemented yet.
- Call logs and staff presence are representative demo content.
- State does not synchronize across browsers or devices.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Environment variables

Core:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Planned vendor features:

- `TAVILY_API_KEY`
- `STAY22_AID`

Use `.env.example` as the local template. Never prefix a vendor secret with
`NEXT_PUBLIC_`.

## Contribution rule

Implement one independently testable path at a time. Preserve the ownership in
`architecture.md`: Clerk owns identity, the classifier owns routing, the
browser store owns demo state, and server routes own vendor secrets.
