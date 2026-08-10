import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useAgentConfig } from '@/hooks/useAgentConfig'
import { RITZ_NOMAD_CONFIG } from '@/types/agent'

const STORAGE_KEY = 'landline_agent_config'

function ConfigProbe() {
  const config = useAgentConfig()

  return (
    <div>
      <span data-testid="loaded">{String(config.isLoaded)}</span>
      <span data-testid="editing">{String(config.isEditing)}</span>
      <span data-testid="name">{config.config.name}</span>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('useAgentConfig', () => {
  it('seeds the local demo property without opening the editor', async () => {
    render(<ConfigProbe />)

    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('true'))
    expect(screen.getByTestId('editing')).toHaveTextContent('false')
    expect(screen.getByTestId('name')).toHaveTextContent(RITZ_NOMAD_CONFIG.name)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(RITZ_NOMAD_CONFIG)
  })

  it('preserves a saved property configuration', async () => {
    const saved = {
      ...RITZ_NOMAD_CONFIG,
      name: 'The Example Hotel',
      address: '1 Example Way',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    render(<ConfigProbe />)

    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('true'))
    expect(screen.getByTestId('name')).toHaveTextContent('The Example Hotel')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(saved)
  })

  it('recovers malformed local configuration with the demo property', async () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json')

    render(<ConfigProbe />)

    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('true'))
    expect(screen.getByTestId('name')).toHaveTextContent(RITZ_NOMAD_CONFIG.name)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(RITZ_NOMAD_CONFIG)
  })
})
