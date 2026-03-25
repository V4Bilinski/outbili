import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useZapHealth, useZapContactStats, useZapTemplates } from '../hooks/useBilinskiZap'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function SettingsPage() {
  const airtablePat = import.meta.env.VITE_AIRTABLE_PAT
  const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID
  const bilinskizapUrl = import.meta.env.VITE_BILINSKIZAP_URL
  const bilinskizapKey = import.meta.env.VITE_BILINSKIZAP_API_KEY
  const apifyToken = import.meta.env.VITE_APIFY_TOKEN

  const { data: zapHealthy, isLoading: healthLoading } = useZapHealth()
  const { data: contactStats } = useZapContactStats()
  const { data: templates } = useZapTemplates()

  const connections = [
    {
      name: 'Airtable',
      desc: 'Base de dados dos leads',
      connected: !!(airtablePat && airtableBaseId),
      status: airtablePat && airtableBaseId ? 'Conectado' : airtablePat ? 'Base ID pendente' : 'Token ausente',
      details: airtableBaseId ? `Base: ${airtableBaseId}` : undefined,
    },
    {
      name: 'BilinskiZap',
      desc: 'API WhatsApp oficial',
      connected: zapHealthy === true,
      loading: healthLoading,
      status: zapHealthy ? 'Conectado' : bilinskizapKey ? 'Erro de conexão' : 'API key pendente',
      details: contactStats ? `${contactStats.total} contatos · ${contactStats.optIn} opt-in` : bilinskizapUrl || undefined,
    },
    {
      name: 'Apify',
      desc: 'Scraping Google Maps, Instagram, Website',
      connected: !!apifyToken,
      status: apifyToken ? 'Conectado' : 'Token ausente',
      details: apifyToken ? '3 actors configurados' : undefined,
    },
  ]

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold font-heading gradient-text">Configurações</h1>
        <p className="text-xs text-text-muted mt-0.5">Gerencie conexões, segmentos e templates</p>
      </div>

      <Card>
        <CardTitle className="mb-5">Conexões API</CardTitle>
        <div className="space-y-3">
          {connections.map((conn) => (
            <div key={conn.name} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${conn.connected ? 'bg-success/10' : 'bg-warning/10'}`}>
                  {conn.loading ? (
                    <Loader2 className="h-4 w-4 text-text-muted animate-spin" />
                  ) : conn.connected ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{conn.name}</p>
                  <p className="text-[11px] text-text-muted">{conn.desc}</p>
                  {conn.details && <p className="text-[10px] text-text-muted mt-0.5">{conn.details}</p>}
                </div>
              </div>
              <Badge variant={conn.connected ? 'success' : 'warning'} size="sm">
                {conn.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Templates */}
      {templates && templates.length > 0 && (
        <Card>
          <CardTitle className="mb-4">Templates WhatsApp ({templates.length})</CardTitle>
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t.name}</p>
                  <p className="text-[11px] text-text-muted">{t.category} · {t.language}</p>
                </div>
                <Badge variant={t.status === 'APPROVED' ? 'success' : t.status === 'PENDING' ? 'warning' : 'error'} size="sm">
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle className="mb-4">Sobre</CardTitle>
        <div className="flex items-center gap-4">
          <img src="/outbili/logo-white.png" alt="V4 Bilinski" className="h-8" />
          <div>
            <p className="text-sm font-semibold">OUTBILI v1.0</p>
            <p className="text-[11px] text-text-muted">Sistema de prospecção outbound · V4 Bilinski &amp;Co</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
