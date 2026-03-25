import { useState, useCallback } from 'react'
import {
  startGoogleMapsSearch,
  startInstagramScrape,
  startWebsiteCrawl,
  startFacebookAdsScrape,
  startSeoAudit,
  startCompetitorSearch,
  pollRunUntilDone,
  getDatasetItems,
  safeRunActor,
  buildSearchQuery,
  type SearchConfig,
  type GoogleMapsResult,
  type MarketingIntelligence,
} from '../lib/apify'

export type SearchPhase = 'idle' | 'maps' | 'instagram' | 'website' | 'marketing' | 'competitors' | 'analyzing' | 'done' | 'error'

export interface EnrichedLead {
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
  whatsapp?: string
  linkedinUrl?: string
  facebookUrl?: string
  instagramHandle?: string
  instagramUrl?: string
  instagramFollowers?: number
  instagramPosts?: number
  instagramBio?: string
  landingPages: string[]
  // Marketing intelligence
  marketing: MarketingIntelligence
  // SPICED scores (data-driven)
  spicedS: number
  spicedP: number
  spicedI: number
  spicedC: number
  spicedD: number
  spicedTotal: number
  // Computed scores
  digitalPresenceScore: number
  marketingVulnerabilities: Array<{ titulo: string; descricao: string; impacto: 'ALTO' | 'MEDIO' | 'BAIXO'; impactoFinanceiro: string; insightProvocativo: string }>
  competitiveAnalysis: Array<{ name: string; rating: number; reviews: number; dimensions: Record<string, string> }>
  salesArguments: Array<{ eixo: string; argumento: string; objecao: string; resposta: string; oportunidade: string; impactoROI: string }>
  projectionNarrative: string
  inactionCost: string
  meetingTalkingPoints: string[]
}

interface SearchState {
  phase: SearchPhase
  stepStatuses: Record<string, 'pending' | 'running' | 'done' | 'skipped' | 'error'>
  results: EnrichedLead[]
  error: string | null
  elapsed: number
}

