import { createVoiceClientTools } from '@/lib/voice-tools'

function response(ok: boolean, body: unknown): Response {
  return { ok, json: async () => body } as Response
}

describe('ElevenLabs client tools', () => {
  it('normalizes and stores voice-created tickets', async () => {
    const ticket = {
      id: 'req_voice',
      room_number: '1208',
      intent: 'physical_request',
      department: 'housekeeping',
      summary: 'Two towels requested',
      urgency: 'medium',
      language_detected: 'en',
      status: 'new',
      requires_human: false,
      assigned_to: null,
      created_at: '2026-08-09T12:00:00.000Z',
      updated_at: '2026-08-09T12:00:00.000Z',
    }
    const fetcher = jest.fn().mockResolvedValue(
      response(true, { status: 'ready', ticket })
    )
    const saveTicket = jest.fn()
    const tools = createVoiceClientTools({ fetcher, saveTicket })

    const result = JSON.parse(
      await tools.log_request({
        intent: 'physical_request',
        room_number: '1208',
        summary: 'Two towels requested',
      })
    )

    expect(fetcher).toHaveBeenCalledWith(
      '/api/requests',
      expect.objectContaining({ method: 'POST' })
    )
    expect(saveTicket).toHaveBeenCalledWith(ticket)
    expect(result).toEqual({
      status: 'logged',
      ticket_id: 'req_voice',
      department: 'housekeeping',
    })
  })

  it('forces staff deferrals through the authoritative classifier path', async () => {
    const fetcher = jest.fn().mockResolvedValue(response(false, {}))
    const tools = createVoiceClientTools({ fetcher })

    await tools.defer_to_staff({
      intent: 'physical_request',
      room_number: '1208',
      summary: 'Please call me',
    })

    const requestBody = JSON.parse(fetcher.mock.calls[0][1].body)
    expect(requestBody.intent).toBe('defer_to_operator')
  })

  it('returns Tavily evidence and stores its source links', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response(true, {
        status: 'answered',
        answer: 'The museum closes at 8 PM.',
        sources: [
          {
            title: 'Museum hours',
            url: 'https://example.com/hours',
            content: 'Open until 8 PM.',
          },
        ],
      })
    )
    const saveRecommendation = jest.fn()
    const now = () => new Date('2026-08-09T12:00:00.000Z')
    const tools = createVoiceClientTools({ fetcher, saveRecommendation, now })

    const result = JSON.parse(
      await tools.search_concierge({ query: 'When does the museum close?' })
    )

    expect(result.status).toBe('answered')
    expect(saveRecommendation).toHaveBeenCalledWith({
      id: 'tavily_1786276800000_0',
      title: 'Museum hours',
      url: 'https://example.com/hours',
      source: 'tavily',
      created_at: '2026-08-09T12:00:00.000Z',
    })
  })

  it('instructs the agent to escalate Tavily failures', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response(true, { status: 'no_answer', answer: null, sources: [] })
    )
    const tools = createVoiceClientTools({ fetcher })

    const result = JSON.parse(
      await tools.search_concierge({ query: 'Unverified event' })
    )

    expect(result.status).toBe('needs_staff')
    expect(result.message).toContain('front desk')
  })

  it('stores Stay22 links and states that no reservation was made', async () => {
    const recommendation = {
      id: 'stay_voice',
      title: 'View stays near NoMad',
      url: 'https://www.stay22.com/allez/roam?aid=test&address=NoMad',
      source: 'stay22',
      created_at: '2026-08-09T12:00:00.000Z',
    }
    const fetcher = jest.fn().mockResolvedValue(
      response(true, { status: 'ready', recommendation })
    )
    const saveRecommendation = jest.fn()
    const tools = createVoiceClientTools({ fetcher, saveRecommendation })

    const result = JSON.parse(
      await tools.find_stays({ destination: 'NoMad' })
    )

    expect(saveRecommendation).toHaveBeenCalledWith(recommendation)
    expect(result.message).toContain('No reservation has been made')
  })

  it('never fabricates a Stay22 link after failure', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('offline'))
    const tools = createVoiceClientTools({ fetcher })

    const result = JSON.parse(
      await tools.find_stays({ destination: 'NoMad' })
    )

    expect(result.status).toBe('unavailable')
    expect(JSON.stringify(result)).not.toContain('https://')
  })
})
