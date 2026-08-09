import type { Urgency, RequestStatus, Intent } from '@/lib/types'
import { LANGUAGE_NAMES } from '@/lib/format'

const URGENCY_STYLES: Record<Urgency, string> = {
  low: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  medium: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  high: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
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
  new: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  done: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
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

export function LanguageBadge({ code }: { code: string }) {
  if (code === 'en') return null
  return (
    <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30">
      {LANGUAGE_NAMES[code] ?? code.toUpperCase()}
    </span>
  )
}

const OUTCOME_STYLES: Record<Intent, string> = {
  answerable_qa: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  physical_request: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  defer_to_operator: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
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
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/40">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
      </span>
      Needs human
    </span>
  )
}
