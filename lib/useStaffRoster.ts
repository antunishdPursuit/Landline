'use client'

import { useEffect, useState } from 'react'
import { seedStaffRoster } from './mock-data'
import type { StaffMember } from './types'

export function useStaffRoster() {
  const [roster, setRoster] = useState<StaffMember[]>([])

  useEffect(() => {
    setRoster(seedStaffRoster())
  }, [])
  return { roster }
}
