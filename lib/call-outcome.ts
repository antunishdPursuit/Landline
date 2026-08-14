import type { CallEndReason, CallLog } from './types'

export type CallOutcomeTone = 'neutral' | 'warning' | 'error'

export interface CallOutcomePresentation {
  label: string
  title: string
  message: string
  tone: CallOutcomeTone
}

const CALL_OUTCOMES: Record<CallEndReason, CallOutcomePresentation> = {
  guest_ended: {
    label: 'Guest ended',
    title: 'Call complete',
    message: 'You ended the call.',
    tone: 'neutral',
  },
  agent_ended: {
    label: 'Agent ended',
    title: 'Call complete',
    message: 'The agent finished the conversation.',
    tone: 'neutral',
  },
  demo_time_limit: {
    label: 'Demo limit',
    title: 'Demo limit reached',
    message: 'The 60-second demo limit was reached.',
    tone: 'warning',
  },
  silence_timeout: {
    label: 'Silence timeout',
    title: 'Call ended',
    message: 'The call ended because no speech was detected.',
    tone: 'warning',
  },
  connection_lost: {
    label: 'Connection lost',
    title: 'Connection interrupted',
    message: 'The call ended because the connection was interrupted.',
    tone: 'error',
  },
  client_error: {
    label: 'Call error',
    title: 'Technical issue',
    message: 'The call ended because of a technical issue.',
    tone: 'error',
  },
  unknown: {
    label: 'End reason unavailable',
    title: 'Call ended',
    message: 'The call ended, but the exact reason was unavailable.',
    tone: 'warning',
  },
}

export function getCallOutcome(
  call: Pick<CallLog, 'end_reason'>
): CallOutcomePresentation {
  return CALL_OUTCOMES[call.end_reason ?? 'unknown']
}
