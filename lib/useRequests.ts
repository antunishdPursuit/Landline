'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { generateRequest, seedRequests } from './mock-data'
import type { GuestRequest, RequestStatus } from './types'

const NEW_TICKET_INTERVAL_MS = 14_000

export function useRequests() {
  const [requests, setRequests] = useState<GuestRequest[]>([])
  const [connected, setConnected] = useState(false)
  const [justArrivedId, setJustArrivedId] = useState<string | null>(null)

  useEffect(() => {
    setRequests(seedRequests())
    const connectTimer = setTimeout(() => setConnected(true), 500)
    return () => clearTimeout(connectTimer)
  }, [])

  useEffect(() => {
    if (!connected) return
    const interval = setInterval(() => {
      const incoming = generateRequest()
      setRequests((prev) => [incoming, ...prev])
      setJustArrivedId(incoming.id)
    }, NEW_TICKET_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [connected])

  const clearJustArrived = useCallback((id: string) => {
    setJustArrivedId((current) => (current === id ? null : current))
  }, [])

  const updateStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r))
    )
  }, [])

  return { requests, connected, justArrivedId, clearJustArrived, updateStatus }
}
