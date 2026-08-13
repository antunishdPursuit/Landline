'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStaffSession, useStaffSignOut } from '@/lib/auth'
import { useCallLogs } from '@/lib/useCallLogs'
import { Header } from '@/components/Header'
import { DashboardNav } from '@/components/DashboardNav'
import { CallLogCard } from '@/components/CallLogCard'

export default function AgentCallsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <AgentCallsContent />
    </Suspense>
  )
}

function AgentCallsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = useStaffSession()
  const signOut = useStaffSignOut()
  const { calls } = useCallLogs()
  const selectedCallId = searchParams.get('call')

  useEffect(() => {
    if (session && session.role !== 'manager') {
      router.replace('/dashboard')
    }
  }, [session, router])

  if (session === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-slate-500">
          Your account hasn&apos;t been assigned a department yet. Contact an admin to get set up.
        </p>
      </main>
    )
  }

  if (!session || session.role !== 'manager') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    )
  }

  const answeredByAgent = calls.filter((c) => c.intent === 'answerable_qa').length
  const ticketsCreated = calls.filter((c) => c.intent === 'physical_request').length
  const deferredToHuman = calls.filter((c) => c.intent === 'defer_to_operator').length

  return (
    <div className="flex h-screen flex-col">
      <Header staffName={session.name} role={session.role} onSignOut={signOut} />
      <DashboardNav role={session.role} />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 grid grid-cols-4 gap-3">
          <StatTile label="Total calls" value={calls.length} />
          <StatTile label="Answered by agent" value={answeredByAgent} accent="text-slate-800" />
          <StatTile label="Tickets created" value={ticketsCreated} accent="text-blue-700" />
          <StatTile label="Deferred to human" value={deferredToHuman} accent="text-rose-700" />
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Full voice-agent call log — visible to managers only.
        </p>

        <div className="space-y-2.5">
          {calls.map((call) => (
            <CallLogCard
              key={call.id}
              call={call}
              justArrived={call.id === selectedCallId}
              defaultExpanded={call.id === selectedCallId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  accent = 'text-slate-900',
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-base-border bg-base-panel px-4 py-3">
      <p className={`text-2xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  )
}
