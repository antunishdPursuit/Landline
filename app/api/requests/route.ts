import { NextRequest, NextResponse } from "next/server";
import { classifyRequest } from "@/lib/classifier";
import { supabaseAdmin } from "@/lib/supabase.server";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Missing required fields: intent, room_number, summary" },
      { status: 400 }
    );
  }

  // Validate required fields — empty strings count as missing
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
  const room_number = (body.room_number as string).trim();
  const summary = (body.summary as string).trim();

  if (!VALID_INTENTS.has(intent)) {
    return NextResponse.json({ error: "Unknown intent" }, { status: 422 });
  }

  // Classify — always server-side; requires_human from body is discarded
  const { requires_human, department } = classifyRequest(intent, summary);

  // answerable_qa: respond immediately, zero DB writes
  if (intent === "answerable_qa") {
    return NextResponse.json({ status: "ok", intent }, { status: 200 });
  }

  const urgency =
    typeof body.urgency === "string" && body.urgency.trim()
      ? body.urgency.trim()
      : "medium";

  const language_detected =
    typeof body.language_detected === "string" && body.language_detected.trim()
      ? body.language_detected.trim()
      : "en";

  try {
    const { data, error } = await supabaseAdmin
      .from("requests")
      .insert({
        room_number,
        intent,
        department,
        summary,
        urgency,
        language_detected,
        requires_human,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ status: "created", id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
