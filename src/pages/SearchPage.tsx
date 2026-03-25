import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Search, MapPin, Globe, TrendingUp, X, ChevronDown, CheckCircle, Loader2, AlertCircle, Star, Download } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/cn'
import { useApifySearch, type SearchPhase } from '../hooks/useApifySearch'
import { useCreateLead } from '../hooks/useLeads'
import { toast } from 'sonner'

// --- Segmentos recomendados (podem ser digitados livremente) ---
const RECOMMENDED_SEGMENTS = [
  'Estética', 'Odontologia', 'Varejo', 'Farmácia', 'Movelaria',
  'Serviços', 'Alimentação', 'Saúde', 'Educação', 'Tecnologia',
  'Automotivo', 'Pet Shop', 'Fitness', 'Beleza', 'Imobiliário',
  'Construção', 'Moda', 'Decoração', 'Agronegócio', 'Logística',
]

// --- Todos os estados BR, recomendados primeiro ---
const RECOMMENDED_STATES = ['SP', 'RJ', 'MG', 'RS', 'SC', 'PR']
const ALL_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' }, { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' }, { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
]

const REVENUE_OPTIONS = [
  { value: '', label: 'Sem limite' },
  { value: '30000', label: 'R$ 30k' },
  { value: '50000', label: 'R$ 50k' },
  { value: '70000', label: 'R$ 70k' },
  { value: '100000', label: 'R$ 100k' },
  { value: '200000', label: 'R$ 200k' },
  { value: '500000', label: 'R$ 500k' },
  { value: '830000', label: 'R$ 830k' },
  { value: '1000000', label: 'R$ 1M' },
  { value: '2000000', label: 'R$ 2M' },
  { value: '5000000', label: 'R$ 5M' },
  { value: '10000000', label: 'R$ 10M' },
]

