import 'server-only'

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { auth } from '@clerk/nextjs/server'

const TOKEN_TTL_SECONDS = 180
const TOKEN_AUDIENCE = 'landline-client-tools'

type ToolTokenPayload = {
  audience: typeof TOKEN_AUDIENCE
  expires_at: number
  issued_at: number
  nonce: string
  subject: string
  conversation_id: string
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

export function createToolAccessToken(userId: string, conversationId: string, now = Date.now()): string {
  if (!userId || !/^[A-Za-z0-9_-]{1,160}$/.test(conversationId)) throw new Error('Invalid session scope')
  const issuedAt = Math.floor(now / 1000)
  const payload: ToolTokenPayload = {
    audience: TOKEN_AUDIENCE,
    expires_at: issuedAt + TOKEN_TTL_SECONDS,
    issued_at: issuedAt,
    nonce: randomBytes(16).toString('base64url'),
    subject: createHash('sha256').update(userId).digest('hex'),
    conversation_id: conversationId,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const encodedSignature = signature(encodedPayload).toString('base64url')
  return `${encodedPayload}.${encodedSignature}`
}

function readToken(token: string, now = Date.now()): ToolTokenPayload | null {
  if (token.length > 2048) return null
  const [encodedPayload, encodedSignature, extra] = token.split('.')
  if (!encodedPayload || !encodedSignature || extra || !/^[A-Za-z0-9_-]+$/.test(encodedPayload) || !/^[A-Za-z0-9_-]+$/.test(encodedSignature)) return null

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
    return null
  }

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null
  }

  const nowSeconds = Math.floor(now / 1000)
  const valid = (
    !!payload && typeof payload === 'object' && !Array.isArray(payload) &&
    payload.audience === TOKEN_AUDIENCE &&
    Number.isInteger(payload.issued_at) &&
    Number.isInteger(payload.expires_at) &&
    typeof payload.nonce === 'string' &&
    payload.nonce.length >= 16 &&
    typeof payload.subject === 'string' && /^[a-f0-9]{64}$/.test(payload.subject) &&
    typeof payload.conversation_id === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(payload.conversation_id) &&
    payload.issued_at <= nowSeconds + 30 &&
    payload.expires_at > nowSeconds &&
    payload.expires_at - payload.issued_at === TOKEN_TTL_SECONDS
  )
  return valid ? payload : null
}

export function verifyToolAccessToken(token: string, now = Date.now()): boolean {
  return readToken(token, now) !== null
}

export async function requestHasToolAccess(request: Request, conversationId?: string): Promise<boolean> {
  const toolToken = request.headers.get('x-landline-tool-token')
  const authorization = request.headers.get('authorization')
  const token = toolToken ?? (authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : '')
  const payload = readToken(token)
  if (!payload || (conversationId !== undefined && payload.conversation_id !== conversationId)) return false
  try {
    const { userId } = await auth()
    return !!userId && payload.subject === createHash('sha256').update(userId).digest('hex')
  } catch { return false }
}
