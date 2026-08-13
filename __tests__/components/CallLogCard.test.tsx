import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CallLogCard } from '@/components/CallLogCard'
import type { CallLog } from '@/lib/types'

const BASE_CALL: CallLog = {
  id: 'conv_123',
  room_number: '1208',
  language_detected: 'en',
  duration_seconds: 42,
  transcript: [
    { speaker: 'guest', text: 'Are you still there?' },
    { speaker: 'agent', text: 'Yes, how can I help?' },
  ],
  intent: 'answerable_qa',
  department: null,
  request_summary: null,
  requires_human: false,
  created_at: new Date().toISOString(),
}

describe('CallLogCard', () => {
  it('shows a recorded end reason and its provider detail', () => {
    render(
      <CallLogCard
        call={{
          ...BASE_CALL,
          end_reason: 'silence_timeout',
          end_source: 'elevenlabs',
          end_detail: 'Silence timeout reached',
          ended_at: new Date().toISOString(),
        }}
        justArrived={false}
      />
    )

    expect(screen.getByText('Silence timeout')).toBeInTheDocument()
    expect(screen.queryByText('Silence timeout reached')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'View transcript' }))

    expect(screen.getByText('Silence timeout reached')).toBeInTheDocument()
  })

  it('keeps older stored calls readable when no end reason exists', () => {
    render(<CallLogCard call={BASE_CALL} justArrived={false} />)

    expect(screen.getByText('End reason unavailable')).toBeInTheDocument()
  })

  it('opens a newly completed call transcript by default', () => {
    render(
      <CallLogCard call={BASE_CALL} justArrived defaultExpanded />
    )

    expect(screen.getByText('Are you still there?')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Hide transcript' })
    ).toBeInTheDocument()
  })
})
