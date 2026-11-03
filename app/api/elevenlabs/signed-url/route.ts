import { authorizePaidRequest } from '@/lib/paid-service-access'
import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/elevenlabs";
import { createToolAccessToken } from "@/lib/tool-access-token";
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return NextResponse.json({ error: 'Cross-site session requests are not allowed' }, { status: 403 });
  }
  const denied = await authorizePaidRequest()
  if (denied) return denied

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { url, conversationId } = await getSignedUrl();
    const toolToken = createToolAccessToken(userId, conversationId);
    return NextResponse.json({ url, toolToken }, { status: 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
