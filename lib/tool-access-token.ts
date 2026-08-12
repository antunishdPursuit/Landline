import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_TTL_SECONDS = 180
const TOKEN_AUDIENCE = 'landline-client-tools'

type ToolTokenPayload = {
  audience: typeof TOKEN_AUDIENCE
  expires_at: number
  issued_at: number
  nonce: string
}

function signingKey(): Buffer {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  const agentId = process.env.ELEVENLABS_AGENT_ID?.trim()
  if (!apiKey || !agentId) {
    throw new Error('Tool access token signing is not configured')
  }

  return createHmac('sha256', apiKey)
    .update(`landline-tool-access:${agentId}`)
    .digest()
}

function signature(encodedPayload: string): Buffer {
  return createHmac('sha256', signingKey()).update(encodedPayload).digest()
}

export function createToolAccessToken(now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000)
  const payload: ToolTokenPayload = {
    audience: TOKEN_AUDIENCE,
    expires_at: issuedAt + TOKEN_TTL_SECONDS,
    issued_at: issuedAt,
    nonce: randomBytes(16).toString('base64url'),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const encodedSignature = signature(encodedPayload).toString('base64url')
  return `${encodedPayload}.${encodedSignature}`
}

export function verifyToolAccessToken(token: string, now = Date.now()): boolean {
  const [encodedPayload, encodedSignature, extra] = token.split('.')
  if (!encodedPayload || !encodedSignature || extra) return false

  let providedSignature: Buffer
  let expectedSignature: Buffer
  let payload: ToolTokenPayload
  try {
    providedSignature = Buffer.from(encodedSignature, 'base64url')
    expectedSignature = signature(encodedPayload)
    payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as ToolTokenPayload
  } catch {
    return false
  }

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return false
  }

  const nowSeconds = Math.floor(now / 1000)
  return (
    payload.audience === TOKEN_AUDIENCE &&
    Number.isInteger(payload.issued_at) &&
    Number.isInteger(payload.expires_at) &&
    typeof payload.nonce === 'string' &&
    payload.nonce.length >= 16 &&
    payload.issued_at <= nowSeconds + 30 &&
    payload.expires_at > nowSeconds &&
    payload.expires_at - payload.issued_at === TOKEN_TTL_SECONDS
  )
}

export function requestHasToolAccess(request: Request): boolean {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return false
  return verifyToolAccessToken(authorization.slice('Bearer '.length))
}
