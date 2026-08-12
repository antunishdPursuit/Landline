'use client'

import { useState } from 'react'
import { seedStaffRoster } from './mock-data'
import type { StaffMember } from './types'

export function useStaffRoster() {
  const [roster] = useState<StaffMember[]>(seedStaffRoster)

  return { roster }
}
