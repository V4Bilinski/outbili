import { EmptyState } from '../components/ui/EmptyState'
import { BarChart3 } from 'lucide-react'

export function ReportsPage() {
  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-xl font-bold font-heading mb-4">Relatórios</h1>
      <EmptyState
        icon={BarChart3}
        title="Sem dados para relatório"
        description="Comece prospectando e os dados aparecerão aqui automaticamente."
      />
    </div>
  )
}
