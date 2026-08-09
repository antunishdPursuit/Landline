/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/requests/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/requests", () => {
  it("returns no ticket for an answerable question", async () => {
    const response = await POST(
      makeRequest({
        intent: "answerable_qa",
        room_number: "101",
        summary: "What time is checkout?",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "no_ticket",
      intent: "answerable_qa",
      department: null,
      requires_human: false,
    });
  });

  it("returns a normalized physical-request ticket", async () => {
    const response = await POST(
      makeRequest({
        intent: "physical_request",
        room_number: " 202 ",
        summary: " I need more towels ",
        urgency: "high",
        language_detected: "es",
        requires_human: true,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.ticket).toMatchObject({
      room_number: "202",
      intent: "physical_request",
      department: "housekeeping",
      summary: "I need more towels",
      urgency: "high",
      language_detected: "es",
      status: "new",
      requires_human: false,
      assigned_to: null,
    });
    expect(body.ticket.id).toMatch(/^req_/);
    expect(body.ticket.created_at).toEqual(body.ticket.updated_at);
  });

  it("forces a human deferral to the front desk", async () => {
    const response = await POST(
      makeRequest({
        intent: "defer_to_operator",
        room_number: "505",
        summary: "I need to speak with a manager",
        requires_human: false,
      })
    );
    const body = await response.json();

    expect(body.ticket).toMatchObject({
      department: "front_desk",
      requires_human: true,
    });
  });

  it("uses safe optional-field defaults", async () => {
    const response = await POST(
      makeRequest({
        intent: "physical_request",
        room_number: "606",
        summary: "Need extra blankets",
        urgency: "critical",
      })
    );
    const body = await response.json();

    expect(body.ticket.urgency).toBe("medium");
    expect(body.ticket.language_detected).toBe("en");
  });

  it("rejects an unknown intent", async () => {
    const response = await POST(
      makeRequest({
        intent: "unknown_future_intent",
        room_number: "101",
        summary: "Something",
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "Unknown intent" });
  });

  it("rejects missing required fields", async () => {
    const response = await POST(makeRequest({ intent: "physical_request" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing required fields: room_number, summary",
    });
  });
});
