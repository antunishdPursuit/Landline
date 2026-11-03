import 'server-only'

import { createHash } from 'node:crypto'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// All three reservations succeed together or none do. Counters are shared
// across instances; an unavailable store never grants a local allowance.
const RESERVE = `
for i = 1, 3 do
  if tonumber(redis.call('GET', KEYS[i]) or '0') >= tonumber(ARGV[i]) then return 0 end
end
for i = 1, 3 do
  local count = redis.call('INCR', KEYS[i])
  if count == 1 then redis.call('EXPIRE', KEYS[i], ARGV[i + 3]) end
end
return 1`

function denied(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, {
    status,
    headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) },
  })
}

function limit(name: string, maximum: number): number | null {
  const raw = process.env[name]
  if (!raw || !/^\d+$/.test(raw)) return null
  const value = Number(raw)
  return Number.isSafeInteger(value) && value > 0 && value <= maximum ? value : null
}

export async function authorizePaidRequest(): Promise<NextResponse | null> {
  if (process.env.LANDLINE_PAID_SERVICES_ENABLED !== 'true') {
    return denied(503, 'Paid services are paused')
  }

  let userId: string | null
  try { ({ userId } = await auth()) } catch {
    return denied(503, 'Authorization is unavailable')
  }
  if (!userId) return denied(401, 'Sign in to use paid services')

  const limits = [
    limit('LANDLINE_GLOBAL_DAILY_REQUESTS', 1000),
    limit('LANDLINE_USER_DAILY_REQUESTS', 100),
    limit('LANDLINE_USER_MINUTE_REQUESTS', 10),
  ]
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  let endpoint: URL
  try {
    endpoint = new URL(process.env.UPSTASH_REDIS_REST_URL || '')
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password ||
        endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw new Error('Invalid endpoint')
  } catch {
    return denied(503, 'Usage controls are not configured')
  }
  if (!token || limits.some(value => value === null)) {
    return denied(503, 'Usage controls are not configured')
  }

  const seconds = Math.floor(Date.now() / 1000)
  const day = Math.floor(seconds / 86400)
  const minute = Math.floor(seconds / 60)
  const user = createHash('sha256').update(userId).digest('hex')
  const prefix = '{landline-quota}'
  const dayTtl = 86400 - seconds % 86400 + 60
  const minuteTtl = 60 - seconds % 60 + 60
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', RESERVE, '3',
        `${prefix}:global:${day}`, `${prefix}:user:${user}:${day}`, `${prefix}:minute:${user}:${minute}`,
        ...limits.map(String), String(dayTtl), String(dayTtl), String(minuteTtl)]),
      signal: AbortSignal.timeout(2500), cache: 'no-store', redirect: 'error',
    })
    if (!response.ok) return denied(503, 'Usage controls are unavailable')
    const body: unknown = await response.json()
    if (!body || typeof body !== 'object' || 'error' in body || !('result' in body)) {
      return denied(503, 'Usage controls are unavailable')
    }
    if (body.result === 0) return denied(429, 'Paid-service usage limit reached')
    if (body.result !== 1) return denied(503, 'Usage controls are unavailable')
    return null
  } catch {
    return denied(503, 'Usage controls are unavailable')
  }
}
