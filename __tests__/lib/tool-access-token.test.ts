/** @vitest-environment node */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn().mockResolvedValue({ userId: 'test-user' }) }))

vi.mock('server-only', () => ({}))

import { auth } from '@clerk/nextjs/server'
import { createHmac } from 'node:crypto'
import {
  createToolAccessToken,
  requestHasToolAccess,
  verifyToolAccessToken,
} from '@/lib/tool-access-token'

const ORIGINAL_ENV = process.env

beforeEach(() => {
  ;(auth as unknown as Mock).mockResolvedValue({ userId: 'test-user' })
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
  it('rejects another user, signed-out callers, or a different conversation', async () => {
    const token = createToolAccessToken('test-user', 'conv_123')
    const request = new Request('https://landline.example', { headers: { 'X-Landline-Tool-Token': token } })
    expect(await requestHasToolAccess(request, 'conv_123')).toBe(true)
    expect(await requestHasToolAccess(request, 'conv_other')).toBe(false)
    ;(auth as unknown as Mock).mockResolvedValue({ userId: 'other-user' })
    expect(await requestHasToolAccess(request)).toBe(false)
    ;(auth as unknown as Mock).mockResolvedValue({ userId: null })
    expect(await requestHasToolAccess(request)).toBe(false)
    ;(auth as unknown as Mock).mockRejectedValue(new Error('Session unavailable'))
    expect(await requestHasToolAccess(request)).toBe(false)
  })

  it('rejects oversized tokens and valid signatures over malformed payloads', () => {
    const key = createHmac('sha256', 'test-api-key').update('landline-tool-access:test-agent-id').digest()
    for (const payload of [null, [], 'text', {}]) {
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = createHmac('sha256', key).update(encoded).digest('base64url')
      expect(verifyToolAccessToken(`${encoded}.${signature}`)).toBe(false)
    }
    expect(verifyToolAccessToken('a'.repeat(2049))).toBe(false)
  })
  it('accepts the dedicated tool header without replacing session authorization', async () => {
    const token = createToolAccessToken('test-user', 'conv_123')
    const request = new Request('https://landline.example/api/stays', {
      headers: { 'X-Landline-Tool-Token': token },
    })
    expect(request.headers.has('authorization')).toBe(false)
    expect(await requestHasToolAccess(request)).toBe(true)
    expect(await requestHasToolAccess(new Request('https://landline.example', {
      headers: { 'X-Landline-Tool-Token': 'invalid', Authorization: `Bearer ${token}` },
    }))).toBe(false)
  })
  it('accepts a freshly issued bearer token', async () => {
    const now = Date.parse('2026-08-12T12:00:00.000Z')
    const token = createToolAccessToken('test-user', 'conv_123', now)
    const currentToken = createToolAccessToken('test-user', 'conv_123')
    const request = new Request('https://landline.example/api/stays', {
      headers: { Authorization: `Bearer ${currentToken}` },
    })

    expect(verifyToolAccessToken(token, now)).toBe(true)
    expect(await requestHasToolAccess(request)).toBe(true)
  })

  it('rejects missing, tampered, and expired tokens', async () => {
    const now = Date.parse('2026-08-12T12:00:00.000Z')
    const token = createToolAccessToken('test-user', 'conv_123', now)
    const [payload, signature] = token.split('.')
    const tamperedSignature = `${signature.startsWith('a') ? 'b' : 'a'}${signature.slice(1)}`
    const tampered = `${payload}.${tamperedSignature}`

    expect(await requestHasToolAccess(new Request('https://landline.example'))).toBe(false)
    expect(verifyToolAccessToken(tampered, now)).toBe(false)
    expect(verifyToolAccessToken(token, now + 181_000)).toBe(false)
  })
})
