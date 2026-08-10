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

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, STAY22_AID: 'landline-demo' }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('POST /api/stays', () => {
  it('returns a tracked Stay22 Roam destination', async () => {
    const response = await POST(
      makeRequest({ destination: 'The Ritz-Carlton New York, NoMad' })
    )
    const body = await response.json()
    const url = new URL(body.recommendation.url)

    expect(response.status).toBe(200)
    expect(body.status).toBe('ready')
    expect(body.recommendation).toMatchObject({
      title: 'View stays near The Ritz-Carlton New York, NoMad',
      source: 'stay22',
    })
    expect(body.recommendation.id).toMatch(/^stay_/)
    expect(url.origin).toBe('https://www.stay22.com')
    expect(url.pathname).toBe('/allez/roam')
    expect(url.searchParams.get('aid')).toBe('landline-demo')
    expect(url.searchParams.get('address')).toBe(
      'The Ritz-Carlton New York, NoMad'
    )
  })

  it.each([
    [{}, 'A destination is required'],
    [{ destination: '   ' }, 'A destination is required'],
    [{ destination: 'x'.repeat(201) }, 'Destination is too long'],
  ])('rejects invalid input %#', async (input, message) => {
    const response = await POST(makeRequest(input))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: message })
  })

  it('fails safely when Stay22 is not configured', async () => {
    delete process.env.STAY22_AID

    const response = await POST(makeRequest({ destination: 'New York, NY' }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Stay search is not configured',
    })
  })

  it('does not accept a caller-supplied affiliate identifier', async () => {
    const response = await POST(
      makeRequest({ destination: 'New York, NY', aid: 'attacker' })
    )
    const body = await response.json()
    const url = new URL(body.recommendation.url)

    expect(url.searchParams.get('aid')).toBe('landline-demo')
    expect(url.searchParams.get('aid')).not.toBe('attacker')
  })
})
