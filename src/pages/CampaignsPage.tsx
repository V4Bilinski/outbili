import { EmptyState } from '../components/ui/EmptyState'
import { Smartphone } from 'lucide-react'

export function CampaignsPage() {
  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-xl font-bold font-heading mb-4">Campanhas WhatsApp</h1>
      <EmptyState
        icon={Smartphone}
        title="Nenhuma cadência criada"
        description="Crie cadências automatizadas de WhatsApp para seus leads HOT e WARM."
        action={{ label: 'Nova cadência', onClick: () => {} }}
      />
    </div>
  )
}
