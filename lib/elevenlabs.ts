import "server-only";

const ELEVENLABS_SIGNED_URL_ENDPOINT =
  "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";
const ELEVENLABS_CONVERSATIONS_ENDPOINT =
  "https://api.elevenlabs.io/v1/convai/conversations";

function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing environment variable: ELEVENLABS_API_KEY");
  }
  return apiKey;
}

export async function getSignedUrl(): Promise<{ url: string; conversationId: string }> {
  const apiKey = getApiKey();
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!agentId) {
    throw new Error("Missing environment variable: ELEVENLABS_AGENT_ID");
  }

  const endpoint = new URL(ELEVENLABS_SIGNED_URL_ENDPOINT);
  endpoint.searchParams.set("agent_id", agentId);
  endpoint.searchParams.set("include_conversation_id", "true");

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs signed URL request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as { signed_url?: unknown; conversation_id?: unknown } | null;
  if (!data || typeof data.signed_url !== 'string' ||
      typeof data.conversation_id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(data.conversation_id)) {
    throw new Error("ElevenLabs response did not include a signed URL");
  }
  const url = new URL(data.signed_url);
  if (url.protocol !== 'wss:' || url.hostname !== 'api.elevenlabs.io' || url.port ||
      url.username || url.password || url.pathname !== '/v1/convai/conversation') {
    throw new Error('Invalid signed conversation endpoint');
  }
  return { url: url.toString(), conversationId: data.conversation_id };
}

export async function getConversationTerminationReason(
  conversationId: string
): Promise<string | null> {
  const response = await fetch(
    `${ELEVENLABS_CONVERSATIONS_ENDPOINT}/${encodeURIComponent(conversationId)}`,
    {
      method: "GET",
      headers: { "xi-api-key": getApiKey() },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      redirect: "error",
    }
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs conversation request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as { termination_reason?: unknown };
  return typeof data.termination_reason === "string"
    ? data.termination_reason
    : null;
}
