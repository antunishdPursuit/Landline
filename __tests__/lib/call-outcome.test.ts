import { getCallOutcome } from '@/lib/call-outcome'
import type { CallEndReason } from '@/lib/types'

describe('call outcome presentation', () => {
  it.each<readonly [CallEndReason, string]>([
    ['guest_ended', 'You ended the call.'],
    ['agent_ended', 'The agent finished the conversation.'],
    ['demo_time_limit', 'The 60-second demo limit was reached.'],
    ['silence_timeout', 'The call ended because no speech was detected.'],
    ['connection_lost', 'The call ended because the connection was interrupted.'],
    ['client_error', 'The call ended because of a technical issue.'],
    ['unknown', 'The call ended, but the exact reason was unavailable.'],
  ])('describes %s clearly', (reason, message) => {
    expect(getCallOutcome({ end_reason: reason }).message).toBe(message)
  })

  it('falls back safely when the provider reason is absent', () => {
    expect(getCallOutcome({}).label).toBe('End reason unavailable')
  })
})
