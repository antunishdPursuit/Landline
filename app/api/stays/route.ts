import { NextRequest, NextResponse } from 'next/server'
import {
  searchStay22,
  Stay22ConfigurationError,
  Stay22UpstreamError,
  type Stay22SearchInput,
} from '@/lib/stay22'

type StayBody = {
  address?: unknown
  checkin?: unknown
  checkout?: unknown
  adults?: unknown
  children?: unknown
  rooms?: unknown
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

function error(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

function dateValue(value: unknown): number | null {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null
  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed)) return null
  return new Date(parsed).toISOString().slice(0, 10) === value ? parsed : null
}

function todayUtc(): number {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

function integerInRange(
  value: unknown,
  minimum: number,
  maximum: number
): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum
}

function validate(body: StayBody): Stay22SearchInput | NextResponse {
  if (typeof body.address !== 'string' || body.address.trim() === '') {
    return error('An address is required')
  }
  if (body.address.trim().length > 200) {
    return error('Address is too long')
  }

  const checkin = dateValue(body.checkin)
  const checkout = dateValue(body.checkout)
  if (checkin === null || checkout === null) {
    return error('Check-in and check-out must use YYYY-MM-DD')
  }

  const today = todayUtc()
  const twoYearsFromToday = today + 730 * DAY_MS
  if (checkin < today || checkin > twoYearsFromToday) {
    return error('Check-in must be within the next two years')
  }
  if (checkout <= checkin || checkout > twoYearsFromToday) {
    return error('Check-out must be after check-in and within the next two years')
  }

  if (!integerInRange(body.adults, 1, 20)) {
    return error('Adults must be between 1 and 20')
  }
  if (!integerInRange(body.children, 0, 20)) {
    return error('Children must be between 0 and 20')
  }
  if (!integerInRange(body.rooms, 1, 10)) {
    return error('Rooms must be between 1 and 10')
  }

  return {
    address: body.address.trim(),
    checkin: body.checkin as string,
    checkout: body.checkout as string,
    adults: body.adults,
    children: body.children,
    rooms: body.rooms,
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: StayBody
  try {
    body = (await request.json()) as StayBody
  } catch {
    return error('A valid stay search is required')
  }

  const input = validate(body)
  if (input instanceof NextResponse) return input

  try {
    const result = await searchStay22(input)
    const createdAt = new Date().toISOString()
    const options = result.options.map((option) => ({
      id: `stay_${option.id}`,
      title: option.name,
      url: option.url,
      source: 'stay22' as const,
      created_at: createdAt,
      accommodation_type: option.type,
      address: option.address,
      supplier: option.supplier,
      price_total: option.price_total,
      currency: option.currency,
      rating: option.rating,
      hotel_stars: option.hotel_stars,
    }))

    return NextResponse.json({
      status: options.length > 0 ? 'ready' : 'no_results',
      search: input,
      nights: result.nights,
      total_results: result.total,
      options,
    })
  } catch (caught) {
    if (caught instanceof Stay22ConfigurationError) {
      return NextResponse.json(
        { error: 'Stay search is not configured' },
        { status: 503 }
      )
    }

    if (caught instanceof Stay22UpstreamError) {
      return NextResponse.json(
        {
          error:
            caught.status === 429
              ? 'Stay search rate limit reached'
              : 'Stay search is temporarily unavailable',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
