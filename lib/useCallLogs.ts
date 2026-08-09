'use client'

import { useEffect, useState } from 'react'
import { readDemoState, subscribeToDemoState } from './demo-store'
import type { CallLog } from './types'

export function useCallLogs() {
  const [calls, setCalls] = useState<CallLog[]>([])

  useEffect(() => {
    const syncCalls = () => setCalls(readDemoState().call_logs)
    syncCalls()
    return subscribeToDemoState(syncCalls)
  }, [])

  return { calls }
}
