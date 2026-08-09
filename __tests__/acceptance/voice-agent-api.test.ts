/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });

import { NextRequest } from "next/server";
import { POST } from "@/app/api/requests/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("voice-agent request normalization", () => {
  it.each([
    ["Extra towels please", "housekeeping"],
    ["The AC is broken", "maintenance"],
    ["I would like room service", "food_beverage"],
    ["Something unrelated", "front_desk"],
  ])("routes %s to %s", async (summary, expectedDepartment) => {
    const response = await POST(
      makeRequest({
        intent: "physical_request",
        room_number: "202",
        summary,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticket.department).toBe(expectedDepartment);
    expect(body.ticket.requires_human).toBe(false);
  });

  it("does not trust a tool-supplied requires_human value", async () => {
    const physical = await POST(
      makeRequest({
        intent: "physical_request",
        room_number: "202",
        summary: "Extra towels please",
        requires_human: true,
      })
    );
    const deferred = await POST(
      makeRequest({
        intent: "defer_to_operator",
        room_number: "202",
        summary: "Connect me to a person",
        requires_human: false,
      })
    );

    expect((await physical.json()).ticket.requires_human).toBe(false);
    expect((await deferred.json()).ticket.requires_human).toBe(true);
  });

  it("does not expose vendor credentials in a normalized response", async () => {
    process.env.ELEVENLABS_API_KEY = "secret-elevenlabs-key";
    process.env.TAVILY_API_KEY = "secret-tavily-key";

    const response = await POST(
      makeRequest({
        intent: "physical_request",
        room_number: "202",
        summary: "Extra towels please",
      })
    );
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain("secret-elevenlabs-key");
    expect(serialized).not.toContain("secret-tavily-key");
  });
});
