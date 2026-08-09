/**
 * @jest-environment node
 *
 * Acceptance tests — API slice (node environment)
 *
 * Covers:
 *   AC-3  – ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID never appear in any browser response
 *   AC-5  – answerable_qa → 200, no DB row written
 *   AC-6  – physical_request → 201, correct mapped department, requires_human server-computed
 *   AC-7  – defer_to_operator → 201, requires_human=true, department=front_desk
 *   AC-8  – Server always recomputes requires_human; client-supplied value discarded
 *   AC-9  – (server side) Missing env vars → signed-url returns 500
 *   AC-10 – Upstream ElevenLabs failure → signed-url returns non-200
 *   AC-11 – Unknown intent → 422, no DB write
 *   AC-12 – Missing required fields → 400, no DB write
 *   AC-13 – Supabase write failure → 500, no internal details exposed
 */

jest.mock("server-only", () => ({}), { virtual: true });

// ---------------------------------------------------------------------------
// Supabase mock — controls insert outcomes without touching a real database
// ---------------------------------------------------------------------------
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock("@/lib/supabase.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/requests/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORIGINAL_ENV = process.env;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getInsertPayload(): Record<string, unknown> {
  const calls = mockInsert.mock.calls as unknown as Array<[Record<string, unknown>]>;
  if (!calls[0]) throw new Error("mockInsert was not called");
  return calls[0][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSingle.mockResolvedValue({ data: { id: "acc-uuid-001" }, error: null });
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// ===========================================================================
// AC-5: answerable_qa → 200, zero DB writes
// ===========================================================================
describe("AC-5: answerable_qa → 200 and no database write", () => {
  it("returns 200 with { status: 'ok', intent: 'answerable_qa' }", async () => {
    const res = await POST(
      makeRequest({ intent: "answerable_qa", room_number: "101", summary: "What time is checkout?" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: "ok", intent: "answerable_qa" });
  });

  it("does not call supabaseAdmin at all for answerable_qa", async () => {
    await POST(
      makeRequest({ intent: "answerable_qa", room_number: "101", summary: "Is the pool open?" })
    );

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// AC-6: physical_request → 201, correct department, requires_human server-computed false
// ===========================================================================
describe("AC-6: physical_request → correct department mapping, requires_human=false", () => {
  const departmentCases: Array<{ summary: string; expectedDept: string }> = [
    { summary: "I need more towels please", expectedDept: "housekeeping" },
    { summary: "Please bring extra sheets", expectedDept: "housekeeping" },
    { summary: "We need cleaning in room 202", expectedDept: "housekeeping" },
    { summary: "Can I get fresh linen?", expectedDept: "housekeeping" },
    { summary: "The plumbing is making noise", expectedDept: "maintenance" },
    { summary: "AC unit is not working", expectedDept: "maintenance" },
    { summary: "There is an electrical issue", expectedDept: "maintenance" },
    { summary: "The TV is broken", expectedDept: "maintenance" },
    { summary: "Water leak under the sink", expectedDept: "maintenance" },
    { summary: "I would like room service", expectedDept: "food_beverage" },
    { summary: "Can I order food to my room?", expectedDept: "food_beverage" },
    { summary: "Please bring a drink", expectedDept: "food_beverage" },
    { summary: "I want a meal sent up", expectedDept: "food_beverage" },
    { summary: "Can I get breakfast delivered?", expectedDept: "food_beverage" },
    { summary: "I need directions to the spa", expectedDept: "concierge" },
    { summary: "Can you give me a recommendation?", expectedDept: "concierge" },
    { summary: "I need help booking a restaurant", expectedDept: "concierge" },
    { summary: "Where is the concierge desk?", expectedDept: "concierge" },
    { summary: "Something unrelated with no keywords", expectedDept: "front_desk" },
  ];

  test.each(departmentCases)(
    "summary '$summary' → department '$expectedDept'",
    async ({ summary, expectedDept }) => {
      const res = await POST(
        makeRequest({ intent: "physical_request", room_number: "202", summary })
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.status).toBe("created");
      expect(typeof body.id).toBe("string");

      const payload = getInsertPayload();
      expect(payload.department).toBe(expectedDept);
      expect(payload.requires_human).toBe(false);

      jest.clearAllMocks();
      mockSingle.mockResolvedValue({ data: { id: "acc-uuid-001" }, error: null });
    }
  );
});

// ===========================================================================
// AC-7: defer_to_operator → requires_human=true, department=front_desk
// ===========================================================================
describe("AC-7: defer_to_operator → requires_human=true, department=front_desk", () => {
  it("returns 201 and inserts row with requires_human=true and department=front_desk", async () => {
    const res = await POST(
      makeRequest({
        intent: "defer_to_operator",
        room_number: "303",
        summary: "I want to speak with the manager",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.status).toBe("created");

    const payload = getInsertPayload();
    expect(payload.requires_human).toBe(true);
    expect(payload.department).toBe("front_desk");
  });
});

// ===========================================================================
// AC-8: requires_human always server-computed; client-supplied value discarded
// ===========================================================================
describe("AC-8: requires_human is server-authoritative — client value is always ignored", () => {
  it("physical_request: client sends requires_human=true, server stores false", async () => {
    await POST(
      makeRequest({
        intent: "physical_request",
        room_number: "404",
        summary: "I need towels",
        requires_human: true,
      })
    );

    expect(getInsertPayload().requires_human).toBe(false);
  });

  it("defer_to_operator: client sends requires_human=false, server stores true", async () => {
    await POST(
      makeRequest({
        intent: "defer_to_operator",
        room_number: "404",
        summary: "Connect me to a human",
        requires_human: false,
      })
    );

    expect(getInsertPayload().requires_human).toBe(true);
  });

  it("answerable_qa: client sends requires_human=true, no DB write occurs", async () => {
    const res = await POST(
      makeRequest({
        intent: "answerable_qa",
        room_number: "404",
        summary: "What is the WiFi password?",
        requires_human: true,
      })
    );

    expect(res.status).toBe(200);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// AC-9 (server side): Missing env vars → GET /api/elevenlabs/signed-url returns 500
// ===========================================================================
describe("AC-9 (server): Missing env vars → signed-url endpoint returns 500", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("returns 500 when ELEVENLABS_API_KEY is missing", async () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ELEVENLABS_API_KEY;
    process.env.ELEVENLABS_AGENT_ID = "test-agent";

    global.fetch = jest.fn();

    let status!: number;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      status = res.status;
    });

    expect(status).toBe(500);
    // fetch to ElevenLabs must never fire when env vars are absent
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 500 when ELEVENLABS_AGENT_ID is missing", async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.ELEVENLABS_API_KEY = "test-key";
    delete process.env.ELEVENLABS_AGENT_ID;

    global.fetch = jest.fn();

    let status!: number;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      status = res.status;
    });

    expect(status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 500 when both env vars are absent", async () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_AGENT_ID;

    global.fetch = jest.fn();

    let status!: number;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      status = res.status;
    });

    expect(status).toBe(500);
  });

  it("returns { error: 'Internal server error' } — no env var names in response", async () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ELEVENLABS_API_KEY;
    process.env.ELEVENLABS_AGENT_ID = "test-agent";

    global.fetch = jest.fn();

    let body!: unknown;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      body = await res.json();
    });

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("ELEVENLABS_API_KEY");
    expect(bodyStr).not.toContain("ELEVENLABS_AGENT_ID");
  });
});

// ===========================================================================
// AC-10: Upstream ElevenLabs failure → non-200 returned
// ===========================================================================
describe("AC-10: Upstream ElevenLabs failure → endpoint returns non-200", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      ELEVENLABS_API_KEY: "test-key",
      ELEVENLABS_AGENT_ID: "test-agent",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("returns non-200 when ElevenLabs responds 401 Unauthorized", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    } as unknown as Response);

    let status!: number;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      status = res.status;
    });

    expect(status).not.toBe(200);
  });

  it("returns non-200 when ElevenLabs responds 503 Service Unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Service unavailable" }),
    } as unknown as Response);

    let status!: number;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      status = res.status;
    });

    expect(status).not.toBe(200);
  });

  it("returns 500 when ElevenLabs returns 200 OK but body has no token field", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ something_unexpected: "value" }),
    } as unknown as Response);

    let status!: number;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      status = res.status;
    });

    expect(status).toBe(500);
  });
});

