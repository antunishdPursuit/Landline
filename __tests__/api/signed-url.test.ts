/**
 * @jest-environment node
 *
 * Tests for GET /api/elevenlabs/signed-url
 *
 * We import the route handler directly and mock global fetch to control
 * what the ElevenLabs upstream returns.
 */

// Must mock "server-only" before any imports that use it
jest.mock("server-only", () => ({}), { virtual: true });

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
  it("returns 200 with { url } when ElevenLabs returns a token", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "wss://example.com/signed" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: "wss://example.com/signed" });
    // Credentials must never appear in the response body
    expect(JSON.stringify(body)).not.toContain("test-api-key");
    expect(JSON.stringify(body)).not.toContain("test-agent-id");
  });

  it("returns 500 when ELEVENLABS_API_KEY is missing", async () => {
    delete process.env.ELEVENLABS_API_KEY;

    global.fetch = jest.fn();

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET();

    expect(response.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 500 when ELEVENLABS_AGENT_ID is missing", async () => {
    delete process.env.ELEVENLABS_AGENT_ID;

    global.fetch = jest.fn();

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET();

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
    const response = await GET();

    expect(response.status).not.toBe(200);
  });

  it("returns non-200 when ElevenLabs returns 503", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Service unavailable" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET();

    expect(response.status).not.toBe(200);
  });

  it("returns 500 when ElevenLabs returns 200 but body has no token field", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ something_else: "value" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET();

    expect(response.status).toBe(500);
  });
});
