import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CheckCircle, AlertCircle } from 'lucide-react'

export function SettingsPage() {
  const airtablePat = import.meta.env.VITE_AIRTABLE_PAT
  const bilinskizapUrl = import.meta.env.VITE_BILINSKIZAP_URL
  const apifyToken = import.meta.env.VITE_APIFY_TOKEN

  const connections = [
    { name: 'Airtable', desc: 'Base de dados dos leads', connected: !!airtablePat, status: airtablePat ? 'Conectado' : 'Token ausente' },
    { name: 'BilinskiZap', desc: 'API WhatsApp oficial', connected: false, status: bilinskizapUrl ? 'URL configurada — API key pendente' : 'Não configurado' },
    { name: 'Apify', desc: 'Scraping Google Maps, Instagram', connected: !!apifyToken, status: apifyToken ? 'Conectado' : 'Token ausente' },
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
                  {conn.connected ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{conn.name}</p>
                  <p className="text-[11px] text-text-muted">{conn.desc}</p>
                </div>
              </div>
              <Badge variant={conn.connected ? 'success' : 'warning'} size="sm">
                {conn.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

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
