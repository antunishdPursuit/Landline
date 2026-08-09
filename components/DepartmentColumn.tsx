'use client'

import type { Department, GuestRequest, RequestStatus } from '@/lib/types'
import { TicketCard } from './TicketCard'

const URGENCY_WEIGHT = { high: 0, medium: 1, low: 2 } as const

interface DepartmentColumnProps {
  department: Department
  label: string
  requests: GuestRequest[]
  justArrivedId: string | null
  onAdvanceStatus: (id: string, status: RequestStatus) => void
}

export function DepartmentColumn({
  label,
  requests,
  justArrivedId,
  onAdvanceStatus,
}: DepartmentColumnProps) {
  const open = requests.filter((r) => r.status !== 'done')
  const sorted = [...requests].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (b.status === 'done' && a.status !== 'done') return -1
    const weight = URGENCY_WEIGHT[a.urgency] - URGENCY_WEIGHT[b.urgency]
    if (weight !== 0) return weight
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const needsHumanCount = open.filter((r) => r.requires_human).length

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-border bg-base-panel">
      <div className="flex items-center justify-between border-b border-base-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">{label}</h2>
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-xs text-slate-400">
            {open.length}
          </span>
        </div>
        {needsHumanCount > 0 && (
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300">
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
            onAdvanceStatus={onAdvanceStatus}
          />
        ))}
      </div>
    </div>
  )
}
