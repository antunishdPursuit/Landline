'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import type { StaffRole } from './types'

export interface StaffSession {
  name: string
  role: StaffRole
}

const VALID_ROLES: StaffRole[] = [
  'front_desk',
  'housekeeping',
  'room_service',
  'maintenance',
  'manager',
]

function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
}

/**
 * Staff identity comes from Clerk; department/role comes from
 * publicMetadata.role, set per-user by an admin (Clerk dashboard or Backend
 * API) — there is no self-service department picker.
 *
 * Returns:
 *   - undefined     Clerk is still resolving the session
 *   - null          signed in, but no role has been assigned yet
 *   - StaffSession  signed in with an assigned role
 */
export function useStaffSession(): StaffSession | null | undefined {
  const { user, isLoaded } = useUser()

  if (!isLoaded || !user) return undefined

  const role = user.publicMetadata.role
  if (!isStaffRole(role)) return null

  const name = user.fullName ?? user.firstName ?? user.username ?? 'Staff'
  return { name, role }
}

export function useStaffSignOut(): () => void {
  const { signOut } = useClerk()
  return () => {
    void signOut({ redirectUrl: '/sign-in' })
  }
}
