/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true })
import { searchStay22 } from '@/lib/stay22'

const input = { address: 'Example City', checkin: '2030-01-01', checkout: '2030-01-02', adults: 1, children: 0, rooms: 1 }
const original = process.env.STAY22_API_BASE_URL
beforeEach(() => { process.env.STAY22_API_BASE_URL = 'https://api.stay22.com/v2/accommodations' })
afterAll(() => {
  if (original === undefined) delete process.env.STAY22_API_BASE_URL
  else process.env.STAY22_API_BASE_URL = original
})

async function search(url: string, link?: string) {
  const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({
    meta: { currency: 'USD' }, results: [{ id: 'fixture', name: 'Fixture Hotel', url,
      suppliers: link ? { supplier: { link, price: { total: 10 } } } : {} }],
  })))
  return searchStay22(input, fetcher)
}

it.each(['https://stay22.com/hotel', 'https://www.stay22.com/hotel', 'https://sub.stay22.com/hotel'])('accepts a real Stay22 host: %s', async url => {
  expect((await search(url)).options).toHaveLength(1)
})

it.each(['https://evil-stay22.com/hotel', 'https://notstay22.com/hotel', 'https://stay22.com.attacker.example/hotel', 'https://stay22.com@attacker.example/hotel', 'https://user@stay22.com/hotel', 'http://stay22.com/hotel'])('rejects deceptive or insecure URLs: %s', async url => {
  expect((await search(url)).options).toHaveLength(0)
})

it('rejects a deceptive supplier link while preserving the trusted fallback', async () => {
  const result = await search('https://www.stay22.com/hotel', 'https://notstay22.com/supplier')
  expect(result.options[0].url).toBe('https://www.stay22.com/hotel')
  expect(result.options[0].supplier).toBeNull()
})
