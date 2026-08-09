'use client'

import { useEffect, useState } from 'react'
import { seedCallLogs } from './mock-data'
import type { CallLog } from './types'

export function useCallLogs() {
  const [calls, setCalls] = useState<CallLog[]>([])

  useEffect(() => {
    setCalls(seedCallLogs())
  }, [])

  return { calls }
}
