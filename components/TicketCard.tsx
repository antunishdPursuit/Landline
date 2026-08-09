'use client'

import { useEffect, useState } from 'react'
import type { GuestRequest, RequestStatus } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { LanguageBadge, NeedsHumanBadge, UrgencyBadge } from './Badges'

const NEXT_STATUS: Record<RequestStatus, RequestStatus | null> = {
  new: 'in_progress',
  in_progress: 'done',
  done: null,
}

const NEXT_LABEL: Record<RequestStatus, string> = {
  new: 'Start',
  in_progress: 'Mark done',
  done: '',
}

interface TicketCardProps {
  request: GuestRequest
  justArrived: boolean
  currentStaffName: string
  onAdvanceStatus: (id: string, status: RequestStatus, assignedTo?: string) => void
}

export function TicketCard({ request, justArrived, currentStaffName, onAdvanceStatus }: TicketCardProps) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  const nextStatus = NEXT_STATUS[request.status]
  const isDone = request.status === 'done'

  return (
    <div
      className={`rounded-xl border p-3.5 shadow-sm transition-colors ${
        justArrived ? 'animate-ticket-in' : ''
      } ${
        request.requires_human
          ? 'border-rose-500/40 bg-rose-500/[0.06]'
          : 'border-base-border bg-base-card'
      } ${isDone ? 'opacity-55' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-white">Room {request.room_number}</span>
          <span className="text-xs text-slate-500">{timeAgo(request.created_at)}</span>
        </div>
        <StatusDot status={request.status} />
      </div>

      <p className="mt-1.5 text-sm leading-snug text-slate-300">{request.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <UrgencyBadge urgency={request.urgency} />
        <LanguageBadge code={request.language_detected} />
        {request.requires_human && <NeedsHumanBadge />}
      </div>

      {request.assigned_to && (
        <p className="mt-2 text-xs text-slate-400">
          Picked up by <span className="font-medium text-slate-200">{request.assigned_to}</span>
        </p>
      )}

      {nextStatus && (
        <button
          onClick={() =>
            onAdvanceStatus(
              request.id,
              nextStatus,
              request.status === 'new' ? currentStaffName : undefined
            )
          }
          className="mt-3 w-full rounded-lg border border-base-border bg-white/[0.03] py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08] active:bg-white/[0.12]"
        >
          {NEXT_LABEL[request.status]}
        </button>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: RequestStatus }) {
  const color =
    status === 'new' ? 'bg-blue-400' : status === 'in_progress' ? 'bg-amber-400' : 'bg-emerald-400'
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />
}
