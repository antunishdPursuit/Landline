# Demo Implementation Sequence

The local-only demo sequence is complete. Each step is implemented and covered
by focused tests, the full Jest suite, TypeScript checking, and production builds.

## 1. Normalize the domain — complete

- Departments are limited to `front_desk`, `housekeeping`, `room_service`, and `maintenance`.
- Ticket status is limited to `new`, `in_progress`, and `done`.
- `lib/classifier.ts` owns department and human-escalation decisions.

## 2. Create the browser demo store — complete

One versioned local record owns tickets, assignments, statuses, call logs, and
displayed travel recommendations. It seeds once, validates stored data,
recovers from invalid data, persists after refresh, and supports reset.

## 3. Complete the manual ticket path — complete

The manual fallback and staff dashboard share the browser store. Staff can pick
up and complete a request, and the state survives refresh in the same browser.

## 4. Add Tavily concierge search — complete

The server-only adapter returns bounded answers with source URLs. Missing
configuration, weak evidence, and upstream failures produce an explicit staff
escalation result instead of a guess.

## 5. Add Stay22 destinations — complete

The server route creates Allez Roam destinations from a validated location and
configured `aid`. The guest UI presents them as links to view stays and states
that no reservation was made.

## 6. Restore the complete ElevenLabs path — complete in code

Voice is the primary guest action, with the manual request as fallback. The
browser registers `log_request`, `search_concierge`, `find_stays`, and
`defer_to_staff`, passes property context through dynamic variables, and keeps
API keys server-only. The matching tool definitions must still be configured
in each ElevenLabs account; see [`elevenlabs-tools.md`](elevenlabs-tools.md).

## 7. Add representative call history — complete

The browser stores session ID, duration, transcript text, and the last verified
tool outcome. It does not store audio or add recording webhooks, production
persistence, or cross-device synchronization.

## Verification baseline

- The project installs, tests, and builds without Supabase, Python, pgvector, or Anthropic.
- Clerk roles control staff identity and dashboard access.
- Manual requests complete the same-browser ticket workflow after refresh.
- ElevenLabs client tools use server routes and never receive raw API keys.
- Tavily answers require sources and fail safely.
- Stay22 returns tracked destinations and never claims to book directly.
- Optional vendor failures leave the manual demo usable.
