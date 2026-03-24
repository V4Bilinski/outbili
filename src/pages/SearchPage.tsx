import { Card, CardTitle } from '../components/ui/Card'
import { Search, MapPin, Globe, TrendingUp } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SEGMENTS } from '../lib/constants'
import { useState } from 'react'

export function SearchPage() {
  const [segment, setSegment] = useState('')
  const [city, setCity] = useState('')
  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold font-heading gradient-text">Pesquisa de leads</h1>
        <p className="text-xs text-text-muted mt-0.5">Encontre empresas qualificadas via Google Maps, Instagram e Website</p>
      </div>

      <Card>
        <CardTitle className="mb-5">Configurar busca</CardTitle>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Segmento</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className={inputClass}>
              <option value="">Selecione o segmento</option>
              {SEGMENTS.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cidade</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Estado</label>
            <select className={inputClass}>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="SC">Santa Catarina</option>
              <option value="PR">Paraná</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Palavras-chave</label>
            <input type="text" placeholder="Ex: implantes, ortodontia" className={inputClass} />
          </div>
        </div>
        <div className="mt-6">
          <Button size="lg" icon={<Search className="h-4 w-4" />} className="w-full md:w-auto">
            Pesquisar via Apify
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: MapPin, label: 'Google Maps', desc: 'Endereço, telefone, avaliações', status: 'Pronto' },
          { icon: Globe, label: 'Website Crawler', desc: 'Serviços, equipe, tecnologias', status: 'Pronto' },
          { icon: TrendingUp, label: 'Instagram', desc: 'Seguidores, engajamento, bio', status: 'Pronto' },
        ].map((source) => (
          <Card key={source.label} className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-red-subtle">
              <source.icon className="h-4 w-4 text-red" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{source.label}</p>
              <p className="text-[11px] text-text-muted">{source.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
