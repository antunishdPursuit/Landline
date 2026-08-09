'use client'

import { useRouter } from 'next/navigation'
import { clearStaffSession, useStaffSession } from '@/lib/auth'
import { useRequests } from '@/lib/useRequests'
import { DEPARTMENTS } from '@/lib/types'
import { Header } from '@/components/Header'
import { DashboardNav } from '@/components/DashboardNav'
import { DepartmentColumn } from '@/components/DepartmentColumn'

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

  const visibleDepartments =
    session.role === 'manager' ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.key === session.role)

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
        style={{ gridTemplateColumns: `repeat(${visibleDepartments.length}, minmax(0, 1fr))` }}
      >
        {visibleDepartments.map((dept) => (
          <DepartmentColumn
            key={dept.key}
            department={dept.key}
            label={dept.label}
            requests={requests.filter((r) => r.department === dept.key)}
            justArrivedId={justArrivedId}
            onAdvanceStatus={updateStatus}
          />
        ))}
      </div>
    </div>
  )
}
