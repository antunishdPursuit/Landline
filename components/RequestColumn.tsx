'use client'

import type { GuestRequest, RequestStatus } from '@/lib/types'
import { TicketCard } from './TicketCard'

const URGENCY_WEIGHT = { high: 0, medium: 1, low: 2 } as const

interface RequestColumnProps {
  label: string
  requests: GuestRequest[]
  count: number
  justArrivedId: string | null
  currentStaffName: string
  onAdvanceStatus: (id: string, status: RequestStatus, assignedTo?: string) => void
  onRemove: (id: string) => void
}

export function RequestColumn({
  label,
  requests,
  count,
  justArrivedId,
  currentStaffName,
  onAdvanceStatus,
  onRemove,
}: RequestColumnProps) {
  const sorted = [...requests].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (b.status === 'done' && a.status !== 'done') return -1
    const weight = URGENCY_WEIGHT[a.urgency] - URGENCY_WEIGHT[b.urgency]
    if (weight !== 0) return weight
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const needsHumanCount = requests.filter((r) => r.requires_human && r.status !== 'done').length

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-border bg-base-panel">
      <div className="flex items-center justify-between border-b border-base-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
          <span className="rounded-full bg-slate-900/5 px-1.5 py-0.5 text-xs text-slate-600">
            {count}
          </span>
        </div>
        {needsHumanCount > 0 && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
            {needsHumanCount} needs human
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {sorted.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-500">No tickets right now</p>
        )}
        {sorted.map((request) => (
          <TicketCard
            key={request.id}
            request={request}
            justArrived={request.id === justArrivedId}
            currentStaffName={currentStaffName}
            onAdvanceStatus={onAdvanceStatus}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}
