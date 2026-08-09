'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setStaffSession } from '@/lib/auth'
import type { StaffRole } from '@/lib/types'

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'room_service', label: 'Room Service' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'manager', label: 'Manager (all departments)' },
]

export default function SignInPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('manager')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStaffSession({ name: name.trim() || 'Staff member', role })
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

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jordan"
          className="mb-4 w-full rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Department</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          className="mb-6 w-full rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full rounded-lg bg-white py-2 text-sm font-semibold text-base-bg transition-opacity hover:opacity-90"
        >
          Sign in
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Demo sign-in — swap for Clerk before launch.
        </p>
      </form>
    </main>
  )
}
