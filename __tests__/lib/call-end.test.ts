import {
  reasonFromElevenLabs,
  sanitizeCallEndDetail,
} from '@/lib/call-end'

describe('call end normalization', () => {
  it.each([
    ['Silence timeout reached', 'silence_timeout'],
    ['Max duration reached', 'demo_time_limit'],
    ['Client disconnected', 'guest_ended'],
    ['Agent initiated conversation termination', 'agent_ended'],
    ['WebSocket connection closed', 'connection_lost'],
    ['Internal error', 'client_error'],
  ] as const)('maps %s to %s', (detail, expected) => {
    expect(reasonFromElevenLabs(detail, 'unknown')).toBe(expected)
  })

  it('keeps the observed reason for an unknown provider value', () => {
    expect(reasonFromElevenLabs('Finished', 'agent_ended')).toBe('agent_ended')
  })

  it('normalizes and limits stored details', () => {
    expect(sanitizeCallEndDetail('  socket\n closed  ')).toBe('socket closed')
    expect(sanitizeCallEndDetail('x'.repeat(300))).toHaveLength(240)
  })
})
