'use client'

import { useEffect, useState } from 'react'
import { readDemoState, subscribeToDemoState } from './demo-store'
import type { TravelRecommendation } from './types'

export function useTravelRecommendations() {
  const [recommendations, setRecommendations] = useState<TravelRecommendation[]>([])

  useEffect(() => {
    const syncRecommendations = () =>
      setRecommendations(readDemoState().travel_recommendations)
    syncRecommendations()
    return subscribeToDemoState(syncRecommendations)
  }, [])

  return { recommendations }
}
