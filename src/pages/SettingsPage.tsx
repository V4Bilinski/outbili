import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export function SettingsPage() {
  const airtablePat = import.meta.env.VITE_AIRTABLE_PAT
  const bilinskizapUrl = import.meta.env.VITE_BILINSKIZAP_URL
  const apifyToken = import.meta.env.VITE_APIFY_TOKEN

  return (
    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-xl font-bold font-heading">Configurações</h1>

      <Card>
        <CardTitle className="mb-4">Conexões API</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-md">
            <div>
              <p className="text-sm font-semibold">Airtable</p>
              <p className="text-xs text-text-muted">Base de dados</p>
            </div>
            <Badge variant={airtablePat ? 'success' : 'error'}>
              {airtablePat ? 'Conectado' : 'Não configurado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-md">
            <div>
              <p className="text-sm font-semibold">BilinskiZap</p>
              <p className="text-xs text-text-muted">WhatsApp API</p>
            </div>
            <Badge variant={bilinskizapUrl ? 'warning' : 'error'}>
              {bilinskizapUrl ? 'URL configurada' : 'Não configurado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-md">
            <div>
              <p className="text-sm font-semibold">Apify</p>
              <p className="text-xs text-text-muted">Lead scraping</p>
            </div>
            <Badge variant={apifyToken ? 'success' : 'error'}>
              {apifyToken ? 'Conectado' : 'Não configurado'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
