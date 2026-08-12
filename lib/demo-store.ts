import { seedCallLogs, seedRequests } from './mock-data'
import {
  DEMO_STORE_STORAGE_KEY,
  DEMO_STORE_VERSION,
  type CallLog,
  type DemoState,
  type Department,
  type GuestRequest,
  type Intent,
  type RequestStatus,
  type TravelRecommendation,
  type Urgency,
} from './types'

const DEMO_STORE_EVENT = 'landline:demo-store-change'

const DEPARTMENTS = new Set<Department>([
  'front_desk',
  'housekeeping',
  'room_service',
  'maintenance',
])
const INTENTS = new Set<Intent>([
  'answerable_qa',
  'defer_to_operator',
  'physical_request',
])
const URGENCIES = new Set<Urgency>(['low', 'medium', 'high'])
const STATUSES = new Set<RequestStatus>(['new', 'in_progress', 'done'])

function getBrowserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isGuestRequest(value: unknown): value is GuestRequest {
  if (!value || typeof value !== 'object') return false
  const ticket = value as Partial<GuestRequest>

  return (
    isString(ticket.id) &&
    isString(ticket.room_number) &&
    INTENTS.has(ticket.intent as Intent) &&
    DEPARTMENTS.has(ticket.department as Department) &&
    isString(ticket.summary) &&
    URGENCIES.has(ticket.urgency as Urgency) &&
    isString(ticket.language_detected) &&
    STATUSES.has(ticket.status as RequestStatus) &&
    typeof ticket.requires_human === 'boolean' &&
    (ticket.assigned_to === null || isString(ticket.assigned_to)) &&
    isString(ticket.created_at) &&
    isString(ticket.updated_at)
  )
}

function isCallLog(value: unknown): value is CallLog {
  if (!value || typeof value !== 'object') return false
  const call = value as Partial<CallLog>

  return (
    isString(call.id) &&
    isString(call.room_number) &&
    isString(call.language_detected) &&
    typeof call.duration_seconds === 'number' &&
    Array.isArray(call.transcript) &&
    call.transcript.every(
      (turn) =>
        !!turn &&
        (turn.speaker === 'guest' || turn.speaker === 'agent') &&
        isString(turn.text)
    ) &&
    INTENTS.has(call.intent as Intent) &&
    (call.department === null || DEPARTMENTS.has(call.department as Department)) &&
    (call.request_summary === null || isString(call.request_summary)) &&
    typeof call.requires_human === 'boolean' &&
    isString(call.created_at)
  )
}

function isTravelRecommendation(value: unknown): value is TravelRecommendation {
  if (!value || typeof value !== 'object') return false
  const recommendation = value as Partial<TravelRecommendation>

  return (
    isString(recommendation.id) &&
    isString(recommendation.title) &&
    isString(recommendation.url) &&
    (recommendation.source === 'tavily' || recommendation.source === 'stay22') &&
    isString(recommendation.created_at) &&
    (recommendation.accommodation_type === undefined ||
      isString(recommendation.accommodation_type)) &&
    (recommendation.address === undefined ||
      recommendation.address === null ||
      isString(recommendation.address)) &&
    (recommendation.supplier === undefined ||
      recommendation.supplier === null ||
      isString(recommendation.supplier)) &&
    (recommendation.price_total === undefined ||
      recommendation.price_total === null ||
      typeof recommendation.price_total === 'number') &&
    (recommendation.currency === undefined || isString(recommendation.currency)) &&
    (recommendation.rating === undefined ||
      recommendation.rating === null ||
      typeof recommendation.rating === 'number') &&
    (recommendation.hotel_stars === undefined ||
      recommendation.hotel_stars === null ||
      typeof recommendation.hotel_stars === 'number') &&
    (recommendation.rating_count === undefined ||
      recommendation.rating_count === null ||
      typeof recommendation.rating_count === 'number') &&
    (recommendation.distance_meters === undefined ||
      recommendation.distance_meters === null ||
      typeof recommendation.distance_meters === 'number')
  )
}

export function createSeedDemoState(): DemoState {
  return {
    version: DEMO_STORE_VERSION,
    tickets: seedRequests(),
    call_logs: seedCallLogs(),
    travel_recommendations: [],
  }
}

export function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<DemoState>

  return (
    state.version === DEMO_STORE_VERSION &&
    Array.isArray(state.tickets) &&
    state.tickets.every(isGuestRequest) &&
    Array.isArray(state.call_logs) &&
    state.call_logs.every(isCallLog) &&
    Array.isArray(state.travel_recommendations) &&
    state.travel_recommendations.every(isTravelRecommendation)
  )
}

function persistState(storage: Storage, state: DemoState): void {
  storage.setItem(DEMO_STORE_STORAGE_KEY, JSON.stringify(state))
}

function notifySubscribers(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DEMO_STORE_EVENT))
  }
}

export function readDemoState(storage: Storage | null = getBrowserStorage()): DemoState {
  if (!storage) return createSeedDemoState()

  const stored = storage.getItem(DEMO_STORE_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as unknown
      if (isDemoState(parsed)) return parsed
    } catch {
      // Invalid JSON is replaced with safe seed data below.
    }
  }

  const seeded = createSeedDemoState()
  persistState(storage, seeded)
  return seeded
}

export function writeDemoState(
  state: DemoState,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  if (!isDemoState(state)) {
    throw new Error('Invalid demo state')
  }
  if (storage) persistState(storage, state)
  notifySubscribers()
  return state
}

export function updateDemoState(
  update: (current: DemoState) => DemoState,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  const next = update(readDemoState(storage))
  return writeDemoState(next, storage)
}

export function addDemoTicket(
  ticket: GuestRequest,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  if (!isGuestRequest(ticket)) throw new Error('Invalid demo ticket')

  return updateDemoState(
    (current) => ({
      ...current,
      tickets: [ticket, ...current.tickets.filter((item) => item.id !== ticket.id)],
    }),
    storage
  )
}

export function addDemoCallLog(
  call: CallLog,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  if (!isCallLog(call)) throw new Error('Invalid demo call log')

  return updateDemoState(
    (current) => ({
      ...current,
      call_logs: [call, ...current.call_logs.filter((item) => item.id !== call.id)],
    }),
    storage
  )
}

export function addTravelRecommendation(
  recommendation: TravelRecommendation,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  if (!isTravelRecommendation(recommendation)) {
    throw new Error('Invalid travel recommendation')
  }

  return updateDemoState(
    (current) => ({
      ...current,
      travel_recommendations: [
        recommendation,
        ...current.travel_recommendations.filter(
          (item) => item.id !== recommendation.id
        ),
      ],
    }),
    storage
  )
}

export function updateDemoTicketStatus(
  id: string,
  status: RequestStatus,
  assignedTo?: string,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  return updateDemoState(
    (current) => ({
      ...current,
      tickets: current.tickets.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              status,
              assigned_to: assignedTo ?? ticket.assigned_to,
              updated_at: new Date().toISOString(),
            }
          : ticket
      ),
    }),
    storage
  )
}

export function removeDemoTicket(
  id: string,
  storage: Storage | null = getBrowserStorage()
): DemoState {
  return updateDemoState(
    (current) => ({
      ...current,
      tickets: current.tickets.filter((ticket) => ticket.id !== id),
    }),
    storage
  )
}

export function subscribeToDemoState(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DEMO_STORE_STORAGE_KEY) listener()
  }
  window.addEventListener(DEMO_STORE_EVENT, listener)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(DEMO_STORE_EVENT, listener)
    window.removeEventListener('storage', handleStorage)
  }
}
