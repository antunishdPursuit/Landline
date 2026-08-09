import type {
  CallLog,
  ConversationTurn,
  Department,
  GuestRequest,
  Intent,
  StaffMember,
  Urgency,
} from './types'

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
function nextId(prefix: string): string {
  counter += 1
  return `${prefix}_${counter}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateRequest(overrides?: Partial<GuestRequest>): GuestRequest {
  const template = pick(TEMPLATES)
  const now = new Date().toISOString()
  return {
    id: nextId('req'),
    room_number: pick(ROOMS),
    intent: template.intent,
    department: template.department,
    summary: pick(template.summaries),
    urgency: template.urgency,
    language_detected: Math.random() < 0.75 ? 'en' : pick(LANGUAGES),
    status: 'new',
    requires_human: template.requires_human,
    assigned_to: null,
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
      assigned_to: 'Maria Lopez',
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
      assigned_to: 'Sam Patel',
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
      assigned_to: 'Diego Ramirez',
      created_at: minutesAgo(22),
      updated_at: minutesAgo(5),
    }),
  ]
}

const STAFF_ROSTER: StaffMember[] = [
  { id: 'stf_1', name: 'Alex Chen', department: 'front_desk', active: true },
  { id: 'stf_2', name: 'Priya Nair', department: 'front_desk', active: true },
  { id: 'stf_3', name: 'Sam Patel', department: 'front_desk', active: false },
  { id: 'stf_4', name: 'Maria Lopez', department: 'housekeeping', active: true },
  { id: 'stf_5', name: 'Tunde Okafor', department: 'housekeeping', active: true },
  { id: 'stf_6', name: 'Grace Kim', department: 'housekeeping', active: false },
  { id: 'stf_7', name: "Liam O'Connor", department: 'room_service', active: true },
  { id: 'stf_8', name: 'Yuki Tanaka', department: 'room_service', active: false },
  { id: 'stf_9', name: 'Diego Ramirez', department: 'maintenance', active: true },
  { id: 'stf_10', name: 'Ben Carter', department: 'maintenance', active: false },
]

export function seedStaffRoster(): StaffMember[] {
  return STAFF_ROSTER.map((member) => ({ ...member }))
}

const CALL_TEMPLATES: {
  intent: Intent
  department: Department | null
  requires_human: boolean
  request_summary: string | null
  transcript: ConversationTurn[]
}[] = [
  {
    intent: 'answerable_qa',
    department: null,
    requires_human: false,
    request_summary: null,
    transcript: [
      { speaker: 'guest', text: "Hi, what time does the pool close tonight?" },
      { speaker: 'agent', text: "The rooftop pool is open until 10pm tonight, towels are available poolside." },
      { speaker: 'guest', text: "Perfect, thank you." },
      { speaker: 'agent', text: "You're welcome, enjoy your evening!" },
    ],
  },
  {
    intent: 'answerable_qa',
    department: null,
    requires_human: false,
    request_summary: null,
    transcript: [
      { speaker: 'guest', text: "Is breakfast included with my stay, and where is it served?" },
      { speaker: 'agent', text: "Yes, breakfast is included and served in the Garden Room on the 2nd floor, 6:30 to 10am." },
      { speaker: 'guest', text: "Great, that's all I needed." },
    ],
  },
  {
    intent: 'answerable_qa',
    department: null,
    requires_human: false,
    request_summary: null,
    transcript: [
      { speaker: 'guest', text: "What's the wifi password for the room?" },
      { speaker: 'agent', text: "The network is LandlineGuest and the password is printed on the card by the room phone — it's also stayhere2024, all lowercase." },
      { speaker: 'guest', text: "Got it, thanks." },
    ],
  },
  {
    intent: 'physical_request',
    department: 'housekeeping',
    requires_human: false,
    request_summary: 'Extra towels requested',
    transcript: [
      { speaker: 'guest', text: "Could someone bring up a couple more towels?" },
      { speaker: 'agent', text: "Of course, I'll send housekeeping up with extra towels right away." },
      { speaker: 'guest', text: "Thank you." },
    ],
  },
  {
    intent: 'physical_request',
    department: 'room_service',
    requires_human: false,
    request_summary: 'Breakfast tray for 2, 8am delivery',
    transcript: [
      { speaker: 'guest', text: "We'd like to order breakfast for two, delivered around 8am." },
      { speaker: 'agent', text: "Happy to set that up — two breakfast trays at 8am. Any dietary preferences?" },
      { speaker: 'guest', text: "No, the standard continental is fine for both of us." },
      { speaker: 'agent', text: "Noted, I've sent that through to room service." },
    ],
  },
  {
    intent: 'physical_request',
    department: 'maintenance',
    requires_human: false,
    request_summary: 'AC unit not cooling, room too warm',
    transcript: [
      { speaker: 'guest', text: "The air conditioning in our room isn't cooling at all, it's really warm in here." },
      { speaker: 'agent', text: "I'm sorry about that — I'm flagging this to maintenance now as a priority fix." },
      { speaker: 'guest', text: "Thanks, we'd appreciate it soon, we have a baby with us." },
      { speaker: 'agent', text: "Understood, I've marked it urgent so they get to you quickly." },
    ],
  },
  {
    intent: 'defer_to_operator',
    department: 'front_desk',
    requires_human: true,
    request_summary: 'Guest disputing a minibar charge, asking to speak with someone directly',
    transcript: [
      { speaker: 'guest', text: "There's a minibar charge on my folio that's wrong, I didn't touch anything in there." },
      { speaker: 'agent', text: "I understand the concern — billing disputes need a front desk team member to look at your folio directly. Let me get someone on the line for you." },
      { speaker: 'guest', text: "Okay, please, I've been waiting." },
    ],
  },
  {
    intent: 'defer_to_operator',
    department: 'front_desk',
    requires_human: true,
    request_summary: 'Guest locked out, ID not matching reservation',
    transcript: [
      { speaker: 'guest', text: "I'm locked out and the front desk said my ID doesn't match the reservation name." },
      { speaker: 'agent', text: "That needs a staff member to verify in person — I'm connecting you to front desk now so they can sort out the key issue." },
    ],
  },
]

function secondsFromTranscript(transcript: ConversationTurn[]): number {
  const base = 25
  return base + transcript.reduce((sum, turn) => sum + turn.text.length, 0) / 4
}

export function generateCallLog(overrides?: Partial<CallLog>): CallLog {
  const template = pick(CALL_TEMPLATES)
  const now = new Date().toISOString()
  return {
    id: nextId('call'),
    room_number: pick(ROOMS),
    language_detected: Math.random() < 0.8 ? 'en' : pick(LANGUAGES),
    duration_seconds: Math.round(secondsFromTranscript(template.transcript)),
    transcript: template.transcript,
    intent: template.intent,
    department: template.department,
    request_summary: template.request_summary,
    requires_human: template.requires_human,
    created_at: now,
    ...overrides,
  }
}

export function seedCallLogs(): CallLog[] {
  return [
    generateCallLog({ room_number: '412', created_at: minutesAgo(1) }),
    generateCallLog({ room_number: '308', created_at: minutesAgo(4) }),
    generateCallLog({ room_number: '214', created_at: minutesAgo(9) }),
    generateCallLog({ room_number: '119', created_at: minutesAgo(15) }),
    generateCallLog({ room_number: '506', language_detected: 'es', created_at: minutesAgo(21) }),
    generateCallLog({ room_number: '150', created_at: minutesAgo(33) }),
    generateCallLog({ room_number: '602', created_at: minutesAgo(47) }),
  ]
}