export function useApifySearch() {
  const [state, setState] = useState<SearchState>({
    phase: 'idle',
    stepStatuses: {},
    results: [],
    error: null,
    elapsed: 0,
  })

  const search = useCallback(async (config: SearchConfig) => {
    const startTime = Date.now()
    const tick = setInterval(() => {
      setState((s) => ({ ...s, elapsed: Math.round((Date.now() - startTime) / 1000) }))
    }, 1000)

    const setStep = (step: string, status: string) => {
      setState((s) => ({ ...s, stepStatuses: { ...s.stepStatuses, [step]: status as any } }))
    }

    try {
      setState({
        phase: 'maps',
        stepStatuses: { maps: 'running', instagram: 'pending', website: 'pending', facebookAds: 'pending', seo: 'pending', competitors: 'pending', analysis: 'pending' },
        results: [],
        error: null,
        elapsed: 0,
      })

      // --- Phase 1: Google Maps ---
      const { query, location } = buildSearchQuery(config)
      const mapsRunId = await startGoogleMapsSearch(query, location, 15)
      const mapsDatasetId = await pollRunUntilDone(mapsRunId, 'compass~crawler-google-places')
      const mapsItems = await getDatasetItems<GoogleMapsResult>(mapsDatasetId)
      setStep('maps', 'done')

      // --- Phase 2: Instagram (parallel-safe) ---
      setState((s) => ({ ...s, phase: 'instagram' }))
      setStep('instagram', 'running')
      let igData: Record<string, any> = {}
      const igProfiles = mapsItems.map((item) => item.socialProfiles?.instagram).filter(Boolean) as string[]
      if (igProfiles.length > 0) {
        try {
          const igRunId = await startInstagramScrape(igProfiles)
          const igDatasetId = await pollRunUntilDone(igRunId, 'apify~instagram-scraper')
          const igItems = await getDatasetItems(igDatasetId)
          igItems.forEach((item: any) => { if (item.username) igData[item.username.toLowerCase()] = item })
          setStep('instagram', 'done')
        } catch { setStep('instagram', 'skipped') }
      } else { setStep('instagram', 'skipped') }

      // --- Phase 3: Website crawl ---
      setState((s) => ({ ...s, phase: 'website' }))
      setStep('website', 'running')
      let webData: Record<string, any> = {}
      const websiteUrls = mapsItems.map((item) => item.website).filter(Boolean) as string[]
      if (websiteUrls.length > 0) {
        try {
          const webRunId = await startWebsiteCrawl(websiteUrls.slice(0, 10))
          const webDatasetId = await pollRunUntilDone(webRunId, 'apify~website-content-crawler')
          const webItems = await getDatasetItems(webDatasetId)
          webItems.forEach((item: any) => {
            if (item.url) { const domain = new URL(item.url).hostname.replace('www.', ''); webData[domain] = item }
          })
          setStep('website', 'done')
        } catch { setStep('website', 'skipped') }
      } else { setStep('website', 'skipped') }

      // --- Phase 4: Marketing intelligence (Facebook Ads + SEO — parallel) ---
      setState((s) => ({ ...s, phase: 'marketing' }))
      setStep('facebookAds', 'running')
      setStep('seo', 'running')

      const adsPromises = mapsItems.slice(0, 5).map(async (item) => {
        const ads = await safeRunActor(
          () => startFacebookAdsScrape(item.title),
          'apify~facebook-ads-scraper',
          90_000,
        )
        return { company: item.title, ads: ads || [] }
      })

      const seoPromises = websiteUrls.slice(0, 5).map(async (url) => {
        const seo = await safeRunActor(
          () => startSeoAudit(url),
          'misceres~seo-audit-tool',
          90_000,
        )
        return { url, seo: seo?.[0] || null }
      })

      const [adsResults, seoResults] = await Promise.all([
        Promise.all(adsPromises),
        Promise.all(seoPromises),
      ])

      const adsMap: Record<string, any[]> = {}
      adsResults.forEach((r) => { adsMap[r.company] = r.ads })

      const seoMap: Record<string, any> = {}
      seoResults.forEach((r) => {
        if (r.url && r.seo) {
          const domain = new URL(r.url).hostname.replace('www.', '')
          seoMap[domain] = r.seo
        }
      })

      setStep('facebookAds', 'done')
      setStep('seo', 'done')

      // --- Phase 5: Competitors ---
      setState((s) => ({ ...s, phase: 'competitors' }))
      setStep('competitors', 'running')
      let competitorData: GoogleMapsResult[] = []
      try {
        const compRunId = await startCompetitorSearch(
          config.segments[0] || query,
          config.city || location,
          10,
        )
        const compDatasetId = await pollRunUntilDone(compRunId, 'compass~crawler-google-places')
        competitorData = await getDatasetItems<GoogleMapsResult>(compDatasetId)
        setStep('competitors', 'done')
      } catch { setStep('competitors', 'skipped') }

      // --- Phase 6: Analysis ---
      setState((s) => ({ ...s, phase: 'analyzing' }))
      setStep('analysis', 'running')

      const enriched: EnrichedLead[] = mapsItems
        .filter((item) => item.title)
        .map((item) => {
          const igHandle = item.socialProfiles?.instagram?.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace('/', '')
          const igInfo = igHandle ? igData[igHandle.toLowerCase()] : null
          const webDomain = item.website ? new URL(item.website).hostname.replace('www.', '') : null
          void (webDomain ? webData[webDomain] : null) // webInfo available for future enrichment
          const ads = adsMap[item.title] || []
          const seo = webDomain ? seoMap[webDomain] : null

          const rawPhone = item.phone || ''
          const whatsapp = rawPhone.replace(/\D/g, '').replace(/^0+/, '')
          const whatsappFull = whatsapp.length >= 10 ? (whatsapp.startsWith('55') ? whatsapp : `55${whatsapp}`) : ''

          // Build marketing intelligence
          const marketing: MarketingIntelligence = {
            facebookAdsCount: ads.length,
            facebookAdsActive: ads.some((a: any) => a.isActive),
            facebookAdsPlatforms: [...new Set(ads.flatMap((a: any) => a.platforms || []))],
            facebookAdsInsight: ads.length > 0
              ? `${ads.length} anúncios encontrados na biblioteca Meta. ${ads.filter((a: any) => a.isActive).length} ativos.`
              : 'Nenhum anúncio encontrado na biblioteca Meta — empresa não investe em tráfego pago no Facebook/Instagram.',
            seoScore: seo?.score || 0,
            seoIssues: seo?.issues?.map((i: any) => i.description || i.message)?.slice(0, 10) || [],
            seoKeywords: seo?.keywords?.slice(0, 20) || [],
            seoInsight: seo
              ? `Score SEO: ${seo.score || 'N/A'}/100. ${seo.issues?.length || 0} problemas técnicos identificados.`
              : 'Sem dados de SEO — website pode não existir ou não está indexado.',
            monthlyVisits: 0,
            bounceRate: 0,
            trafficSources: {},
            trafficInsight: 'Dados de tráfego via SimilarWeb disponíveis sob demanda.',
            domainRating: 0,
            backlinks: 0,
            referringDomains: 0,
            organicKeywords: 0,
            authorityInsight: 'Análise de autoridade via Ahrefs disponível sob demanda.',
            googleRating: item.totalScore || 0,
            googleReviews: item.reviewsCount || 0,
            googlePhotos: 0,
            googleInsight: item.totalScore
              ? `Nota ${item.totalScore}/5 com ${item.reviewsCount} avaliações no Google Meu Negócio.${item.totalScore < 4 ? ' Abaixo de 4.0 — reputação em risco.' : ' Boa reputação.'}`
              : 'Sem perfil no Google Meu Negócio — invisível para buscas locais.',
            competitors: competitorData
              .filter((c) => c.title !== item.title)
              .slice(0, 3)
              .map((c) => ({
                name: c.title,
                website: c.website,
                rating: c.totalScore || 0,
                reviews: c.reviewsCount || 0,
                category: c.categoryName || '',
                dimensions: buildCompetitorDimensions(c, item),
              })),
          }

          // Digital presence score (0-10)
          let dpScore = 0
          if (item.website) dpScore += 2
          if (igInfo?.followersCount > 1000) dpScore += 2
          else if (igInfo?.followersCount > 0) dpScore += 1
          if (item.totalScore >= 4.0) dpScore += 1
          if (item.reviewsCount >= 50) dpScore += 1
          if (ads.length > 0) dpScore += 2
          if (seo?.score > 50) dpScore += 1
          if (item.emails?.length) dpScore += 1
          dpScore = Math.min(dpScore, 10)

          // SPICED data-driven scoring
          const spicedS = calculateSpicedS(item, seo, igInfo)
          const spicedP = calculateSpicedP(item, ads, igInfo, marketing)
          const spicedI = calculateSpicedI(item, marketing, dpScore)
          const spicedC = calculateSpicedC(marketing)
          const spicedD = calculateSpicedD(item)

          // Vulnerabilities with real data + provocative insights
          const vulns = buildVulnerabilities(item, marketing, igInfo, seo, ads)

          // Sales arguments with opportunities
          const salesArgs = buildSalesArguments(item, marketing, config)

          // Projection narrative
          const projectionNarrative = buildProjectionNarrative(item, marketing, dpScore)
          const inactionCost = buildInactionCost(item, marketing)

          // Meeting talking points
          const meetingTalkingPoints = buildMeetingPoints(item, marketing, igInfo)

          return {
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
            linkedinUrl: item.socialProfiles?.linkedin || '',
            facebookUrl: item.socialProfiles?.facebook || '',
            instagramHandle: igHandle,
            instagramUrl: item.socialProfiles?.instagram,
            instagramFollowers: igInfo?.followersCount,
            instagramPosts: igInfo?.postsCount,
            instagramBio: igInfo?.biography,
            landingPages: item.website ? [item.website] : [],
            marketing,
            spicedS, spicedP, spicedI, spicedC, spicedD,
            spicedTotal: Math.round((spicedS * 0.25 + spicedP * 0.25 + spicedI * 0.20 + spicedC * 0.15 + spicedD * 0.15) * 10) / 10,
            digitalPresenceScore: dpScore,
            marketingVulnerabilities: vulns,
            competitiveAnalysis: marketing.competitors,
            salesArguments: salesArgs,
            projectionNarrative,
            inactionCost,
            meetingTalkingPoints,
          }
        })

      setStep('analysis', 'done')
      setState({
        phase: 'done',
        stepStatuses: { maps: 'done', instagram: 'done', website: 'done', facebookAds: 'done', seo: 'done', competitors: 'done', analysis: 'done' },
        results: enriched,
        error: null,
        elapsed: Math.round((Date.now() - startTime) / 1000),
      })
    } catch (err: any) {
      setState((s) => ({ ...s, phase: 'error', error: err.message || 'Erro na pesquisa' }))
    } finally {
      clearInterval(tick)
    }
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle', stepStatuses: {}, results: [], error: null, elapsed: 0 })
  }, [])

  return { ...state, search, reset }
}

