'use client'

import { useRouter } from 'next/navigation'
import { clearStaffSession, useStaffSession } from '@/lib/auth'
import { useRequests } from '@/lib/useRequests'
import { DEPARTMENTS } from '@/lib/types'
import { Header } from '@/components/Header'
import { DashboardNav } from '@/components/DashboardNav'
import { RequestColumn } from '@/components/RequestColumn'

const STATUS_COLUMN_LABEL = {
  new: 'Waiting for Pickup',
  in_progress: 'Picked Up',
  done: 'Completed',
} as const

export default function DashboardPage() {
  const router = useRouter()
  const session = useStaffSession()
  const { requests, connected, justArrivedId, updateStatus } = useRequests()

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    )
  }

  const columns =
    session.role === 'manager'
      ? (['new', 'in_progress', 'done'] as const).map((status) => {
          const columnRequests = requests.filter((r) => r.status === status)
          return {
            key: status,
            label: STATUS_COLUMN_LABEL[status],
            requests: columnRequests,
            // every request here already shares this status, so the total is the count
            count: columnRequests.length,
          }
        })
      : DEPARTMENTS.filter((d) => d.key === session.role).map((d) => {
          const columnRequests = requests.filter((r) => r.department === d.key)
          return {
            key: d.key,
            label: d.label,
            requests: columnRequests,
            // done tickets stay visible (grayed out) but shouldn't inflate the "open work" count
            count: columnRequests.filter((r) => r.status !== 'done').length,
          }
        })

  const urgentHuman = requests.filter((r) => r.requires_human && r.status !== 'done')

  function handleSignOut() {
    clearStaffSession()
    router.push('/sign-in')
  }

  return (
    <div className="flex h-screen flex-col">
      <Header
        staffName={session.name}
        role={session.role}
        connected={connected}
        onSignOut={handleSignOut}
      />
      <DashboardNav role={session.role} />

      {urgentHuman.length > 0 && (
        <div className="flex items-center gap-3 border-b border-rose-500/30 bg-rose-500/10 px-6 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
          </span>
          <p className="text-xs font-medium text-rose-200">
            {urgentHuman.length} guest{urgentHuman.length > 1 ? 's' : ''} waiting for a human — Room
            {urgentHuman.length > 1 ? 's' : ''} {urgentHuman.map((r) => r.room_number).join(', ')}
          </p>
        </div>
      )}

      <div
        className="grid flex-1 gap-4 overflow-hidden p-4"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((col) => (
          <RequestColumn
            key={col.key}
            label={col.label}
            requests={col.requests}
            count={col.count}
            justArrivedId={justArrivedId}
            currentStaffName={session.name}
            onAdvanceStatus={updateStatus}
          />
        ))}
      </div>
    </div>
  )
}
