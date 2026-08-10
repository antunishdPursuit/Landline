import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  createStay22Destination,
  Stay22ConfigurationError,
} from '@/lib/stay22'

type StayBody = {
  destination?: unknown
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: StayBody
  try {
    body = (await request.json()) as StayBody
  } catch {
    return NextResponse.json({ error: 'A destination is required' }, { status: 400 })
  }

  if (typeof body.destination !== 'string' || body.destination.trim() === '') {
    return NextResponse.json({ error: 'A destination is required' }, { status: 400 })
  }

  const destination = body.destination.trim()
  if (destination.length > 200) {
    return NextResponse.json({ error: 'Destination is too long' }, { status: 400 })
  }

  try {
    const stayDestination = createStay22Destination(destination)

    return NextResponse.json({
      status: 'ready',
      recommendation: {
        id: `stay_${randomUUID()}`,
        title: stayDestination.title,
        url: stayDestination.url,
        source: 'stay22',
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof Stay22ConfigurationError) {
      return NextResponse.json(
        { error: 'Stay search is not configured' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
