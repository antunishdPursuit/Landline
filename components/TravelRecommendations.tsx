'use client'

import React from 'react'
import { useTravelRecommendations } from '@/lib/useTravelRecommendations'

export function TravelRecommendations() {
  const { recommendations } = useTravelRecommendations()
  if (recommendations.length === 0) return null

  return (
    <section
      aria-labelledby="travel-recommendations-title"
      className="w-full max-w-sm rounded-2xl border border-base-border bg-white p-5 shadow-lg shadow-slate-900/5"
    >
      <h2
        id="travel-recommendations-title"
        className="font-display text-xl font-semibold text-slate-900"
      >
        Concierge links
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Open source information and tracked stay destinations from this conversation.
      </p>

      <ul className="mt-4 space-y-3">
        {recommendations.slice(0, 5).map((recommendation) => (
          <li key={recommendation.id}>
            <a
              href={recommendation.url}
              target="_blank"
              rel={recommendation.source === 'stay22' ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}
              className="group flex items-center justify-between gap-3 rounded-xl border border-base-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-gold hover:text-gold"
            >
              <span>{recommendation.title}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-gold">
                {recommendation.source === 'stay22' ? 'View stays' : 'Source'}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {recommendations.some((item) => item.source === 'stay22') && (
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Stay links open an external search. Landline has not made a reservation.
        </p>
      )}
    </section>
  )
}
