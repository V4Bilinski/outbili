// Supabase Edge Function: social-enrich (Camada 2 - Fase 1 / W3-08 Presenca Digital)
// Extracao UNIFICADA e ECONOMICA de presenca digital de um lead.
//
// Fluxo: POST { leadId, cnpj? }
//   1. Le o lead (address, city, state, trade_name, company_name, website, cnpj)
//   2. GMB via Apify (compass/crawler-google-places): rating, reviews, categoria,
//      website, url do maps. VALIDACAO ANTI-FILIAL (cruza o address do place com
//      o endereco real do lead).
//   3. Website = place.website (GMB) ou website atual do lead.
//   4. IG + LinkedIn + Facebook via fetch GRATIS do site (regex em <a href>).
//   5. Fallback Instagram: instagram-scraper Apify (validacao anti-filial atual)
//      apenas quando o site nao revelou nenhum Instagram.
//   6. Persiste GMB em app.leads e as redes em app.lead_social / app.socio_redes,
//      de forma idempotente, sem duplicar e preservando a melhor fonte ja gravada.
//
// Apify usado para GMB (google-places) e fallback de Instagram. Redes via site = gratis.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_IG_ENDPOINT =
  'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items'
const APIFY_GMB_ENDPOINT =
  'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items'

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Normaliza string para comparacao (sem acento, sem pontuacao, minuscula)
function norm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Extrai o nome da via do endereco (ex: "Rua Augusta, 962" -> "Augusta")
function extrairVia(address: string | null): string {
  if (!address) return ''
  const semNumero = address.split(',')[0]
  return semNumero
    .replace(/^(rua|r\.|av\.?|avenida|alameda|al\.|travessa|tv\.|rodovia|rod\.|pra[cç]a|estrada|estr\.)\s+/i, '')
    .trim()
}

interface MatchResult {
  confianca: 'alta' | 'media' | 'baixa'
  motivo: string
}

// VALIDACAO ANTI-FILIAL (Instagram): o perfil pertence MESMO a esta unidade?
function avaliarMatch(
  lead: { address: string | null; city: string | null },
  ba: Record<string, unknown> | undefined,
): MatchResult {
  const leadStreet = norm(lead.address)
  const leadCity = norm((lead.city ?? '').split(',')[0])
  const baStreet = norm(ba?.['street_address'])
  const baCity = norm(String(ba?.['city_name'] ?? '').split(',')[0])

  if (leadStreet && baStreet && (baStreet.includes(leadStreet) || leadStreet.includes(baStreet))) {
    return { confianca: 'alta', motivo: `endereco confere: ${ba?.['street_address']}` }
  }
  if (leadCity && baCity && (baCity.includes(leadCity) || leadCity.includes(baCity))) {
    return {
      confianca: 'media',
      motivo: `apenas cidade confere (${ba?.['city_name'] ?? '?'}); possivel outra filial da franquia`,
    }
  }
  return {
    confianca: 'baixa',
    motivo: `endereco divergente (${ba?.['city_name'] ?? 'sem endereco'}); provavel outra unidade`,
  }
}

// VALIDACAO ANTI-FILIAL (GMB): cruza o endereco textual do place com o lead.
// O place retorna address como string unica (ex: "R. Augusta, 962 - Consolacao,
// Sao Paulo - SP, 01304-001"). Comparamos via (logradouro) e cidade.
function avaliarMatchEndereco(
  lead: { address: string | null; city: string | null },
  placeAddress: string | null,
): MatchResult {
  const placeNorm = norm(placeAddress)
  if (!placeNorm) {
    return { confianca: 'baixa', motivo: 'place sem endereco; nao da pra validar' }
  }
  const leadStreet = norm(extrairVia(lead.address))
  const leadStreetFull = norm(lead.address)
  const leadCity = norm((lead.city ?? '').split(',')[0])

  // Rua do lead aparece no endereco do place -> ALTA
  if (leadStreet && leadStreet.length >= 4 && placeNorm.includes(leadStreet)) {
    return { confianca: 'alta', motivo: `endereco confere: ${placeAddress}` }
  }
  if (leadStreetFull && leadStreetFull.length >= 4 && placeNorm.includes(leadStreetFull)) {
    return { confianca: 'alta', motivo: `endereco confere: ${placeAddress}` }
  }
  // So a cidade bate -> MEDIA (possivel outra filial)
  if (leadCity && leadCity.length >= 3 && placeNorm.includes(leadCity)) {
    return {
      confianca: 'media',
      motivo: `apenas cidade confere (${placeAddress}); possivel outra unidade`,
    }
  }
  return {
    confianca: 'baixa',
    motivo: `endereco divergente (${placeAddress ?? 'sem endereco'}); provavel outra unidade`,
  }
}

