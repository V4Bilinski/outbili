import { useState, useCallback } from 'react'
import {
  startFacebookAdsScrape,
  startSemrushScrape,
  pollRunUntilDone,
  getDatasetItems,
} from '../lib/apify'

export type AdsIntelPhase = 'idle' | 'meta-ads' | 'semrush' | 'analyzing' | 'done' | 'error'

export interface MetaAd {
  adArchiveID: string
  title: string | null
  displayFormat: string
  bodyText: string
  imageUrl: string | null
  videoPreviewUrl: string | null
  linkTitle: string
  linkDescription: string
  linkUrl: string
  ctaText: string
  platforms: string[]
  startDate: string
  isActive: boolean
  collationCount: number | null
  profilePictureUrl: string | null
}

export interface SemrushData {
  authorityScore: number
  mozDomainAuthority: number
  spamScore: string
}

export interface AdsIntelReport {
  companyName: string
  domain: string
  generatedAt: string
  metaAds: MetaAd[]
  semrush: SemrushData | null
  totalActiveAds: number
}

function extractDomain(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch {
    return url.replace(/https?:\/\//, '').replace('www.', '').split('/')[0]
  }
}

function parseMetaAds(items: any[]): MetaAd[] {
  return items
    .filter((item) => item.snapshot && item.adArchiveID)
    .map((item) => {
      const snap = item.snapshot
      const firstCard = snap.cards?.[0]

      return {
        adArchiveID: item.adArchiveID,
        title: snap.title,
        displayFormat: snap.displayFormat || 'UNKNOWN',
        bodyText:
          firstCard?.body ||
          (snap.body?.text && !snap.body.text.includes('{{') ? snap.body.text : '') ||
          '',
        imageUrl:
          firstCard?.resizedImageUrl ||
          firstCard?.originalImageUrl ||
          snap.images?.[0]?.resizedImageUrl ||
          snap.images?.[0]?.originalImageUrl ||
          null,
        videoPreviewUrl:
          firstCard?.videoPreviewImageUrl ||
          null,
        linkTitle:
          firstCard?.title ||
          snap.title ||
          '',
        linkDescription:
          firstCard?.linkDescription ||
          snap.linkDescription ||
          '',
        linkUrl:
          firstCard?.linkUrl ||
          snap.linkUrl ||
          '',
        ctaText:
          firstCard?.ctaText ||
          snap.ctaText ||
          'Learn More',
        platforms: item.publisherPlatform || [],
        startDate: item.startDateFormatted || '',
        isActive: item.isActive ?? true,
        collationCount: item.collationCount,
        profilePictureUrl:
          snap.pageProfilePictureUrl ||
          item.ad_details?.advertiser?.ad_library_page_info?.page_info?.profile_photo ||
          null,
      }
    })
}

export function useAdsIntel() {
  const [phase, setPhase] = useState<AdsIntelPhase>('idle')
  const [report, setReport] = useState<AdsIntelReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (companyName: string, website?: string) => {
    setPhase('meta-ads')
    setError(null)
    setReport(null)

    const domain = extractDomain(website)

    try {
      // Phase 1: Meta Ads Library (run with startUrls for better results)
      let metaAds: MetaAd[] = []
      try {
        const runId = await startFacebookAdsScrape(companyName)
        const datasetId = await pollRunUntilDone(runId, 'apify~facebook-ads-scraper', undefined, 180_000)
        const items = await getDatasetItems(datasetId, 30)
        metaAds = parseMetaAds(items)
      } catch (e) {
        console.warn('Meta Ads scrape failed:', e)
      }

      // Phase 2: SEMrush
      setPhase('semrush')
      let semrush: SemrushData | null = null
      if (domain) {
        try {
          const runId = await startSemrushScrape(domain)
          const datasetId = await pollRunUntilDone(runId, 'radeance~semrush-scraper', undefined, 120_000)
          const items = await getDatasetItems(datasetId, 1)
          if (items[0]) {
            semrush = {
              authorityScore: items[0].authority_score || 0,
              mozDomainAuthority: items[0].moz_domain_authority || 0,
              spamScore: items[0].moz_spam_score || '0%',
            }
          }
        } catch (e) {
          console.warn('SEMrush scrape failed:', e)
        }
      }

      // Phase 3: Compile
      setPhase('analyzing')

      const finalReport: AdsIntelReport = {
        companyName,
        domain,
        generatedAt: new Date().toISOString(),
        metaAds,
        semrush,
        totalActiveAds: metaAds.filter((a) => a.isActive).length,
      }

      setReport(finalReport)
      setPhase('done')
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar relatório')
      setPhase('error')
    }
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setReport(null)
    setError(null)
  }, [])

  return { phase, report, error, generate, reset }
}
