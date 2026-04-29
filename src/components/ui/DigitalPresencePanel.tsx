import { RefreshCw } from 'lucide-react'
import { cn } from '../../lib/cn'
import { extractHandle } from '../../services/socialMediaExtractor'
import type { Lead } from '../../types'
import { InstagramIcon } from './InstagramIcon'
import { LinkedInIcon } from './LinkedInIcon'
import { TikTokIcon } from './TikTokIcon'
import { FacebookIcon } from './FacebookIcon'
import { GlobeIcon } from './GlobeIcon'

interface Props {
  lead: Lead
  onReExtract?: () => void
  isReExtracting?: boolean
  compact?: boolean
}

const SOURCE_LABEL: Record<string, string> = {
  assertiva: 'Assertiva',
  firecrawl: 'Firecrawl (raspado)',
  mixed: 'Assertiva + Firecrawl',
  manual: 'Manual',
}

/**
 * Painel de Presença Digital — 5 pills com prioridade visual:
 *   Instagram → LinkedIn → TikTok → Website → Facebook
 *
 * Estado "presente": pill vermelho outline com ícone + handle
 * Estado "ausente": pill cinza dashed opacity-40 "Não encontrado"
 *
 * Extraído via pipeline de enriquecimento (Assertiva → Firecrawl fallback).
 */
export function DigitalPresencePanel({ lead, onReExtract, isReExtracting, compact }: Props) {
  const instagramUrl = normalizeInstagramUrl(lead.instagram)
  const linkedinUrl = normalizeLinkedinUrl(lead.linkedin)
  const tiktokUrl = normalizeTiktokUrl(lead.tiktok)
  const websiteUrl = lead.website?.trim()
  const facebookUrl = lead.facebook?.trim()

  const items = [
    instagramUrl && { platform: 'instagram' as const, url: instagramUrl, label: extractHandle(instagramUrl, 'instagram'), Icon: InstagramIcon },
    linkedinUrl && { platform: 'linkedin' as const, url: linkedinUrl, label: 'LinkedIn', Icon: LinkedInIcon },
    tiktokUrl && { platform: 'tiktok' as const, url: tiktokUrl, label: extractHandle(tiktokUrl, 'tiktok'), Icon: TikTokIcon },
    websiteUrl && !websiteUrl.toLowerCase().includes('instagram.com') && { platform: 'website' as const, url: websiteUrl, label: 'Website', Icon: GlobeIcon },
    facebookUrl && { platform: 'facebook' as const, url: facebookUrl, label: 'Facebook', Icon: FacebookIcon },
  ].filter(Boolean) as Array<{ platform: string; url: string; label: string; Icon: React.ComponentType<{ className?: string }> }>

  const extractedAt = lead.socialMediaExtractedAt
  const source = lead.socialMediaSource
  const sourceLabel = source ? SOURCE_LABEL[source] || source : null

  const showMeta = !compact && (extractedAt || sourceLabel || onReExtract)

  return (
    <div className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-2')}>
      {/* Header com meta + botão re-extrair (só não compact) */}
      {showMeta && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="uppercase tracking-wider font-semibold">Presença Digital</span>
            {sourceLabel && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-border text-[9px] font-medium text-text-secondary">
                {sourceLabel}
              </span>
            )}
            {extractedAt && (
              <span className="text-[10px] text-text-muted/60" title={new Date(extractedAt).toLocaleString('pt-BR')}>
                · {formatRelativeDate(extractedAt)}
              </span>
            )}
          </div>
          {onReExtract && (
            <button
              type="button"
              onClick={onReExtract}
              disabled={isReExtracting}
              className={cn(
                'inline-flex items-center gap-1 text-[10px] text-text-secondary hover:text-red-vivid transition-colors cursor-pointer',
                'px-2 py-1 rounded-md border border-border hover:border-red/30',
                isReExtracting && 'opacity-60 cursor-wait',
              )}
              aria-label="Re-extrair redes sociais"
              title="Re-extrair redes sociais via Assertiva + Firecrawl"
            >
              <RefreshCw className={cn('h-3 w-3', isReExtracting && 'animate-spin')} />
              <span className="font-medium">{isReExtracting ? 'Re-extraindo…' : 'Re-extrair'}</span>
            </button>
          )}
        </div>
      )}

      {/* Pills */}
      <div className="flex gap-2 flex-wrap">
        {items.length > 0 ? (
          items.map((item) => (
            <a
              key={item.platform}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 text-[10px] text-red-vivid border border-red/30 rounded-md transition-all font-medium leading-none',
                'hover:bg-red hover:text-white hover:border-red',
                compact ? 'px-1.5 py-1' : 'px-2 py-1',
              )}
              aria-label={`Abrir ${item.platform}: ${item.label}`}
            >
              <item.Icon className="h-2.5 w-2.5" />
              <span className="truncate max-w-[140px]">{item.label}</span>
            </a>
          ))
        ) : (
          <span className="text-[11px] text-text-muted italic">
            Nenhuma rede social encontrada
            {onReExtract && !isReExtracting ? '. Clique em Re-extrair.' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// --- Helpers ---

function normalizeInstagramUrl(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // Handle solto sem http → prepend instagram.com
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

function normalizeLinkedinUrl(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // Assume company slug
  return `https://linkedin.com/company/${trimmed.replace(/^\/?(in|company)\//, '')}`
}

function normalizeTiktokUrl(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://tiktok.com/@${trimmed.replace(/^@/, '')}`
}

function formatRelativeDate(iso: string): string {
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diffMs = now - then
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    if (diffDays < 1) return 'hoje'
    if (diffDays === 1) return 'ontem'
    if (diffDays < 30) return `há ${diffDays}d`
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)}mes`
    return `há ${Math.floor(diffDays / 365)}a`
  } catch {
    return ''
  }
}
