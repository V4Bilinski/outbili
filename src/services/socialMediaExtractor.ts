/**
 * Social Media Extractor — helper puro para classificar, normalizar e extrair
 * handles de URLs de redes sociais (Instagram, LinkedIn, TikTok, Facebook) + Website.
 *
 * Usado por:
 *   - enrichmentService.ts (reclassifica URLs retornadas por Assertiva)
 *   - firecrawlService.ts (extrai links sociais do HTML raspado)
 *   - DigitalPresencePanel (exibe handle legível)
 *
 * Sem side effects — puro, testável em isolamento.
 */

export type SocialPlatform = 'instagram' | 'linkedin' | 'tiktok' | 'facebook' | 'website'

export interface ClassifiedUrl {
  platform: SocialPlatform
  url: string
}

/**
 * Classifica uma URL de acordo com sua plataforma.
 * Retorna null se a URL for inválida.
 * URLs "neutras" (sem match de plataforma) são classificadas como 'website'.
 */
export function classifySocialUrl(rawUrl: string): ClassifiedUrl | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const url = rawUrl.trim()
  if (!url) return null

  // Ignorar mailto:, tel:, javascript: e âncoras puras
  if (/^(mailto:|tel:|javascript:|#)/i.test(url)) return null

  const lower = url.toLowerCase()

  // Instagram — inclui instagr.am, instagram.com
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return { platform: 'instagram', url }
  }
  // LinkedIn — company, in, pub
  if (lower.includes('linkedin.com') || lower.includes('lnkd.in')) {
    return { platform: 'linkedin', url }
  }
  // TikTok — tiktok.com, vm.tiktok.com (share short link)
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok.com')) {
    return { platform: 'tiktok', url }
  }
  // Facebook — facebook.com, fb.com, fb.me
  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.me')) {
    return { platform: 'facebook', url }
  }
  // Link aggregators ficam como 'website' (linktr.ee, linklist.bio, bio.site, beacons.ai)
  if (lower.includes('linktr.ee') || lower.includes('linklist.bio') || lower.includes('bio.site') || lower.includes('beacons.ai')) {
    return { platform: 'website', url }
  }
  // URL genérica vira website se começar com http/https ou parecer domínio
  if (/^https?:\/\//.test(lower) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(lower)) {
    return { platform: 'website', url }
  }
  return null
}

/**
 * Normaliza URL social: remove tracking params, força https, normaliza casing de domínio.
 * Preserva o path (crítico para identificar handle).
 */
export function normalizeSocialUrl(rawUrl: string, platform: SocialPlatform): string {
  if (!rawUrl) return ''
  let url = rawUrl.trim()

  // Força protocolo https
  if (!/^https?:\/\//i.test(url)) {
    // Se começa com domínio, prepend https://
    if (/^[a-z0-9-]+\.[a-z]/i.test(url)) {
      url = `https://${url}`
    } else if (platform === 'instagram' && !url.startsWith('@')) {
      // Handle solto tipo "meuperfil" → assume Instagram
      url = `https://instagram.com/${url.replace(/^@/, '')}`
    } else if (platform === 'instagram' && url.startsWith('@')) {
      url = `https://instagram.com/${url.slice(1)}`
    }
  }

  try {
    const parsed = new URL(url)
    // Força https
    parsed.protocol = 'https:'
    // Lowercase host
    parsed.hostname = parsed.hostname.toLowerCase()
    // Remove tracking params conhecidos
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'igshid', '_r', 'ref_src', 'ref_url', 'si', 'feature']
    for (const p of trackingParams) parsed.searchParams.delete(p)
    // Remove trailing slash (exceto se path for vazio)
    let clean = parsed.toString()
    if (clean.endsWith('/') && parsed.pathname.length > 1) {
      clean = clean.replace(/\/$/, '')
    }
    return clean
  } catch {
    return url
  }
}

/**
 * Extrai handle legível da URL social.
 * IG: @username
 * LinkedIn: /company/xxx → xxx, /in/yyy → yyy
 * TikTok: @username
 * Facebook: /page → page
 * Website: hostname sem www
 */
export function extractHandle(rawUrl: string, platform: SocialPlatform): string {
  if (!rawUrl) return ''
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const path = parsed.pathname.replace(/\/$/, '')
    const segments = path.split('/').filter(Boolean)

    switch (platform) {
      case 'instagram': {
        const handle = segments[0]
        return handle ? `@${handle}` : parsed.hostname.replace(/^www\./, '')
      }
      case 'tiktok': {
        const handle = segments[0]
        if (handle?.startsWith('@')) return handle
        return handle ? `@${handle}` : 'TikTok'
      }
      case 'linkedin': {
        // /company/nome, /in/nome, /pub/nome
        if (segments[0] === 'company' && segments[1]) return segments[1]
        if (segments[0] === 'in' && segments[1]) return segments[1]
        return 'LinkedIn'
      }
      case 'facebook': {
        const handle = segments[0]
        return handle || 'Facebook'
      }
      case 'website':
        return parsed.hostname.replace(/^www\./, '')
      default:
        return rawUrl
    }
  } catch {
    return rawUrl
  }
}

/**
 * Merge de duas fontes de redes sociais, priorizando a primeira (geralmente Assertiva).
 * Retorna o merged object + source identificando origem combinada.
 */
export function mergeSocialSources(
  primary: Partial<Record<SocialPlatform, string | undefined>>,
  fallback: Partial<Record<SocialPlatform, string | undefined>>,
): { merged: Partial<Record<SocialPlatform, string>>; source: 'assertiva' | 'firecrawl' | 'mixed' | 'none' } {
  const merged: Partial<Record<SocialPlatform, string>> = {}
  const platforms: SocialPlatform[] = ['instagram', 'linkedin', 'tiktok', 'facebook', 'website']
  let usedPrimary = false
  let usedFallback = false

  for (const p of platforms) {
    if (primary[p]) {
      merged[p] = primary[p] as string
      usedPrimary = true
    } else if (fallback[p]) {
      merged[p] = fallback[p] as string
      usedFallback = true
    }
  }

  if (usedPrimary && usedFallback) return { merged, source: 'mixed' }
  if (usedPrimary) return { merged, source: 'assertiva' }
  if (usedFallback) return { merged, source: 'firecrawl' }
  return { merged, source: 'none' }
}

/**
 * Extrai links sociais de uma lista de URLs (ex: todos <a href> de uma página).
 * Retorna primeiro match de cada plataforma.
 */
export function extractSocialsFromUrls(urls: string[]): Partial<Record<SocialPlatform, string>> {
  const result: Partial<Record<SocialPlatform, string>> = {}
  for (const url of urls) {
    const classified = classifySocialUrl(url)
    if (!classified) continue
    const { platform, url: cleanUrl } = classified
    // Só primeiro match por plataforma
    if (!result[platform]) {
      result[platform] = normalizeSocialUrl(cleanUrl, platform)
    }
  }
  return result
}
