interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

const entries = new Map<string, RateLimitEntry>()

export function checkFixedWindowRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  const current = entries.get(key)
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs })
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  current.count += 1
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds,
  }
}

export function clearRateLimitsForTests(): void {
  entries.clear()
}
