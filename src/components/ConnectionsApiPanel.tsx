import { useState } from 'react'
import { Card, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useZapHealth, useZapContactStats } from '../hooks/useBilinskiZap'
import { CheckCircle, AlertCircle, Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

// Conexoes de sistema (Supabase, BilinskiZap). Vive na tela Administracao.
export function ConnectionsApiPanel() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const bilinskizapUrl = import.meta.env.VITE_BILINSKIZAP_URL
  const bilinskizapKey = import.meta.env.VITE_BILINSKIZAP_API_KEY
  const { data: zapHealthy, isLoading: healthLoading } = useZapHealth()
  const { data: contactStats } = useZapContactStats()

  const [testing, setTesting] = useState<string | null>(null)
  const [expandedError, setExpandedError] = useState<string | null>(null)

  const testConnection = async (name: string) => {
    setTesting(name)
    try {
      if (name === 'Supabase') {
        const { error } = await supabase.schema('app').from('leads').select('id', { head: true, count: 'exact' })
        if (!error) toast.success('Supabase conectado com sucesso')
        else toast.error(`Supabase erro: ${error.message}`)
      } else if (name === 'BilinskiZap') {
        const res = await fetch(`${bilinskizapUrl}/api/health`, {
          headers: { 'x-api-key': bilinskizapKey },
        })
        if (res.ok) toast.success('BilinskiZap conectado com sucesso')
        else toast.error(`BilinskiZap erro: ${res.status}`)
      }
    } catch (err: any) {
      toast.error(`Erro ao testar ${name}: ${err.message}`)
    }
    setTesting(null)
  }

  const connections = [
    {
      name: 'Supabase',
      desc: 'Base de dados dos leads',
      connected: !!(supabaseUrl && supabaseKey),
      loading: false,
      status: supabaseUrl && supabaseKey ? 'Conectado' : 'Configuração pendente',
      details: supabaseUrl ? supabaseUrl.replace('https://', '').replace('.supabase.co', '') : undefined,
      errorHint: !supabaseUrl ? 'Adicione VITE_SUPABASE_URL no .env.local' : !supabaseKey ? 'Adicione VITE_SUPABASE_ANON_KEY no .env.local' : undefined,
    },
    {
      name: 'BilinskiZap',
      desc: 'API WhatsApp oficial',
      connected: zapHealthy === true,
      loading: healthLoading,
      status: zapHealthy ? 'Conectado' : bilinskizapKey ? 'Erro de conexão' : 'API key pendente',
      details: contactStats ? `${contactStats.total} contatos · ${contactStats.optIn} opt-in` : bilinskizapUrl || undefined,
      errorHint: !bilinskizapKey ? 'Adicione VITE_BILINSKIZAP_API_KEY no .env.local' : !zapHealthy ? `Verifique se ${bilinskizapUrl} está acessível` : undefined,
    },
  ]

  return (
    <Card>
      <CardTitle className="mb-5">Conexões API</CardTitle>
      <div className="space-y-3">
        {connections.map((conn) => (
          <div key={conn.name} className="rounded-xl bg-elevated-1 border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${conn.connected ? 'bg-success/10' : 'bg-warning/10'}`}>
                  {conn.loading ? (
                    <Loader2 className="h-4 w-4 text-text-muted animate-spin" />
                  ) : conn.connected ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{conn.name}</p>
                  <p className="text-label text-text-muted">{conn.desc}</p>
                  {conn.details && <p className="text-caption text-text-muted mt-0.5">{conn.details}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={testing === conn.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  onClick={() => testConnection(conn.name)}
                  disabled={testing !== null}
                >
                  Testar
                </Button>
                <Badge variant={conn.connected ? 'success' : 'warning'} size="sm">
                  {conn.status}
                </Badge>
              </div>
            </div>
            {!conn.connected && conn.errorHint && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => setExpandedError(expandedError === conn.name ? null : conn.name)}
                  className="flex items-center gap-1 text-caption text-warning cursor-pointer hover:text-warning/80 transition-colors"
                >
                  Como resolver <ChevronDown className={cn('h-3 w-3 transition-transform', expandedError === conn.name && 'rotate-180')} />
                </button>
                {expandedError === conn.name && (
                  <p className="text-caption text-text-muted mt-1 pl-2 border-l-2 border-warning/20 animate-[fade-in_0.2s_ease-out]">
                    {conn.errorHint}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
