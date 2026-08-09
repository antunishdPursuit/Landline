export type Department = 'housekeeping' | 'room_service' | 'maintenance' | 'front_desk'

export type Intent = 'answerable_qa' | 'defer_to_operator' | 'physical_request'

export type Urgency = 'low' | 'medium' | 'high'

export type RequestStatus = 'new' | 'in_progress' | 'done'

export type StaffRole = 'front_desk' | 'housekeeping' | 'room_service' | 'maintenance' | 'manager'

export interface GuestRequest {
  id: string
  room_number: string
  intent: Intent
  department: Department
  summary: string
  urgency: Urgency
  language_detected: string
  status: RequestStatus
  requires_human: boolean
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export const DEPARTMENTS: { key: Department; label: string }[] = [
  { key: 'front_desk', label: 'Front Desk' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'room_service', label: 'Room Service' },
  { key: 'maintenance', label: 'Maintenance' },
]

export interface ConversationTurn {
  speaker: 'guest' | 'agent'
  text: string
}

export interface CallLog {
  id: string
  room_number: string
  language_detected: string
  duration_seconds: number
  transcript: ConversationTurn[]
  intent: Intent
  department: Department | null
  request_summary: string | null
  requires_human: boolean
  created_at: string
}
