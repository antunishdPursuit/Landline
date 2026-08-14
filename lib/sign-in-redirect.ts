export function getSafeDashboardRedirect(value: string | null): string {
  if (
    value &&
    !value.startsWith('//') &&
    (value === '/dashboard' || value.startsWith('/dashboard/'))
  ) {
    return value
  }

  return '/dashboard'
}
