import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SignInPage from '@/app/sign-in/[[...sign-in]]/page'
import { isEmbeddedBrowser, SignInExperience } from '@/components/SignInExperience'

jest.mock('@clerk/nextjs', () => ({
  SignIn: () => <div>Clerk sign in</div>,
}))

describe('SignInPage', () => {
  const originalUsername = process.env.NEXT_PUBLIC_DEMO_USERNAME
  const originalPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD
  const originalUserAgent = window.navigator.userAgent

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_USERNAME = originalUsername
    process.env.NEXT_PUBLIC_DEMO_PASSWORD = originalPassword
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
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

  it('recognizes Slack and iOS webviews without blocking full browsers', () => {
    expect(isEmbeddedBrowser('Slack/24.08.20 CFNetwork iPhone')).toBe(true)
    expect(
      isEmbeddedBrowser(
        'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148'
      )
    ).toBe(true)
    expect(
      isEmbeddedBrowser(
        'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15'
      )
    ).toBe(false)
  })

  it('replaces Clerk with browser-opening guidance inside Slack', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Slack/24.08.20 CFNetwork iPhone',
    })
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<SignInExperience />)

    expect(
      await screen.findByRole('heading', { name: /open landline in safari or chrome/i })
    ).toBeInTheDocument()
    expect(screen.queryByText('Clerk sign in')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /copy landline link/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href))
    expect(screen.getByRole('button', { name: /link copied/i })).toBeInTheDocument()
  })
})
