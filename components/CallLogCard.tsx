'use client'

import { useState } from 'react'
import type { CallLog } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { CallOutcomeBadge, LanguageBadge, NeedsHumanBadge } from './Badges'

const END_REASON_PRESENTATION = {
  guest_ended: {
    label: 'Guest ended',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  agent_ended: {
    label: 'Agent ended',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  demo_time_limit: {
    label: 'Demo limit',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  silence_timeout: {
    label: 'Silence timeout',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  connection_lost: {
    label: 'Connection lost',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  client_error: {
    label: 'Call error',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  unknown: {
    label: 'End reason unavailable',
    className: 'border-slate-200 bg-white text-slate-500',
  },
} as const

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CallLogCard({
  call,
  justArrived,
  defaultExpanded = false,
}: {
  call: CallLog
  justArrived: boolean
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const endReason = END_REASON_PRESENTATION[call.end_reason ?? 'unknown']

  return (
    <div
      className={`rounded-xl border border-base-border bg-base-card p-4 ${
        justArrived ? 'animate-ticket-in' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-slate-900">Room {call.room_number}</span>
            <span className="text-xs text-slate-500">{timeAgo(call.created_at)}</span>
            <span className="text-xs text-slate-500">· {formatDuration(call.duration_seconds)}</span>
          </div>
          {call.request_summary && (
            <p className="mt-1 text-sm text-slate-700">{call.request_summary}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CallOutcomeBadge intent={call.intent} />
        <LanguageBadge code={call.language_detected} />
        {call.requires_human && <NeedsHumanBadge />}
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${endReason.className}`}
        >
          {endReason.label}
        </span>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        {expanded ? 'Hide transcript' : 'View transcript'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 rounded-lg border border-base-border bg-slate-50 p-3">
          {call.end_detail && (
            <p className="border-b border-slate-200 pb-2 text-xs text-slate-600">
              <span className="font-medium text-slate-700">Call ended:</span>{' '}
              {call.end_detail}
            </p>
          )}
          {call.transcript.map((turn, i) => (
            <div key={i} className={`flex ${turn.speaker === 'guest' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-snug ${
                  turn.speaker === 'guest'
                    ? 'bg-slate-200/70 text-slate-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide opacity-60">
                  {turn.speaker === 'guest' ? 'Guest' : 'Agent'}
                </span>
                {turn.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
