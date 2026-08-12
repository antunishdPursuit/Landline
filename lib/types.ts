export type Department = 'housekeeping' | 'room_service' | 'maintenance' | 'front_desk'

export type Intent = 'answerable_qa' | 'defer_to_operator' | 'physical_request'

export type Urgency = 'low' | 'medium' | 'high'

export type RequestStatus = 'new' | 'in_progress' | 'done'

export const DEMO_STORE_STORAGE_KEY = 'landline_demo_state'
export const DEMO_STORE_VERSION = 1 as const

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

export interface StaffMember {
  id: string
  name: string
  department: Department
  active: boolean
}

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

export interface TravelRecommendation {
  id: string
  title: string
  url: string
  source: 'tavily' | 'stay22'
  created_at: string
  accommodation_type?: string
  address?: string | null
  supplier?: string | null
  price_total?: number | null
  currency?: string
  rating?: number | null
  hotel_stars?: number | null
  rating_count?: number | null
  distance_meters?: number | null
}

export interface DemoState {
  version: typeof DEMO_STORE_VERSION
  tickets: GuestRequest[]
  call_logs: CallLog[]
  travel_recommendations: TravelRecommendation[]
}
