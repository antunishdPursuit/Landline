import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { classifyRequest } from "@/lib/classifier";
import { DEMO_ROOM_NUMBER } from "@/lib/demo-room";
import { requestHasToolAccess } from "@/lib/tool-access-token";

type RequestBody = {
  intent?: unknown;
  room_number?: unknown;
  summary?: unknown;
  urgency?: unknown;
  language_detected?: unknown;
  requires_human?: unknown;
};

const VALID_INTENTS = new Set([
  "answerable_qa",
  "defer_to_operator",
  "physical_request",
]);
const VALID_URGENCIES = new Set(["low", "medium", "high"]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!requestHasToolAccess(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Missing required fields: intent, room_number, summary" },
      { status: 400 }
    );
  }

  const missing: string[] = [];
  if (!body.intent || typeof body.intent !== "string" || body.intent.trim() === "") {
    missing.push("intent");
  }
  if (
    !body.room_number ||
    typeof body.room_number !== "string" ||
    body.room_number.trim() === ""
  ) {
    missing.push("room_number");
  }
  if (
    !body.summary ||
    typeof body.summary !== "string" ||
    body.summary.trim() === ""
  ) {
    missing.push("summary");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const intent = (body.intent as string).trim();
  const roomNumber = (body.room_number as string).trim();
  const summary = (body.summary as string).trim();

  if (!VALID_INTENTS.has(intent)) {
    return NextResponse.json({ error: "Unknown intent" }, { status: 422 });
  }

  // Classification is authoritative. Tool-supplied routing flags are ignored.
  const { requires_human, department } = classifyRequest(intent, summary);

  // Current-information answers are handled by the Tavily adapter.
  // They do not create staff tickets in the local demo store.
  if (intent === "answerable_qa") {
    return NextResponse.json(
      {
        status: "no_ticket",
        intent,
        department,
        requires_human,
      },
      { status: 200 }
    );
  }

  if (roomNumber !== DEMO_ROOM_NUMBER) {
    return NextResponse.json(
      {
        status: "room_restricted",
        allowed_room: DEMO_ROOM_NUMBER,
        message: `I can only submit requests for room ${DEMO_ROOM_NUMBER}.`,
      },
      { status: 422 }
    );
  }

  const requestedUrgency =
    typeof body.urgency === "string" ? body.urgency.trim() : "";
  const urgency = VALID_URGENCIES.has(requestedUrgency)
    ? requestedUrgency
    : "medium";
  const languageDetected =
    typeof body.language_detected === "string" && body.language_detected.trim()
      ? body.language_detected.trim()
      : "en";
  const now = new Date().toISOString();

  return NextResponse.json(
    {
      status: "ready",
      ticket: {
        id: `req_${randomUUID()}`,
        room_number: roomNumber,
        intent,
        department,
        summary,
        urgency,
        language_detected: languageDetected,
        status: "new",
        requires_human,
        assigned_to: null,
        created_at: now,
        updated_at: now,
      },
    },
    { status: 200 }
  );
}
