## Staff login (Clerk)

The staff dashboard is gated behind Clerk auth so only hotel staff can view live tickets. Guests never interact with Clerk — it only protects the internal dashboard.

### 1. Install

```bash
npm install @clerk/nextjs
```

### 2. Environment variables

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
```

### 3. Wrap the app

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 4. Protect the dashboard route

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

### 5. Sign-in page

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return <SignIn />
}
```

### 6. (Optional) restrict by role

If you want to separate front desk / housekeeping / manager views, tag staff accounts with `publicMetadata.role` in the Clerk dashboard and check it server-side:

```tsx
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { sessionClaims } = await auth()
  const role = sessionClaims?.publicMetadata?.role as string | undefined

  if (!role) redirect('/unauthorized')

  return <StaffDashboard role={role} />
}
```

### Why Clerk here

- Zero-config hosted sign-in UI — no time spent building auth screens during the hackathon.
- Middleware-based route protection means the ticket board and API routes are locked down in a couple lines.
- `publicMetadata.role` is enough to fake departmental views without a real RBAC system, which is plenty for a one-day demo.