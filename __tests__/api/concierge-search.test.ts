/** @jest-environment node */

jest.mock('server-only', () => ({}), { virtual: true })

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/concierge/search/route'

const ORIGINAL_ENV = process.env

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/concierge/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, TAVILY_API_KEY: 'tvly-test-secret' }
  jest.restoreAllMocks()
  global.fetch = jest.fn()
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('POST /api/concierge/search', () => {
  it('returns one source-backed answer with a location-aware query', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: 'The museum is open until 8 PM today.',
        results: [
          {
            title: 'Museum hours',
            url: 'https://example.com/museum',
            content: 'Open today from 10 AM until 8 PM.',
          },
        ],
      }),
    } as Response)

    const response = await POST(
      makeRequest({ query: 'When does the museum close?', location: 'Brooklyn, NY' })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      status: 'answered',
      answer: 'The museum is open until 8 PM today.',
      query: 'When does the museum close? near Brooklyn, NY',
      sources: [
        {
          title: 'Museum hours',
          url: 'https://example.com/museum',
          content: 'Open today from 10 AM until 8 PM.',
        },
      ],
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer tvly-test-secret' }),
      })
    )
    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(requestBody).toMatchObject({
      search_depth: 'basic',
      max_results: 5,
      include_answer: 'basic',
      include_raw_content: false,
    })
  })

  it('returns no_answer when Tavily provides no source evidence', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: 'Unsupported answer', results: [] }),
    } as Response)

    const response = await POST(makeRequest({ query: 'What is happening nearby?' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'no_answer',
      answer: null,
      sources: [],
    })
  })

  it.each([
    [{}, 'A search query is required'],
    [{ query: '   ' }, 'A search query is required'],
    [{ query: 'events', location: 42 }, 'Location must be a non-empty string'],
  ])('rejects invalid input %#', async (input, message) => {
    const response = await POST(makeRequest(input))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: message })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fails safely when Tavily is not configured', async () => {
    delete process.env.TAVILY_API_KEY

    const response = await POST(makeRequest({ query: 'Nearby restaurants' }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Concierge search is not configured',
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('hides upstream errors and credentials', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 } as Response)

    const response = await POST(makeRequest({ query: 'Nearby restaurants' }))
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({ error: 'Concierge search is temporarily unavailable' })
    expect(JSON.stringify(body)).not.toContain('tvly-test-secret')
  })
})