// Normaliza uma URL: forca https, remove query/hash, trailing slash, lowercase host.
function normUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = `https://${s.replace(/^\/+/, '')}`
  try {
    const u = new URL(s)
    u.protocol = 'https:'
    u.search = ''
    u.hash = ''
    u.hostname = u.hostname.toLowerCase()
    let out = u.toString()
    out = out.replace(/\/+$/, '') // remove trailing slash(es)
    return out
  } catch {
    return null
  }
}

interface SocialLinks {
  instagram?: string
  linkedin?: string
  facebook?: string
}

// Extrai IG/LinkedIn/Facebook de um HTML cru (primeiro match de cada).
// Procura tanto em href="" quanto em URLs soltas no markup.
function extractSocialsFromHtml(html: string): SocialLinks {
  const out: SocialLinks = {}
  if (!html) return out

  const igRe = /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/gi
  const liRe = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(company|in|school)\/([A-Za-z0-9._%-]+)/gi
  const fbRe = /https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/([A-Za-z0-9.\-_/]+)/gi

  // Instagram: ignora rotas internas que nao sao perfil
  const igSkip = new Set(['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'about'])
  let m: RegExpExecArray | null
  while ((m = igRe.exec(html)) !== null) {
    const handle = (m[1] || '').replace(/\/+$/, '')
    if (!handle || igSkip.has(handle.toLowerCase())) continue
    const url = normUrl(`https://www.instagram.com/${handle}`)
    if (url) {
      out.instagram = url
      break
    }
  }

  while ((m = liRe.exec(html)) !== null) {
    const kind = (m[1] || '').toLowerCase()
    const slug = (m[2] || '').replace(/\/+$/, '')
    if (!slug) continue
    const url = normUrl(`https://www.linkedin.com/${kind}/${slug}`)
    if (url) {
      out.linkedin = url
      break
    }
  }

  // Facebook: ignora rotas internas (sharer, tr, plugins, etc.)
  const fbSkip = new Set([
    'sharer', 'sharer.php', 'tr', 'plugins', 'dialog', 'login', 'profile.php', 'pages', 'people', 'groups',
  ])
  while ((m = fbRe.exec(html)) !== null) {
    let page = (m[1] || '').replace(/\/+$/, '')
    page = page.split('/')[0] // primeiro segmento
    if (!page || fbSkip.has(page.toLowerCase())) continue
    const url = normUrl(`https://www.facebook.com/${page}`)
    if (url) {
      out.facebook = url
      break
    }
  }

  return out
}

// Faz fetch do website (timeout ~8s, UA de browser). Retorna o HTML ou null.
async function fetchWebsiteHtml(website: string): Promise<string | null> {
  const url = normUrl(website)
  if (!url) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (ct && !/text\/html|xml|json|javascript/i.test(ct)) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

interface GmbResult {
  confirmado: boolean
  title: string | null
  rating: number | null
  reviews: number | null
  categoria: string | null
  website: string | null
  mapsUrl: string | null
  placeAddress: string | null
  match: MatchResult | null
  motivo: string
}

// GMB via Apify (compass/crawler-google-places). Anti-filial por endereco textual.
async function runGmbApify(
  apifyToken: string,
  lead: { address: string | null; city: string | null; state: string | null },
  termo: string,
): Promise<GmbResult> {
  const base: GmbResult = {
    confirmado: false,
    title: null,
    rating: null,
    reviews: null,
    categoria: null,
    website: null,
    mapsUrl: null,
    placeAddress: null,
    match: null,
    motivo: 'GMB nao buscado',
  }

  const res = await fetch(`${APIFY_GMB_ENDPOINT}?token=${apifyToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [termo],
      maxCrawledPlacesPerSearch: 1,
      scrapePlaceDetailPage: false,
      maxReviews: 0,
      language: 'pt-BR',
      skipClosedPlaces: false,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    return { ...base, motivo: `Apify GMB ${res.status}: ${txt.slice(0, 160)}` }
  }
  const items = (await res.json()) as Record<string, unknown>[]
  const place = Array.isArray(items) ? items[0] : undefined
  if (!place) return { ...base, motivo: 'GMB sem resultado para o termo' }

  const placeAddress = (place['address'] as string) ?? null
  const title = (place['title'] as string) ?? null
  const m = avaliarMatchEndereco(lead, placeAddress)

  const out: GmbResult = {
    ...base,
    title,
    rating: typeof place['totalScore'] === 'number' ? (place['totalScore'] as number) : null,
    reviews: typeof place['reviewsCount'] === 'number' ? (place['reviewsCount'] as number) : null,
    categoria: (place['categoryName'] as string) ?? null,
    website: normUrl(place['website'] as string),
    mapsUrl: (place['url'] as string) ?? null,
    placeAddress,
    match: m,
    motivo: m.motivo,
  }

  // Anti-filial: aceita ALTA ou MEDIA; descarta BAIXA (outro endereco/cidade).
  out.confirmado = m.confianca === 'alta' || m.confianca === 'media'
  return out
}

interface IgFromApify {
  url: string
  handle: string
  fullName: string | null
  bio: string | null
  followers: number | null
  verified: boolean
  externalUrl: string | null
  isBusiness: boolean
  category: string | null
  confianca: string
  motivo: string
}

// Fallback Instagram: instagram-scraper Apify + validacao anti-filial atual.
// Retorna a melhor unidade (alta > media), ou null se nada confere.
async function runInstagramApify(
  apifyToken: string,
  lead: { address: string | null; city: string | null },
  termo: string,
  avaliados: { handle: string; confianca: string; motivo: string }[],
): Promise<IgFromApify | null> {
  const res = await fetch(`${APIFY_IG_ENDPOINT}?token=${apifyToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      search: termo,
      searchType: 'user',
      searchLimit: 8,
      resultsType: 'details',
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Apify IG ${res.status}: ${txt.slice(0, 200)}`)
  }
  const perfis = (await res.json()) as Record<string, unknown>[]

  let melhor: IgFromApify | null = null
  for (const p of Array.isArray(perfis) ? perfis : []) {
    const ba = p['businessAddress'] as Record<string, unknown> | undefined
    const m = avaliarMatch(lead, ba)
    const handle = String(p['username'] ?? '')
    avaliados.push({ handle, confianca: m.confianca, motivo: m.motivo })
    if (m.confianca === 'baixa') continue

    const candidato: IgFromApify = {
      url: normUrl(String(p['url'] ?? `https://www.instagram.com/${handle}`)) ??
        `https://www.instagram.com/${handle}`,
      handle,
      fullName: (p['fullName'] as string) || null,
      bio: (p['biography'] as string) || null,
      followers: typeof p['followersCount'] === 'number' ? (p['followersCount'] as number) : null,
      verified: Boolean(p['verified']),
      externalUrl: (p['externalUrl'] as string) || null,
      isBusiness: Boolean(p['isBusinessAccount']),
      category: (p['businessCategoryName'] as string) || null,
      confianca: m.confianca,
      motivo: m.motivo,
    }
    // Prioriza alta sobre media
    if (!melhor || (candidato.confianca === 'alta' && melhor.confianca !== 'alta')) {
      melhor = candidato
    }
    if (melhor.confianca === 'alta') break
  }
  return melhor
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), {
      status: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  try {
    const { leadId } = (await req.json()) as { leadId?: string; cnpj?: string }
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apifyToken = Deno.env.get('API_APIFY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY ausentes')
    if (!apifyToken) throw new Error('API_APIFY nao configurado no env da Edge Function')

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const warnings: string[] = []

    // 1. Dados do lead
    const { data: leadData, error: leadErr } = await supabase
      .schema('app')
      .from('leads')
      .select('id, address, city, state, trade_name, company_name, website')
      .eq('id', leadId)
      .single()
    if (leadErr || !leadData) throw new Error(`Lead nao encontrado: ${leadErr?.message}`)
    const lead = leadData as {
      id: string; address: string | null; city: string | null; state: string | null
      trade_name: string | null; company_name: string | null; website: string | null
    }

    const nomeBase = (lead.company_name || lead.trade_name || '').trim()
    const via = extrairVia(lead.address)
    const cidade = (lead.city || '').split(',')[0].trim()
    const uf = (lead.state || '').trim()
    if (!nomeBase && !via && !cidade) throw new Error('Lead sem nome/endereco para busca')

    // ── 2. GMB via Apify (google-places). Termo = nome + (via|cidade), UF. ──
    const gmbTermoLocal = via || cidade
    const gmbTermo = [
      [nomeBase, gmbTermoLocal].filter(Boolean).join(' '),
      uf,
    ].filter(Boolean).join(', ')

    let gmb: GmbResult | null = null
    if (gmbTermo) {
      try {
        gmb = await runGmbApify(apifyToken, lead, gmbTermo)
      } catch (e) {
        warnings.push(`Falha GMB: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // ── 3. Website: place.website (se GMB confirmado) ou website atual do lead. ──
    const gmbConfirmado = Boolean(gmb && gmb.confirmado)
    const websiteGmb = gmbConfirmado ? gmb?.website ?? null : null
    const websiteFinal = websiteGmb || normUrl(lead.website) || lead.website || null

    // ── 4. IG + LinkedIn + Facebook GRATIS via fetch do site. ──
    const redes: SocialLinks = {}
    if (websiteFinal) {
      try {
        const html = await fetchWebsiteHtml(websiteFinal)
        if (html) {
          const found = extractSocialsFromHtml(html)
          if (found.instagram) redes.instagram = found.instagram
          if (found.linkedin) redes.linkedin = found.linkedin
          if (found.facebook) redes.facebook = found.facebook
        } else {
          warnings.push(`Site nao retornou HTML aproveitavel: ${websiteFinal}`)
        }
      } catch (e) {
        warnings.push(`Falha ao ler site: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // ── 5. Fallback Instagram via Apify (so se o site nao revelou IG). ──
    const avaliadosIg: { handle: string; confianca: string; motivo: string }[] = []
    let igApify: IgFromApify | null = null
    if (!redes.instagram) {
      const igTermo = [nomeBase, via || cidade].filter(Boolean).join(' ')
      if (igTermo) {
        try {
          igApify = await runInstagramApify(apifyToken, lead, igTermo, avaliadosIg)
          if (igApify) redes.instagram = igApify.url
        } catch (e) {
          warnings.push(`Falha fallback Instagram: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    // ── 6. Persistencia ──

    // 6a. app.leads: flags/metricas GMB + website (so se ainda vazio).
    const leadUpdate: Record<string, unknown> = {
      tem_google_meu_negocio: gmbConfirmado,
    }
    if (gmbConfirmado && gmb) {
      if (gmb.rating !== null) leadUpdate.google_rating = gmb.rating
      if (gmb.reviews !== null) leadUpdate.google_reviews_count = gmb.reviews
    }
    // website: so preenche se o lead ainda nao tiver.
    if (!lead.website && websiteFinal) leadUpdate.website = websiteFinal
    leadUpdate.social_media_source = redes.instagram && !igApify ? 'firecrawl' : 'mixed'
    leadUpdate.social_media_extracted_at = new Date().toISOString()

    {
      const { error: upErr } = await supabase
        .schema('app')
        .from('leads')
        .update(leadUpdate)
        .eq('id', leadId)
      if (upErr) warnings.push(`Erro ao atualizar leads (GMB/website): ${upErr.message}`)
    }

    // 6b. app.lead_social: idempotente, nao-duplica, preserva melhor fonte.
    //     Le as platforms ja existentes e so insere as ausentes.
    const { data: existentesData, error: exErr } = await supabase
      .schema('app')
      .from('lead_social')
      .select('platform, url')
      .eq('lead_id', leadId)
    if (exErr) warnings.push(`Erro ao ler lead_social existente: ${exErr.message}`)
    const existentes = new Map<string, string | null>()
    for (const row of (existentesData as { platform: string; url: string | null }[]) || []) {
      existentes.set(row.platform, row.url)
    }

    const nowIso = new Date().toISOString()
    type LeadSocialRow = {
      lead_id: string; platform: string; url: string; handle: string | null
      source: string; extracted_at: string
    }
    const toInsert: LeadSocialRow[] = []

    const handleFromUrl = (platform: string, url: string): string | null => {
      try {
        const u = new URL(url)
        const seg = u.pathname.split('/').filter(Boolean)
        if (platform === 'instagram') return seg[0] ? `@${seg[0]}` : null
        if (platform === 'linkedin') return seg.length >= 2 ? seg[1] : (seg[0] ?? null)
        if (platform === 'facebook') return seg[0] ?? null
        return null
      } catch {
        return null
      }
    }

    // Plataformas vindas do SITE -> source 'firecrawl' (fetch gratis do site).
    const siteEntries: { platform: string; url?: string }[] = [
      { platform: 'instagram', url: redes.instagram && !igApify ? redes.instagram : undefined },
      { platform: 'linkedin', url: redes.linkedin },
      { platform: 'facebook', url: redes.facebook },
    ]
    for (const e of siteEntries) {
      if (!e.url) continue
      if (existentes.has(e.platform)) continue // preserva o que ja existe
      toInsert.push({
        lead_id: leadId,
        platform: e.platform,
        url: e.url,
        handle: handleFromUrl(e.platform, e.url),
        source: 'firecrawl',
        extracted_at: nowIso,
      })
    }

    // Instagram vindo do fallback Apify -> source 'apify'.
    if (igApify && !existentes.has('instagram')) {
      toInsert.push({
        lead_id: leadId,
        platform: 'instagram',
        url: igApify.url,
        handle: igApify.handle ? `@${igApify.handle}` : handleFromUrl('instagram', igApify.url),
        source: 'apify',
        extracted_at: nowIso,
      })
    }

    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.schema('app').from('lead_social').insert(toInsert)
      if (insErr) warnings.push(`Erro ao inserir lead_social: ${insErr.message}`)
    }

    // 6c. app.lead_social platform='google' (GMB) -> url do maps. source 'apify'.
    //     Se ja existe linha google, faz update da url; senao insere.
    //     OBS: o CHECK lead_social_platform_check pode bloquear 'google' (so aceita
    //     instagram/linkedin/tiktok/facebook). Tratado como warning, nao fatal.
    if (gmbConfirmado && gmb?.mapsUrl) {
      if (existentes.has('google')) {
        const { error: gUpdErr } = await supabase
          .schema('app')
          .from('lead_social')
          .update({ url: gmb.mapsUrl, source: 'apify', extracted_at: nowIso })
          .eq('lead_id', leadId)
          .eq('platform', 'google')
        if (gUpdErr) warnings.push(`Erro ao atualizar lead_social google: ${gUpdErr.message}`)
      } else {
        const { error: gInsErr } = await supabase
          .schema('app')
          .from('lead_social')
          .insert({
            lead_id: leadId,
            platform: 'google',
            url: gmb.mapsUrl,
            handle: gmb.title,
            source: 'apify',
            extracted_at: nowIso,
          })
        if (gInsErr) warnings.push(`Erro ao inserir lead_social google: ${gInsErr.message}`)
      }
    }

    // 6d. app.socio_redes: mantem o painel Presenca Digital (Instagram detalhado).
    //     So grava quando veio do fallback Apify (tem metadados ricos).
    if (igApify) {
      const { error: delErr } = await supabase
        .schema('app')
        .from('socio_redes')
        .delete()
        .eq('lead_id', leadId)
        .eq('fonte', 'apify')
        .eq('plataforma', 'instagram')
      if (delErr) warnings.push(`Erro ao limpar socio_redes anteriores: ${delErr.message}`)

      const { error: srErr } = await supabase.schema('app').from('socio_redes').insert({
        lead_id: leadId,
        socio_id: null,
        plataforma: 'instagram',
        url: igApify.url,
        handle: igApify.handle || null,
        nome_exibicao: igApify.fullName,
        bio: igApify.bio,
        seguidores: igApify.followers,
        verificado: igApify.verified,
        contato_externo: igApify.externalUrl,
        fonte: 'apify',
        confianca: igApify.confianca,
        match_motivo: igApify.motivo,
        raw: igApify,
      })
      if (srErr) warnings.push(`Erro ao inserir socio_redes: ${srErr.message}`)

      // Link da bio (linktr.ee etc.) vira website de presenca digital (se vazio).
      if (!lead.website && !leadUpdate.website && igApify.externalUrl) {
        const bioLink = normUrl(igApify.externalUrl) || igApify.externalUrl
        const { error: bioErr } = await supabase
          .schema('app')
          .from('leads')
          .update({ website: bioLink })
          .eq('id', leadId)
        if (bioErr) warnings.push(`Erro ao gravar link da bio como website: ${bioErr.message}`)
      }
    }

    // ── Retorno (compat) ──
    return new Response(
      JSON.stringify({
        ok: true,
        gmb: gmbConfirmado && gmb
          ? { tem: true, rating: gmb.rating, reviews: gmb.reviews, categoria: gmb.categoria }
          : null,
        redes: {
          ...(redes.instagram ? { instagram: redes.instagram } : {}),
          ...(redes.linkedin ? { linkedin: redes.linkedin } : {}),
          ...(redes.facebook ? { facebook: redes.facebook } : {}),
        },
        website: websiteFinal,
        // diagnostico extra (nao quebra compat — campos adicionais)
        gmbTermo,
        gmbMatch: gmb?.match ?? null,
        perfisAvaliados: avaliadosIg.length > 0 ? avaliadosIg : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[social-enrich] erro:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
