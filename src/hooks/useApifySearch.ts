import { useState, useCallback } from 'react'
import {
  startGoogleMapsSearch,
  startInstagramScrape,
  startWebsiteCrawl,
  pollRunUntilDone,
  getDatasetItems,
  buildSearchQuery,
  type SearchConfig,
  type GoogleMapsResult,
} from '../lib/apify'

export type SearchPhase = 'idle' | 'maps' | 'instagram' | 'website' | 'analyzing' | 'done' | 'error'

interface EnrichedLead {
  // Google Maps data
  companyName: string
  address: string
  phone: string
  website: string
  googleRating: number
  reviewsCount: number
  category: string
  city: string
  state: string
  googleUrl: string
  imageUrl?: string
  emails: string[]
  // Social & contact data
  whatsapp?: string
  linkedinUrl?: string
  instagramHandle?: string
  instagramUrl?: string
  instagramFollowers?: number
  instagramPosts?: number
  instagramBio?: string
  instagramEngagement?: string
  facebookUrl?: string
  // Website data
  websiteTitle?: string
  websiteDescription?: string
  websiteServices?: string
  websiteTech?: string
  landingPages: string[]
  // Analysis
  digitalPresenceScore: number
  marketingVulnerabilities: string[]
  competitiveInsights: string
  revenueRiskProjection: string
  meetingTalkingPoints: string[]
}

interface SearchState {
  phase: SearchPhase
  mapsStatus: 'pending' | 'running' | 'done' | 'error'
  instagramStatus: 'pending' | 'running' | 'done' | 'skipped' | 'error'
  websiteStatus: 'pending' | 'running' | 'done' | 'skipped' | 'error'
  results: EnrichedLead[]
  rawMapsResults: GoogleMapsResult[]
  error: string | null
  elapsed: number
}

function analyzeDigitalPresence(lead: Partial<EnrichedLead>): number {
  let score = 0
  if (lead.website) score += 2
  if (lead.instagramFollowers && lead.instagramFollowers > 1000) score += 2
  else if (lead.instagramFollowers && lead.instagramFollowers > 0) score += 1
  if (lead.googleRating && lead.googleRating >= 4.0) score += 1
  if (lead.reviewsCount && lead.reviewsCount >= 50) score += 1
  if (lead.emails && lead.emails.length > 0) score += 1
  if (lead.websiteServices) score += 1
  if (lead.instagramPosts && lead.instagramPosts > 50) score += 1
  return Math.min(score, 10)
}

function generateVulnerabilities(lead: Partial<EnrichedLead>): string[] {
  const vulns: string[] = []
  if (!lead.website) vulns.push('Sem website — perda de credibilidade e tráfego orgânico')
  if (!lead.instagramHandle) vulns.push('Sem presença no Instagram — canal de aquisição ignorado')
  if (lead.instagramFollowers && lead.instagramFollowers < 500) vulns.push('Poucos seguidores no Instagram — baixa autoridade digital')
  if (lead.googleRating && lead.googleRating < 4.0) vulns.push(`Nota ${lead.googleRating} no Google — reputação abaixo do ideal (< 4.0)`)
  if (lead.reviewsCount && lead.reviewsCount < 20) vulns.push('Poucas avaliações no Google — baixa prova social')
  if (!lead.emails || lead.emails.length === 0) vulns.push('Sem e-mail de contato público — dificulta captação de leads')
  if (!lead.websiteServices) vulns.push('Website sem descrição clara de serviços — visitante não converte')
  vulns.push('Sem funil de vendas digital — dependência de indicações')
  return vulns.slice(0, 8)
}

function generateMeetingPoints(lead: Partial<EnrichedLead>): string[] {
  const points: string[] = []
  if (lead.googleRating) points.push(`Nota ${lead.googleRating} no Google com ${lead.reviewsCount} avaliações — explorar como converter avaliadores em clientes recorrentes`)
  if (lead.instagramFollowers) points.push(`${lead.instagramFollowers} seguidores no Instagram — potencial de converter audiência em clientes via funil`)
  if (!lead.website) points.push('Ausência de website — oportunidade imediata de presença digital')
  points.push('Questionar sobre CAC atual e LTV — provavelmente sem métricas claras')
  points.push('Mapear processo comercial atual — identificar gargalos de conversão')
  points.push('Apresentar caso similar do segmento com resultados mensuráveis')
  return points.slice(0, 6)
}

