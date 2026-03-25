import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Search, X, ChevronDown, CheckCircle, Loader2, AlertCircle, Star, Sparkles, Brain, Target, Shield, Zap, History } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/cn'
import { useApifySearch } from '../hooks/useApifySearch'
import { useCreateLead } from '../hooks/useLeads'
import { toast } from 'sonner'

// --- Constants ---
const RECOMMENDED_SEGMENTS = [
  'Estética', 'Odontologia', 'Varejo', 'Farmácia', 'Movelaria',
  'Serviços', 'Alimentação', 'Saúde', 'Educação', 'Tecnologia',
  'Automotivo', 'Pet Shop', 'Fitness', 'Beleza', 'Imobiliário',
  'Construção', 'Moda', 'Decoração', 'Agronegócio', 'Logística',
]

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
  { value: '30000', label: 'R$ 30k' }, { value: '50000', label: 'R$ 50k' },
  { value: '70000', label: 'R$ 70k' }, { value: '100000', label: 'R$ 100k' },
  { value: '200000', label: 'R$ 200k' }, { value: '500000', label: 'R$ 500k' },
  { value: '830000', label: 'R$ 830k' }, { value: '1000000', label: 'R$ 1M' },
  { value: '2000000', label: 'R$ 2M' }, { value: '5000000', label: 'R$ 5M' },
]

const SEARCH_PHASES = [
  { key: 'maps', icon: Target, label: 'Mapeando empresas', desc: 'Coletando dados de contato, localização e avaliações' },
  { key: 'instagram', icon: Sparkles, label: 'Analisando presença social', desc: 'Seguidores, engajamento e posicionamento digital' },
  { key: 'website', icon: Brain, label: 'Rastreando websites', desc: 'Serviços, tecnologias e conteúdo publicado' },
  { key: 'facebookAds', icon: Zap, label: 'Auditando anúncios', desc: 'Biblioteca de anúncios Meta e investimento em mídia' },
  { key: 'seo', icon: Search, label: 'Auditoria SEO', desc: 'Score técnico, palavras-chave e posicionamento orgânico' },
  { key: 'competitors', icon: Shield, label: 'Mapeando concorrentes', desc: 'Identificando 3+ concorrentes diretos no segmento' },
  { key: 'analysis', icon: Brain, label: 'Gerando inteligência', desc: 'Vulnerabilidades, projeções e argumentos de venda' },
]

const CURIOSITY_MESSAGES = [
  'Descobrindo oportunidades escondidas...',
  'Analisando o mercado em tempo real...',
  'Identificando gaps competitivos...',
  'Calculando potencial de receita...',
  'Mapeando vulnerabilidades de marketing...',
  'Preparando arsenal de argumentos...',
  'Criando projeção de cenários...',
  'Montando diagnóstico estratégico...',
  'Quase lá... finalizando análise...',
]

// --- Saved search history ---
interface SearchHistory {
  id: string
  segments: string[]
  states: string[]
  city: string
  keywords: string[]
  revenueMin: string
  revenueMax: string
  date: string
  resultsCount?: number
}

function loadHistory(): SearchHistory[] {
  try { return JSON.parse(localStorage.getItem('outbili_search_history') || '[]') } catch { return [] }
}
function saveToHistory(entry: SearchHistory) {
  const history = loadHistory().slice(0, 9)
  history.unshift(entry)
  localStorage.setItem('outbili_search_history', JSON.stringify(history))
}

