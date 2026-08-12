import type { CallEndReason } from './types'

const MAX_END_DETAIL_LENGTH = 240

export function sanitizeCallEndDetail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return null
  return normalized.slice(0, MAX_END_DETAIL_LENGTH)
}

export function reasonFromElevenLabs(
  terminationReason: string,
  fallback: CallEndReason
): CallEndReason {
  const reason = terminationReason.toLowerCase()

  if (reason.includes('silence') || reason.includes('inactivity')) {
    return 'silence_timeout'
  }
  if (reason.includes('max duration') || reason.includes('time limit')) {
    return 'demo_time_limit'
  }
  if (
    reason.includes('client disconnected') ||
    reason.includes('user ended') ||
    reason.includes('user initiated')
  ) {
    return 'guest_ended'
  }
  if (reason.includes('agent')) return 'agent_ended'
  if (
    reason.includes('connection') ||
    reason.includes('websocket') ||
    reason.includes('network')
  ) {
    return 'connection_lost'
  }
  if (reason.includes('error') || reason.includes('failed')) {
    return 'client_error'
  }

  return fallback
}
