import { EmptyState } from '../components/ui/EmptyState'
import { BarChart3 } from 'lucide-react'

export function ReportsPage() {
  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      <div className="mb-6">
        <h1 className="text-xl font-bold font-heading gradient-text">Relatórios</h1>
        <p className="text-xs text-text-muted mt-0.5">Performance, funil e análise de segmentos</p>
      </div>
      <EmptyState
        icon={BarChart3}
        title="Sem dados para relatório"
        description="Comece prospectando leads e os dados aparecerão automaticamente."
      />
    </div>
  )
}
