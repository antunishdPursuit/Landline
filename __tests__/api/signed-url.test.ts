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

import { NextRequest } from "next/server";

function makeRequest(ip = "203.0.113.10"): NextRequest {
  return new NextRequest("https://landline.example/api/elevenlabs/signed-url", {
    headers: { "x-vercel-forwarded-for": ip },
  });
}

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
  it("returns 200 with { url } when ElevenLabs returns a signed URL", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signed_url: "wss://example.com/signed" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ url: "wss://example.com/signed" });
    // Credentials must never appear in the response body
    expect(JSON.stringify(body)).not.toContain("test-api-key");
    expect(JSON.stringify(body)).not.toContain("test-agent-id");
  });

  it("requests a fresh signed URL with the agent ID in the query", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signed_url: "wss://example.com/signed" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    await GET(makeRequest());

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit
    ];
    expect(requestUrl.toString()).toBe(
      "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=test-agent-id"
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
    const response = await GET(makeRequest());

    expect(response.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 500 when ELEVENLABS_AGENT_ID is missing", async () => {
    delete process.env.ELEVENLABS_AGENT_ID;

    global.fetch = jest.fn();

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(makeRequest());

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
    const response = await GET(makeRequest());

    expect(response.status).not.toBe(200);
  });

  it("returns non-200 when ElevenLabs returns 503", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Service unavailable" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(makeRequest());

    expect(response.status).not.toBe(200);
  });

  it("returns 500 when ElevenLabs returns 200 but body has no signed URL", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ something_else: "value" }),
    } as unknown as Response);

    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(500);
  });

  it("allows two production call starts per IP in ten minutes", async () => {
    process.env.VERCEL_ENV = "production";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ signed_url: "wss://example.com/signed" }),
    } as unknown as Response);

    const { clearRateLimitsForTests } = await import("@/lib/rate-limit");
    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    clearRateLimitsForTests();
    const request = new NextRequest("https://landline.example/api/elevenlabs/signed-url", {
      headers: { "x-vercel-forwarded-for": "203.0.113.10" },
    });

    expect((await GET(request)).status).toBe(200);
    expect((await GET(request)).status).toBe(200);
    const blocked = await GET(request);
    const body = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("600");
    expect(body).toEqual({
      error: "Demo call limit reached",
      retry_after_seconds: 600,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("tracks production call starts separately by IP", async () => {
    process.env.VERCEL_ENV = "production";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ signed_url: "wss://example.com/signed" }),
    } as unknown as Response);

    const { clearRateLimitsForTests } = await import("@/lib/rate-limit");
    const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
    clearRateLimitsForTests();

    const firstIp = new NextRequest("https://landline.example/api/elevenlabs/signed-url", {
      headers: { "x-vercel-forwarded-for": "203.0.113.10" },
    });
    const secondIp = new NextRequest("https://landline.example/api/elevenlabs/signed-url", {
      headers: { "x-vercel-forwarded-for": "203.0.113.11" },
    });

    expect((await GET(firstIp)).status).toBe(200);
    expect((await GET(firstIp)).status).toBe(200);
    expect((await GET(secondIp)).status).toBe(200);
  });
});
