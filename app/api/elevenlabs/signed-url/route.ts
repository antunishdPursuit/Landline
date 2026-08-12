import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/elevenlabs";
import { checkFixedWindowRateLimit } from "@/lib/rate-limit";

const CALL_START_LIMIT = 2;
const CALL_START_WINDOW_MS = 10 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  let rateLimitHeaders: Record<string, string> = {};
  if (process.env.VERCEL_ENV === "production") {
    const rateLimit = checkFixedWindowRateLimit(
      `elevenlabs-signed-url:${getClientIp(request)}`,
      CALL_START_LIMIT,
      CALL_START_WINDOW_MS
    );
    rateLimitHeaders = {
      "X-RateLimit-Limit": String(CALL_START_LIMIT),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    };

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Demo call limit reached",
          retry_after_seconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }
  }

  try {
    const url = await getSignedUrl();
    return NextResponse.json({ url }, { status: 200, headers: rateLimitHeaders });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
