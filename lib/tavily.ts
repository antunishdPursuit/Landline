import 'server-only'

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search'

export interface ConciergeSource {
  title: string
  url: string
  content: string
}

export interface ConciergeSearchResult {
  answered: boolean
  answer: string | null
  sources: ConciergeSource[]
  query: string
}

type TavilySearchResponse = {
  answer?: unknown
  results?: unknown
}

export class TavilyConfigurationError extends Error {}
export class TavilyUpstreamError extends Error {}

function parseSources(value: unknown): ConciergeSource[] {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object'
    )
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : '',
      url: typeof item.url === 'string' ? item.url.trim() : '',
      content: typeof item.content === 'string' ? item.content.trim() : '',
    }))
    .filter((item) => item.title !== '' && item.url.startsWith('http'))
    .slice(0, 5)
}

export async function searchConcierge(
  question: string,
  location?: string
): Promise<ConciergeSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new TavilyConfigurationError('Tavily is not configured')
  }

  const query = location ? `${question} near ${location}` : question
  let response: Response
  try {
    response = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        topic: 'general',
        search_depth: 'basic',
        max_results: 5,
        include_answer: 'basic',
        include_raw_content: false,
        include_images: false,
        auto_parameters: false,
      }),
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    throw new TavilyUpstreamError('Tavily request failed')
  }

  if (!response.ok) {
    throw new TavilyUpstreamError(`Tavily responded with status ${response.status}`)
  }

  let payload: TavilySearchResponse
  try {
    payload = (await response.json()) as TavilySearchResponse
  } catch {
    throw new TavilyUpstreamError('Tavily returned invalid JSON')
  }

  const answer = typeof payload.answer === 'string' ? payload.answer.trim() : ''
  const sources = parseSources(payload.results)
  const answered = answer !== '' && sources.length > 0

  return {
    answered,
    answer: answered ? answer : null,
    sources,
    query,
  }
}
