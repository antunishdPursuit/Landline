import { NextRequest, NextResponse } from 'next/server'
import {
  searchConcierge,
  TavilyConfigurationError,
  TavilyUpstreamError,
} from '@/lib/tavily'
import { requestHasToolAccess } from '@/lib/tool-access-token'

type SearchBody = {
  query?: unknown
  location?: unknown
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!requestHasToolAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SearchBody
  try {
    body = (await request.json()) as SearchBody
  } catch {
    return NextResponse.json({ error: 'A search query is required' }, { status: 400 })
  }

  if (typeof body.query !== 'string' || body.query.trim() === '') {
    return NextResponse.json({ error: 'A search query is required' }, { status: 400 })
  }
  if (body.query.trim().length > 500) {
    return NextResponse.json({ error: 'Search query is too long' }, { status: 400 })
  }
  if (
    body.location !== undefined &&
    (typeof body.location !== 'string' || body.location.trim() === '')
  ) {
    return NextResponse.json({ error: 'Location must be a non-empty string' }, { status: 400 })
  }

  try {
    const result = await searchConcierge(
      body.query.trim(),
      typeof body.location === 'string' ? body.location.trim() : undefined
    )

    return NextResponse.json(
      {
        status: result.answered ? 'answered' : 'no_answer',
        answer: result.answer,
        sources: result.sources,
        query: result.query,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof TavilyConfigurationError) {
      return NextResponse.json(
        { error: 'Concierge search is not configured' },
        { status: 503 }
      )
    }
    if (error instanceof TavilyUpstreamError) {
      return NextResponse.json(
        { error: 'Concierge search is temporarily unavailable' },
        { status: 502 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
