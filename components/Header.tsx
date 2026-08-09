'use client'

interface HeaderProps {
  staffName: string
  role: string
  connected: boolean
  onSignOut: () => void
}

const ROLE_LABEL: Record<string, string> = {
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  room_service: 'Room Service',
  maintenance: 'Maintenance',
  manager: 'Manager',
}

export function Header({ staffName, role, connected, onSignOut }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-base-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-base-bg">
          L
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">Landline</h1>
          <p className="text-xs text-slate-500">Staff request board</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'animate-pulse-ring bg-emerald-400' : 'bg-slate-500'
            }`}
          />
          {connected ? 'Live' : 'Connecting…'}
        </div>

        <div className="h-4 w-px bg-base-border" />

        <div className="text-right">
          <p className="text-xs font-medium text-white">{staffName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABEL[role] ?? role}</p>
        </div>

        <button
          onClick={onSignOut}
          className="rounded-lg border border-base-border px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
