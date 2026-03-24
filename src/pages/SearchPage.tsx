import { EmptyState } from '../components/ui/EmptyState'
import { Search } from 'lucide-react'

export function SearchPage() {
  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-xl font-bold font-heading mb-4">Pesquisa de leads</h1>
      <EmptyState
        icon={Search}
        title="Pesquisa via Apify"
        description="Configure os filtros e pesquise leads qualificados via Google Maps, Instagram e Website."
        action={{ label: 'Em breve', onClick: () => {} }}
      />
    </div>
  )
}
