'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStaffSession } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace(getStaffSession() ? '/dashboard' : '/sign-in')
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-500">Loading…</p>
    </main>
  )
}
