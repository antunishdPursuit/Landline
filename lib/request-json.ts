import 'server-only'
import { NextResponse } from 'next/server'

const MAX_BODY_BYTES = 8192
const BODY_TIMEOUT_MS = 5000

export async function readJsonObject(request: Request): Promise<
  { body: Record<string, unknown>; response?: never } |
  { response: NextResponse; body?: never }
> {
  const reject = (status: number, error: string) => ({
    response: NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } }),
  })
  const length = request.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    return reject(413, 'Request body is too large')
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reject(415, 'Content-Type must be application/json')
  }
  if (!request.body) return reject(400, 'A JSON object is required')
  const reader = request.body.getReader()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, rejectTimeout) => {
    timer = setTimeout(() => rejectTimeout(new Error('Body timeout')), BODY_TIMEOUT_MS)
  })
  try {
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout])
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) return reject(413, 'Request body is too large')
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reject(400, 'A JSON object is required')
    return { body: body as Record<string, unknown> }
  } catch {
    return reject(400, 'A valid JSON object is required')
  } finally {
    clearTimeout(timer)
    void reader.cancel().catch(() => {})
  }
}
