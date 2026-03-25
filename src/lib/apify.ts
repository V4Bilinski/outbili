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

// --- Core actors ---

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
  return result.data.id
}

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

// --- Marketing intelligence actors ---

export async function startFacebookAdsScrape(companyName: string, country = 'BR'): Promise<string> {
  const result = await apifyFetch(
    `/acts/apify~facebook-ads-scraper/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        searchQuery: companyName,
        countryCode: country,
        adType: 'all',
        adActiveStatus: 'all',
        maxItems: 20,
      }),
    },
  )
  return result.data.id
}

export async function startSeoAudit(url: string): Promise<string> {
  const result = await apifyFetch(
    `/acts/misceres~seo-audit-tool/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        startUrls: [{ url }],
        maxRequestsPerCrawl: 10,
      }),
    },
  )
  return result.data.id
}

export async function startAhrefsScrape(domain: string): Promise<string> {
  const result = await apifyFetch(
    `/acts/radeance~ahrefs-scraper/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        urls: [`https://ahrefs.com/site-explorer/overview?target=${domain}&mode=subdomains`],
      }),
    },
  )
  return result.data.id
}

export async function startSimilarWebScrape(domain: string): Promise<string> {
  const result = await apifyFetch(
    `/acts/ecomdate~similarweb-scraper/runs?token=${TOKEN}`,
    {
      method: 'POST',
      body: JSON.stringify({
        urls: [`https://www.similarweb.com/website/${domain}/`],
      }),
    },
  )
  return result.data.id
}

// Start Google Maps competitor search (same segment, same city)
export async function startCompetitorSearch(segment: string, city: string, maxResults = 10): Promise<string> {
  return startGoogleMapsSearch(segment, city, maxResults)
}

// --- Utilities ---

export async function getRunStatus(runId: string, actorId: string): Promise<ApifyRunResult> {
  const result = await apifyFetch(`/acts/${actorId}/runs/${runId}?token=${TOKEN}`)
  return result.data
}

export async function getDatasetItems<T = any>(datasetId: string, limit = 100): Promise<T[]> {
  const result = await apifyFetch(`/datasets/${datasetId}/items?token=${TOKEN}&limit=${limit}`)
  return result
}

export async function pollRunUntilDone(
  runId: string,
  actorId: string,
  onProgress?: (status: string) => void,
  maxWaitMs = 300_000,
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

// Safe run — returns null instead of throwing on failure
export async function safeRunActor(
  startFn: () => Promise<string>,
  actorId: string,
  maxWaitMs = 120_000,
): Promise<any[] | null> {
  try {
    const runId = await startFn()
    const datasetId = await pollRunUntilDone(runId, actorId, undefined, maxWaitMs)
    return await getDatasetItems(datasetId)
  } catch {
    return null
  }
}

// --- Types ---

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

export interface MarketingIntelligence {
  // Facebook Ads
  facebookAdsCount: number
  facebookAdsActive: boolean
  facebookAdsPlatforms: string[]
  facebookAdsInsight: string
  // SEO
  seoScore: number
  seoIssues: string[]
  seoKeywords: string[]
  seoInsight: string
  // Traffic (SimilarWeb)
  monthlyVisits: number
  bounceRate: number
  trafficSources: Record<string, number>
  trafficInsight: string
  // Authority (Ahrefs)
  domainRating: number
  backlinks: number
  referringDomains: number
  organicKeywords: number
  authorityInsight: string
  // Google Meu Negócio
  googleRating: number
  googleReviews: number
  googlePhotos: number
  googleInsight: string
  // Competitors
  competitors: Array<{
    name: string
    website?: string
    rating: number
    reviews: number
    category: string
    dimensions: Record<string, string>
  }>
}

// State abbreviation to full name mapping for Google Maps
const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
}

/**
 * Build search queries for Google Maps.
 * Returns MULTIPLE queries when multiple segments are selected
 * (one query per segment for better results).
 */
export function buildSearchQueries(config: SearchConfig): Array<{ query: string; location: string }> {
  const segments = config.segments.filter(Boolean)
  const keywords = config.keywords.filter(Boolean)

  // Location: city takes priority, then state full name
  let location = 'Brasil'
  if (config.city) {
    const stateAbbr = config.states[0] || ''
    const stateName = STATE_NAMES[stateAbbr] || stateAbbr
    location = stateName ? `${config.city}, ${stateName}` : config.city
  } else if (config.states.length > 0) {
    // Use first state as primary location
    location = STATE_NAMES[config.states[0]] || config.states[0]
  }

  // Build queries: one per segment for precision
  const queries: Array<{ query: string; location: string }> = []

  if (segments.length > 0) {
    for (const segment of segments) {
      // Combine segment with keywords for richer search
      const queryParts = [segment, ...keywords].filter(Boolean)
      queries.push({ query: queryParts.join(' '), location })
    }
  } else if (keywords.length > 0) {
    // No segments, use keywords only
    queries.push({ query: keywords.join(' '), location })
  } else {
    queries.push({ query: 'empresas', location })
  }

  return queries
}

// Legacy function for backward compatibility
export function buildSearchQuery(config: SearchConfig): { query: string; location: string } {
  const queries = buildSearchQueries(config)
  return queries[0] || { query: 'empresas', location: 'Brasil' }
}
