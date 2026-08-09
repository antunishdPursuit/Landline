/**
 * @jest-environment node
 *
 * Tests for POST /api/requests
 *
 * We mock lib/supabase.server.ts so the route never touches a real database.
 * lib/classifier.ts is NOT mocked — it is pure and its own test suite covers it.
 */

jest.mock("server-only", () => ({}), { virtual: true });

// ---------- RAG mock ----------
jest.mock("@/lib/rag", () => ({
  getRagAnswer: jest.fn().mockResolvedValue({
    answered: true,
    answer: "Checkout is at 11am.",
    sources: [],
    query_used: "What time is checkout?",
  }),
}));

// ---------- supabase mock setup ----------
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock("@/lib/supabase.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));
// -----------------------------------------

import { NextRequest } from "next/server";
import { POST } from "@/app/api/requests/route";

// Helper: build a POST NextRequest with a JSON body
function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type InsertPayload = Record<string, unknown>;

// Extract the first argument passed to the first mockInsert call
function getInsertPayload(): InsertPayload {
  const calls = mockInsert.mock.calls as unknown as Array<[InsertPayload]>;
  if (!calls[0]) throw new Error("mockInsert was not called");
  return calls[0][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default happy path: successful insert returning an id
  mockSingle.mockResolvedValue({ data: { id: "uuid-123" }, error: null });
});

describe("POST /api/requests", () => {
  // ---- answerable_qa ----
  describe("answerable_qa", () => {
    it("returns 200 with { status: ok, intent } and does not insert", async () => {
      const req = makeRequest({
        intent: "answerable_qa",
        room_number: "101",
        summary: "What time is checkout?",
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({ status: "ok", intent: "answerable_qa", answered: true });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("ignores requires_human=true from client when intent is answerable_qa", async () => {
      const req = makeRequest({
        intent: "answerable_qa",
        room_number: "101",
        summary: "What time is checkout?",
        requires_human: true,
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({ status: "ok" });
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  // ---- physical_request ----
  describe("physical_request", () => {
    it("returns 201 with id, routes 'towels' to housekeeping, requires_human=false", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "202",
        summary: "I need more towels",
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual({ status: "created", id: "uuid-123" });

      const insertCall = getInsertPayload();
      expect(insertCall.department).toBe("housekeeping");
      expect(insertCall.requires_human).toBe(false);
    });

    it("routes 'AC broken' to maintenance", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "303",
        summary: "The AC is broken",
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.department).toBe("maintenance");
      expect(insertCall.requires_human).toBe(false);
    });

    it("routes 'room service' to food_beverage", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "404",
        summary: "I want room service",
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.department).toBe("food_beverage");
    });
  });

  // ---- defer_to_operator ----
  describe("defer_to_operator", () => {
    it("returns 201 with department=front_desk and requires_human=true", async () => {
      const req = makeRequest({
        intent: "defer_to_operator",
        room_number: "505",
        summary: "I want to speak with the manager",
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.status).toBe("created");

      const insertCall = getInsertPayload();
      expect(insertCall.department).toBe("front_desk");
      expect(insertCall.requires_human).toBe(true);
    });

    it("ignores requires_human=false from client for defer_to_operator — server always sets true", async () => {
      const req = makeRequest({
        intent: "defer_to_operator",
        room_number: "505",
        summary: "Connect me to a human",
        requires_human: false,
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.requires_human).toBe(true);
    });
  });

  // ---- optional field defaults ----
  describe("optional field defaults", () => {
    it("defaults urgency to 'medium' when absent", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "606",
        summary: "Need extra blankets",
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.urgency).toBe("medium");
    });

    it("defaults language_detected to 'en' when absent", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "606",
        summary: "Need extra blankets",
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.language_detected).toBe("en");
    });

    it("passes through urgency when provided", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "606",
        summary: "Need extra blankets",
        urgency: "high",
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.urgency).toBe("high");
    });

    it("passes through language_detected when provided", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "606",
        summary: "Need extra blankets",
        language_detected: "es",
      });
      await POST(req);

      const insertCall = getInsertPayload();
      expect(insertCall.language_detected).toBe("es");
    });
  });

  // ---- 400 validation ----
  describe("400 — missing required fields", () => {
    it("returns 400 when intent is missing", async () => {
      const req = makeRequest({ room_number: "101", summary: "Need something" });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/intent/);
    });

    it("returns 400 when room_number is missing", async () => {
      const req = makeRequest({ intent: "physical_request", summary: "Need something" });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/room_number/);
    });

    it("returns 400 when summary is missing", async () => {
      const req = makeRequest({ intent: "physical_request", room_number: "101" });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/summary/);
    });

    it("returns 400 when summary is an empty string", async () => {
      const req = makeRequest({
        intent: "physical_request",
        room_number: "101",
        summary: "",
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/summary/);
    });
  });

  // ---- 422 unknown intent ----
  describe("422 — unknown intent", () => {
    it("returns 422 for an unrecognized intent value", async () => {
      const req = makeRequest({
        intent: "do_something_weird",
        room_number: "101",
        summary: "Some summary",
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body).toEqual({ error: "Unknown intent" });
    });
  });

  // ---- 500 Supabase failure ----
  describe("500 — Supabase insert failure", () => {
    it("returns 500 with 'Internal server error' when Supabase returns an error", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "DB connection lost" },
      });

      const req = makeRequest({
        intent: "physical_request",
        room_number: "101",
        summary: "I need towels",
      });
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
      // Must not leak internal error details
      expect(JSON.stringify(body)).not.toContain("DB connection lost");
    });
  });
});
