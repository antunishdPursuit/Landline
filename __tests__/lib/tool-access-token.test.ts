/** @jest-environment node */

jest.mock('server-only', () => ({}), { virtual: true })

import {
  createToolAccessToken,
  requestHasToolAccess,
  verifyToolAccessToken,
} from '@/lib/tool-access-token'

const ORIGINAL_ENV = process.env

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    ELEVENLABS_API_KEY: 'test-api-key',
    ELEVENLABS_AGENT_ID: 'test-agent-id',
  }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('tool access tokens', () => {
  it('accepts a freshly issued bearer token', () => {
    const now = Date.parse('2026-08-12T12:00:00.000Z')
    const token = createToolAccessToken(now)
    const currentToken = createToolAccessToken()
    const request = new Request('https://landline.example/api/stays', {
      headers: { Authorization: `Bearer ${currentToken}` },
    })

    expect(verifyToolAccessToken(token, now)).toBe(true)
    expect(requestHasToolAccess(request)).toBe(true)
  })

  it('rejects missing, tampered, and expired tokens', () => {
    const now = Date.parse('2026-08-12T12:00:00.000Z')
    const token = createToolAccessToken(now)
    const [payload, signature] = token.split('.')
    const tamperedSignature = `${signature.startsWith('a') ? 'b' : 'a'}${signature.slice(1)}`
    const tampered = `${payload}.${tamperedSignature}`

    expect(requestHasToolAccess(new Request('https://landline.example'))).toBe(false)
    expect(verifyToolAccessToken(tampered, now)).toBe(false)
    expect(verifyToolAccessToken(token, now + 181_000)).toBe(false)
  })
})
