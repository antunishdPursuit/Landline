import type { Department, GuestRequest, Intent, Urgency } from './types'

const ROOMS = ['214', '308', '412', '119', '506', '227', '331', '150', '418', '602']

const TEMPLATES: {
  intent: Intent
  department: Department
  urgency: Urgency
  requires_human: boolean
  summaries: string[]
}[] = [
  {
    intent: 'physical_request',
    department: 'housekeeping',
    urgency: 'low',
    requires_human: false,
    summaries: ['Extra towels requested', 'Needs fresh linens', 'Requesting extra pillows', 'Room needs a top-up clean'],
  },
  {
    intent: 'physical_request',
    department: 'room_service',
    urgency: 'medium',
    requires_human: false,
    summaries: ['Ordered club sandwich and sparkling water', 'Breakfast tray for 2, 8am delivery', 'Bottle of house red requested'],
  },
  {
    intent: 'physical_request',
    department: 'maintenance',
    urgency: 'high',
    requires_human: false,
    summaries: ['AC unit not cooling, room too warm', 'Bathroom sink leaking onto floor', 'TV won’t power on'],
  },
  {
    intent: 'defer_to_operator',
    department: 'front_desk',
    urgency: 'high',
    requires_human: true,
    summaries: ['Guest disputing a charge on folio, wants to speak to someone', 'Guest locked out, ID not matching reservation', 'Guest requesting early check-in exception'],
  },
  {
    intent: 'physical_request',
    department: 'front_desk',
    urgency: 'medium',
    requires_human: false,
    summaries: ['Requesting late checkout', 'Needs a taxi booked for 6am airport run', 'Asking for an extra room key'],
  },
]

const LANGUAGES = ['en', 'es', 'fr', 'de', 'pt']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString()
}

let counter = 0
function nextId(): string {
  counter += 1
  return `req_${counter}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateRequest(overrides?: Partial<GuestRequest>): GuestRequest {
  const template = pick(TEMPLATES)
  const now = new Date().toISOString()
  return {
    id: nextId(),
    room_number: pick(ROOMS),
    intent: template.intent,
    department: template.department,
    summary: pick(template.summaries),
    urgency: template.urgency,
    language_detected: Math.random() < 0.75 ? 'en' : pick(LANGUAGES),
    status: 'new',
    requires_human: template.requires_human,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function seedRequests(): GuestRequest[] {
  return [
    generateRequest({
      room_number: '412',
      department: 'front_desk',
      intent: 'defer_to_operator',
      urgency: 'high',
      requires_human: true,
      summary: 'Guest disputing a minibar charge, asking to speak with someone directly',
      status: 'new',
      created_at: minutesAgo(1),
      updated_at: minutesAgo(1),
    }),
    generateRequest({
      room_number: '308',
      department: 'maintenance',
      intent: 'physical_request',
      urgency: 'high',
      summary: 'AC unit not cooling, room too warm',
      status: 'new',
      created_at: minutesAgo(3),
      updated_at: minutesAgo(3),
    }),
    generateRequest({
      room_number: '119',
      department: 'housekeeping',
      intent: 'physical_request',
      urgency: 'low',
      summary: 'Extra towels and pillows requested',
      status: 'in_progress',
      created_at: minutesAgo(14),
      updated_at: minutesAgo(6),
    }),
    generateRequest({
      room_number: '506',
      department: 'room_service',
      intent: 'physical_request',
      urgency: 'medium',
      summary: 'Breakfast tray for 2, requested for 8am',
      language_detected: 'es',
      status: 'new',
      created_at: minutesAgo(8),
      updated_at: minutesAgo(8),
    }),
    generateRequest({
      room_number: '227',
      department: 'front_desk',
      intent: 'physical_request',
      urgency: 'low',
      summary: 'Requesting late checkout, flight isn’t until 8pm',
      status: 'done',
      created_at: minutesAgo(40),
      updated_at: minutesAgo(20),
    }),
    generateRequest({
      room_number: '331',
      department: 'maintenance',
      intent: 'physical_request',
      urgency: 'medium',
      summary: 'Bathroom sink leaking onto floor',
      status: 'in_progress',
      created_at: minutesAgo(22),
      updated_at: minutesAgo(5),
    }),
  ]
}
