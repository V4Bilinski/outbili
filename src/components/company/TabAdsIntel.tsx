import type { Lead } from '../../types'
import { useAdsIntel, type MetaAd, type AdsIntelPhase } from '../../hooks/useAdsIntel'
import { cn } from '../../lib/cn'
import { Radar, Loader2, AlertTriangle, Play, Image, Zap, Eye } from 'lucide-react'

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  AUDIENCE_NETWORK: 'Audience Net.',
  MESSENGER: 'Messenger',
  THREADS: 'Threads',
}

const PHASE_LABELS: Record<AdsIntelPhase, string> = {
  idle: '',
  'meta-ads': 'Buscando anúncios no Meta Ads Library...',
  semrush: 'Coletando dados SEMrush...',
  analyzing: 'Compilando relatório...',
  done: '',
  error: '',
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FormatBadge({ format }: { format: string }) {
  const styles: Record<string, string> = {
    DCO: 'bg-info/10 text-info border-info/20',
    IMAGE: 'bg-warning/10 text-warning border-warning/20',
    VIDEO: 'bg-red/10 text-red border-red/20',
  }
  const labels: Record<string, string> = {
    DCO: 'Automático',
    IMAGE: 'Imagem',
    VIDEO: 'Vídeo',
  }
  return (
    <span className={cn('text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border', styles[format] || 'bg-surface-lt text-text-muted border-border')}>
      {labels[format] || format}
    </span>
  )
}

function AdCard({ ad }: { ad: MetaAd }) {
  const adsLibraryUrl = `https://www.facebook.com/ads/library/?id=${ad.adArchiveID}`
  const creativeUrl = ad.imageUrl || ad.videoPreviewUrl
  const isVideo = ad.displayFormat === 'VIDEO' || !!ad.videoPreviewUrl

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden transition-all hover:border-border-strong hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            <span className="text-xs font-semibold text-text-primary">Ativo</span>
          </div>
          <FormatBadge format={ad.displayFormat} />
        </div>
        <div className="text-[11px] text-text-muted space-y-0.5">
          <div>ID: <span className="font-mono">{ad.adArchiveID}</span></div>
          <div>Veiculação iniciada em <span className="text-text-secondary font-medium">{formatDate(ad.startDate)}</span></div>
          {ad.collationCount && ad.collationCount > 1 && (
            <div className="text-text-secondary font-medium">{ad.collationCount} anúncios usam esse criativo</div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-text-muted">Plataformas</span>
            {ad.platforms.map((p) => (
              <span key={p} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-lt text-[9px] text-text-muted">{PLATFORM_LABELS[p]?.[0] || '?'}</span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Link */}
      <a
        href={adsLibraryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center py-2.5 mx-4 mb-3 border border-border-strong rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-hover hover:border-red hover:text-red-vivid transition-all"
      >
        Ver detalhes do anúncio
      </a>

      {/* Preview */}
      <div className="border-t border-border px-4 pt-3 pb-4 space-y-3">
        {/* Page row */}
        <div className="flex items-center gap-2.5">
          {ad.profilePictureUrl ? (
            <img src={ad.profilePictureUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1877F2] to-[#42b883] flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0">C</div>
          )}
          <div>
            <div className="text-[13px] font-heading font-bold text-text-primary">Contabilizei</div>
            <div className="text-[11px] text-text-muted">Patrocinado</div>
          </div>
        </div>

        {/* Body text */}
        {ad.bodyText && (
          <p className="text-[13px] text-text-secondary leading-relaxed">{ad.bodyText}</p>
        )}

        {/* Creative */}
        {creativeUrl && (
          <div className="relative rounded-lg overflow-hidden bg-surface-md">
            <img
              src={creativeUrl}
              alt={ad.linkTitle || 'Criativo do anúncio'}
              className="w-full max-h-[280px] object-cover"
              loading="lazy"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* No creative placeholder */}
        {!creativeUrl && (
          <div className="rounded-lg bg-surface-md border border-border py-8 flex flex-col items-center gap-2 text-text-muted">
            {ad.displayFormat === 'DCO' ? (
              <>
                <Zap className="h-6 w-6 text-info" />
                <span className="text-xs">Criativo Dinâmico (DCO)</span>
                <span className="text-[10px]">O conteúdo muda para cada pessoa</span>
              </>
            ) : isVideo ? (
              <>
                <Play className="h-6 w-6 text-red" />
                <span className="text-xs">Vídeo</span>
              </>
            ) : (
              <>
                <Image className="h-6 w-6 text-warning" />
                <span className="text-xs">Imagem não disponível</span>
              </>
            )}
          </div>
        )}

        {/* Link row */}
        {(ad.linkTitle || ad.linkUrl) && (
          <div className="flex items-center justify-between gap-3 bg-surface-md rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              {ad.linkUrl && (
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide truncate">
                  {ad.linkUrl.replace(/https?:\/\//, '').split('/')[0]}
                </div>
              )}
              {ad.linkTitle && (
                <div className="text-[13px] font-semibold text-text-primary truncate">{ad.linkTitle}</div>
              )}
              {ad.linkDescription && (
                <div className="text-[11px] text-text-muted truncate">{ad.linkDescription}</div>
              )}
            </div>
            <span className="flex-shrink-0 px-3 py-1.5 rounded-md bg-surface-hover border border-border-strong text-[11px] font-semibold text-text-primary">
              {ad.ctaText === 'Learn More' ? 'Saiba mais' : ad.ctaText || 'Saiba mais'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function TabAdsIntel({ lead }: { lead: Lead }) {
  const { phase, report, error, generate, reset } = useAdsIntel()

  const isRunning = phase !== 'idle' && phase !== 'done' && phase !== 'error'

  if (phase === 'idle') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-red" />
          <h3 className="text-sm font-semibold font-heading">SpyBili</h3>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red/10 mx-auto">
            <Eye className="h-7 w-7 text-red" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-text-primary mb-1">Espionar anúncios de {lead.companyName}</h4>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Descubra quais anúncios essa empresa está rodando no Facebook, Instagram, Messenger e Threads. Veja os criativos reais, copies e estratégia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-[11px] text-text-muted">
            <span className="px-2 py-1 rounded bg-surface-lt border border-border">Meta Ads Library</span>
            <span className="px-2 py-1 rounded bg-surface-lt border border-border">SEMrush</span>
            <span className="px-2 py-1 rounded bg-surface-lt border border-border">Authority Score</span>
          </div>
          <button
            onClick={() => generate(lead.companyName, lead.website)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red text-white font-semibold text-sm hover:bg-red-vivid transition-all shadow-lg shadow-red/20 cursor-pointer"
          >
            <Radar className="h-4 w-4" />
            Gerar Relatório de Ads
          </button>
          <p className="text-[11px] text-text-muted">Leva de 2 a 5 minutos</p>
        </div>
      </div>
    )
  }

  if (isRunning) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-red" />
          <h3 className="text-sm font-semibold font-heading">SpyBili</h3>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
          <Loader2 className="h-10 w-10 text-red animate-spin mx-auto" />
          <div>
            <h4 className="font-heading font-bold text-text-primary mb-1">Coletando dados...</h4>
            <p className="text-sm text-text-muted">{PHASE_LABELS[phase]}</p>
          </div>

          {/* Progress steps */}
          <div className="flex justify-center gap-8 text-xs">
            <div className={cn('flex items-center gap-1.5', phase === 'meta-ads' ? 'text-red' : 'text-success')}>
              <span className={cn('w-2 h-2 rounded-full', phase === 'meta-ads' ? 'bg-red animate-pulse' : 'bg-success')} />
              Meta Ads
            </div>
            <div className={cn('flex items-center gap-1.5', phase === 'semrush' ? 'text-red' : phase === 'analyzing' ? 'text-success' : 'text-text-muted')}>
              <span className={cn('w-2 h-2 rounded-full', phase === 'semrush' ? 'bg-red animate-pulse' : phase === 'analyzing' ? 'bg-success' : 'bg-surface-lt')} />
              SEMrush
            </div>
            <div className={cn('flex items-center gap-1.5', phase === 'analyzing' ? 'text-red' : 'text-text-muted')}>
              <span className={cn('w-2 h-2 rounded-full', phase === 'analyzing' ? 'bg-red animate-pulse' : 'bg-surface-lt')} />
              Análise
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-red" />
          <h3 className="text-sm font-semibold font-heading">SpyBili</h3>
        </div>
        <div className="bg-error/5 border border-error/20 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-error mx-auto" />
          <p className="text-sm text-error">{error}</p>
          <button onClick={reset} className="text-xs text-text-muted hover:text-text-primary cursor-pointer">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // phase === 'done' — show report
  if (!report) return null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-red" />
          <h3 className="text-sm font-semibold font-heading">SpyBili — {report.companyName}</h3>
        </div>
        <button onClick={reset} className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer">
          Regerar
        </button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 text-center border-t-2 border-t-red">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Anúncios Ativos</div>
          <div className="text-2xl font-heading font-extrabold text-red">{report.totalActiveAds}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center border-t-2 border-t-info">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Plataformas</div>
          <div className="text-2xl font-heading font-extrabold text-info">
            {new Set(report.metaAds.flatMap((a) => a.platforms)).size}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center border-t-2 border-t-success">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Authority</div>
          <div className="text-2xl font-heading font-extrabold text-success">
            {report.semrush?.authorityScore ?? '—'}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center border-t-2 border-t-warning">
          <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">DA (Moz)</div>
          <div className="text-2xl font-heading font-extrabold text-warning">
            {report.semrush?.mozDomainAuthority ?? '—'}
          </div>
        </div>
      </div>

      {/* No ads found */}
      {report.metaAds.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-2">
          <div className="text-text-muted text-sm">Nenhum anúncio ativo encontrado na Meta Ads Library.</div>
          <div className="text-[11px] text-text-muted">Isso pode significar que a empresa não roda ads no Meta ou usa outro nome de página.</div>
        </div>
      )}

      {/* Ad cards */}
      {report.metaAds.length > 0 && (
        <>
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Anúncios encontrados ({report.metaAds.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.metaAds.map((ad) => (
              <AdCard key={ad.adArchiveID} ad={ad} />
            ))}
          </div>
        </>
      )}

      {/* Timestamp */}
      <div className="text-center text-[10px] text-text-muted pt-2">
        Relatório gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')} · Dados via Apify MCP
      </div>
    </div>
  )
}
