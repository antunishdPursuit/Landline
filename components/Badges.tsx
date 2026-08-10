import type { Urgency, RequestStatus, Intent, Department } from '@/lib/types'
import { LANGUAGE_NAMES } from '@/lib/format'
import { DEPARTMENTS } from '@/lib/types'

const URGENCY_STYLES: Record<Urgency, string> = {
  low: 'bg-slate-100 text-slate-700 ring-slate-300',
  medium: 'bg-amber-100 text-amber-800 ring-amber-300',
  high: 'bg-rose-100 text-rose-700 ring-rose-300',
}

const URGENCY_LABEL: Record<Urgency, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${URGENCY_STYLES[urgency]}`}
    >
      {urgency === 'high' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
      {URGENCY_LABEL[urgency]}
    </span>
  )
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  new: 'bg-blue-100 text-blue-700 ring-blue-300',
  in_progress: 'bg-amber-100 text-amber-800 ring-amber-300',
  done: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  done: 'Done',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

const DEPARTMENT_LABEL: Record<Department, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.key, d.label])
) as Record<Department, string>

export function DepartmentBadge({ department }: { department: Department }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300">
      {DEPARTMENT_LABEL[department]}
    </span>
  )
}

export function LanguageBadge({ code }: { code: string }) {
  if (code === 'en') return null
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-300">
      {LANGUAGE_NAMES[code] ?? code.toUpperCase()}
    </span>
  )
}

const OUTCOME_STYLES: Record<Intent, string> = {
  answerable_qa: 'bg-slate-100 text-slate-700 ring-slate-300',
  physical_request: 'bg-blue-100 text-blue-700 ring-blue-300',
  defer_to_operator: 'bg-rose-100 text-rose-700 ring-rose-300',
}

const OUTCOME_LABEL: Record<Intent, string> = {
  answerable_qa: 'Answered by agent',
  physical_request: 'Ticket created',
  defer_to_operator: 'Deferred to human',
}

export function CallOutcomeBadge({ intent }: { intent: Intent }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${OUTCOME_STYLES[intent]}`}
    >
      {OUTCOME_LABEL[intent]}
    </span>
  )
}

export function NeedsHumanBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
      </span>
      Needs human
    </span>
  )
}