// --- Tag input with dropdown suggestions ---
function TagInput({
  label,
  placeholder,
  tags,
  setTags,
  suggestions,
  suggestionsLabel,
}: {
  label: string
  placeholder: string
  tags: string[]
  setTags: (t: string[]) => void
  suggestions: string[]
  suggestionsLabel: string
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()),
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">{label}</label>
      <div
        className={cn(
          'min-h-[44px] w-full rounded-xl bg-white/[0.03] border text-sm text-text-primary px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text transition-colors',
          open ? 'border-red/30 ring-1 ring-red/20' : 'border-border',
        )}
        onClick={() => setOpen(true)}
      >
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-red/10 text-red border border-red/20 rounded-lg px-2.5 py-1 text-xs font-medium">
            {tag}
            <button onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:text-red-vivid cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-text-muted"
        />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-surface-md border border-border shadow-xl shadow-black/30 py-2 max-h-[240px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium px-3 pb-2">{suggestionsLabel}</p>
          {filtered.map((item) => (
            <button
              key={item}
              onClick={() => { addTag(item); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] cursor-pointer transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Multi-select dropdown for states ---
function StateMultiSelect({
  selected,
  setSelected,
}: {
  selected: string[]
  setSelected: (s: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const toggle = (uf: string) => {
    setSelected(selected.includes(uf) ? selected.filter((s) => s !== uf) : [...selected, uf])
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const recommended = ALL_STATES.filter((s) => RECOMMENDED_STATES.includes(s.uf))
  const others = ALL_STATES.filter((s) => !RECOMMENDED_STATES.includes(s.uf))

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Estado / Região</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'min-h-[44px] w-full rounded-xl bg-white/[0.03] border text-sm px-3 py-2 flex flex-wrap gap-1.5 items-center text-left cursor-pointer transition-colors',
          open ? 'border-red/30 ring-1 ring-red/20' : 'border-border',
        )}
      >
        {selected.length === 0 ? (
          <span className="text-text-muted">Todo Brasil</span>
        ) : (
          selected.map((uf) => (
            <span key={uf} className="inline-flex items-center gap-1 bg-red/10 text-red border border-red/20 rounded-lg px-2.5 py-1 text-xs font-medium">
              {uf}
              <span onClick={(e) => { e.stopPropagation(); toggle(uf) }} className="hover:text-red-vivid cursor-pointer">
                <X className="h-3 w-3" />
              </span>
            </span>
          ))
        )}
        <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-surface-md border border-border shadow-xl shadow-black/30 py-2 max-h-[300px] overflow-y-auto">
          {/* Recomendados */}
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium px-3 pb-1.5">Recomendados</p>
          {recommended.map((state) => (
            <button
              key={state.uf}
              onClick={() => toggle(state.uf)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 text-sm cursor-pointer transition-colors',
                selected.includes(state.uf) ? 'text-red bg-red/5' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors',
                selected.includes(state.uf) ? 'bg-red border-red text-white' : 'border-border',
              )}>
                {selected.includes(state.uf) && '✓'}
              </div>
              {state.name} <span className="text-text-muted text-xs">({state.uf})</span>
            </button>
          ))}

          <div className="border-t border-border my-2" />

          {/* Demais */}
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium px-3 pb-1.5">Demais estados</p>
          {others.map((state) => (
            <button
              key={state.uf}
              onClick={() => toggle(state.uf)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 text-sm cursor-pointer transition-colors',
                selected.includes(state.uf) ? 'text-red bg-red/5' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors',
                selected.includes(state.uf) ? 'bg-red border-red text-white' : 'border-border',
              )}>
                {selected.includes(state.uf) && '✓'}
              </div>
              {state.name} <span className="text-text-muted text-xs">({state.uf})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Search result card (enriched) ---
function ResultCard({ item, onImport, importing }: { item: any; onImport: () => void; importing: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-border hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold text-text-primary truncate">{item.companyName}</h4>
            {item.googleRating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-warning">
                <Star className="h-3 w-3 fill-current" /> {item.googleRating}
              </span>
            )}
            <Badge variant={item.digitalPresenceScore >= 6 ? 'success' : item.digitalPresenceScore >= 3 ? 'warning' : 'error'} size="sm">
              Digital: {item.digitalPresenceScore}/10
            </Badge>
          </div>
          <p className="text-xs text-text-muted mb-1">{item.category} · {item.address}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.whatsapp ? (
              <span className="text-[11px] text-whatsapp bg-whatsapp/10 px-2 py-0.5 rounded-md font-medium">WhatsApp: +{item.whatsapp}</span>
            ) : (
              <span className="text-[11px] text-error/70 bg-error/8 px-2 py-0.5 rounded-md">Sem WhatsApp decisor</span>
            )}
            {item.phone && <span className="text-[11px] text-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md">{item.phone}</span>}
            {item.website && <span className="text-[11px] text-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md truncate max-w-[180px]">{item.website}</span>}
            {item.instagramFollowers && <span className="text-[11px] text-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md">IG: {item.instagramFollowers}</span>}
            {item.linkedinUrl && <span className="text-[11px] text-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md">LinkedIn</span>}
            {item.reviewsCount > 0 && <span className="text-[11px] text-text-muted">{item.reviewsCount} avaliações</span>}
          </div>
          {!item.whatsapp && (
            <p className="text-[10px] text-warning mt-1.5">O WhatsApp do decisor (CEO/dono) deve ser adicionado manualmente na ficha do lead após importação</p>
          )}
          {item.marketingVulnerabilities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.marketingVulnerabilities.slice(0, 3).map((v: string, i: number) => (
                <span key={i} className="text-[10px] text-error/80 bg-error/8 px-2 py-0.5 rounded-md">{v.split('—')[0].trim()}</span>
              ))}
              {item.marketingVulnerabilities.length > 3 && (
                <span className="text-[10px] text-text-muted">+{item.marketingVulnerabilities.length - 3} mais</span>
              )}
            </div>
          )}
        </div>
        <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={onImport} loading={importing}>
          Importar
        </Button>
      </div>
    </div>
  )
}

// --- Progress display (3 phases) ---
function SearchProgress({ phase, mapsStatus, instagramStatus, websiteStatus, elapsed }: { phase: SearchPhase; mapsStatus: string; instagramStatus: string; websiteStatus: string; elapsed: number }) {
  const steps = [
    { label: 'Google Maps', status: mapsStatus, desc: 'Empresas, endereços, telefones, avaliações' },
    { label: 'Instagram', status: instagramStatus, desc: 'Seguidores, engajamento, bio, posicionamento' },
    { label: 'Website Crawler', status: websiteStatus, desc: 'Serviços, tecnologias, conteúdo, about' },
    { label: 'Análise', status: phase === 'analyzing' ? 'running' : phase === 'done' ? 'done' : 'pending', desc: 'Vulnerabilidades, competitiva, projeção de riscos' },
  ]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Pesquisando leads...</CardTitle>
        <span className="text-xs font-mono text-text-muted">{elapsed}s</span>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            {step.status === 'done' ? (
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
            ) : step.status === 'running' ? (
              <Loader2 className="h-5 w-5 text-red animate-spin shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border border-border shrink-0" />
            )}
            <div>
              <p className={cn('text-sm font-medium', step.status === 'done' ? 'text-success' : step.status === 'running' ? 'text-text-primary' : 'text-text-muted')}>
                {step.label}
              </p>
              <p className="text-[11px] text-text-muted">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-dark to-red transition-all duration-500"
          style={{ width: phase === 'done' ? '100%' : phase === 'analyzing' ? '90%' : phase === 'website' ? '70%' : phase === 'instagram' ? '45%' : `${Math.min(30, elapsed)}%` }}
        />
      </div>
    </Card>
  )
}

// --- Main page ---
export function SearchPage() {
  const [segments, setSegments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [revenueMin, setRevenueMin] = useState('')
  const [revenueMax, setRevenueMax] = useState('')
  const [importingId, setImportingId] = useState<string | null>(null)

  const apify = useApifySearch()
  const createLead = useCreateLead()

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'
  const selectClass = cn(inputClass, 'appearance-none cursor-pointer')

  const activeFilters = segments.length + states.length + (city ? 1 : 0) + keywords.length + (revenueMin ? 1 : 0) + (revenueMax ? 1 : 0)

  const handleSearch = () => {
    if (segments.length === 0 && keywords.length === 0) {
      toast.error('Selecione pelo menos um segmento ou palavra-chave')
      return
    }
    apify.search({ segments, states, city, keywords, revenueMin, revenueMax })
  }

  const handleImport = async (item: any) => {
    setImportingId(item.companyName)
    try {
      const vulns = (item.marketingVulnerabilities || []).map((v: string, i: number) => ({
        titulo: v.split('—')[0]?.trim() || v,
        impacto: i < 3 ? 'ALTO' : 'MEDIO',
        descricao: v,
        impactoFinanceiro: 'A quantificar no diagnóstico',
      }))

      await createLead.mutateAsync({
        companyName: item.companyName,
        segment: segments[0] || item.category || '',
        tier: 'Small',
        status: 'Novo',
        score: Math.round(item.digitalPresenceScore / 2),
        temperature: item.digitalPresenceScore >= 5 ? 'WARM' : 'COLD',
        spicedS: 0, spicedP: 0, spicedI: 0, spicedC: 0, spicedD: 0,
        website: item.website || '',
        address: item.address || '',
        city: item.city || city,
        state: item.state || states[0] || '',
        instagram: item.instagramUrl || '',
        linkedin: item.linkedinUrl || '',
        facebook: item.facebookUrl || '',
        businessSummary: `${item.category} · ${item.reviewsCount} avaliações Google (${item.googleRating}★) · ${item.instagramFollowers ? item.instagramFollowers + ' seguidores IG' : 'Sem IG'} · Presença digital: ${item.digitalPresenceScore}/10`,
        techStack: item.websiteTech || '',
        productPortfolio: item.landingPages?.length > 0 ? `Landing pages: ${item.landingPages.join(', ')}` : '',
        marketContext: item.competitiveInsights || '',
        vulnerabilities: JSON.stringify(vulns),
        meetingPrep: JSON.stringify({
          agenda: [],
          objecoes: [],
          checklist: item.meetingTalkingPoints || [],
        }),
      })
    } finally {
      setImportingId(null)
    }
  }

  const handleImportAll = async () => {
    for (const item of apify.results) {
      await handleImport(item)
    }
    toast.success(`${apify.results.length} leads importados com análise completa`)
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold font-heading gradient-text">Pesquisa de leads</h1>
        <p className="text-xs text-text-muted mt-0.5">Encontre empresas qualificadas via Google Maps, Instagram e Website</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-5">
          <CardTitle>Configurar busca</CardTitle>
          {activeFilters > 0 && (
            <span className="text-[11px] text-red font-medium bg-red/10 px-2.5 py-1 rounded-full">
              {activeFilters} filtro{activeFilters > 1 ? 's' : ''} ativo{activeFilters > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Segmento — tag input com sugestões */}
          <TagInput
            label="Setor / Segmento"
            placeholder="Digite ou selecione segmentos..."
            tags={segments}
            setTags={setSegments}
            suggestions={RECOMMENDED_SEGMENTS}
            suggestionsLabel="Segmentos recomendados"
          />

          {/* Estado — multi-select com todos os 27 */}
          <StateMultiSelect selected={states} setSelected={setStates} />

          {/* Cidade */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cidade</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo, Campinas, Curitiba"
              className={inputClass}
            />
          </div>

          {/* Palavras-chave — tag input */}
          <TagInput
            label="Palavras-chave"
            placeholder="Ex: implantes, ortodontia, clínica..."
            tags={keywords}
            setTags={setKeywords}
            suggestions={['implantes', 'ortodontia', 'harmonização facial', 'manipulação', 'planejados', 'pet shop', 'ecommerce', 'franquia', 'delivery', 'consultório']}
            suggestionsLabel="Sugestões"
          />

          {/* Faturamento mínimo */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento mínimo</label>
            <select value={revenueMin} onChange={(e) => setRevenueMin(e.target.value)} className={selectClass}>
              {REVENUE_OPTIONS.map((r) => (
                <option key={'min-' + r.value} value={r.value}>{r.value ? r.label : 'Sem mínimo'}</option>
              ))}
            </select>
          </div>

          {/* Faturamento máximo */}
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento máximo</label>
            <select value={revenueMax} onChange={(e) => setRevenueMax(e.target.value)} className={selectClass}>
              {REVENUE_OPTIONS.map((r) => (
                <option key={'max-' + r.value} value={r.value}>{r.value ? r.label : 'Sem máximo'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters summary */}
        {activeFilters > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-text-muted mr-1">Filtros:</span>
            {segments.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">
                {s} <button onClick={() => setSegments(segments.filter((x) => x !== s))} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {states.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">
                {s} <button onClick={() => setStates(states.filter((x) => x !== s))} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {city && (
              <span className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">
                {city} <button onClick={() => setCity('')} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {keywords.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">
                {k} <button onClick={() => setKeywords(keywords.filter((x) => x !== k))} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {revenueMin && (
              <span className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">
                Min: {REVENUE_OPTIONS.find((r) => r.value === revenueMin)?.label}
                <button onClick={() => setRevenueMin('')} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {revenueMax && (
              <span className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">
                Max: {REVENUE_OPTIONS.find((r) => r.value === revenueMax)?.label}
                <button onClick={() => setRevenueMax('')} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            <button
              onClick={() => { setSegments([]); setStates([]); setCity(''); setKeywords([]); setRevenueMin(''); setRevenueMax('') }}
              className="text-[11px] text-text-muted hover:text-red ml-2 cursor-pointer transition-colors"
            >
              Limpar tudo
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            size="lg"
            icon={<Search className="h-4 w-4" />}
            onClick={handleSearch}
            loading={apify.phase !== 'idle' && apify.phase !== 'done' && apify.phase !== 'error'}
            disabled={apify.phase !== 'idle' && apify.phase !== 'done' && apify.phase !== 'error'}
          >
            Pesquisar via Apify
          </Button>
          {apify.phase === 'idle' && <span className="text-[11px] text-text-muted">Estimativa: 30-120 segundos</span>}
          {apify.phase === 'done' && (
            <Button variant="ghost" size="sm" onClick={apify.reset}>Nova pesquisa</Button>
          )}
        </div>
      </Card>

      {/* Progress */}
      {(apify.phase === 'maps' || apify.phase === 'instagram' || apify.phase === 'website' || apify.phase === 'analyzing') && (
        <SearchProgress phase={apify.phase} mapsStatus={apify.mapsStatus} instagramStatus={apify.instagramStatus} websiteStatus={apify.websiteStatus} elapsed={apify.elapsed} />
      )}

      {/* Error */}
      {apify.phase === 'error' && (
        <Card className="p-4">
          <div className="flex items-center gap-3 text-error">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Erro na pesquisa</p>
              <p className="text-xs text-text-muted">{apify.error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={apify.reset} className="ml-auto">Tentar novamente</Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {apify.phase === 'done' && apify.results.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CardTitle>{apify.results.length} empresas encontradas</CardTitle>
              <Badge variant="success" size="sm">em {apify.elapsed}s</Badge>
            </div>
            <Button size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleImportAll}>
              Importar todos ({apify.results.length})
            </Button>
          </div>
          <div className="space-y-2">
            {apify.results.map((item, i) => (
              <ResultCard
                key={i}
                item={item}
                onImport={() => handleImport(item)}
                importing={importingId === item.companyName}
              />
            ))}
          </div>
        </Card>
      )}

      {apify.phase === 'done' && apify.results.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-muted">Nenhum resultado encontrado. Tente ajustar os filtros.</p>
        </Card>
      )}

      {/* Data sources (only when idle) */}
      {apify.phase === 'idle' && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: MapPin, label: 'Google Maps', desc: 'Endereço, telefone, avaliações, fotos' },
            { icon: Globe, label: 'Website Crawler', desc: 'Serviços, equipe, tecnologias, about' },
            { icon: TrendingUp, label: 'Instagram', desc: 'Seguidores, engajamento, bio, posts' },
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
      )}
    </div>
  )
}
