'use client'

import { addDemoTicket, addTravelRecommendation } from './demo-store'
import type { GuestRequest, TravelRecommendation } from './types'

type JsonRecord = Record<string, unknown>
type Fetcher = typeof fetch

interface VoiceToolDependencies {
  fetcher?: Fetcher
  toolToken?: string
  saveTicket?: (ticket: GuestRequest) => unknown
  saveRecommendation?: (recommendation: TravelRecommendation) => unknown
  now?: () => Date
  onActivity?: (activity: VoiceToolActivity) => void
}

export interface VoiceToolActivity {
  intent: 'answerable_qa' | 'defer_to_operator' | 'physical_request'
  department: 'front_desk' | 'housekeeping' | 'room_service' | 'maintenance' | null
  request_summary: string | null
  requires_human: boolean
  language_detected: string
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
  payload: unknown,
  toolToken?: string
): Promise<{ ok: boolean; body: unknown }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (toolToken) headers.Authorization = `Bearer ${toolToken}`
    const response = await fetcher(url, {
      method: 'POST',
      headers,
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
  toolToken,
  saveTicket = addDemoTicket,
  saveRecommendation = addTravelRecommendation,
  now = () => new Date(),
  onActivity = () => undefined,
}: VoiceToolDependencies = {}) {
  async function saveRequest(payload: unknown, forceStaffDeferral: boolean) {
    const requestPayload = isRecord(payload) ? payload : {}
    const normalizedPayload = forceStaffDeferral
      ? { ...requestPayload, intent: 'defer_to_operator' }
      : requestPayload
    const result = await postJson(
      fetcher,
      '/api/requests',
      normalizedPayload,
      toolToken
    )

    if (result.ok && isRecord(result.body)) {
      if (result.body.status === 'no_ticket') {
        return toResult(result.body)
      }

      if (result.body.status === 'ready' && isRecord(result.body.ticket)) {
        try {
          const ticket = result.body.ticket as unknown as GuestRequest
          saveTicket(ticket)
          onActivity({
            intent: ticket.intent,
            department: ticket.department,
            request_summary: ticket.summary,
            requires_human: ticket.requires_human,
            language_detected: ticket.language_detected,
          })
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
      const result = await postJson(
        fetcher,
        '/api/concierge/search',
        payload,
        toolToken
      )
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

        onActivity({
          intent: 'answerable_qa',
          department: null,
          request_summary:
            typeof result.body.answer === 'string' ? result.body.answer : null,
          requires_human: false,
          language_detected: 'en',
        })

        return toResult(result.body)
      }

      onActivity({
        intent: 'defer_to_operator',
        department: 'front_desk',
        request_summary: 'Current information could not be verified',
        requires_human: true,
        language_detected: 'en',
      })

      return toResult({
        status: 'needs_staff',
        message: 'I could not verify that information. Offer to connect the guest with the front desk.',
      })
    },

    find_stays: async (payload: unknown) => {
      const result = await postJson(fetcher, '/api/stays', payload, toolToken)
      if (
        result.ok &&
        isRecord(result.body) &&
        result.body.status === 'ready' &&
        isRecord(result.body.recommended_option) &&
        Array.isArray(result.body.backup_options)
      ) {
        const returnedOptions = [
          result.body.recommended_option,
          ...result.body.backup_options,
        ]
        const savedOptions: TravelRecommendation[] = []
        returnedOptions.forEach((option) => {
          if (!isRecord(option)) return
          try {
            const recommendation = option as unknown as TravelRecommendation
            saveRecommendation(recommendation)
            savedOptions.push(recommendation)
          } catch {
            // Invalid options are excluded from the response to the agent.
          }
        })

        if (savedOptions.length > 0) {
          const recommendedOption = savedOptions[0]
          const price =
            typeof recommendedOption.price_total === 'number' &&
            recommendedOption.currency
              ? `${recommendedOption.currency} ${recommendedOption.price_total} total`
              : 'price unavailable'
          const summary = `${recommendedOption.title}: ${price}`

          onActivity({
            intent: 'answerable_qa',
            department: null,
            request_summary: summary,
            requires_human: false,
            language_detected: 'en',
          })
          return toResult({
            ...result.body,
            recommended_option: recommendedOption,
            backup_options: savedOptions.slice(1),
            message:
              'Describe only recommended_option with its full-stay price. Availability can change. No reservation has been made. If the guest rejects it, offer one backup_options entry without calling find_stays again.',
          })
        }
      }

      if (
        result.ok &&
        isRecord(result.body) &&
        result.body.status === 'no_results'
      ) {
        onActivity({
          intent: 'answerable_qa',
          department: null,
          request_summary: 'No stays matched the confirmed search',
          requires_human: false,
          language_detected: 'en',
        })
        return toResult({
          ...result.body,
          message:
            'No stays matched the confirmed search. Offer to change the destination, dates, or guest count.',
        })
      }

      onActivity({
        intent: 'defer_to_operator',
        department: 'front_desk',
        request_summary: 'Stay options were unavailable',
        requires_human: true,
        language_detected: 'en',
      })

      return toResult({
        status: 'unavailable',
        message:
          'Stay options are temporarily unavailable. Do not invent hotels, prices, availability, or links; offer staff help.',
      })
    },
  }
}
