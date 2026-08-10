import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useStaffSession } from '@/lib/auth'

let clerkLoaded = true
let clerkUser: {
  publicMetadata: Record<string, unknown>
  fullName: string | null
  firstName: string | null
  username: string | null
} | null = null

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: clerkUser, isLoaded: clerkLoaded }),
  useClerk: () => ({ signOut: jest.fn() }),
}))

function SessionProbe() {
  const session = useStaffSession()
  if (session === undefined) return <span>loading</span>
  if (session === null) return <span>missing-role</span>
  return <span>{`${session.name}:${session.role}`}</span>
}

beforeEach(() => {
  clerkLoaded = true
  clerkUser = null
})

describe('Clerk staff role boundary', () => {
  it('waits while Clerk resolves the user', () => {
    clerkLoaded = false
    render(<SessionProbe />)

    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('rejects users without a supported role', () => {
    clerkUser = {
      publicMetadata: { role: 'owner' },
      fullName: 'Example Owner',
      firstName: null,
      username: null,
    }
    render(<SessionProbe />)

    expect(screen.getByText('missing-role')).toBeInTheDocument()
  })

  it.each([
    'front_desk',
    'housekeeping',
    'room_service',
    'maintenance',
    'manager',
  ])('accepts the %s staff role', (role) => {
    clerkUser = {
      publicMetadata: { role },
      fullName: 'Jordan Lee',
      firstName: null,
      username: null,
    }
    render(<SessionProbe />)

    expect(screen.getByText(`Jordan Lee:${role}`)).toBeInTheDocument()
  })
})
