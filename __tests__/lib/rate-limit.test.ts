import {
  checkFixedWindowRateLimit,
  clearRateLimitsForTests,
} from '@/lib/rate-limit'

beforeEach(() => {
  clearRateLimitsForTests()
})

describe('fixed-window rate limiter', () => {
  it('blocks requests beyond the limit until the window resets', () => {
    expect(checkFixedWindowRateLimit('guest', 2, 600_000, 1_000)).toMatchObject({
      allowed: true,
      remaining: 1,
    })
    expect(checkFixedWindowRateLimit('guest', 2, 600_000, 2_000)).toMatchObject({
      allowed: true,
      remaining: 0,
    })
    expect(checkFixedWindowRateLimit('guest', 2, 600_000, 3_000)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 598,
    })
    expect(checkFixedWindowRateLimit('guest', 2, 600_000, 601_000)).toMatchObject({
      allowed: true,
      remaining: 1,
    })
  })
})