// --- Tag Input ---
function TagInput({ label, placeholder, tags, setTags, suggestions, suggestionsLabel }: {
  label: string; placeholder: string; tags: string[]; setTags: (t: string[]) => void; suggestions: string[]; suggestionsLabel: string
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const filtered = suggestions.filter((s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()))
  const addTag = (tag: string) => { const t = tag.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setInput('') }
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))
  const handleKeyDown = (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); addTag(input) }; if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]) }
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">{label}</label>
      <div className={cn('min-h-[44px] w-full rounded-xl bg-white/[0.03] border text-sm text-text-primary px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text transition-colors', open ? 'border-red/30 ring-1 ring-red/20' : 'border-border')} onClick={() => setOpen(true)}>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-red/10 text-red border border-red/20 rounded-lg px-2.5 py-1 text-xs font-medium">
            {tag}
            <button onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:text-red-vivid cursor-pointer"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input type="text" value={input} onChange={(e) => { setInput(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} placeholder={tags.length === 0 ? placeholder : ''} className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-text-muted" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-surface-md border border-border shadow-xl shadow-black/30 py-2 max-h-[240px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium px-3 pb-2">{suggestionsLabel}</p>
          {filtered.map((item) => (
            <button key={item} onClick={() => { addTag(item); setOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] cursor-pointer transition-colors">{item}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- State Multi-Select ---
function StateMultiSelect({ selected, setSelected }: { selected: string[]; setSelected: (s: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toggle = (uf: string) => setSelected(selected.includes(uf) ? selected.filter((s) => s !== uf) : [...selected, uf])
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  const recommended = ALL_STATES.filter((s) => RECOMMENDED_STATES.includes(s.uf))
  const others = ALL_STATES.filter((s) => !RECOMMENDED_STATES.includes(s.uf))

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Estado / Região</label>
      <button type="button" onClick={() => setOpen(!open)} className={cn('min-h-[44px] w-full rounded-xl bg-white/[0.03] border text-sm px-3 py-2 flex flex-wrap gap-1.5 items-center text-left cursor-pointer transition-colors', open ? 'border-red/30 ring-1 ring-red/20' : 'border-border')}>
        {selected.length === 0 ? <span className="text-text-muted">Todo Brasil</span> : selected.map((uf) => (
          <span key={uf} className="inline-flex items-center gap-1 bg-red/10 text-red border border-red/20 rounded-lg px-2.5 py-1 text-xs font-medium">
            {uf} <span onClick={(e) => { e.stopPropagation(); toggle(uf) }} className="hover:text-red-vivid cursor-pointer"><X className="h-3 w-3" /></span>
          </span>
        ))}
        <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-surface-md border border-border shadow-xl shadow-black/30 py-2 max-h-[300px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium px-3 pb-1.5">Recomendados</p>
          {recommended.map((state) => (
            <button key={state.uf} onClick={() => toggle(state.uf)} className={cn('flex items-center gap-2.5 w-full px-3 py-2 text-sm cursor-pointer transition-colors', selected.includes(state.uf) ? 'text-red bg-red/5' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]')}>
              <div className={cn('w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors', selected.includes(state.uf) ? 'bg-red border-red text-white' : 'border-border')}>{selected.includes(state.uf) && '✓'}</div>
              {state.name} <span className="text-text-muted text-xs">({state.uf})</span>
            </button>
          ))}
          <div className="border-t border-border my-2" />
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium px-3 pb-1.5">Demais estados</p>
          {others.map((state) => (
            <button key={state.uf} onClick={() => toggle(state.uf)} className={cn('flex items-center gap-2.5 w-full px-3 py-2 text-sm cursor-pointer transition-colors', selected.includes(state.uf) ? 'text-red bg-red/5' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]')}>
              <div className={cn('w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors', selected.includes(state.uf) ? 'bg-red border-red text-white' : 'border-border')}>{selected.includes(state.uf) && '✓'}</div>
              {state.name} <span className="text-text-muted text-xs">({state.uf})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Animated search progress ---
function SearchAnimation({ stepStatuses, elapsed }: { stepStatuses: Record<string, string>; elapsed: number }) {
  const [msgIndex, setMsgIndex] = useState(0)
  useEffect(() => { const i = setInterval(() => setMsgIndex((n) => (n + 1) % CURIOSITY_MESSAGES.length), 4000); return () => clearInterval(i) }, [])
  const doneCount = Object.values(stepStatuses).filter((s) => s === 'done' || s === 'skipped').length
  const pct = Math.round((doneCount / 7) * 100)

  return (
    <Card className="overflow-hidden">
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red via-warning to-red bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] opacity-20 pointer-events-none" style={{ margin: -1 }} />

      <div className="text-center py-6">
        {/* Spinning radar animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-2 rounded-full border border-border/50" />
          <div className="absolute inset-4 rounded-full border border-border/30" />
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from ${elapsed * 30}deg, transparent 0deg, rgba(230,51,41,0.3) 60deg, transparent 120deg)` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold font-mono text-red">{pct}%</span>
          </div>
        </div>

        {/* Curiosity message */}
        <p className="text-sm font-medium text-text-primary animate-[fade-in_0.5s_ease-out] mb-1" key={msgIndex}>
          {CURIOSITY_MESSAGES[msgIndex]}
        </p>
        <p className="text-xs text-text-muted font-mono">{elapsed}s decorridos</p>
      </div>

      {/* Steps */}
      <div className="space-y-2 mt-4">
        {SEARCH_PHASES.map((phase) => {
          const status = stepStatuses[phase.key] || 'pending'
          return (
            <div key={phase.key} className={cn('flex items-center gap-3 p-3 rounded-xl transition-all duration-500', status === 'running' ? 'bg-red/5 border border-red/10' : status === 'done' ? 'bg-success/5' : 'opacity-40')}>
              {status === 'done' ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : status === 'running' ? <Loader2 className="h-4 w-4 text-red animate-spin shrink-0" /> : status === 'skipped' ? <CheckCircle className="h-4 w-4 text-text-muted shrink-0" /> : <div className="h-4 w-4 rounded-full border border-border shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', status === 'done' ? 'text-success' : status === 'running' ? 'text-red' : 'text-text-muted')}>{phase.label}</p>
                <p className="text-[10px] text-text-muted truncate">{phase.desc}</p>
              </div>
              {status === 'running' && <span className="text-[10px] text-red font-mono animate-pulse">processando</span>}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-red-dark via-red to-warning transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  )
}

// --- Result card ---
function ResultCard({ item, saved }: { item: any; saved: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-border hover:border-border-strong transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold text-text-primary">{item.companyName}</h4>
            {item.googleRating > 0 && <span className="flex items-center gap-0.5 text-xs text-warning"><Star className="h-3 w-3 fill-current" /> {item.googleRating}</span>}
            <Badge variant={item.digitalPresenceScore >= 6 ? 'success' : item.digitalPresenceScore >= 3 ? 'warning' : 'error'} size="sm">Presença: {item.digitalPresenceScore}/10</Badge>
          </div>
          <p className="text-xs text-text-muted mb-2">{item.category} · {item.address}</p>
          <div className="flex flex-wrap gap-1.5">
            {item.whatsapp ? <span className="text-[11px] text-whatsapp bg-whatsapp/10 px-2 py-0.5 rounded-md font-medium">WhatsApp: +{item.whatsapp}</span> : <span className="text-[11px] text-error/70 bg-error/8 px-2 py-0.5 rounded-md">WhatsApp decisor pendente</span>}
            {item.website && <span className="text-[11px] text-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md truncate max-w-[180px]">{item.website}</span>}
            {item.instagramFollowers && <span className="text-[11px] text-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md">IG: {item.instagramFollowers}</span>}
            {item.marketing?.facebookAdsCount > 0 && <span className="text-[11px] text-info bg-info/10 px-2 py-0.5 rounded-md">{item.marketing.facebookAdsCount} anúncios</span>}
            {item.reviewsCount > 0 && <span className="text-[11px] text-text-muted">{item.reviewsCount} avaliações</span>}
          </div>
          {item.marketingVulnerabilities?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.marketingVulnerabilities.slice(0, 3).map((v: any, i: number) => (
                <span key={i} className="text-[10px] text-error/80 bg-error/8 px-2 py-0.5 rounded-md">{v.titulo}</span>
              ))}
              {item.marketingVulnerabilities.length > 3 && <span className="text-[10px] text-text-muted">+{item.marketingVulnerabilities.length - 3}</span>}
            </div>
          )}
        </div>
        {saved ? (
          <span className="text-[10px] text-success font-medium bg-success/10 px-2 py-1 rounded-lg shrink-0">Salvo</span>
        ) : (
          <span className="text-[10px] text-text-muted animate-pulse shrink-0">Salvando...</span>
        )}
      </div>
    </div>
  )
}

// === MAIN PAGE ===
export function SearchPage() {
  const [segments, setSegments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [revenueMin, setRevenueMin] = useState('')
  const [revenueMax, setRevenueMax] = useState('')
  const [_importingId, setImportingId] = useState<string | null>(null)
  const [autoImported, setAutoImported] = useState(false)
  const [autoImportCount, setAutoImportCount] = useState(0)
  const [history, setHistory] = useState<SearchHistory[]>(loadHistory)

  const apify = useApifySearch()
  const createLead = useCreateLead()

  // Auto-import when search completes
  useEffect(() => {
    if (apify.phase === 'done' && apify.results.length > 0 && !autoImported) {
      setAutoImported(true)
      ;(async () => {
        let count = 0
        for (const item of apify.results) {
          try {
            await handleImportSingle(item)
            count++
            setAutoImportCount(count)
          } catch { /* skip failed */ }
        }
        toast.success(`${count} leads salvos automaticamente no pipeline`)
      })()
    }
  }, [apify.phase, apify.results.length, autoImported])

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'
  const selectClass = cn(inputClass, 'appearance-none cursor-pointer')
  const activeFilters = segments.length + states.length + (city ? 1 : 0) + keywords.length + (revenueMin ? 1 : 0) + (revenueMax ? 1 : 0)
  const isSearching = apify.phase !== 'idle' && apify.phase !== 'done' && apify.phase !== 'error'

  const handleSearch = () => {
    if (segments.length === 0 && keywords.length === 0) { toast.error('Selecione pelo menos um segmento ou palavra-chave'); return }
    const entry: SearchHistory = { id: Date.now().toString(), segments, states, city, keywords, revenueMin, revenueMax, date: new Date().toISOString() }
    saveToHistory(entry)
    setHistory(loadHistory())
    setAutoImported(false)
    setAutoImportCount(0)
    apify.search({ segments, states, city, keywords, revenueMin, revenueMax })
  }

  const loadFromHistory = (entry: SearchHistory) => {
    setSegments(entry.segments); setStates(entry.states); setCity(entry.city); setKeywords(entry.keywords); setRevenueMin(entry.revenueMin); setRevenueMax(entry.revenueMax)
  }

  const handleImportSingle = async (item: any) => {
    const spicedTotal = item.spicedTotal || 0
    const temp = spicedTotal >= 4 ? 'HOT' : spicedTotal >= 3 ? 'WARM' : 'COLD'
    await createLead.mutateAsync({
        companyName: item.companyName, segment: segments[0] || item.category || '', tier: 'Small', status: 'Novo',
        score: spicedTotal, temperature: temp,
        spicedS: item.spicedS || 0, spicedP: item.spicedP || 0, spicedI: item.spicedI || 0, spicedC: item.spicedC || 0, spicedD: item.spicedD || 0,
        website: item.website || '', address: item.address || '', city: item.city || city, state: item.state || states[0] || '',
        instagram: item.instagramUrl || '', linkedin: item.linkedinUrl || '', facebook: item.facebookUrl || '',
        businessSummary: `${item.category} · ${item.reviewsCount} avaliações (${item.googleRating}★) · Presença digital: ${item.digitalPresenceScore}/10 · ${item.marketing?.facebookAdsCount || 0} anúncios Meta`,
        marketContext: `${item.marketing?.googleInsight || ''} ${item.marketing?.facebookAdsInsight || ''} ${item.marketing?.seoInsight || ''}`.trim(),
        vulnerabilities: JSON.stringify(item.marketingVulnerabilities || []),
        competitiveAnalysis: JSON.stringify({ competitors: item.competitiveAnalysis || [] }),
        salesArguments: JSON.stringify(item.salesArguments || []),
        projectionData: JSON.stringify({ narrative: item.projectionNarrative || '', inactionCost: item.inactionCost || '' }),
        meetingPrep: JSON.stringify({ agenda: [], objecoes: [], checklist: item.meetingTalkingPoints || [] }),
        enrichmentStatus: 'pending',
      })
  }

  void setImportingId // available for future manual import

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold font-heading gradient-text">Pesquisa de leads</h1>
        <p className="text-xs text-text-muted mt-0.5">Encontre e analise empresas qualificadas com inteligência de marketing completa</p>
      </div>

      {/* Search form */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <CardTitle>Configurar pesquisa</CardTitle>
          {activeFilters > 0 && <span className="text-[11px] text-red font-medium bg-red/10 px-2.5 py-1 rounded-full">{activeFilters} filtro{activeFilters > 1 ? 's' : ''}</span>}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <TagInput label="Setor / Segmento" placeholder="Digite ou selecione segmentos..." tags={segments} setTags={setSegments} suggestions={RECOMMENDED_SEGMENTS} suggestionsLabel="Segmentos recomendados" />
          <StateMultiSelect selected={states} setSelected={setStates} />
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cidade</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo, Campinas, Curitiba" className={inputClass} />
          </div>
          <TagInput label="Palavras-chave" placeholder="Ex: implantes, ortodontia, clínica..." tags={keywords} setTags={setKeywords} suggestions={['implantes', 'ortodontia', 'harmonização', 'manipulação', 'planejados', 'pet shop', 'ecommerce', 'franquia', 'delivery', 'consultório']} suggestionsLabel="Sugestões" />
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento mínimo</label>
            <select value={revenueMin} onChange={(e) => setRevenueMin(e.target.value)} className={selectClass}>
              {REVENUE_OPTIONS.map((r) => <option key={'min-' + r.value} value={r.value}>{r.value ? r.label : 'Sem mínimo'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento máximo</label>
            <select value={revenueMax} onChange={(e) => setRevenueMax(e.target.value)} className={selectClass}>
              {REVENUE_OPTIONS.map((r) => <option key={'max-' + r.value} value={r.value}>{r.value ? r.label : 'Sem máximo'}</option>)}
            </select>
          </div>
        </div>

        {/* Active filters */}
        {activeFilters > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-text-muted mr-1">Filtros:</span>
            {segments.map((s) => <span key={s} className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">{s} <button onClick={() => setSegments(segments.filter((x) => x !== s))} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button></span>)}
            {states.map((s) => <span key={s} className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">{s} <button onClick={() => setStates(states.filter((x) => x !== s))} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button></span>)}
            {city && <span className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">{city} <button onClick={() => setCity('')} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button></span>}
            {keywords.map((k) => <span key={k} className="inline-flex items-center gap-1 bg-white/5 border border-border rounded-lg px-2 py-0.5 text-[11px] text-text-secondary">{k} <button onClick={() => setKeywords(keywords.filter((x) => x !== k))} className="cursor-pointer hover:text-red"><X className="h-2.5 w-2.5" /></button></span>)}
            <button onClick={() => { setSegments([]); setStates([]); setCity(''); setKeywords([]); setRevenueMin(''); setRevenueMax('') }} className="text-[11px] text-text-muted hover:text-red ml-2 cursor-pointer">Limpar</button>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button size="lg" icon={<Search className="h-4 w-4" />} onClick={handleSearch} loading={isSearching} disabled={isSearching}>
            Pesquisar leads
          </Button>
          {apify.phase === 'done' && <Button variant="ghost" size="sm" onClick={apify.reset}>Nova pesquisa</Button>}
        </div>
      </Card>

      {/* Search history */}
      {history.length > 0 && apify.phase === 'idle' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-text-muted" />
            <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium">Pesquisas recentes</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry)}
                className="flex-shrink-0 p-3 rounded-xl bg-white/[0.02] border border-border hover:border-border-strong transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  {entry.segments.map((s) => <span key={s} className="text-[10px] text-red bg-red/10 px-1.5 py-0.5 rounded">{s}</span>)}
                  {entry.states.map((s) => <span key={s} className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{s}</span>)}
                </div>
                <p className="text-[10px] text-text-muted">
                  {entry.city && `${entry.city} · `}{new Date(entry.date).toLocaleDateString('pt-BR')}
                  {entry.resultsCount && ` · ${entry.resultsCount} resultados`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Animated search progress */}
      {isSearching && <SearchAnimation stepStatuses={apify.stepStatuses} elapsed={apify.elapsed} />}

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
              <CardTitle>{apify.results.length} empresas analisadas</CardTitle>
              <Badge variant="success" size="sm">{apify.elapsed}s</Badge>
            </div>
            {autoImported ? (
              <Badge variant="success" size="sm">{autoImportCount} salvos no pipeline</Badge>
            ) : (
              <Badge variant="warning" size="sm">Salvando...</Badge>
            )}
          </div>
          <div className="space-y-2">
            {apify.results.map((item, i) => (
              <ResultCard key={i} item={item} saved={autoImportCount > i} />
            ))}
          </div>
        </Card>
      )}

      {apify.phase === 'done' && apify.results.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-muted">Nenhum resultado encontrado. Ajuste os filtros e tente novamente.</p>
        </Card>
      )}
    </div>
  )
}
