/** @jest-environment node */

jest.mock('server-only', () => ({}), { virtual: true })

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stays/route'

const ORIGINAL_ENV = process.env

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/stays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function isoDate(daysFromToday: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

function validSearch(overrides: Record<string, unknown> = {}) {
  return {
    address: 'SoHo, New York',
    checkin: isoDate(30),
    checkout: isoDate(33),
    adults: 2,
    children: 0,
    rooms: 1,
    ...overrides,
  }
}

function stay22Response(results: unknown[] = [
  {
    id: 'hotel_123',
    name: 'The Example Hotel',
    type: 'Hotel',
    url: 'https://www.stay22.com/allez/roam/hotel_123?source=direct',
    location: {
      address: '10 Example Street, New York',
      distanceInMeters: 850,
    },
    rating: { value: 8.7, hotelStars: 4, count: 420 },
    suppliers: {
      booking: {
        link: 'https://www.stay22.com/allez/booking/123',
        price: { total: 620 },
      },
      expedia: {
        link: 'https://www.stay22.com/allez/expedia/456',
        price: { total: 590 },
      },
    },
  },
]) {
  return {
    meta: {
      pageSize: 5,
      count: results.length,
      page: 1,
      total: results.length,
      currency: 'USD',
      nights: 3,
    },
    results,
  }
}

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    STAY22_API_BASE_URL: 'https://api.stay22.com/v2/accommodations',
  }
  global.fetch = jest.fn().mockResolvedValue(
    new Response(JSON.stringify(stay22Response()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('POST /api/stays', () => {
  it('returns one recommendation and backups from one no-key request', async () => {
    const search = validSearch()
    const response = await POST(makeRequest(search))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: 'ready',
      search,
      nights: 3,
      total_results: 1,
    })
    expect(body.recommended_option).toEqual(
      expect.objectContaining({
          id: 'stay_hotel_123',
          title: 'The Example Hotel',
          url: 'https://www.stay22.com/allez/expedia/456',
          source: 'stay22',
          accommodation_type: 'Hotel',
          address: '10 Example Street, New York',
          supplier: 'expedia',
          price_total: 590,
          currency: 'USD',
          rating: 8.7,
          hotel_stars: 4,
          rating_count: 420,
          distance_meters: 850,
        })
    )
    expect(body.backup_options).toEqual([])

    const [requestedUrl, requestInit] = (global.fetch as jest.Mock).mock.calls[0]
    const url = new URL(String(requestedUrl))
    expect(url.origin + url.pathname).toBe(
      'https://api.stay22.com/v2/accommodations'
    )
    expect(url.searchParams.get('address')).toBe(search.address)
    expect(url.searchParams.get('checkin')).toBe(search.checkin)
    expect(url.searchParams.get('checkout')).toBe(search.checkout)
    expect(url.searchParams.get('adults')).toBe('2')
    expect(url.searchParams.get('children')).toBe('0')
    expect(url.searchParams.get('rooms')).toBe('1')
    expect(url.searchParams.get('type')).toBe('hotel')
    expect(url.searchParams.get('pageSize')).toBe('5')
    expect(requestInit.headers).not.toHaveProperty('X-API-KEY')
  })

  it('recommends a nearby well-reviewed hotel and retains ranked backups', async () => {
    const option = (
      id: string,
      name: string,
      distanceInMeters: number,
      rating: number,
      count: number,
      total: number
    ) => ({
      id,
      name,
      type: 'Hotel',
      url: `https://www.stay22.com/allez/roam/${id}`,
      location: { address: `${name} address`, distanceInMeters },
      rating: { value: rating, hotelStars: 4, count },
      suppliers: {
        booking: {
          link: `https://www.stay22.com/allez/booking/${id}`,
          price: { total },
        },
      },
    })
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify(
          stay22Response([
            option('cheap', 'Cheap Hotel', 300, 6.8, 800, 300),
            option('far', 'Far Excellent Hotel', 5000, 9.4, 2000, 700),
            option('near', 'Nearby Strong Hotel', 600, 8.5, 900, 650),
            option('mid', 'Midrange Strong Hotel', 1200, 8.8, 1200, 550),
          ])
        ),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const response = await POST(makeRequest(validSearch()))
    const body = await response.json()

    expect(body.recommended_option.title).toBe('Nearby Strong Hotel')
    expect(body.backup_options.map((item: { title: string }) => item.title)).toEqual([
      'Midrange Strong Hotel',
      'Far Excellent Hotel',
      'Cheap Hotel',
    ])
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not recommend the hotel named as the search location', async () => {
    const currentHotel = {
      id: 'current',
      name: 'The Ritz-Carlton New York, Nomad',
      type: 'Hotel',
      url: 'https://www.stay22.com/allez/roam/current',
      location: { address: '25 West 28th Street', distanceInMeters: 20 },
      rating: { value: 9.2, hotelStars: 5, count: 900 },
      suppliers: {
        booking: {
          link: 'https://www.stay22.com/allez/booking/current',
          price: { total: 1200 },
        },
      },
    }
    const alternative = {
      ...currentHotel,
      id: 'alternative',
      name: 'Nearby Alternative Hotel',
      url: 'https://www.stay22.com/allez/roam/alternative',
      location: { address: '30 West 28th Street', distanceInMeters: 80 },
      suppliers: {
        booking: {
          link: 'https://www.stay22.com/allez/booking/alternative',
          price: { total: 900 },
        },
      },
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(stay22Response([currentHotel, alternative])), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const response = await POST(
      makeRequest(
        validSearch({ address: 'The Ritz-Carlton New York, NoMad' })
      )
    )
    const body = await response.json()

    expect(body.recommended_option.title).toBe('Nearby Alternative Hotel')
    expect(body.backup_options).toEqual([])
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    [{}, 'An address is required'],
    [validSearch({ address: '   ' }), 'An address is required'],
    [validSearch({ address: 'x'.repeat(201) }), 'Address is too long'],
    [validSearch({ checkin: '09/12/2026' }), 'Check-in and check-out must use YYYY-MM-DD'],
    [validSearch({ checkout: isoDate(29) }), 'Check-out must be after check-in and within the next two years'],
    [validSearch({ adults: 0 }), 'Adults must be between 1 and 20'],
    [validSearch({ children: -1 }), 'Children must be between 0 and 20'],
    [validSearch({ rooms: 11 }), 'Rooms must be between 1 and 10'],
  ])('rejects invalid input %#', async (input, message) => {
    const response = await POST(makeRequest(input))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: message })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns no_results without inventing accommodation options', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(stay22Response([])), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const response = await POST(makeRequest(validSearch()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'no_results',
      recommended_option: null,
      backup_options: [],
    })
  })

  it('fails safely when the Stay22 endpoint is not configured', async () => {
    delete process.env.STAY22_API_BASE_URL

    const response = await POST(makeRequest(validSearch()))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Stay search is not configured',
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fails safely when Stay22 reaches the demo rate limit', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ code: 'RATE_LIMIT_EXCEEDED' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const response = await POST(makeRequest(validSearch()))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Stay search rate limit reached',
    })
  })

  it('rejects malformed upstream data instead of fabricating results', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ results: 'invalid' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const response = await POST(makeRequest(validSearch()))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Stay search is temporarily unavailable',
    })
  })
})
