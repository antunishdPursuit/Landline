'use client'

import type { StaffMember } from '@/lib/types'

interface StaffRosterPanelProps {
  label: string
  members: StaffMember[]
  assignedCounts: Record<string, number>
}

export function StaffRosterPanel({ label, members, assignedCounts }: StaffRosterPanelProps) {
  const activeCount = members.filter((m) => m.active).length

  return (
    <div className="rounded-2xl border border-base-border bg-base-panel">
      <div className="flex items-center justify-between border-b border-base-border px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            activeCount > 0
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {activeCount}/{members.length} active
        </span>
      </div>

      <div className="space-y-2 p-3">
        {members.map((member) => {
          const handling = assignedCounts[member.name] ?? 0
          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg bg-slate-900/[0.03] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${member.active ? 'bg-emerald-400' : 'bg-slate-600'}`}
                />
                <span className="text-sm text-slate-800">{member.name}</span>
              </div>
              {handling > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  handling {handling}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
