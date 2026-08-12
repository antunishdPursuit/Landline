import { fireEvent, render, screen } from '@testing-library/react'
import { TicketCard } from '@/components/TicketCard'
import type { GuestRequest } from '@/lib/types'

jest.mock('@/components/Badges', () => ({
  DepartmentBadge: () => null,
  LanguageBadge: () => null,
  NeedsHumanBadge: () => null,
  UrgencyBadge: () => null,
}))

const request: GuestRequest = {
  id: 'req_test',
  room_number: '1208',
  intent: 'physical_request',
  department: 'housekeeping',
  summary: 'Two towels requested',
  urgency: 'medium',
  language_detected: 'en',
  status: 'new',
  requires_human: false,
  assigned_to: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TicketCard', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('removes a request after confirmation', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    const onRemove = jest.fn()

    render(
      <TicketCard
        request={request}
        justArrived={false}
        currentStaffName="Demo Manager"
        onAdvanceStatus={jest.fn()}
        onRemove={onRemove}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove request for room 1208' }))

    expect(window.confirm).toHaveBeenCalledWith('Remove the request for room 1208?')
    expect(onRemove).toHaveBeenCalledWith('req_test')
  })

  it('keeps a request when removal is canceled', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    const onRemove = jest.fn()

    render(
      <TicketCard
        request={request}
        justArrived={false}
        currentStaffName="Demo Manager"
        onAdvanceStatus={jest.fn()}
        onRemove={onRemove}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove request for room 1208' }))

    expect(onRemove).not.toHaveBeenCalled()
  })
})
