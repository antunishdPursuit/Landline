import "server-only";

const ELEVENLABS_TOKEN_ENDPOINT =
  "https://api.elevenlabs.io/v1/convai/conversation/token";

export async function getSignedUrl(): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    throw new Error("Missing environment variable: ELEVENLABS_API_KEY");
  }
  if (!agentId) {
    throw new Error("Missing environment variable: ELEVENLABS_AGENT_ID");
  }

  const response = await fetch(ELEVENLABS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agent_id: agentId }),
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs token request failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as { token?: string };

  if (!data.token) {
    throw new Error("ElevenLabs response did not include a token");
  }

  return data.token;
}