// ===========================================================================
// AC-3 / BR-4: Raw credentials never appear in any browser response
// ===========================================================================
describe("AC-3 / BR-4: API key and agent ID never appear in signed-url response body", () => {
  const FAKE_KEY = "sk-very-secret-elevenlabs-key";
  const FAKE_AGENT = "agt-very-secret-agent-id";

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      ELEVENLABS_API_KEY: FAKE_KEY,
      ELEVENLABS_AGENT_ID: FAKE_AGENT,
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("200 success response body does not contain the raw API key", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "wss://safe.example.com/session" }),
    } as unknown as Response);

    let body!: unknown;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      body = await res.json();
    });

    expect(JSON.stringify(body)).not.toContain(FAKE_KEY);
  });

  it("200 success response body does not contain the raw agent ID", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "wss://safe.example.com/session" }),
    } as unknown as Response);

    let body!: unknown;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      body = await res.json();
    });

    expect(JSON.stringify(body)).not.toContain(FAKE_AGENT);
  });

  it("500 error response body does not contain the raw API key", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response);

    let body!: unknown;
    await jest.isolateModulesAsync(async () => {
      const { GET } = await import("@/app/api/elevenlabs/signed-url/route");
      const res = await GET();
      body = await res.json();
    });

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain(FAKE_KEY);
    expect(bodyStr).not.toContain(FAKE_AGENT);
  });
});

