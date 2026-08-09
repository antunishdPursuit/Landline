import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/elevenlabs";

export async function GET(): Promise<NextResponse> {
  try {
    const url = await getSignedUrl();
    return NextResponse.json({ url }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
