import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TravelRecommendations } from '@/components/TravelRecommendations'
import { addTravelRecommendation } from '@/lib/demo-store'

beforeEach(() => {
  localStorage.clear()
})

describe('TravelRecommendations', () => {
  it('renders nothing before a concierge tool saves a link', () => {
    const { container } = render(<TravelRecommendations />)

    expect(container).toBeEmptyDOMElement()
  })

  it('presents a priced Stay22 option without a booking claim', async () => {
    addTravelRecommendation({
      id: 'stay_test',
      title: 'Example Hotel',
      url: 'https://www.stay22.com/allez/booking/123',
      source: 'stay22',
      created_at: new Date().toISOString(),
      price_total: 590,
      currency: 'USD',
      rating: 8.7,
    })

    render(<TravelRecommendations />)

    const link = await screen.findByRole('link', { name: /example hotel/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('sponsored'))
    expect(screen.getByText(/USD 590 total/i)).toBeInTheDocument()
    expect(screen.getByText(/8.7\/10/i)).toBeInTheDocument()
    expect(screen.getByText(/has not made a reservation/i)).toBeInTheDocument()
  })

  it('labels Tavily evidence as a source', async () => {
    addTravelRecommendation({
      id: 'tavily_test',
      title: 'Museum hours',
      url: 'https://example.com/museum',
      source: 'tavily',
      created_at: new Date().toISOString(),
    })

    render(<TravelRecommendations />)

    expect(await screen.findByRole('link', { name: /museum hours/i })).toBeInTheDocument()
    expect(screen.getByText('Source')).toBeInTheDocument()
  })
})
