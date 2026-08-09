'use client'

import { useState } from 'react'
import type { CallLog } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { CallOutcomeBadge, LanguageBadge, NeedsHumanBadge } from './Badges'

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CallLogCard({ call, justArrived }: { call: CallLog; justArrived: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`rounded-xl border border-base-border bg-base-card p-4 ${
        justArrived ? 'animate-ticket-in' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-white">Room {call.room_number}</span>
            <span className="text-xs text-slate-500">{timeAgo(call.created_at)}</span>
            <span className="text-xs text-slate-500">· {formatDuration(call.duration_seconds)}</span>
          </div>
          {call.request_summary && (
            <p className="mt-1 text-sm text-slate-300">{call.request_summary}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CallOutcomeBadge intent={call.intent} />
        <LanguageBadge code={call.language_detected} />
        {call.requires_human && <NeedsHumanBadge />}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
      >
        {expanded ? 'Hide transcript' : 'View transcript'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 rounded-lg border border-base-border bg-black/20 p-3">
          {call.transcript.map((turn, i) => (
            <div key={i} className={`flex ${turn.speaker === 'guest' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-snug ${
                  turn.speaker === 'guest'
                    ? 'bg-white/[0.06] text-slate-200'
                    : 'bg-blue-500/15 text-blue-100'
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
