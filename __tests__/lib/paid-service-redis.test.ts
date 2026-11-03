/** @jest-environment node */
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }))
import { createConnection } from 'node:net'
import { auth } from '@clerk/nextjs/server'
import { authorizePaidRequest } from '@/lib/paid-service-access'

// Use a disposable, empty loopback Redis instance; never a production store.
const port = Number(process.env.LANDLINE_TEST_REDIS_PORT)
const integration = Number.isInteger(port) && port > 0 && port <= 65535 ? describe : describe.skip

function command(args: string[]): Promise<number | string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    let data = ''
    socket.setTimeout(3000, () => socket.destroy(new Error('Redis test timeout')))
    socket.on('error', reject)
    socket.on('connect', () => socket.write(`*${args.length}\r\n` + args.map(arg => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join('')))
    socket.on('data', chunk => {
      data += chunk.toString()
      const end = data.indexOf('\r\n')
      if (end < 0) return
      socket.destroy()
      if (data[0] === ':') resolve(Number(data.slice(1, end)))
      else if (data[0] === '+') resolve(data.slice(1, end))
      else reject(new Error('Redis test command failed'))
    })
  })
}

integration('atomic quotas against real Redis', () => {
  const env = process.env
  const originalFetch = global.fetch
  beforeEach(async () => {
    await command(['FLUSHDB'])
    process.env = { ...env,
      LANDLINE_PAID_SERVICES_ENABLED: 'true',
      UPSTASH_REDIS_REST_URL: 'https://quota.example/', UPSTASH_REDIS_REST_TOKEN: 'synthetic-token',
      LANDLINE_GLOBAL_DAILY_REQUESTS: '20', LANDLINE_USER_DAILY_REQUESTS: '5', LANDLINE_USER_MINUTE_REQUESTS: '2',
    }
    ;(auth as unknown as jest.Mock).mockResolvedValue({ userId: 'quota-user' })
    global.fetch = jest.fn(async (_url, options) => {
      const result = await command(JSON.parse(String(options?.body)))
      return new Response(JSON.stringify({ result }))
    }) as typeof fetch
  })
  afterEach(() => { process.env = env; global.fetch = originalFetch })

  test('concurrent callers cannot exceed a per-user minute reservation', async () => {
    const responses = await Promise.all(Array.from({ length: 20 }, () => authorizePaidRequest()))
    expect(responses.filter(r => r === null)).toHaveLength(2)
    expect(responses.filter(r => r?.status === 429)).toHaveLength(18)
    const keys = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).slice(3, 6)
    for (const key of keys) {
      expect(await command(['INCRBY', key, '0'])).toBe(2)
      expect(await command(['TTL', key])).toBeGreaterThan(0)
    }
  })

  test('a global cap is shared by different users without partially reserving denied requests', async () => {
    process.env.LANDLINE_GLOBAL_DAILY_REQUESTS = '3'
    ;(auth as unknown as jest.Mock).mockImplementation(() => Promise.resolve({ userId: `quota-user-${Math.random()}` }))
    const responses = await Promise.all(Array.from({ length: 12 }, () => authorizePaidRequest()))
    expect(responses.filter(r => r === null)).toHaveLength(3)
    expect(responses.filter(r => r?.status === 429)).toHaveLength(9)
    const key = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)[3]
    expect(await command(['INCRBY', key, '0'])).toBe(3)
  })

  test('Redis errors fail closed without contacting a provider', async () => {
    global.fetch = jest.fn(async () => {
      try { await command(['EVAL', 'return redis.error_reply("unavailable")', '0']) }
      catch { return new Response(JSON.stringify({ error: 'store unavailable' })) }
      throw new Error('Expected Redis error')
    }) as typeof fetch
    expect((await authorizePaidRequest())?.status).toBe(503)
  })
})
