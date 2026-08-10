# ElevenLabs Agent Setup

Landline registers four case-sensitive client tools when a signed conversation
starts. Create matching **Client** tools in the ElevenLabs agent dashboard. For
each tool, enable the option that waits for the client response so the agent can
use the returned result.

ElevenLabs requires client tool names and parameter identifiers to match the
registered code exactly. See the official
[client tools documentation](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools).

## Tools

### `log_request`

Use for a physical hotel request that staff must perform.

| Parameter | Type | Required | Values or purpose |
|---|---|---:|---|
| `intent` | string | yes | `physical_request` or `defer_to_operator` |
| `room_number` | string | yes | Guest room identifier |
| `summary` | string | yes | Short actionable request |
| `urgency` | string | no | `low`, `medium`, or `high` |
| `language_detected` | string | no | Short language code; defaults to `en` |

The server recomputes department and human escalation. Do not add tool
parameters that attempt to override those decisions.

### `search_concierge`

Use only for facts that can change, such as current hours, nearby businesses,
events, or transportation information.

| Parameter | Type | Required | Purpose |
|---|---|---:|---|
| `query` | string | yes | The current-information question |
| `location` | string | no | Property or nearby location context |

When the result is `needs_staff`, do not guess. Offer staff help and use
`defer_to_staff` if the guest accepts.

### `find_stays`

Use when the guest wants an accommodation-search link.

| Parameter | Type | Required | Purpose |
|---|---|---:|---|
| `destination` | string | yes | Hotel, neighborhood, city, or address |

Describe the result as a link to view stays. Never say that Landline booked or
reserved accommodation. When the result is `unavailable`, do not invent a URL.

### `defer_to_staff`

Use when the guest requests a person or a tool cannot answer safely.

| Parameter | Type | Required | Purpose |
|---|---|---:|---|
| `room_number` | string | yes | Guest room identifier |
| `summary` | string | yes | Why staff help is needed |
| `urgency` | string | no | `low`, `medium`, or `high` |
| `language_detected` | string | no | Short language code; defaults to `en` |

The browser forces this path to `defer_to_operator`; a caller cannot downgrade
the human-escalation decision.

## Dynamic variables

Landline sends these values when the conversation starts:

- `property_name`
- `property_address`
- `property_lat`
- `property_lng`
- `room_number`

Use them in the agent prompt for property and room context. Hotel-specific
policies should remain deterministic prompt content. Do not send them to Tavily
unless the guest asks a current-information question.

## Live verification

1. Add all four tools with the exact names and parameters above.
2. Enable waiting for each client tool response.
3. Start Landline with the required environment variables.
4. Ask for a physical item and confirm a local dashboard ticket appears.
5. Ask a current-hours question and confirm a source link appears.
6. Ask for nearby stays and confirm a Stay22 “View stays” link appears.
7. Remove an optional vendor key and confirm the agent offers staff help while
   the manual fallback remains available.