// --- Builders ---

function buildCompetitorDimensions(competitor: GoogleMapsResult, lead: GoogleMapsResult): Record<string, string> {
  const dims: Record<string, string> = {}
  dims['Presença digital'] = competitor.website ? (competitor.reviewsCount > lead.reviewsCount ? 'Forte' : 'Média') : 'Fraca'
  dims['Avaliação Google'] = competitor.totalScore >= 4.5 ? 'Forte' : competitor.totalScore >= 4.0 ? 'Média' : 'Fraca'
  dims['Volume de avaliações'] = competitor.reviewsCount > 100 ? 'Forte' : competitor.reviewsCount > 30 ? 'Média' : 'Fraca'
  dims['Atendimento'] = competitor.totalScore >= 4.5 ? 'Forte' : 'Média'
  dims['Força da marca'] = competitor.reviewsCount > lead.reviewsCount * 2 ? 'Forte' : competitor.reviewsCount > lead.reviewsCount ? 'Média' : 'Fraca'
  return dims
}

function buildVulnerabilities(
  item: GoogleMapsResult,
  _mkt: MarketingIntelligence,
  igInfo: any,
  seo: any,
  ads: any[],
): EnrichedLead['marketingVulnerabilities'] {
  const vulns: EnrichedLead['marketingVulnerabilities'] = []

  if (!item.website) {
    vulns.push({
      titulo: 'Ausência de website',
      descricao: 'Empresa não possui website indexável. Perde 100% do tráfego orgânico e credibilidade digital.',
      impacto: 'ALTO',
      impactoFinanceiro: 'Perda estimada de 35-50% de leads potenciais que buscam online',
      insightProvocativo: 'Cada dia sem website é um dia em que seus concorrentes captam clientes que estavam procurando por você.',
    })
  } else if (seo && seo.score < 50) {
    vulns.push({
      titulo: `SEO deficiente — Score ${seo.score}/100`,
      descricao: `${seo.issues?.length || 0} problemas técnicos de SEO identificados: ${seo.issues?.slice(0, 3).map((i: any) => i.description || i.message).join(', ') || 'meta tags, headings, performance'}.`,
      impacto: 'ALTO',
      impactoFinanceiro: `Potencial de 2-5x mais tráfego orgânico com correções técnicas`,
      insightProvocativo: 'Seu site existe mas o Google não consegue recomendá-lo. É como ter uma loja com a porta trancada.',
    })
  }

  if (ads.length === 0) {
    vulns.push({
      titulo: 'Zero investimento em tráfego pago',
      descricao: 'Nenhum anúncio encontrado na biblioteca de anúncios Meta (Facebook/Instagram Ads). Empresa não investe em mídia paga.',
      impacto: 'ALTO',
      impactoFinanceiro: 'Concorrentes que investem captam 60-80% dos leads digitais do segmento',
      insightProvocativo: 'Seus concorrentes estão comprando seus clientes. Cada real que eles investem em ads é um cliente que não chega até você.',
    })
  } else if (ads.filter((a: any) => a.isActive).length === 0) {
    vulns.push({
      titulo: 'Anúncios inativos — campanhas pausadas',
      descricao: `${ads.length} anúncios encontrados na biblioteca Meta, mas nenhum está ativo atualmente. Investimento descontinuado.`,
      impacto: 'MEDIO',
      impactoFinanceiro: 'Perda de momentum e retargeting — custo de reativação 30-50% maior',
      insightProvocativo: 'Você já investiu em ads antes, parou, e seus concorrentes continuaram. O gap competitivo aumenta cada mês.',
    })
  }

  if (!igInfo || !igInfo.followersCount) {
    vulns.push({
      titulo: 'Sem presença no Instagram',
      descricao: 'Perfil inexistente ou sem atividade. Canal de aquisição ignorado em um mercado onde 70%+ do público B2C está ativo.',
      impacto: 'ALTO',
      impactoFinanceiro: 'Canal de aquisição com CAC 40-60% menor que mídia paga desperdiçado',
      insightProvocativo: 'Seu público está scrollando o Instagram agora. Se não é o seu conteúdo, é o do concorrente.',
    })
  } else if (igInfo.followersCount < 1000) {
    vulns.push({
      titulo: `Instagram com baixa autoridade — ${igInfo.followersCount} seguidores`,
      descricao: `Presença mínima com ${igInfo.postsCount || 0} publicações. Sem estratégia de conteúdo estruturada. Engajamento insuficiente para gerar demanda.`,
      impacto: 'MEDIO',
      impactoFinanceiro: 'Potencial de 3-5x crescimento de audiência com estratégia de conteúdo',
      insightProvocativo: `${igInfo.followersCount} seguidores não geram negócio. É presença simbólica, não estratégica. Com conteúdo certo, esse número 5x em 90 dias.`,
    })
  }

  if (item.totalScore < 4.0 && item.reviewsCount > 5) {
    vulns.push({
      titulo: `Reputação Google abaixo do ideal — ${item.totalScore}/5`,
      descricao: `Nota ${item.totalScore} com ${item.reviewsCount} avaliações no Google Meu Negócio. Abaixo da nota de corte (4.0) que impacta decisão de compra.`,
      impacto: 'ALTO',
      impactoFinanceiro: 'Cada 0.1 ponto abaixo de 4.0 reduz taxa de clique em 5-10%',
      insightProvocativo: 'Quando alguém pesquisa seu serviço no Google, vê uma nota que gera dúvida. Seus concorrentes com 4.5+ pegam esse cliente.',
    })
  } else if (item.reviewsCount < 20) {
    vulns.push({
      titulo: `Poucas avaliações Google — apenas ${item.reviewsCount}`,
      descricao: 'Volume insuficiente de avaliações para gerar confiança. Concorrentes com 50+ avaliações têm vantagem na prova social.',
      impacto: 'MEDIO',
      impactoFinanceiro: 'Empresas com 50+ avaliações convertem 30% mais em buscas locais',
      insightProvocativo: 'A prova social é gratuita, mas você está deixando na mesa. Cada cliente satisfeito que não avalia é uma conversão perdida.',
    })
  }

  if (!item.emails || item.emails.length === 0) {
    vulns.push({
      titulo: 'Sem captação de leads digital',
      descricao: 'Nenhum email de contato público ou formulário de captação identificado. Sem CRM ou nutrição de leads.',
      impacto: 'MEDIO',
      impactoFinanceiro: 'Perda de 100% dos visitantes que não compram na primeira visita (85-95%)',
      insightProvocativo: 'A cada 100 pessoas que visitam seu site, 95 saem sem comprar e você não tem como falar com elas de novo. Concorrentes que captam o email reconvertem 20-30%.',
    })
  }

  vulns.push({
    titulo: 'Dependência de indicações e tráfego orgânico',
    descricao: 'Sem funil de vendas digital estruturado. Geração de demanda limitada a indicações boca-a-boca e presença física.',
    impacto: 'ALTO',
    impactoFinanceiro: 'Crescimento limitado a 5-8%/ano vs 15-25% com estratégia digital',
    insightProvocativo: 'Indicação é ótima, mas não escala. No dia que o indicador parar de indicar, a receita sente. Funil digital é previsível.',
  })

  vulns.push({
    titulo: 'Ausência de estratégia multicanal',
    descricao: 'Nenhuma integração entre canais (Google, Meta, Instagram, site, WhatsApp). Cada canal opera isolado sem sinergia.',
    impacto: 'MEDIO',
    impactoFinanceiro: 'Perda de 30-40% de eficiência por fragmentação de canais',
    insightProvocativo: 'Seus canais não conversam entre si. O cliente que vê no Google, pesquisa no Instagram, e vai ao WhatsApp deveria ter uma jornada — mas hoje é aleatório.',
  })

  return vulns.slice(0, 8)
}

