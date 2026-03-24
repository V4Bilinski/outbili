import { EmptyState } from '../components/ui/EmptyState'
import { Smartphone } from 'lucide-react'
export function CampaignsPage() {
  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      <div className="mb-6">
        <h1 className="text-xl font-bold font-heading gradient-text">Campanhas WhatsApp</h1>
        <p className="text-xs text-text-muted mt-0.5">Cadências automatizadas via BilinskiZap</p>
      </div>
      <EmptyState
        icon={Smartphone}
        title="Nenhuma cadência criada"
        description="Crie cadências automatizadas de WhatsApp para seus leads HOT e WARM."
        action={{ label: 'Nova cadência', onClick: () => {} }}
      />
    </div>
  )
}
