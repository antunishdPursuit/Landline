'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  readDemoState,
  resetDemoState,
  subscribeToDemoState,
  updateDemoTicketStatus,
} from './demo-store'
import type { GuestRequest, RequestStatus } from './types'

export function useRequests() {
  const [requests, setRequests] = useState<GuestRequest[]>([])
  const [justArrivedId, setJustArrivedId] = useState<string | null>(null)
  const knownIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const syncRequests = () => {
      const next = readDemoState().tickets
      const arrival = next.find((ticket) => !knownIds.current.has(ticket.id))

      knownIds.current = new Set(next.map((ticket) => ticket.id))
      setRequests(next)
      if (arrival) setJustArrivedId(arrival.id)
    }

    // Initialize without treating seeded tickets as newly arrived.
    const initial = readDemoState().tickets
    knownIds.current = new Set(initial.map((ticket) => ticket.id))
    setRequests(initial)

    return subscribeToDemoState(syncRequests)
  }, [])

  const clearJustArrived = useCallback((id: string) => {
    setJustArrivedId((current) => (current === id ? null : current))
  }, [])

  const updateStatus = useCallback(
    (id: string, status: RequestStatus, assignedTo?: string) => {
      updateDemoTicketStatus(id, status, assignedTo)
    },
    []
  )

  const reset = useCallback(() => {
    resetDemoState()
    setJustArrivedId(null)
  }, [])

  return { requests, justArrivedId, clearJustArrived, updateStatus, reset }
}
