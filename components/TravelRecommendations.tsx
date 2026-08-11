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
        Sources and accommodation options from this conversation.
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
              <span className="min-w-0">
                <span className="block">{recommendation.title}</span>
                {recommendation.source === 'stay22' && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {typeof recommendation.price_total === 'number' &&
                    recommendation.currency
                      ? `${recommendation.currency} ${recommendation.price_total} total`
                      : 'See current price'}
                    {recommendation.rating !== null &&
                      recommendation.rating !== undefined
                      ? ` · ${recommendation.rating}/10`
                      : ''}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-gold">
                {recommendation.source === 'stay22' ? 'View stays' : 'Source'}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {recommendations.some((item) => item.source === 'stay22') && (
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Prices and availability can change. Landline has not made a reservation.
        </p>
      )}
    </section>
  )
}