export function useApifySearch() {
  const [state, setState] = useState<SearchState>({
    phase: 'idle',
    mapsStatus: 'pending',
    instagramStatus: 'pending',
    websiteStatus: 'pending',
    results: [],
    rawMapsResults: [],
    error: null,
    elapsed: 0,
  })

  const search = useCallback(async (config: SearchConfig) => {
    const startTime = Date.now()
    const tick = setInterval(() => {
      setState((s) => ({ ...s, elapsed: Math.round((Date.now() - startTime) / 1000) }))
    }, 1000)

    try {
      // Phase 1: Google Maps
      setState({ phase: 'maps', mapsStatus: 'running', instagramStatus: 'pending', websiteStatus: 'pending', results: [], rawMapsResults: [], error: null, elapsed: 0 })

      const { query, location } = buildSearchQuery(config)
      const mapsRunId = await startGoogleMapsSearch(query, location, 15)
      const mapsDatasetId = await pollRunUntilDone(mapsRunId, 'compass~crawler-google-places')
      const mapsItems = await getDatasetItems<GoogleMapsResult>(mapsDatasetId)

      setState((s) => ({ ...s, mapsStatus: 'done', rawMapsResults: mapsItems, phase: 'instagram' }))

      // Phase 2: Instagram (for companies that have social profiles)
      let igData: Record<string, any> = {}
      const igProfiles = mapsItems
        .map((item) => item.socialProfiles?.instagram)
        .filter(Boolean) as string[]

      if (igProfiles.length > 0) {
        setState((s) => ({ ...s, instagramStatus: 'running' }))
        try {
          const igRunId = await startInstagramScrape(igProfiles)
          const igDatasetId = await pollRunUntilDone(igRunId, 'apify~instagram-scraper')
          const igItems = await getDatasetItems(igDatasetId)
          igItems.forEach((item: any) => {
            if (item.username) igData[item.username.toLowerCase()] = item
          })
          setState((s) => ({ ...s, instagramStatus: 'done' }))
        } catch {
          setState((s) => ({ ...s, instagramStatus: 'skipped' }))
        }
      } else {
        setState((s) => ({ ...s, instagramStatus: 'skipped' }))
      }

      // Phase 3: Website crawl (for companies that have websites)
      setState((s) => ({ ...s, phase: 'website' }))
      let webData: Record<string, any> = {}
      const websiteUrls = mapsItems
        .map((item) => item.website)
        .filter(Boolean) as string[]

      if (websiteUrls.length > 0) {
        setState((s) => ({ ...s, websiteStatus: 'running' }))
        try {
          const webRunId = await startWebsiteCrawl(websiteUrls.slice(0, 10))
          const webDatasetId = await pollRunUntilDone(webRunId, 'apify~website-content-crawler')
          const webItems = await getDatasetItems(webDatasetId)
          webItems.forEach((item: any) => {
            if (item.url) {
              const domain = new URL(item.url).hostname.replace('www.', '')
              webData[domain] = item
            }
          })
          setState((s) => ({ ...s, websiteStatus: 'done' }))
        } catch {
          setState((s) => ({ ...s, websiteStatus: 'skipped' }))
        }
      } else {
        setState((s) => ({ ...s, websiteStatus: 'skipped' }))
      }

      // Phase 4: Analyze and enrich
      setState((s) => ({ ...s, phase: 'analyzing' }))

      const enriched: EnrichedLead[] = mapsItems
        .filter((item) => item.title)
        .map((item) => {
          const igHandle = item.socialProfiles?.instagram?.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace('/', '')
          const igInfo = igHandle ? igData[igHandle.toLowerCase()] : null
          const webDomain = item.website ? new URL(item.website).hostname.replace('www.', '') : null
          const webInfo = webDomain ? webData[webDomain] : null

          // Extract phone as WhatsApp (Brazilian phones)
          const rawPhone = item.phone || ''
          const whatsapp = rawPhone.replace(/\D/g, '').replace(/^0+/, '')
          const whatsappFull = whatsapp.length >= 10 ? (whatsapp.startsWith('55') ? whatsapp : `55${whatsapp}`) : ''

          // Extract social profiles
          const linkedinUrl = item.socialProfiles?.linkedin || ''
          const facebookUrl = item.socialProfiles?.facebook || ''

          // Extract landing pages from website crawl
          const landingPages: string[] = []
          if (item.website) landingPages.push(item.website)
          if (webInfo?.links) {
            const links = (webInfo.links as string[]).filter((l: string) =>
              l.includes(item.website?.replace(/https?:\/\/(www\.)?/, '').split('/')[0] || '---')
            ).slice(0, 5)
            landingPages.push(...links)
          }

          const lead: EnrichedLead = {
            companyName: item.title,
            address: item.address || '',
            phone: rawPhone,
            website: item.website || '',
            googleRating: item.totalScore || 0,
            reviewsCount: item.reviewsCount || 0,
            category: item.categoryName || '',
            city: item.city || config.city || '',
            state: item.state || config.states[0] || '',
            googleUrl: item.url || '',
            imageUrl: item.imageUrl,
            emails: item.emails || [],
            whatsapp: whatsappFull,
            linkedinUrl,
            facebookUrl,
            instagramHandle: igHandle,
            instagramUrl: item.socialProfiles?.instagram,
            instagramFollowers: igInfo?.followersCount,
            instagramPosts: igInfo?.postsCount,
            instagramBio: igInfo?.biography,
            instagramEngagement: igInfo?.averageLikesPerPost ? `${igInfo.averageLikesPerPost} likes/post` : undefined,
            websiteTitle: webInfo?.title,
            websiteDescription: webInfo?.text?.substring(0, 500),
            websiteServices: webInfo?.text?.substring(0, 300),
            websiteTech: undefined,
            landingPages: [...new Set(landingPages)],
            digitalPresenceScore: 0,
            marketingVulnerabilities: [],
            competitiveInsights: '',
            revenueRiskProjection: '',
            meetingTalkingPoints: [],
          }

          lead.digitalPresenceScore = analyzeDigitalPresence(lead)
          lead.marketingVulnerabilities = generateVulnerabilities(lead)
          lead.competitiveInsights = `Presença digital: ${lead.digitalPresenceScore}/10. ${lead.reviewsCount} avaliações Google (${lead.googleRating}★). ${lead.instagramFollowers ? lead.instagramFollowers + ' seguidores IG.' : 'Sem Instagram.'} ${lead.website ? 'Website ativo.' : 'Sem website.'}`
          lead.revenueRiskProjection = `Com ${lead.marketingVulnerabilities.length} vulnerabilidades identificadas, estimativa de perda de 15-30% de receita potencial por ausência de estratégia digital estruturada.`
          lead.meetingTalkingPoints = generateMeetingPoints(lead)

          return lead
        })

      setState({
        phase: 'done',
        mapsStatus: 'done',
        instagramStatus: igProfiles.length > 0 ? 'done' : 'skipped',
        websiteStatus: websiteUrls.length > 0 ? 'done' : 'skipped',
        results: enriched,
        rawMapsResults: mapsItems,
        error: null,
        elapsed: Math.round((Date.now() - startTime) / 1000),
      })
    } catch (err: any) {
      setState((s) => ({
        ...s,
        phase: 'error',
        error: err.message || 'Erro na pesquisa',
      }))
    } finally {
      clearInterval(tick)
    }
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle', mapsStatus: 'pending', instagramStatus: 'pending', websiteStatus: 'pending', results: [], rawMapsResults: [], error: null, elapsed: 0 })
  }, [])

  return { ...state, search, reset }
}
