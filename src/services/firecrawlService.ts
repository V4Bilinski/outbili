/**
 * Firecrawl Service — scraping de website para extrair links de redes sociais
 * (Instagram, LinkedIn, TikTok, Facebook) quando Assertiva não retorna.
 *
 * Fallback inteligente: só é chamado quando Assertiva devolveu redes sociais
 * vazias E o lead tem website cadastrado.
 *
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 * Free tier: 500 scrapes/mês (suficiente para backfill inicial).
 *
 * Env:
 *   VITE_FIRECRAWL_API_KEY — chave API Firecrawl (fc-xxxxxxxx)
 */

import { extractSocialsFromUrls } from './socialMediaExtractor'
import type { SocialPlatform } from './socialMediaExtractor'

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY || ''
const FIRECRAWL_ENDPOINT = 'https://api.firecrawl.dev/v1/scrape'
const SCRAPE_TIMEOUT_MS = 20000

export interface FirecrawlSocialResult {
  instagram?: string
  linkedin?: string
  tiktok?: string
  facebook?: string
  website?: string
  scrapedAt: string
  sourceUrl: string
}

/**
 * Scrape website e extrai URLs de redes sociais dos <a href> encontrados.
 * Retorna null se Firecrawl não configurado, timeout, ou erro.
 * Nunca lança exceção — é graceful fallback.
 */
export async function scrapeSocialLinksFromWebsite(
  websiteUrl: string,
): Promise<FirecrawlSocialResult | null> {
  if (!FIRECRAWL_API_KEY) {
    console.warn('[Firecrawl] VITE_FIRECRAWL_API_KEY não configurada — skip fallback social')
    return null
  }
  if (!websiteUrl || typeof websiteUrl !== 'string') return null

  // Normalizar URL do website
  let url = websiteUrl.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)

  try {
    const res = await fetch(FIRECRAWL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'links'],
        onlyMainContent: false,
        waitFor: 1500,
        timeout: SCRAPE_TIMEOUT_MS - 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      console.warn(`[Firecrawl] ${res.status}: ${errorBody.slice(0, 200)}`)
      return null
    }

    const data = await res.json()
    // Firecrawl v1 retorna: { success, data: { links, html, markdown, metadata } }
    const payload = data?.data || data
    const allLinks: string[] = []

    // Prioridade: campo `links` direto (já extraído por Firecrawl)
    if (Array.isArray(payload?.links)) {
      for (const link of payload.links) {
        const href = typeof link === 'string' ? link : (link?.url || link?.href)
        if (href) allLinks.push(href)
      }
    }

    // Fallback: extrair hrefs do HTML (caso links esteja vazio)
    if (allLinks.length === 0 && typeof payload?.html === 'string') {
      const hrefRegex = /href=["']([^"']+)["']/gi
      let match
      while ((match = hrefRegex.exec(payload.html)) !== null) {
        allLinks.push(match[1])
      }
    }

    if (allLinks.length === 0) {
      console.warn('[Firecrawl] scrape sucesso mas nenhum link encontrado', { websiteUrl: url })
      return null
    }

    const socials = extractSocialsFromUrls(allLinks)
    const hasAnySocial = (['instagram', 'linkedin', 'tiktok', 'facebook'] as SocialPlatform[])
      .some((p) => !!socials[p])

    if (!hasAnySocial) return null

    return {
      instagram: socials.instagram,
      linkedin: socials.linkedin,
      tiktok: socials.tiktok,
      facebook: socials.facebook,
      website: socials.website,
      scrapedAt: new Date().toISOString(),
      sourceUrl: url,
    }
  } catch (err) {
    clearTimeout(timeout)
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[Firecrawl] falha ao raspar ${url}: ${message}`)
    return null
  }
}

/**
 * Verifica se Firecrawl está configurado.
 */
export function isFirecrawlAvailable(): boolean {
  return !!FIRECRAWL_API_KEY
}
