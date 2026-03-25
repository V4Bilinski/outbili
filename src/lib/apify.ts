const TOKEN = import.meta.env.VITE_APIFY_TOKEN || ''
const API_URL = 'https://api.apify.com/v2'

interface ApifyRunResult {
  id: string
  status: string
  defaultDatasetId: string
}

async function apifyFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error?.message || `Apify error: ${res.status}`)
  }
  return res.json()
}

// Start a Google Maps Places scraper run
export async function startGoogleMapsSearch(query: string, location: string, maxResults = 20): Promise<string> {
  const result = await apifyFetch(
    `/acts/compass~crawler-google-places/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        searchStringsArray: [query],
        locationQuery: location,
        maxCrawledPlacesPerSearch: maxResults,
        language: 'pt-BR',
        maxImages: 1,
        scrapeContacts: true,
        scrapeEmails: true,
        deeperCityScrape: false,
      }),
    },
  )
  return result.data.id // runId
}

// Start Instagram scraper for a list of profiles
export async function startInstagramScrape(profiles: string[]): Promise<string> {
  const result = await apifyFetch(
    `/acts/apify~instagram-scraper/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        directUrls: profiles.map((p) => p.startsWith('http') ? p : `https://www.instagram.com/${p}/`),
        resultsType: 'details',
        resultsLimit: 5,
        searchType: 'user',
      }),
    },
  )
  return result.data.id
}

// Start website content crawler
export async function startWebsiteCrawl(urls: string[]): Promise<string> {
  const result = await apifyFetch(
    `/acts/apify~website-content-crawler/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        startUrls: urls.map((url) => ({ url })),
        maxCrawlPages: 5,
        crawlerType: 'cheerio',
      }),
    },
  )
  return result.data.id
}

// Poll run status
export async function getRunStatus(runId: string, actorId: string): Promise<ApifyRunResult> {
  const result = await apifyFetch(`/acts/${actorId}/runs/${runId}?token=${TOKEN}`)
  return result.data
}

// Get dataset items from a completed run
export async function getDatasetItems<T = any>(datasetId: string, limit = 100): Promise<T[]> {
  const result = await apifyFetch(`/datasets/${datasetId}/items?token=${TOKEN}&limit=${limit}`)
  return result
}

// Poll until run completes (with callback for progress updates)
export async function pollRunUntilDone(
  runId: string,
  actorId: string,
  onProgress?: (status: string) => void,
  maxWaitMs = 180_000,
): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const run = await getRunStatus(runId, actorId)
    onProgress?.(run.status)
    if (run.status === 'SUCCEEDED') return run.defaultDatasetId
    if (run.status === 'FAILED' || run.status === 'ABORTED') throw new Error(`Apify run ${run.status}`)
    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error('Apify run timeout')
}

// Combined search: Google Maps + optional Instagram + Website
export interface SearchConfig {
  segments: string[]
  states: string[]
  city: string
  keywords: string[]
  revenueMin?: string
  revenueMax?: string
}

export interface GoogleMapsResult {
  title: string
  address: string
  phone: string
  website: string
  totalScore: number
  reviewsCount: number
  categoryName: string
  city: string
  state: string
  url: string
  imageUrl?: string
  emails?: string[]
  socialProfiles?: Record<string, string>
}

export function buildSearchQuery(config: SearchConfig): { query: string; location: string } {
  const parts = [...config.segments, ...config.keywords].filter(Boolean)
  const query = parts.join(' ') || 'empresas'
  const locationParts = [config.city, ...config.states].filter(Boolean)
  const location = locationParts.join(', ') || 'Brasil'
  return { query, location }
}
