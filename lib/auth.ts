'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StaffRole } from './types'

const STORAGE_KEY = 'landline_staff_session'

export interface StaffSession {
  name: string
  role: StaffRole
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StaffSession
  } catch {
    return null
  }
}

export function setStaffSession(session: StaffSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStaffSession(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function useStaffSession(): StaffSession | null | undefined {
  const router = useRouter()
  const [session, setSession] = useState<StaffSession | null | undefined>(undefined)

  useEffect(() => {
    const existing = getStaffSession()
    if (!existing) {
      router.replace('/sign-in')
      return
    }
    setSession(existing)
  }, [router])

  return session
}
