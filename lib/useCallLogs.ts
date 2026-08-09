'use client'

import { useCallback, useEffect, useState } from 'react'
import { generateCallLog, seedCallLogs } from './mock-data'
import type { CallLog } from './types'

const NEW_CALL_INTERVAL_MS = 19_000

export function useCallLogs() {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [justArrivedId, setJustArrivedId] = useState<string | null>(null)

  useEffect(() => {
    setCalls(seedCallLogs())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const incoming = generateCallLog()
      setCalls((prev) => [incoming, ...prev])
      setJustArrivedId(incoming.id)
    }, NEW_CALL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const clearJustArrived = useCallback((id: string) => {
    setJustArrivedId((current) => (current === id ? null : current))
  }, [])

  return { calls, justArrivedId, clearJustArrived }
}
