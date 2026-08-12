/** @jest-environment node */

jest.mock('server-only', () => ({}), { virtual: true })

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/elevenlabs/conversation-end/route'
import { createToolAccessToken } from '@/lib/tool-access-token'

const ORIGINAL_ENV = process.env

function makeRequest(conversationId: unknown, authorized = true): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authorized) headers.Authorization = `Bearer ${createToolAccessToken()}`
  return new NextRequest('http://localhost/api/elevenlabs/conversation-end', {
    method: 'POST',
    headers,
    body: JSON.stringify({ conversationId }),
  })
}

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    ELEVENLABS_API_KEY: 'test-api-key',
    ELEVENLABS_AGENT_ID: 'test-agent-id',
  }
  global.fetch = jest.fn()
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('POST /api/elevenlabs/conversation-end', () => {
  it('rejects requests without the short-lived session token', async () => {
    const response = await POST(makeRequest('conv_123', false))

    expect(response.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns only the provider termination reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        conversation_id: 'conv_123',
        termination_reason: 'Agent initiated conversation termination',
        transcript: [{ role: 'user', message: 'private transcript' }],
      }),
    } as Response)

    const response = await POST(makeRequest('conv_123'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      terminationReason: 'Agent initiated conversation termination',
    })
    expect(JSON.stringify(body)).not.toContain('private transcript')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/convai/conversations/conv_123',
      expect.objectContaining({
        method: 'GET',
        headers: { 'xi-api-key': 'test-api-key' },
        cache: 'no-store',
      })
    )
  })

  it.each(['', '../secret', 'conversation id', 123])(
    'rejects an invalid conversation ID: %p',
    async (conversationId) => {
      const response = await POST(makeRequest(conversationId))

      expect(response.status).toBe(400)
      expect(global.fetch).not.toHaveBeenCalled()
    }
  )

  it('hides upstream failures', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 } as Response)

    const response = await POST(makeRequest('conv_123'))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Conversation details are temporarily unavailable',
    })
  })
})
