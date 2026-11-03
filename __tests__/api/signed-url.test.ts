/**
 * @jest-environment node
 *
 * Tests for GET /api/elevenlabs/signed-url
 *
 * We import the route handler directly and mock global fetch to control
 * what the ElevenLabs upstream returns.
 */
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn().mockResolvedValue({ userId: 'test-user' }) }))


// Must mock "server-only" before any imports that use it
jest.mock("server-only", () => ({}), { virtual: true });

jest.mock('@/lib/paid-service-access', () => ({ authorizePaidRequest: jest.fn().mockResolvedValue(null) }))

// Provide env vars before any module is imported
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    ELEVENLABS_API_KEY: "test-api-key",
    ELEVENLABS_AGENT_ID: "test-agent-id",
  };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.restoreAllMocks();
});

describe("GET /api/elevenlabs/signed-url", () => {
  it.each([['Origin', 'https://attacker.example'], ['Sec-Fetch-Site', 'cross-site']])('rejects cross-site session creation before contacting a provider', async (name, value) => {
    global.fetch = jest.fn()
    const { GET } = await import('@/app/api/elevenlabs/signed-url/route')
    const request = new Request('https://landline.example/api/elevenlabs/signed-url', { headers: { [name]: value } })
    expect((await GET(request)).status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    { signed_url: 'wss://attacker.example/v1/convai/conversation', conversation_id: 'conv_123' },
    { signed_url: 'https://api.elevenlabs.io/v1/convai/conversation', conversation_id: 'conv_123' },
    { signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation', conversation_id: '../other' },
    { signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation' },
    null,
  ])('rejects an untrusted or unscoped signed session response', async payload => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload })
    const { GET } = await import('@/app/api/elevenlabs/signed-url/route')
    expect((await GET(new Request('https://landline.example/api/elevenlabs/signed-url'))).status).toBe(500)
  })
  it("returns a signed URL and short-lived tool token", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=synthetic", conversation_id: "conv_123" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(new Request('https://landline.example/api/elevenlabs/signed-url'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=synthetic");
    expect(typeof body.toolToken).toBe("string");
    const { verifyToolAccessToken } = await import("@/lib/tool-access-token");
    expect(verifyToolAccessToken(body.toolToken)).toBe(true);
    // Credentials must never appear in the response body
    expect(JSON.stringify(body)).not.toContain("test-api-key");
    expect(JSON.stringify(body)).not.toContain("test-agent-id");
  });

  it("requests a fresh signed URL with the agent ID in the query", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=synthetic", conversation_id: "conv_123" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    await GET(new Request('https://landline.example/api/elevenlabs/signed-url'));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit
    ];
    expect(requestUrl.toString()).toBe(
      "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=test-agent-id&include_conversation_id=true"
    );
    expect(requestInit).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: { "xi-api-key": "test-api-key" },
    });
    expect(requestInit.body).toBeUndefined();
  });

  it("returns 500 when ELEVENLABS_API_KEY is missing", async () => {
    delete process.env.ELEVENLABS_API_KEY;

    global.fetch = jest.fn();

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(new Request('https://landline.example/api/elevenlabs/signed-url'));

    expect(response.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 500 when ELEVENLABS_AGENT_ID is missing", async () => {
    delete process.env.ELEVENLABS_AGENT_ID;

    global.fetch = jest.fn();

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(new Request('https://landline.example/api/elevenlabs/signed-url'));

    expect(response.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns non-200 when ElevenLabs returns 401", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(new Request('https://landline.example/api/elevenlabs/signed-url'));

    expect(response.status).not.toBe(200);
  });

  it("returns 500 when ElevenLabs returns 200 but body has no signed URL", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ something_else: "value" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(new Request('https://landline.example/api/elevenlabs/signed-url'));

    expect(response.status).toBe(500);
  });

});
