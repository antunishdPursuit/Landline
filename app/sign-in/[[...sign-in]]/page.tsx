import { SignInExperience } from '@/components/SignInExperience'

export default function SignInPage() {
  const demoUsername = process.env.NEXT_PUBLIC_DEMO_USERNAME
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-8">
      {demoUsername && demoPassword && (
        <aside className="w-full max-w-sm rounded-xl border border-base-border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Demo manager access</p>
          <p className="mt-1 text-xs text-slate-500">
            Use these shared credentials to view the request created in this browser.
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-slate-500">Username</dt>
            <dd className="select-all font-mono text-slate-900">{demoUsername}</dd>
            <dt className="text-slate-500">Password</dt>
            <dd className="select-all font-mono text-slate-900">{demoPassword}</dd>
          </dl>
        </aside>
      )}
      <SignInExperience />
    </main>
  )
}
