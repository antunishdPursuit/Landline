import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DemoRequestButton } from '@/components/DemoRequestButton'
import { readDemoState } from '@/lib/demo-store'
import { EMPTY_CONFIG } from '@/types/agent'

let signedIn = true

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: signedIn }),
}))

beforeEach(() => {
  localStorage.clear()
  signedIn = true
})

describe('DemoRequestButton', () => {
  it('previews and stores one housekeeping request before navigating', () => {
    const navigate = jest.fn()
    render(
      <DemoRequestButton
        config={{ ...EMPTY_CONFIG, name: 'The Example Hotel' }}
        onNavigate={navigate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show demo request' }))
    expect(screen.getByText('Two additional towels')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Send demo request' }))

    expect(readDemoState().tickets[0]).toMatchObject({
      room_number: '1208',
      department: 'housekeeping',
      summary: 'Two additional towels requested at The Example Hotel',
      status: 'new',
    })
    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('sends signed-out staff through Clerk with a dashboard redirect', () => {
    signedIn = false
    const navigate = jest.fn()
    render(<DemoRequestButton config={EMPTY_CONFIG} onNavigate={navigate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Show demo request' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send demo request' }))

    expect(navigate).toHaveBeenCalledWith('/sign-in?redirect_url=%2Fdashboard')
  })
})