function buildSalesArguments(item: GoogleMapsResult, mkt: MarketingIntelligence, config: SearchConfig): EnrichedLead['salesArguments'] {
  const segment = config.segments[0] || item.categoryName || 'seu segmento'
  return [
    {
      eixo: 'Presença digital como motor de receita',
      argumento: `A ${item.title} opera no segmento de ${segment} há anos, mas ${mkt.facebookAdsCount === 0 ? 'não investe em tráfego pago' : 'investiu de forma pontual em ads'} e ${item.website ? `o site tem score SEO de ${mkt.seoScore || 'N/A'}` : 'não possui website'}. Isso significa que a geração de demanda depende 100% de fatores que você não controla.`,
      objecao: '"Nosso marketing está funcionando bem do jeito que está."',
      resposta: `Se estivesse funcionando, vocês não teriam ${mkt.googleReviews < 30 ? 'apenas ' + mkt.googleReviews + ' avaliações no Google' : 'espaço para crescer com ' + (mkt.facebookAdsCount === 0 ? 'zero' : 'poucos') + ' anúncios ativos'}. "Funcionando" e "otimizado" são coisas diferentes — a distância entre os dois é receita perdida.`,
      oportunidade: `Implementar funil digital completo (SEO + Ads + Conteúdo) pode gerar 30-50% de novos leads em 90 dias com base nos benchmarks do segmento de ${segment}.`,
      impactoROI: 'ROI médio de 4-8x no primeiro semestre para empresas do segmento que implementam estratégia digital estruturada',
    },
    {
      eixo: 'Vantagem competitiva via dados',
      argumento: `Identificamos ${mkt.competitors.length} concorrentes diretos. ${mkt.competitors.filter((c) => c.reviews > item.reviewsCount).length} deles têm mais avaliações no Google e ${mkt.competitors.filter((c) => c.rating > (item.totalScore || 0)).length} têm nota superior. A janela de diferenciação existe mas está fechando.`,
      objecao: '"Conhecemos nossos concorrentes, não preciso de análise."',
      resposta: `Conhecer é diferente de medir. Seus concorrentes investem em ads enquanto você não investe. Eles têm mais avaliações. Eles aparecem antes no Google. Cada uma dessas diferenças é mensurável e reversível — mas só se você agir antes que o gap aumente.`,
      oportunidade: `Posicionamento agressivo em Google Meu Negócio + estratégia de avaliações pode superar ${mkt.competitors[0]?.name || 'o principal concorrente'} em 4-6 meses.`,
      impactoROI: 'Cada posição acima nos resultados Google = +15-25% de cliques',
    },
    {
      eixo: 'Automação e escala da operação comercial',
      argumento: `Hoje a ${item.title} depende de esforço manual para gerar clientes. Sem automação de marketing, cada venda tem o mesmo custo de aquisição independente do volume. Isso trava a escalabilidade.`,
      objecao: '"Não temos budget para automação agora."',
      resposta: 'Automação não é custo, é eficiência. O custo é continuar fazendo tudo manual — cada lead que não é nutrido automaticamente é uma venda perdida. O investimento em automação se paga ao desonerar o time comercial para fechar em vez de prospectar.',
      oportunidade: `CRM + automação de WhatsApp + funil de nutrição podem reduzir CAC em 40-60% e aumentar taxa de conversão em 25-35%.`,
      impactoROI: 'Tempo médio de payback da automação: 45-60 dias',
    },
    {
      eixo: 'Conteúdo como ativo de aquisição',
      argumento: `${!mkt.facebookAdsActive && (!item.socialProfiles?.instagram) ? 'A empresa não tem presença em redes sociais nem produz conteúdo.' : `A presença digital é mínima com ${mkt.googleReviews} avaliações e poucos seguidores.`} Conteúdo estratégico é o canal de aquisição com maior ROI no longo prazo.`,
      objecao: '"Não temos tempo para criar conteúdo."',
      resposta: 'Conteúdo não precisa do dono. Precisa de estratégia do dono e execução de equipe. 2 posts por semana + 1 email quinzenal com template já mudam o jogo. O custo de não fazer é ser irrelevante enquanto concorrentes aparecem todos os dias no feed do seu cliente.',
      oportunidade: `Estratégia de conteúdo para ${segment}: 8 posts/mês + blog SEO pode gerar 500-2000 visitantes orgânicos mensais em 6 meses.`,
      impactoROI: 'Custo por lead orgânico: 80-90% menor que mídia paga após 6 meses de conteúdo',
    },
    {
      eixo: 'Custo da inação — projeção de perda',
      argumento: `A cada mês que a ${item.title} opera sem estratégia digital estruturada, perde entre 15-30% do potencial de receita. Em 12 meses, isso soma entre R$ 180k e R$ 600k em receita não realizada para empresas do porte e segmento similar.`,
      objecao: '"Vamos pensar e te retorno depois."',
      resposta: 'Cada mês de "pensar" tem um custo real. Se as vulnerabilidades que identificamos custam R$ 15-50k/mês em receita perdida, 3 meses de reflexão são R$ 45-150k que não voltam. O diagnóstico leva 2 semanas e custa uma fração disso.',
      oportunidade: `Implementação em 90 dias com checkpoints quinzenais de resultado. Primeiro resultado mensurável em 3-4 semanas.`,
      impactoROI: 'Custo da inação estimado: R$ 180k-600k/ano em receita não capturada',
    },
  ]
}

