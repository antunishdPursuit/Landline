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

  it('presents Stay22 as an external stay search without a booking claim', async () => {
    addTravelRecommendation({
      id: 'stay_test',
      title: 'View stays near NoMad',
      url: 'https://www.stay22.com/allez/roam?aid=test&address=NoMad',
      source: 'stay22',
      created_at: new Date().toISOString(),
    })

    render(<TravelRecommendations />)

    const link = await screen.findByRole('link', { name: /view stays near nomad/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('sponsored'))
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
