import { Card, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { useZapTemplates } from '../hooks/useBilinskiZap'

// Templates de WhatsApp aprovados. Vive na tela Campanhas, onde sao usados.
export function WhatsappTemplatesPanel() {
  const { data: templates } = useZapTemplates()

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardTitle className="mb-2">Templates WhatsApp</CardTitle>
        <p className="text-xs text-text-muted">Nenhum template disponível no momento.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle className="mb-4">Templates WhatsApp ({templates.length})</CardTitle>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">{t.name}</p>
              <p className="text-label text-text-muted">{t.category} · {t.language}</p>
            </div>
            <Badge variant={t.status === 'APPROVED' ? 'success' : t.status === 'PENDING' ? 'warning' : 'error'} size="sm">
              {t.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