function buildProjectionNarrative(_item: GoogleMapsResult, mkt: MarketingIntelligence, dpScore: number): string {
  const hasAds = mkt.facebookAdsCount > 0
  const hasGoodSeo = mkt.seoScore > 50
  if (dpScore <= 3) {
    return `Os cenários refletem a ausência quase total de presença digital. O conservador assume apenas criação de Google Meu Negócio otimizado e captação de avaliações. O moderado adiciona tráfego pago em Meta e SEO básico. O agressivo inclui estratégia multicanal completa com automação e conteúdo estruturado. Com as vulnerabilidades identificadas, há potencial de crescimento de 25-40% em receita no primeiro ano.`
  }
  return `Os cenários refletem diferentes níveis de investimento em marketing digital. O conservador assume penetração mínima com ${hasAds ? 'otimização dos ads atuais' : 'Google Ads e SEO básico'}. O moderado adiciona ${hasGoodSeo ? 'expansão de conteúdo' : 'tráfego pago em Meta e conteúdo estruturado'}. O agressivo inclui estratégia multicanal completa com automação. Com as vulnerabilidades identificadas, há potencial de redução de custos operacionais em 15-20%, ampliando as margens em todos os cenários.`
}

function buildInactionCost(_item: GoogleMapsResult, _mkt: MarketingIntelligence): string {
  return `Custo da inação: cada mês sem presença digital = R$ 15K a R$ 50K de receita incremental perdida. Em 12 meses: R$ 180K a R$ 600K.`
}

