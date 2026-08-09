'use client'

import { useCallback, useEffect, useState } from 'react'
import { seedRequests } from './mock-data'
import type { GuestRequest, RequestStatus } from './types'

export function useRequests() {
  const [requests, setRequests] = useState<GuestRequest[]>([])
  const [justArrivedId, setJustArrivedId] = useState<string | null>(null)

  useEffect(() => {
    setRequests(seedRequests())
  }, [])

  const clearJustArrived = useCallback((id: string) => {
    setJustArrivedId((current) => (current === id ? null : current))
  }, [])

  const updateStatus = useCallback((id: string, status: RequestStatus, assignedTo?: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              assigned_to: assignedTo ?? r.assigned_to,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    )
  }, [])

  return { requests, justArrivedId, clearJustArrived, updateStatus }
}
