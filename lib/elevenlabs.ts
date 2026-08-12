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

export async function getSignedUrl(): Promise<string> {
  const apiKey = getApiKey();
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!agentId) {
    throw new Error("Missing environment variable: ELEVENLABS_AGENT_ID");
  }

  const endpoint = new URL(ELEVENLABS_SIGNED_URL_ENDPOINT);
  endpoint.searchParams.set("agent_id", agentId);

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs signed URL request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as { signed_url?: string };

  if (!data.signed_url) {
    throw new Error("ElevenLabs response did not include a signed URL");
  }

  return data.signed_url;
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