function buildMeetingPoints(_item: GoogleMapsResult, mkt: MarketingIntelligence, igInfo: any): string[] {
  const points: string[] = []
  if (mkt.facebookAdsCount === 0) points.push('Zero anúncios na biblioteca Meta — explorar motivo e custo da inação')
  if (mkt.googleReviews < 30) points.push(`Apenas ${mkt.googleReviews} avaliações Google — estratégia de prova social`)
  if (igInfo?.followersCount) points.push(`${igInfo.followersCount} seguidores IG — converter audiência em leads`)
  if (mkt.seoScore > 0 && mkt.seoScore < 50) points.push(`SEO score ${mkt.seoScore}/100 — oportunidade de tráfego orgânico`)
  points.push('Mapear processo comercial atual e identificar gargalos de conversão')
  points.push('Apresentar case similar do segmento com resultados mensuráveis')
  return points.slice(0, 6)
}

// --- SPICED Data-Driven Scoring ---

// S (Situação): website + reviews + presença digital geral
function calculateSpicedS(item: GoogleMapsResult, seo: any, igInfo: any): number {
  let score = 1
  if (item.website) score += 1
  if (seo?.score > 50) score += 1
  if (item.totalScore >= 4.0 && item.reviewsCount >= 20) score += 1
  if (igInfo?.followersCount > 500) score += 1
  return Math.min(score, 5)
}

