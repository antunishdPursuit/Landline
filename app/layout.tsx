import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Landline — Staff Board',
  description: 'Live guest request board for hotel staff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base-bg text-slate-200 antialiased">{children}</body>
    </html>
  )
}
