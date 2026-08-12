import 'server-only'

type Fetcher = typeof fetch
type JsonRecord = Record<string, unknown>

const STAY22_API_ORIGIN = 'https://api.stay22.com'
const STAY22_API_PATH = '/v2/accommodations'
const CANDIDATE_LIMIT = 5

export interface Stay22SearchInput {
  address: string
  checkin: string
  checkout: string
  adults: number
  children: number
  rooms: number
}

export interface Stay22Option {
  id: string
  name: string
  type: string
  address: string | null
  url: string
  supplier: string | null
  price_total: number | null
  currency: string
  rating: number | null
  hotel_stars: number | null
  rating_count: number | null
  distance_meters: number | null
}

export interface Stay22SearchResult {
  currency: string
  nights: number | null
  total: number
  options: Stay22Option[]
}

export class Stay22ConfigurationError extends Error {}

export class Stay22UpstreamError extends Error {
  constructor(public readonly status: number | null = null) {
    super('Stay22 search failed')
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stay22Url(value: unknown): string | null {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('stay22.com')
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function configuredEndpoint(): URL {
  const configured = process.env.STAY22_API_BASE_URL?.trim()
  if (!configured) {
    throw new Stay22ConfigurationError('Stay22 API endpoint is not configured')
  }

  try {
    const endpoint = new URL(configured)
    if (
      endpoint.origin !== STAY22_API_ORIGIN ||
      endpoint.pathname.replace(/\/$/, '') !== STAY22_API_PATH
    ) {
      throw new Error('Unexpected Stay22 API endpoint')
    }
    return endpoint
  } catch {
    throw new Stay22ConfigurationError('Stay22 API endpoint is invalid')
  }
}

function cheapestSupplier(
  value: unknown
): { name: string; link: string; total: number } | null {
  if (!isRecord(value)) return null

  return Object.entries(value).reduce<{
    name: string
    link: string
    total: number
  } | null>((best, [name, supplier]) => {
    if (!isRecord(supplier) || !isRecord(supplier.price)) return best

    const link = stay22Url(supplier.link)
    const total = optionalNumber(supplier.price.total)
    if (!link || total === null || total < 0) return best

    if (!best || total < best.total) return { name, link, total }
    return best
  }, null)
}

function parseOption(value: unknown, currency: string): Stay22Option | null {
  if (!isRecord(value)) return null

  const id = optionalString(value.id)
  const name = optionalString(value.name)
  const fallbackUrl = stay22Url(value.url)
  if (!id || !name || !fallbackUrl) return null

  const supplier = cheapestSupplier(value.suppliers)
  const location = isRecord(value.location) ? value.location : null
  const rating = isRecord(value.rating) ? value.rating : null

  return {
    id,
    name,
    type: optionalString(value.type) ?? 'Accommodation',
    address: optionalString(location?.address),
    url: supplier?.link ?? fallbackUrl,
    supplier: supplier?.name ?? null,
    price_total: supplier?.total ?? null,
    currency,
    rating: optionalNumber(rating?.value),
    hotel_stars: optionalNumber(rating?.hotelStars),
    rating_count: optionalNumber(rating?.count),
    distance_meters: optionalNumber(location?.distanceInMeters),
  }
}

function compareNullableAscending(
  left: number | null,
  right: number | null
): number {
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return left - right
}

function compareNullableDescending(
  left: number | null,
  right: number | null
): number {
  return compareNullableAscending(right, left)
}

function isWellReviewed(option: Stay22Option): boolean {
  return (
    option.rating !== null &&
    option.rating >= 8 &&
    option.rating_count !== null &&
    option.rating_count >= 50
  )
}

function normalizeLocationName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function matchesSearchLocation(option: Stay22Option, address: string): boolean {
  const title = normalizeLocationName(option.name)
  const searchLocation = normalizeLocationName(address)

  return title.length > 0 && searchLocation.includes(title)
}

export function rankStay22Options(options: Stay22Option[]): Stay22Option[] {
  return [...options].sort((left, right) => {
    const reviewQuality = Number(isWellReviewed(right)) - Number(isWellReviewed(left))
    if (reviewQuality !== 0) return reviewQuality

    const distance = compareNullableAscending(
      left.distance_meters,
      right.distance_meters
    )
    if (distance !== 0) return distance

    const rating = compareNullableDescending(left.rating, right.rating)
    if (rating !== 0) return rating

    const reviewCount = compareNullableDescending(
      left.rating_count,
      right.rating_count
    )
    if (reviewCount !== 0) return reviewCount

    return compareNullableAscending(left.price_total, right.price_total)
  })
}

export async function searchStay22(
  input: Stay22SearchInput,
  fetcher: Fetcher = fetch
): Promise<Stay22SearchResult> {
  const endpoint = configuredEndpoint()
  endpoint.searchParams.set('address', input.address)
  endpoint.searchParams.set('checkin', input.checkin)
  endpoint.searchParams.set('checkout', input.checkout)
  endpoint.searchParams.set('adults', String(input.adults))
  endpoint.searchParams.set('children', String(input.children))
  endpoint.searchParams.set('rooms', String(input.rooms))
  endpoint.searchParams.set('currency', 'USD')
  endpoint.searchParams.set('lang', 'en')
  endpoint.searchParams.set('type', 'hotel')
  endpoint.searchParams.set('pageSize', String(CANDIDATE_LIMIT))
  endpoint.searchParams.set('page', '1')
  endpoint.searchParams.set('cluster', 'false')

  let response: Response
  try {
    response = await fetcher(endpoint, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 300 },
    })
  } catch {
    throw new Stay22UpstreamError()
  }

  if (!response.ok) {
    throw new Stay22UpstreamError(response.status)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Stay22UpstreamError(response.status)
  }

  if (!isRecord(body) || !isRecord(body.meta) || !Array.isArray(body.results)) {
    throw new Stay22UpstreamError(response.status)
  }

  const currency = optionalString(body.meta.currency) ?? 'USD'
  const options = rankStay22Options(
    body.results
      .map((result) => parseOption(result, currency))
      .filter((option): option is Stay22Option => option !== null)
      .filter((option) => !matchesSearchLocation(option, input.address))
      .slice(0, CANDIDATE_LIMIT)
  )

  return {
    currency,
    nights: optionalNumber(body.meta.nights),
    total: optionalNumber(body.meta.total) ?? options.length,
    options,
  }
}
