'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setStaffSession } from '@/lib/auth'
import { getStaffNamesForDepartment } from '@/lib/mock-data'
import type { Department, StaffRole } from '@/lib/types'

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'room_service', label: 'Room Service' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'manager', label: 'Manager (all departments)' },
]

function isDepartment(role: StaffRole): role is Department {
  return role !== 'manager'
}

export default function SignInPage() {
  const router = useRouter()
  const [role, setRole] = useState<StaffRole>('manager')
  const rosterNames = isDepartment(role) ? getStaffNamesForDepartment(role) : []
  const [name, setName] = useState('')
  const [managerName, setManagerName] = useState('')

  function handleRoleChange(newRole: StaffRole) {
    setRole(newRole)
    const names = isDepartment(newRole) ? getStaffNamesForDepartment(newRole) : []
    setName(names[0] ?? '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const staffName = role === 'manager' ? managerName.trim() || 'Manager' : name
    setStaffSession({ name: staffName, role })
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-base-border bg-base-panel p-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-base-bg">
            L
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Landline</h1>
            <p className="text-xs text-slate-500">Staff sign-in</p>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Department</label>
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
          className="mb-4 w-full rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Your name</label>
        {role === 'manager' ? (
          <input
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="e.g. Jordan"
            className="mb-6 w-full rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
          />
        ) : (
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-6 w-full rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
          >
            {rosterNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-white py-2 text-sm font-semibold text-base-bg transition-opacity hover:opacity-90"
        >
          Sign in
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Demo sign-in — swap for Clerk before launch. Names below are matched to the mock staff
          roster so pickup attribution lines up.
        </p>
      </form>
    </main>
  )
}
