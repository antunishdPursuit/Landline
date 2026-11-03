/** @jest-environment node */
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn().mockResolvedValue({ userId: 'test-user' }) }))
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/elevenlabs/signed-url/route'
import { POST as endConversation } from '@/app/api/elevenlabs/conversation-end/route'
import { POST as concierge } from '@/app/api/concierge/search/route'
import { POST as stays } from '@/app/api/stays/route'
import { createToolAccessToken } from '@/lib/tool-access-token'

test('every provider route is paused before parsing or contacting a provider', async () => {
  const original = process.env.LANDLINE_PAID_SERVICES_ENABLED
  const originalFetch = global.fetch
  const originalEnv = process.env
  process.env = { ...originalEnv, ELEVENLABS_API_KEY: 'synthetic-key', ELEVENLABS_AGENT_ID: 'synthetic-agent' }
  delete process.env.LANDLINE_PAID_SERVICES_ENABLED
  global.fetch = jest.fn()
  try {
    expect((await GET(new Request('https://landline.example/api/elevenlabs/signed-url'))).status).toBe(503)
    for (const handler of [endConversation, concierge, stays]) {
      const request = new NextRequest('http://localhost/api/example', {
        method: 'POST', body: 'invalid json', headers: { 'X-Landline-Tool-Token': createToolAccessToken('test-user', 'conv_123') },
      })
      expect((await handler(request)).status).toBe(503)
      expect(request.bodyUsed).toBe(false)
    }
    expect(fetch).not.toHaveBeenCalled()
  } finally {
    if (original === undefined) delete process.env.LANDLINE_PAID_SERVICES_ENABLED
    else process.env.LANDLINE_PAID_SERVICES_ENABLED = original
    global.fetch = originalFetch
    process.env = originalEnv
  }
})

test('missing capabilities are rejected before shared quota reservations', async () => {
  const originalEnv = process.env
  const originalFetch = global.fetch
  process.env = { ...originalEnv, LANDLINE_PAID_SERVICES_ENABLED: 'true' }
  global.fetch = jest.fn()
  try {
    for (const handler of [endConversation, concierge, stays]) {
      const response = await handler(new NextRequest('http://localhost/api/example', { method: 'POST', body: '{}' }))
      expect(response.status).toBe(401)
    }
    expect(fetch).not.toHaveBeenCalled()
  } finally { process.env = originalEnv; global.fetch = originalFetch }
})