// P (Dor/Pain): quanto mais gaps, mais dor = score ALTO (bom pra nós)
function calculateSpicedP(item: GoogleMapsResult, ads: any[], igInfo: any, mkt: MarketingIntelligence): number {
  let score = 5 // começa alto (muita dor)
  if (ads.length > 0 && ads.some((a: any) => a.isActive)) score -= 1
  if (igInfo?.followersCount > 1000) score -= 1
  if (item.website) score -= 1
  if (mkt.seoScore > 60) score -= 1
  if (item.reviewsCount > 50) score -= 1
  return Math.max(score, 1)
}

// I (Impacto): potencial de crescimento baseado no gap
function calculateSpicedI(_item: GoogleMapsResult, _mkt: MarketingIntelligence, dpScore: number): number {
  // Quanto menor o dpScore, maior o potencial de impacto
  if (dpScore <= 2) return 5
  if (dpScore <= 4) return 4
  if (dpScore <= 6) return 3
  if (dpScore <= 8) return 2
  return 1
}

// C (Evento Crítico): concorrentes fortes = urgência
function calculateSpicedC(mkt: MarketingIntelligence): number {
  const strongCompetitors = mkt.competitors.filter((c) => c.rating >= 4.5 || c.reviews > 100).length
  if (strongCompetitors >= 3) return 5
  if (strongCompetitors >= 2) return 4
  if (strongCompetitors >= 1) return 3
  if (mkt.competitors.length > 0) return 2
  return 1
}

// D (Decisão): acessibilidade do decisor
function calculateSpicedD(item: GoogleMapsResult): number {
  let score = 1
  if (item.phone) score += 1
  if (item.emails?.length) score += 1
  if (item.socialProfiles?.linkedin) score += 1
  if (item.socialProfiles?.instagram) score += 1
  return Math.min(score, 5)
}