// ===========================================================================
// AC-11: Unknown intent → 422, no DB write
// ===========================================================================
describe("AC-11: Unknown intent → 422 and no database write", () => {
  it("returns 422 for an unrecognized intent string", async () => {
    const res = await POST(
      makeRequest({ intent: "hack_the_mainframe", room_number: "101", summary: "Bad intent" })
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body).toEqual({ error: "Unknown intent" });
  });

  it("returns 422 for empty-string intent that passes presence check... no, empty is caught at 400", async () => {
    // An intent that passes the non-empty check but is not in the known set
    const res = await POST(
      makeRequest({ intent: "unknown_future_intent", room_number: "101", summary: "Something" })
    );

    expect(res.status).toBe(422);
  });

  it("does not write to the database for an unknown intent", async () => {
    await POST(
      makeRequest({ intent: "launch_missiles", room_number: "101", summary: "Suspicious" })
    );

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// AC-12: Missing required fields → 400, no DB write
// ===========================================================================
describe("AC-12: Missing required fields → 400 and no database write", () => {
  const cases: Array<{ label: string; body: unknown; fieldMention: string | null }> = [
    {
      label: "intent absent",
      body: { room_number: "101", summary: "Need something" },
      fieldMention: "intent",
    },
    {
      label: "room_number absent",
      body: { intent: "physical_request", summary: "Need something" },
      fieldMention: "room_number",
    },
    {
      label: "summary absent",
      body: { intent: "physical_request", room_number: "101" },
      fieldMention: "summary",
    },
    {
      label: "intent is empty string",
      body: { intent: "", room_number: "101", summary: "Need something" },
      fieldMention: "intent",
    },
    {
      label: "room_number is empty string",
      body: { intent: "physical_request", room_number: "", summary: "Need something" },
      fieldMention: "room_number",
    },
    {
      label: "summary is empty string",
      body: { intent: "physical_request", room_number: "101", summary: "" },
      fieldMention: "summary",
    },
    {
      label: "whitespace-only summary",
      body: { intent: "physical_request", room_number: "101", summary: "   " },
      fieldMention: "summary",
    },
  ];

  test.each(cases)("$label → 400", async ({ body, fieldMention }) => {
    const res = await POST(makeRequest(body));
    const resBody = await res.json();

    expect(res.status).toBe(400);
    if (fieldMention) {
      expect(resBody.error).toMatch(new RegExp(fieldMention, "i"));
    }
    expect(mockFrom).not.toHaveBeenCalled();

    jest.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "acc-uuid-001" }, error: null });
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new NextRequest("http://localhost/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{{{",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// AC-13: Supabase write failure → 500, no internal details exposed
// ===========================================================================
describe("AC-13: Supabase write failure → 500 with no internal detail leakage", () => {
  it("returns 500 when Supabase insert returns an error object", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "connection refused — pg_primary:5432", code: "PGRST503" },
    });

    const res = await POST(
      makeRequest({ intent: "physical_request", room_number: "101", summary: "I need towels" })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("does not leak internal DB error message to the caller", async () => {
    const INTERNAL_MSG = "connection refused — pg_primary:5432";
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: INTERNAL_MSG, code: "PGRST503" },
    });

    const res = await POST(
      makeRequest({
        intent: "defer_to_operator",
        room_number: "505",
        summary: "Please connect me to a human",
      })
    );
    const bodyStr = JSON.stringify(await res.json());

    expect(bodyStr).not.toContain(INTERNAL_MSG);
    expect(bodyStr).not.toContain("pg_primary");
    expect(bodyStr).not.toContain("PGRST503");
  });

  it("returns 500 when the Supabase promise rejects entirely", async () => {
    mockSingle.mockRejectedValueOnce(new Error("Network timeout reaching Supabase"));

    const res = await POST(
      makeRequest({
        intent: "physical_request",
        room_number: "101",
        summary: "Extra pillows please",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(body)).not.toContain("Network timeout");
  });
});
