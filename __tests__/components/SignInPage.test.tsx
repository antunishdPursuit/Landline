import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SignInPage from '@/app/sign-in/[[...sign-in]]/page'

jest.mock('@clerk/nextjs', () => ({
  SignIn: () => <div>Clerk sign in</div>,
}))

describe('SignInPage', () => {
  const originalUsername = process.env.NEXT_PUBLIC_DEMO_USERNAME
  const originalPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_USERNAME = originalUsername
    process.env.NEXT_PUBLIC_DEMO_PASSWORD = originalPassword
  })

  it('shows configured demo credentials beside Clerk sign in', () => {
    process.env.NEXT_PUBLIC_DEMO_USERNAME = 'landline-demo'
    process.env.NEXT_PUBLIC_DEMO_PASSWORD = 'demo-password'

    render(<SignInPage />)

    expect(screen.getByText('landline-demo')).toBeInTheDocument()
    expect(screen.getByText('demo-password')).toBeInTheDocument()
    expect(screen.getByText('Clerk sign in')).toBeInTheDocument()
  })

  it('does not show an incomplete credential card', () => {
    process.env.NEXT_PUBLIC_DEMO_USERNAME = 'landline-demo'
    delete process.env.NEXT_PUBLIC_DEMO_PASSWORD

    render(<SignInPage />)

    expect(screen.queryByText('Demo manager access')).not.toBeInTheDocument()
  })
})
