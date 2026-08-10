import 'server-only'

const STAY22_ALLEZ_URL = 'https://www.stay22.com/allez/roam'

export interface Stay22Destination {
  destination: string
  title: string
  url: string
}

export class Stay22ConfigurationError extends Error {}

export function createStay22Destination(destination: string): Stay22Destination {
  const aid = process.env.STAY22_AID?.trim()
  if (!aid) {
    throw new Stay22ConfigurationError('Stay22 is not configured')
  }

  const normalizedDestination = destination.trim()
  const url = new URL(STAY22_ALLEZ_URL)
  url.searchParams.set('aid', aid)
  url.searchParams.set('address', normalizedDestination)

  return {
    destination: normalizedDestination,
    title: `View stays near ${normalizedDestination}`,
    url: url.toString(),
  }
}
