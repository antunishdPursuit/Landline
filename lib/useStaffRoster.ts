'use client'

import { useEffect, useState } from 'react'
import { seedStaffRoster } from './mock-data'
import type { StaffMember } from './types'

const PRESENCE_FLIP_INTERVAL_MS = 15_000

export function useStaffRoster() {
  const [roster, setRoster] = useState<StaffMember[]>([])

  useEffect(() => {
    setRoster(seedStaffRoster())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setRoster((prev) => {
        if (prev.length === 0) return prev
        const index = Math.floor(Math.random() * prev.length)
        return prev.map((member, i) => (i === index ? { ...member, active: !member.active } : member))
      })
    }, PRESENCE_FLIP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return { roster }
}
