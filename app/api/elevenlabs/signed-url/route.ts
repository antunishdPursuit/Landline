import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/elevenlabs";
import { createToolAccessToken } from "@/lib/tool-access-token";

export async function GET(): Promise<NextResponse> {
  try {
    const url = await getSignedUrl();
    const toolToken = createToolAccessToken();
    return NextResponse.json({ url, toolToken }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
