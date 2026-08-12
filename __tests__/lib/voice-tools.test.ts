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
    const onActivity = jest.fn()
    const tools = createVoiceClientTools({
      fetcher,
      saveTicket,
      onActivity,
      toolToken: 'short-lived-token',
    })

    const result = JSON.parse(
      await tools.log_request({
        intent: 'physical_request',
        room_number: '1208',
        summary: 'Two towels requested',
      })
    )

    expect(fetcher).toHaveBeenCalledWith(
      '/api/requests',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer short-lived-token',
        }),
      })
    )
    expect(saveTicket).toHaveBeenCalledWith(ticket)
    expect(onActivity).toHaveBeenCalledWith({
      intent: 'physical_request',
      department: 'housekeeping',
      request_summary: 'Two towels requested',
      requires_human: false,
      language_detected: 'en',
    })
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
    const tools = createVoiceClientTools({
      fetcher,
      saveRecommendation,
      now,
      toolToken: 'short-lived-token',
    })

    const result = JSON.parse(
      await tools.search_concierge({ query: 'When does the museum close?' })
    )

    expect(result.status).toBe('answered')
    expect(fetcher).toHaveBeenCalledWith(
      '/api/concierge/search',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer short-lived-token',
        }),
      })
    )
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

  it('stores priced Stay22 options and states that no reservation was made', async () => {
    const option = {
      id: 'stay_voice',
      title: 'Example Hotel',
      url: 'https://www.stay22.com/allez/booking/123',
      source: 'stay22',
      created_at: '2026-08-09T12:00:00.000Z',
      price_total: 590,
      currency: 'USD',
      rating: 8.7,
    }
    const fetcher = jest.fn().mockResolvedValue(
      response(true, {
        status: 'ready',
        search: {
          address: 'NoMad, New York',
          checkin: '2026-09-12',
          checkout: '2026-09-15',
          adults: 2,
          children: 0,
          rooms: 1,
        },
        recommended_option: option,
        backup_options: [],
      })
    )
    const saveRecommendation = jest.fn()
    const tools = createVoiceClientTools({
      fetcher,
      saveRecommendation,
      toolToken: 'short-lived-token',
    })

    const result = JSON.parse(
      await tools.find_stays({
        address: 'NoMad, New York',
        checkin: '2026-09-12',
        checkout: '2026-09-15',
        adults: 2,
        children: 0,
        rooms: 1,
      })
    )

    expect(saveRecommendation).toHaveBeenCalledWith(option)
    expect(fetcher).toHaveBeenCalledWith(
      '/api/stays',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer short-lived-token',
        }),
      })
    )
    expect(result.recommended_option).toEqual(option)
    expect(result.backup_options).toEqual([])
    expect(result.message).toContain('Describe only recommended_option')
    expect(result.message).toContain('No reservation has been made')
  })

  it('stores backups from the same response without another Stay22 request', async () => {
    const recommended = {
      id: 'stay_recommended',
      title: 'Recommended Hotel',
      url: 'https://www.stay22.com/allez/booking/1',
      source: 'stay22',
      created_at: '2026-08-12T12:00:00.000Z',
      price_total: 600,
      currency: 'USD',
    }
    const backup = {
      ...recommended,
      id: 'stay_backup',
      title: 'Backup Hotel',
      url: 'https://www.stay22.com/allez/booking/2',
      price_total: 550,
    }
    const fetcher = jest.fn().mockResolvedValue(
      response(true, {
        status: 'ready',
        recommended_option: recommended,
        backup_options: [backup],
      })
    )
    const saveRecommendation = jest.fn()
    const tools = createVoiceClientTools({ fetcher, saveRecommendation })

    const result = JSON.parse(
      await tools.find_stays({
        address: 'NoMad, New York',
        checkin: '2026-09-12',
        checkout: '2026-09-15',
        adults: 2,
        children: 0,
        rooms: 1,
      })
    )

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(saveRecommendation).toHaveBeenNthCalledWith(1, recommended)
    expect(saveRecommendation).toHaveBeenNthCalledWith(2, backup)
    expect(result.recommended_option).toEqual(recommended)
    expect(result.backup_options).toEqual([backup])
  })

  it('lets the agent revise a confirmed search when Stay22 has no results', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response(true, {
        status: 'no_results',
        recommended_option: null,
        backup_options: [],
      })
    )
    const onActivity = jest.fn()
    const tools = createVoiceClientTools({ fetcher, onActivity })

    const result = JSON.parse(
      await tools.find_stays({
        address: 'NoMad, New York',
        checkin: '2026-09-12',
        checkout: '2026-09-15',
        adults: 2,
        children: 0,
        rooms: 1,
      })
    )

    expect(result.status).toBe('no_results')
    expect(result.message).toContain('change the destination, dates, or guest count')
    expect(onActivity).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'answerable_qa', requires_human: false })
    )
  })

  it('never fabricates a Stay22 link after failure', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('offline'))
    const tools = createVoiceClientTools({ fetcher })

    const result = JSON.parse(
      await tools.find_stays({
        address: 'NoMad, New York',
        checkin: '2026-09-12',
        checkout: '2026-09-15',
        adults: 2,
        children: 0,
        rooms: 1,
      })
    )

    expect(result.status).toBe('unavailable')
    expect(JSON.stringify(result)).not.toContain('https://')
  })
})
