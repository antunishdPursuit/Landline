'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { StaffRole } from '@/lib/types'

const TABS = [
  { href: '/dashboard', label: 'Requests', managerOnly: false },
  { href: '/dashboard/calls', label: 'Agent Calls', managerOnly: true },
  { href: '/dashboard/team', label: 'Team', managerOnly: true },
]

export function DashboardNav({ role }: { role: StaffRole }) {
  const pathname = usePathname()
  const visibleTabs = TABS.filter((tab) => !tab.managerOnly || role === 'manager')

  if (visibleTabs.length < 2) return null

  return (
    <nav className="flex gap-1 border-b border-base-border px-6">
      {visibleTabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              active
                ? 'border-white text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
