# Demo Implementation Sequence

The project is intentionally not a production or multi-user system. Follow
this sequence after the legacy backend cleanup.

## 1. Normalize the domain

- Use only `front_desk`, `housekeeping`, `room_service`, and `maintenance`.
- Use only `new`, `in_progress`, and `done` for ticket status.
- Keep department and human-escalation decisions in `lib/classifier.ts`.
- Update tests before adding persistence or vendors.

## 2. Create the browser demo store

Add one versioned local record that owns tickets, assignments, statuses, demo
call logs, and displayed travel recommendations. It must seed once, validate
stored data, recover safely, persist after refresh, and support an explicit
reset.

## 3. Complete the manual ticket path

Connect the demo request and dashboard to the shared store. Verify that a Clerk
staff member can pick up and complete a request and that the state survives a
refresh.

## 4. Add Tavily concierge search

Create a server-only adapter with bounded results and source URLs. Use it only
for facts that can change. Missing configuration, weak evidence, and upstream
failure must offer human escalation.

## 5. Add Stay22 destinations

Begin with an Allez destination generated from a validated location and the
configured partner identifier. Present it as a link to view stays; never claim
that Landline made a reservation or persist live inventory.

## 6. Restore the complete ElevenLabs path

Make the voice control the primary guest action and keep the manual request as
a fallback. Configure focused tools for request logging, concierge search,
stay discovery, and staff deferral. Pass property context through dynamic
variables and keep all vendor keys server-only.

## 7. Add representative call history

Store only the data needed for the demo. Do not build production recording,
webhook persistence, or cross-device synchronization.

## Verification after every step

- Run the focused tests.
- Run the complete Jest suite.
- Run a production build.
- Confirm that no vendor secret is included in a browser response or bundle.
- Confirm that the manual demo still works when optional vendor keys are absent.
