/** @vitest-environment node */
import { expect, test, vi } from "vitest";
import { readJsonObject } from '@/lib/request-json'

function request(body: string, headers: Record<string, string> = {}) {
  return new Request('https://landline.example/api/requests', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body,
  })
}

test.each(['null', '[]', '"text"', '1', '{'])('rejects non-object or malformed JSON: %s', async body => {
  expect((await readJsonObject(request(body))).response?.status).toBe(400)
})

test('accepts a small valid object and rejects unsupported content types', async () => {
  expect((await readJsonObject(request('{"summary":"Towels"}'))).body).toEqual({ summary: 'Towels' })
  expect((await readJsonObject(request('{}', { 'Content-Type': 'text/plain' }))).response?.status).toBe(415)
})

test('bounds declared and streamed byte lengths, including multibyte UTF-8', async () => {
  expect((await readJsonObject(request('{}', { 'Content-Length': '99999' }))).response?.status).toBe(413)
  expect((await readJsonObject(request(JSON.stringify({ text: '€'.repeat(4000) })))).response?.status).toBe(413)
})

test('cancels an oversized chunked body without trusting Content-Length', async () => {
  const cancel = vi.fn()
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(8193)) }, cancel })
  const req = new Request('https://landline.example', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '2' },
    body: stream, duplex: 'half',
  } as RequestInit)
  expect((await readJsonObject(req)).response?.status).toBe(413)
  expect(cancel).toHaveBeenCalledTimes(1)
})

test('rejects and cancels a stalled stream within the body deadline', async () => {
  vi.useFakeTimers()
  try {
    const cancel = vi.fn()
    const req = new Request('https://landline.example', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: new ReadableStream({ cancel }), duplex: 'half',
    } as RequestInit)
    const pending = readJsonObject(req)
    await vi.advanceTimersByTimeAsync(5001)
    expect((await pending).response?.status).toBe(400)
    expect(cancel).toHaveBeenCalledTimes(1)
  } finally { vi.useRealTimers() }
})
