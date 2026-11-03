/** @jest-environment node */
import { searchConcierge, TavilyUpstreamError } from '@/lib/tavily'
const env = process.env
const originalFetch = global.fetch
beforeEach(() => { process.env = { ...env, TAVILY_API_KEY: 'synthetic-key' } })
afterEach(() => { process.env = env; global.fetch = originalFetch })

test('only returns credential-free HTTPS sources and never follows provider redirects', async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
    answer: 'Test answer', results: [
      { title: 'Valid', url: 'https://example.com/source' },
      { title: 'Unsafe', url: 'javascript:alert(1)' },
      { title: 'Malformed', url: 'httpjavascript:alert(1)' },
      { title: 'Credentials', url: 'https://user:password@example.com' },
      { title: 'Plaintext', url: 'http://example.com' },
    ],
  })))
  expect((await searchConcierge('test')).sources).toHaveLength(1)
  expect(fetch).toHaveBeenCalledWith('https://api.tavily.com/search', expect.objectContaining({ cache: 'no-store', redirect: 'error' }))
})

test.each([null, [], 'text'])('rejects malformed provider objects without exposing response data', async payload => {
  global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify(payload)))
  await expect(searchConcierge('test')).rejects.toBeInstanceOf(TavilyUpstreamError)
})
