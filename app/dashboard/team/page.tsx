'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffSession, useStaffSignOut } from '@/lib/auth'
import { useRequests } from '@/lib/useRequests'
import { useStaffRoster } from '@/lib/useStaffRoster'
import { DEPARTMENTS } from '@/lib/types'
import { Header } from '@/components/Header'
import { DashboardNav } from '@/components/DashboardNav'
import { StaffRosterPanel } from '@/components/StaffRosterPanel'

export default function TeamPage() {
  const router = useRouter()
  const session = useStaffSession()
  const signOut = useStaffSignOut()
  const { requests } = useRequests()
  const { roster } = useStaffRoster()

  useEffect(() => {
    if (session && session.role !== 'manager') {
      router.replace('/dashboard')
    }
  }, [session, router])

  if (session === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-slate-500">
          Your account hasn&apos;t been assigned a department yet. Contact an admin to get set up.
        </p>
      </main>
    )
  }

  if (!session || session.role !== 'manager') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    )
  }

  const assignedCounts: Record<string, number> = {}
  for (const request of requests) {
    if (request.assigned_to && request.status !== 'done') {
      assignedCounts[request.assigned_to] = (assignedCounts[request.assigned_to] ?? 0) + 1
    }
  }

  const totalActive = roster.filter((m) => m.active).length

  return (
    <div className="flex h-screen flex-col">
      <Header staffName={session.name} role={session.role} onSignOut={signOut} />
      <DashboardNav role={session.role} />

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs text-slate-500">
          {totalActive} of {roster.length} staff currently active across all departments.
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DEPARTMENTS.map((dept) => (
            <StaffRosterPanel
              key={dept.key}
              label={dept.label}
              members={roster.filter((m) => m.department === dept.key)}
              assignedCounts={assignedCounts}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
