'use client'

interface HeaderProps {
  staffName: string
  role: string
  onSignOut: () => void
}

const ROLE_LABEL: Record<string, string> = {
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  room_service: 'Room Service',
  maintenance: 'Maintenance',
  manager: 'Manager',
}

export function Header({ staffName, role, onSignOut }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-base-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          L
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Landline</h1>
          <p className="text-xs text-slate-500">Staff request board</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-medium text-slate-900">{staffName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABEL[role] ?? role}</p>
        </div>

        <button
          onClick={onSignOut}
          className="rounded-lg border border-base-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-900/[0.05]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
