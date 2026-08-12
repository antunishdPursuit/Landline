import type {
  CallLog,
  ConversationTurn,
  Department,
  GuestRequest,
  StaffMember,
} from './types'

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString()
}

export function seedRequests(): GuestRequest[] {
  return [
    {
      id: 'req_seed_front_desk',
      room_number: '412',
      department: 'front_desk',
      intent: 'defer_to_operator',
      urgency: 'high',
      requires_human: true,
      summary: 'Guest disputing a minibar charge, asking to speak with someone directly',
      status: 'new',
      language_detected: 'en',
      assigned_to: null,
      created_at: minutesAgo(1),
      updated_at: minutesAgo(1),
    },
    {
      id: 'req_seed_maintenance_ac',
      room_number: '308',
      department: 'maintenance',
      intent: 'physical_request',
      urgency: 'high',
      summary: 'AC unit not cooling, room too warm',
      status: 'new',
      requires_human: false,
      language_detected: 'en',
      assigned_to: null,
      created_at: minutesAgo(3),
      updated_at: minutesAgo(3),
    },
    {
      id: 'req_seed_housekeeping',
      room_number: '119',
      department: 'housekeeping',
      intent: 'physical_request',
      urgency: 'low',
      summary: 'Extra towels and pillows requested',
      status: 'in_progress',
      requires_human: false,
      language_detected: 'en',
      assigned_to: 'Maria Lopez',
      created_at: minutesAgo(14),
      updated_at: minutesAgo(6),
    },
    {
      id: 'req_seed_room_service',
      room_number: '506',
      department: 'room_service',
      intent: 'physical_request',
      urgency: 'medium',
      summary: 'Breakfast tray for 2, requested for 8am',
      language_detected: 'en',
      status: 'new',
      requires_human: false,
      assigned_to: null,
      created_at: minutesAgo(8),
      updated_at: minutesAgo(8),
    },
    {
      id: 'req_seed_checkout',
      room_number: '227',
      department: 'front_desk',
      intent: 'physical_request',
      urgency: 'low',
      summary: 'Requesting late checkout, flight isn’t until 8pm',
      status: 'done',
      requires_human: false,
      language_detected: 'en',
      assigned_to: 'Sam Patel',
      created_at: minutesAgo(40),
      updated_at: minutesAgo(20),
    },
    {
      id: 'req_seed_maintenance_sink',
      room_number: '331',
      department: 'maintenance',
      intent: 'physical_request',
      urgency: 'medium',
      summary: 'Bathroom sink leaking onto floor',
      status: 'in_progress',
      requires_human: false,
      language_detected: 'en',
      assigned_to: 'Diego Ramirez',
      created_at: minutesAgo(22),
      updated_at: minutesAgo(5),
    },
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

export function getStaffNamesForDepartment(department: Department): string[] {
  return STAFF_ROSTER.filter((member) => member.department === department).map((member) => member.name)
}

const SEED_CALLS: Omit<CallLog, 'duration_seconds' | 'created_at'>[] = [
  {
    id: 'call_seed_capabilities',
    room_number: '412',
    language_detected: 'en',
    intent: 'answerable_qa',
    department: null,
    requires_human: false,
    request_summary: null,
    transcript: [
      { speaker: 'guest', text: 'What can you help me with during my stay?' },
      { speaker: 'agent', text: 'I can help with room requests, current nearby information, and accommodation searches.' },
      { speaker: 'guest', text: 'That is all I needed. Thank you.' },
    ],
  },
  {
    id: 'call_seed_restaurant_search',
    room_number: '308',
    language_detected: 'en',
    intent: 'answerable_qa',
    department: null,
    requires_human: false,
    request_summary: null,
    transcript: [
      { speaker: 'guest', text: 'Can you help me find an Italian restaurant near the hotel?' },
      { speaker: 'agent', text: 'Yes. What time would you like to go, and do you have a preferred walking distance?' },
      { speaker: 'guest', text: 'I am only testing what you can search for.' },
    ],
  },
  {
    id: 'call_seed_stay_search',
    room_number: '214',
    language_detected: 'en',
    intent: 'answerable_qa',
    department: null,
    requires_human: false,
    request_summary: null,
    transcript: [
      { speaker: 'guest', text: 'Can you help me search for another hotel after I leave?' },
      { speaker: 'agent', text: 'Yes. I will need the destination, dates, number of adults and children, and number of rooms.' },
      { speaker: 'guest', text: 'Great, I will come back when I have those details.' },
    ],
  },
  {
    id: 'call_seed_towels',
    room_number: '119',
    language_detected: 'en',
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
    id: 'call_seed_room_service',
    room_number: '506',
    language_detected: 'en',
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
    id: 'call_seed_maintenance',
    room_number: '150',
    language_detected: 'en',
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
    id: 'call_seed_staff_deferral',
    room_number: '602',
    language_detected: 'en',
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
]

function secondsFromTranscript(transcript: ConversationTurn[]): number {
  const base = 25
  return base + transcript.reduce((sum, turn) => sum + turn.text.length, 0) / 4
}

export function seedCallLogs(): CallLog[] {
  const ages = [1, 4, 9, 15, 21, 33, 47]
  return SEED_CALLS.map((call, index) => ({
    ...call,
    transcript: call.transcript.map((turn) => ({ ...turn })),
    duration_seconds: Math.round(secondsFromTranscript(call.transcript)),
    created_at: minutesAgo(ages[index]),
  }))
}
