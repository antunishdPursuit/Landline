import {
  addDemoTicket,
  addDemoCallLog,
  addTravelRecommendation,
  createSeedDemoState,
  isDemoState,
  readDemoState,
  removeDemoTicket,
  resetDemoState,
  updateDemoTicketStatus,
  writeDemoState,
} from '@/lib/demo-store'
import { DEMO_STORE_STORAGE_KEY, type GuestRequest } from '@/lib/types'

function makeTicket(overrides: Partial<GuestRequest> = {}): GuestRequest {
  const now = new Date().toISOString()
  return {
    id: 'req_test',
    room_number: '1208',
    intent: 'physical_request',
    department: 'housekeeping',
    summary: 'Two towels requested',
    urgency: 'medium',
    language_detected: 'en',
    status: 'new',
    requires_human: false,
    assigned_to: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('demo store', () => {
  it('creates and persists one valid seed state', () => {
    const first = readDemoState()
    const second = readDemoState()

    expect(first).toEqual(second)
    expect(first.version).toBe(1)
    expect(first.tickets.length).toBeGreaterThan(0)
    expect(first.call_logs.length).toBeGreaterThan(0)
    expect(isDemoState(JSON.parse(localStorage.getItem(DEMO_STORE_STORAGE_KEY)!))).toBe(true)
  })

  it('replaces corrupt storage with safe seed data', () => {
    localStorage.setItem(DEMO_STORE_STORAGE_KEY, '{not-json')

    const recovered = readDemoState()

    expect(isDemoState(recovered)).toBe(true)
    expect(recovered.tickets.length).toBeGreaterThan(0)
  })

  it('rejects invalid state writes', () => {
    expect(() =>
      writeDemoState({ ...createSeedDemoState(), version: 2 } as never)
    ).toThrow('Invalid demo state')
  })

  it('adds one ticket without duplicating the same id', () => {
    const ticket = makeTicket()
    addDemoTicket(ticket)
    addDemoTicket({ ...ticket, summary: 'Updated towels request' })

    const stored = readDemoState()
    expect(stored.tickets.filter((item) => item.id === ticket.id)).toHaveLength(1)
    expect(stored.tickets[0].summary).toBe('Updated towels request')
  })

  it('persists status and assignment changes', () => {
    addDemoTicket(makeTicket())
    updateDemoTicketStatus('req_test', 'in_progress', 'Maria Lopez')

    expect(readDemoState().tickets[0]).toMatchObject({
      status: 'in_progress',
      assigned_to: 'Maria Lopez',
    })
  })

  it('removes only the selected ticket', () => {
    addDemoTicket(makeTicket({ id: 'req_first' }))
    addDemoTicket(makeTicket({ id: 'req_second' }))

    removeDemoTicket('req_first')

    expect(readDemoState().tickets.some((ticket) => ticket.id === 'req_first')).toBe(false)
    expect(readDemoState().tickets.some((ticket) => ticket.id === 'req_second')).toBe(true)
  })

  it('adds and deduplicates displayed travel recommendations', () => {
    const recommendation = {
      id: 'stay_test',
      title: 'View stays near NoMad',
      url: 'https://www.stay22.com/allez/roam?aid=test&address=NoMad',
      source: 'stay22' as const,
      created_at: new Date().toISOString(),
    }

    addTravelRecommendation(recommendation)
    addTravelRecommendation({ ...recommendation, title: 'Updated stay link' })

    expect(readDemoState().travel_recommendations).toEqual([
      { ...recommendation, title: 'Updated stay link' },
    ])
  })

  it('adds and deduplicates local voice call logs', () => {
    const call = {
      id: 'call_voice',
      room_number: '1208',
      language_detected: 'en',
      duration_seconds: 42,
      transcript: [{ speaker: 'guest' as const, text: 'I need towels' }],
      intent: 'physical_request' as const,
      department: 'housekeeping' as const,
      request_summary: 'Towels requested',
      requires_human: false,
      created_at: new Date().toISOString(),
    }

    addDemoCallLog(call)
    addDemoCallLog({ ...call, duration_seconds: 45 })

    expect(readDemoState().call_logs.filter((item) => item.id === call.id)).toHaveLength(1)
    expect(readDemoState().call_logs[0].duration_seconds).toBe(45)
  })

  it('resets local changes to fresh seed data', () => {
    addDemoTicket(makeTicket())

    const reset = resetDemoState()

    expect(reset.tickets.some((ticket) => ticket.id === 'req_test')).toBe(false)
    expect(readDemoState()).toEqual(reset)
  })
})
