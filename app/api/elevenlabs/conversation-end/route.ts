import { NextRequest, NextResponse } from 'next/server'
import { getConversationTerminationReason } from '@/lib/elevenlabs'
import { requestHasToolAccess } from '@/lib/tool-access-token'

const CONVERSATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!requestHasToolAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const conversationId =
    body && typeof body === 'object' && 'conversationId' in body
      ? (body as { conversationId?: unknown }).conversationId
      : undefined

  if (
    typeof conversationId !== 'string' ||
    !CONVERSATION_ID_PATTERN.test(conversationId)
  ) {
    return NextResponse.json(
      { error: 'A valid conversation ID is required' },
      { status: 400 }
    )
  }

  try {
    const terminationReason =
      await getConversationTerminationReason(conversationId)
    return NextResponse.json({ terminationReason }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Conversation details are temporarily unavailable' },
      { status: 502 }
    )
  }
}
