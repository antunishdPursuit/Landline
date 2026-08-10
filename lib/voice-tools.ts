'use client'

import { addDemoTicket, addTravelRecommendation } from './demo-store'
import type { GuestRequest, TravelRecommendation } from './types'

type JsonRecord = Record<string, unknown>
type Fetcher = typeof fetch

interface VoiceToolDependencies {
  fetcher?: Fetcher
  saveTicket?: (ticket: GuestRequest) => unknown
  saveRecommendation?: (recommendation: TravelRecommendation) => unknown
  now?: () => Date
}

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toResult(value: JsonRecord): string {
  return JSON.stringify(value)
}

async function postJson(
  fetcher: Fetcher,
  url: string,
  payload: unknown
): Promise<{ ok: boolean; body: unknown }> {
  try {
    const response = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // A malformed upstream response is handled as an unavailable tool below.
    }

    return { ok: response.ok, body }
  } catch {
    return { ok: false, body: null }
  }
}

export function createVoiceClientTools({
  fetcher = fetch,
  saveTicket = addDemoTicket,
  saveRecommendation = addTravelRecommendation,
  now = () => new Date(),
}: VoiceToolDependencies = {}) {
  async function saveRequest(payload: unknown, forceStaffDeferral: boolean) {
    const requestPayload = isRecord(payload) ? payload : {}
    const normalizedPayload = forceStaffDeferral
      ? { ...requestPayload, intent: 'defer_to_operator' }
      : requestPayload
    const result = await postJson(fetcher, '/api/requests', normalizedPayload)

    if (result.ok && isRecord(result.body)) {
      if (result.body.status === 'no_ticket') {
        return toResult(result.body)
      }

      if (result.body.status === 'ready' && isRecord(result.body.ticket)) {
        try {
          const ticket = result.body.ticket as unknown as GuestRequest
          saveTicket(ticket)
          return toResult({
            status: 'logged',
            ticket_id: ticket.id,
            department: ticket.department,
          })
        } catch {
          // Invalid API data is handled as a failed tool call below.
        }
      }
    }

    return toResult({
      status: 'unavailable',
      message: 'The request could not be logged. Offer to connect the guest with staff.',
    })
  }

  return {
    log_request: async (payload: unknown) => saveRequest(payload, false),

    defer_to_staff: async (payload: unknown) => saveRequest(payload, true),

    search_concierge: async (payload: unknown) => {
      const result = await postJson(fetcher, '/api/concierge/search', payload)
      if (result.ok && isRecord(result.body) && result.body.status === 'answered') {
        const sources = Array.isArray(result.body.sources) ? result.body.sources : []
        const createdAt = now().toISOString()

        sources.forEach((source, index) => {
          if (
            isRecord(source) &&
            typeof source.title === 'string' &&
            typeof source.url === 'string'
          ) {
            try {
              saveRecommendation({
                id: `tavily_${now().getTime()}_${index}`,
                title: source.title,
                url: source.url,
                source: 'tavily',
                created_at: createdAt,
              })
            } catch {
              // The answer can still be returned if one display item is invalid.
            }
          }
        })

        return toResult(result.body)
      }

      return toResult({
        status: 'needs_staff',
        message: 'I could not verify that information. Offer to connect the guest with the front desk.',
      })
    },

    find_stays: async (payload: unknown) => {
      const result = await postJson(fetcher, '/api/stays', payload)
      if (
        result.ok &&
        isRecord(result.body) &&
        result.body.status === 'ready' &&
        isRecord(result.body.recommendation)
      ) {
        try {
          const recommendation =
            result.body.recommendation as unknown as TravelRecommendation
          saveRecommendation(recommendation)
          return toResult({
            status: 'ready',
            message: 'This link lets the guest view stays. No reservation has been made.',
            recommendation,
          })
        } catch {
          // Invalid API data is handled as an unavailable tool call below.
        }
      }

      return toResult({
        status: 'unavailable',
        message: 'Stay options are unavailable. Do not invent a link; offer staff help.',
      })
    },
  }
}
