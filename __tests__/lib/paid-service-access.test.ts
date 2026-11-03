/** @jest-environment node */
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }))

import { auth } from '@clerk/nextjs/server'
import { authorizePaidRequest } from '@/lib/paid-service-access'

const originalEnv = process.env
const originalFetch = global.fetch
beforeEach(() => {
  process.env = { ...originalEnv,
    LANDLINE_PAID_SERVICES_ENABLED: 'true',
    UPSTASH_REDIS_REST_URL: 'https://quota.example/',
    UPSTASH_REDIS_REST_TOKEN: 'synthetic-quota-token',
    LANDLINE_GLOBAL_DAILY_REQUESTS: '20',
    LANDLINE_USER_DAILY_REQUESTS: '5',
    LANDLINE_USER_MINUTE_REQUESTS: '2',
  }
  ;(auth as unknown as jest.Mock).mockResolvedValue({ userId: 'synthetic-user' })
  global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ result: 1 })))
})
afterEach(() => { process.env = originalEnv; global.fetch = originalFetch; jest.resetAllMocks() })

test('paid calls are paused by default even when credentials exist', async () => {
  delete process.env.LANDLINE_PAID_SERVICES_ENABLED
  expect((await authorizePaidRequest())?.status).toBe(503)
  expect(auth).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})
test('authentication is required before a reservation', async () => {
  ;(auth as unknown as jest.Mock).mockResolvedValue({ userId: null })
  expect((await authorizePaidRequest())?.status).toBe(401)
  expect(fetch).not.toHaveBeenCalled()
})
test.each(['UPSTASH_REDIS_REST_TOKEN', 'UPSTASH_REDIS_REST_URL', 'LANDLINE_GLOBAL_DAILY_REQUESTS', 'LANDLINE_USER_DAILY_REQUESTS', 'LANDLINE_USER_MINUTE_REQUESTS'])('missing %s fails closed', async name => {
  delete process.env[name]
  expect((await authorizePaidRequest())?.status).toBe(503)
  expect(fetch).not.toHaveBeenCalled()
})
test.each(['0', '-1', '1.5', '999999', 'Infinity'])('invalid quota %s fails closed', async value => {
  process.env.LANDLINE_USER_DAILY_REQUESTS = value
  expect((await authorizePaidRequest())?.status).toBe(503)
  expect(fetch).not.toHaveBeenCalled()
})
test('one atomic operation reserves global, daily-user and minute-user quotas', async () => {
  expect(await authorizePaidRequest()).toBeNull()
  const [, options] = (fetch as jest.Mock).mock.calls[0]
  const command = JSON.parse(options.body)
  expect(command[0]).toBe('EVAL')
  expect(command[2]).toBe('3')
  expect(command.slice(3, 6).every((key: string) => key.startsWith('{landline-quota}:'))).toBe(true)
  expect(options.body).not.toContain('synthetic-user')
  expect(options).toMatchObject({ cache: 'no-store', redirect: 'error' })
})
test('exhaustion is rejected without granting an allowance', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(new Response('{"result":0}'))
  const response = await authorizePaidRequest()
  expect(response?.status).toBe(429)
  expect(response?.headers.get('Retry-After')).toBe('60')
})
test.each([{ error: 'store error' }, { result: '1' }, {}, { result: 9 }])('invalid store response fails closed', async body => {
  ;(fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify(body)))
  expect((await authorizePaidRequest())?.status).toBe(503)
})
test('store failures and authorization failures fail closed', async () => {
  ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  expect((await authorizePaidRequest())?.status).toBe(503)
  ;(auth as unknown as jest.Mock).mockRejectedValue(new Error('offline'))
  expect((await authorizePaidRequest())?.status).toBe(503)
})
