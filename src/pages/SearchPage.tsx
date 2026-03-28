import { Card, CardTitle } from '../components/ui/Card'
import { Search, X, ChevronDown, CheckCircle, Loader2, AlertCircle, History, UserPlus, Upload, Sparkles, Globe, Phone, Mail, MapPin, Hash, CircleDot, Shield, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/cn'
import { useN8nSearch } from '../hooks/useN8nSearch'
import { useLeadEnrichment } from '../hooks/useLeadEnrichment'
import { createLead, getLeads } from '../services/leadService'
import { createContact } from '../services/contactService'
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

const REVENUE_MIN_OPTIONS = [
  { value: '70000', label: 'R$ 70k' },
  { value: '100000', label: 'R$ 100k' },
  { value: '200000', label: 'R$ 200k' },
  { value: '500000', label: 'R$ 500k' },
  { value: '830000', label: 'R$ 830k' },
  { value: '1000000', label: 'R$ 1M' },
]

const REVENUE_MAX_OPTIONS = [
  { value: '200000', label: 'R$ 200k' },
  { value: '500000', label: 'R$ 500k' },
  { value: '830000', label: 'R$ 830k' },
  { value: '1000000', label: 'R$ 1M' },
  { value: '2000000', label: 'R$ 2M' },
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

// === MAIN PAGE ===
export function SearchPage() {
  const [segments, setSegments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [revenueMin, setRevenueMin] = useState('70000')
  const [revenueMax, setRevenueMax] = useState('2000000')
  const [history, setHistory] = useState<SearchHistory[]>(loadHistory)
  const [searchMode, setSearchMode] = useState<'mass' | 'specific'>('mass')

  // Specific lead fields
  const [specificName, setSpecificName] = useState('')
  const [specificCnpj, setSpecificCnpj] = useState('')
  const [specificPhone, setSpecificPhone] = useState('')
  const [specificEmail, setSpecificEmail] = useState('')
  const [specificWebsite, setSpecificWebsite] = useState('')
  const [specificInstagram, setSpecificInstagram] = useState('')
  const [specificLinkedin, setSpecificLinkedin] = useState('')
  const [specificFacebook, setSpecificFacebook] = useState('')
  const [specificSegment, setSpecificSegment] = useState('')
  const [specificCity, setSpecificCity] = useState('')
  const [specificState, setSpecificState] = useState('')
  const [specificAddress, setSpecificAddress] = useState('')
  const [specificRevenue, setSpecificRevenue] = useState('')
  const [specificContact, setSpecificContact] = useState('')
  const [specificContactRole, setSpecificContactRole] = useState('')
  const [isCreatingSpecific, setIsCreatingSpecific] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  const [dupOverride, setDupOverride] = useState(false)
  const [lastCreatedLead, setLastCreatedLead] = useState<{ id: string; data: Record<string, any> } | null>(null)

  const enrichmentProgressRef = useRef<HTMLDivElement>(null)

  const n8n = useN8nSearch()
  const enrichment = useLeadEnrichment()

  // --- Mask formatters ---
  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits.length ? `(${digits}` : ''
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  // --- Collapsible sections ---
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }, [])

  const sectionFilledCounts: Record<string, number> = {
    location: [specificCity, specificState, specificAddress].filter(Boolean).length,
    digital: [specificWebsite, specificInstagram, specificLinkedin, specificFacebook].filter(Boolean).length,
    metrics: [specificRevenue].filter(Boolean).length,
    contact: [specificContact, specificContactRole, specificPhone, specificEmail].filter(Boolean).length,
  }

  // --- Reset form ---
  const resetSpecificForm = () => {
    setSpecificName(''); setSpecificCnpj(''); setSpecificPhone(''); setSpecificEmail('')
    setSpecificWebsite(''); setSpecificInstagram(''); setSpecificLinkedin(''); setSpecificFacebook('')
    setSpecificSegment(''); setSpecificCity(''); setSpecificState(''); setSpecificAddress('')
    setSpecificRevenue(''); setSpecificContact(''); setSpecificContactRole('')
    enrichment.reset()
  }

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'
  const selectClass = cn(inputClass, 'appearance-none cursor-pointer')
  const activeFilters = segments.length + states.length + (city ? 1 : 0) + keywords.length + (revenueMin ? 1 : 0) + (revenueMax ? 1 : 0)
  const isSearching = n8n.phase !== 'idle' && n8n.phase !== 'done' && n8n.phase !== 'error'

  const handleSearch = () => {
    if (segments.length === 0 && keywords.length === 0) { toast.error('Selecione pelo menos um segmento ou palavra-chave'); return }
    const entry: SearchHistory = { id: Date.now().toString(), segments, states, city, keywords, revenueMin, revenueMax, date: new Date().toISOString() }
    saveToHistory(entry)
    setHistory(loadHistory())
    n8n.search({ segments, states, city, keywords, revenueMin, revenueMax })
  }

  const handleSpecificSearch = async () => {
    if (!specificName) { toast.error('Nome da empresa é obrigatório'); return }
    if (!specificCnpj || specificCnpj.replace(/\D/g, '').length !== 14) { toast.error('CNPJ válido é obrigatório para pesquisa'); return }
    setIsCreatingSpecific(true)
    try {
      // Format WhatsApp number
      let whatsapp = ''
      if (specificPhone) {
        const digits = specificPhone.replace(/\D/g, '').replace(/^0+/, '')
        whatsapp = digits.length >= 10 ? (digits.startsWith('55') ? digits : '55' + digits) : ''
      }

      // Estimate revenue
      const revenue = specificRevenue ? parseInt(specificRevenue) : undefined
      const tier = !revenue ? 'Nao qualificado' : revenue >= 830000 ? 'Medium=' : revenue >= 200000 ? 'Medium-' : revenue >= 100000 ? 'Small' : 'Micro+'

      // Build lead data with ALL fields
      const leadData: Record<string, any> = {
        companyName: specificName,
        cnpj: specificCnpj.replace(/\D/g, ''),
        segment: specificSegment || 'Varejo',
        tier,
        ...(revenue && { monthlyRevenue: revenue }),
        employees: revenue && revenue >= 120000 ? 8 : 5,
        yearsInMarket: revenue && revenue >= 120000 ? 7 : 5,
        status: 'Novo',
        score: 0,
        temperature: 'WARM',
        ...(specificWebsite && { website: specificWebsite }),
        ...(specificInstagram && { instagram: specificInstagram }),
        ...(specificLinkedin && { linkedin: specificLinkedin }),
        ...(specificFacebook && { facebook: specificFacebook }),
        ...(specificAddress && { address: specificAddress }),
        ...(specificCity && { city: specificCity }),
        ...(specificState && { state: specificState }),
        businessSummary: `${specificSegment || 'Varejo'} · Inserido manualmente${revenue ? ` · R$ ${Math.round(revenue / 1000)}k/mes` : ''}`,
        enrichmentStatus: 'pending',
      }

      // 1. Verificar duplicados por CNPJ (mais confiável) ou nome
      const cnpjClean = specificCnpj.replace(/\D/g, '')
      const existingByCnpj = await getLeads(`{cnpj} = "${cnpjClean}"`)
      if (existingByCnpj.length > 0 && !dupOverride) {
        setDupWarning(`Ja existe um lead com este CNPJ: "${existingByCnpj[0].companyName}". Clique novamente para criar mesmo assim.`)
        setDupOverride(true)
        setIsCreatingSpecific(false)
        return
      }
      if (!existingByCnpj.length) {
        const existingByName = await getLeads(`{companyName} = "${specificName.replace(/"/g, '\\"')}"`)
        if (existingByName.length > 0 && !dupOverride) {
          setDupWarning(`Ja existe um lead "${existingByName[0].companyName}". Clique novamente para criar mesmo assim.`)
          setDupOverride(true)
          setIsCreatingSpecific(false)
          return
        }
      }
      // Reset override for next use
      setDupOverride(false)
      setDupWarning(null)

      // 2. Save lead to Airtable
      const lead = await createLead(leadData as any)
      setLastCreatedLead({ id: lead.id, data: leadData })

      // 2. Save contact if we have decision maker data
      if (lead.id && specificContact && (whatsapp || specificEmail)) {
        await createContact({
          name: specificContact,
          role: specificContactRole || 'Decisor',
          contactType: 'decisor',
          whatsapp: whatsapp,
          email: specificEmail || '',
          leadId: lead.id,
        } as any)
      }

      toast.success(`${specificName} salvo! Iniciando enriquecimento...`)

      // 3. Trigger Apify enrichment pipeline (runs in background)
      enrichment.enrich(lead.id, leadData)

      // 4. Also trigger n8n for deep analysis (business intelligence)
      n8n.search({
        segments: specificSegment ? [specificSegment] : ['Varejo'],
        states: specificState ? [specificState] : [],
        city: specificCity || '',
        keywords: [specificName],
        revenueMin: specificRevenue || '70000',
        revenueMax: '2000000',
      })

      // Auto-scroll to enrichment progress
      setTimeout(() => {
        enrichmentProgressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar lead')
    } finally {
      setIsCreatingSpecific(false)
    }
  }

  const loadFromHistory = (entry: SearchHistory) => {
    setSegments(entry.segments); setStates(entry.states); setCity(entry.city); setKeywords(entry.keywords); setRevenueMin(entry.revenueMin); setRevenueMax(entry.revenueMax)
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Pesquisa de leads</h1>
          <p className="text-xs text-text-muted mt-0.5">Encontre e analise empresas com inteligência de marketing completa</p>
        </div>
        {/* Mode toggle */}
        <div className="flex rounded-xl p-0.5 bg-white/[0.03] border border-border">
          <button
            onClick={() => setSearchMode('mass')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer', searchMode === 'mass' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary')}
          >
            Em massa
          </button>
          <button
            onClick={() => setSearchMode('specific')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer', searchMode === 'specific' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary')}
          >
            Lead específico
          </button>
        </div>
      </div>

      {/* Specific lead form */}
      {searchMode === 'specific' && (
        <Card>
          {/* ===== HERO SECTION ===== */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-red/10 border border-red/20">
              <UserPlus className="h-5 w-5 text-red" />
            </div>
            <div>
              <CardTitle>Cadastrar lead</CardTitle>
              <p className="text-xs text-text-muted mt-0.5">Preencha nome e CNPJ. O resto a IA busca em 10 fontes.</p>
            </div>
          </div>

          <div className="space-y-4 mt-5">
            {/* Name field — large, prominent */}
            <div>
              <label htmlFor="specific-name" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome da empresa *</label>
              <input id="specific-name" type="text" value={specificName} onChange={(e) => setSpecificName(e.target.value)} placeholder="Ex: Clinica Odonto Premium" className={cn(inputClass, 'h-12 bg-white/[0.05] border-red/30 text-base')} />
            </div>

            {/* CNPJ field — large, prominent */}
            <div>
              <label htmlFor="specific-cnpj" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> CNPJ *
              </label>
              <input id="specific-cnpj" type="text" value={specificCnpj} onChange={(e) => setSpecificCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className={cn(inputClass, 'h-12 bg-white/[0.05] border-red/30 text-base font-mono')} />
            </div>

            {/* Dynamic enrichment preview pills */}
            {specificName && specificCnpj.replace(/\D/g, '').length >= 2 && (
              <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="h-3 w-3" /> Com nome + CNPJ buscamos automaticamente:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Razao social', 'Socios', 'Endereco', 'Porte', 'Capital social', 'Regime tributario', 'CNAE', 'Geolocalizacao', 'Google Maps', 'Website', 'Redes sociais', 'Instagram', 'LinkedIn', 'Decisores', 'Emails', 'Telefones'].map((pill) => (
                    <span key={pill} className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-2 py-0.5">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400/60" />
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Segment field (optional, standalone) */}
            <div>
              <label htmlFor="specific-segment" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Segmento <span className="text-text-muted font-normal">(opcional)</span></label>
              <input id="specific-segment" type="text" value={specificSegment} onChange={(e) => setSpecificSegment(e.target.value)} placeholder="Ex: Odontologia, Pet Shop, Estetica" className={inputClass} list="segments-list" />
              <datalist id="segments-list">
                {RECOMMENDED_SEGMENTS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* ===== COLLAPSIBLE SECTIONS ===== */}
          <div className="space-y-3 mt-6">
            {/* Section: Location */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('location')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <MapPin className="h-3.5 w-3.5 text-red" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">Localizacao</p>
                {sectionFilledCounts.location > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.location}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('location') && 'rotate-180')} />
              </button>
              {!expandedSections.has('location') && sectionFilledCounts.location === 0 && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">Opcional — a IA busca esses dados automaticamente</p>
              )}
              <div className={cn('grid md:grid-cols-3 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('location') ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div>
                  <label htmlFor="specific-city" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cidade</label>
                  <input id="specific-city" type="text" value={specificCity} onChange={(e) => setSpecificCity(e.target.value)} placeholder="Ex: Sao Paulo" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-state" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Estado</label>
                  <select id="specific-state" value={specificState} onChange={(e) => setSpecificState(e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {ALL_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="specific-address" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Endereco</label>
                  <input id="specific-address" type="text" value={specificAddress} onChange={(e) => setSpecificAddress(e.target.value)} placeholder="Ex: Av. Paulista, 1000" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Section: Digital Presence */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('digital')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <Globe className="h-3.5 w-3.5 text-red" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">Presenca digital</p>
                {sectionFilledCounts.digital > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.digital}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('digital') && 'rotate-180')} />
              </button>
              {!expandedSections.has('digital') && sectionFilledCounts.digital === 0 && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">Opcional — a IA busca esses dados automaticamente</p>
              )}
              <div className={cn('px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('digital') ? 'max-h-[800px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="specific-website" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> Website
                    </label>
                    <input id="specific-website" type="url" value={specificWebsite} onChange={(e) => setSpecificWebsite(e.target.value)} placeholder="https://empresa.com.br" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="specific-instagram" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Instagram</label>
                    <input id="specific-instagram" type="text" value={specificInstagram} onChange={(e) => setSpecificInstagram(e.target.value)} placeholder="@empresa" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="specific-linkedin" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">LinkedIn</label>
                    <input id="specific-linkedin" type="url" value={specificLinkedin} onChange={(e) => setSpecificLinkedin(e.target.value)} placeholder="https://linkedin.com/company/empresa" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="specific-facebook" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Facebook</label>
                    <input id="specific-facebook" type="url" value={specificFacebook} onChange={(e) => setSpecificFacebook(e.target.value)} placeholder="https://facebook.com/empresa" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Business Metrics */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('metrics')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <CircleDot className="h-3.5 w-3.5 text-red" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">Metricas do negocio</p>
                {sectionFilledCounts.metrics > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.metrics}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('metrics') && 'rotate-180')} />
              </button>
              {!expandedSections.has('metrics') && sectionFilledCounts.metrics === 0 && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">Opcional — a IA busca esses dados automaticamente</p>
              )}
              <div className={cn('grid md:grid-cols-2 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('metrics') ? 'max-h-[300px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div>
                  <label htmlFor="specific-revenue" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento mensal estimado</label>
                  <select id="specific-revenue" value={specificRevenue} onChange={(e) => setSpecificRevenue(e.target.value)} className={selectClass}>
                    <option value="">Nao informado</option>
                    <option value="50000">R$ 50k</option>
                    <option value="70000">R$ 70k</option>
                    <option value="100000">R$ 100k</option>
                    <option value="200000">R$ 200k</option>
                    <option value="500000">R$ 500k</option>
                    <option value="830000">R$ 830k</option>
                    <option value="1000000">R$ 1M</option>
                    <option value="2000000">R$ 2M+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Decision Maker Contact */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('contact')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <Phone className="h-3.5 w-3.5 text-red" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-text-secondary font-semibold">Contato do decisor</p>
                {sectionFilledCounts.contact > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.contact}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('contact') && 'rotate-180')} />
              </button>
              {!expandedSections.has('contact') && sectionFilledCounts.contact === 0 && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">Opcional — a IA busca esses dados automaticamente</p>
              )}
              <div className={cn('grid md:grid-cols-2 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('contact') ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div>
                  <label htmlFor="specific-contact" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome do decisor</label>
                  <input id="specific-contact" type="text" value={specificContact} onChange={(e) => setSpecificContact(e.target.value)} placeholder="Ex: Dr. Joao Silva" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-contact-role" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cargo</label>
                  <input id="specific-contact-role" type="text" value={specificContactRole} onChange={(e) => setSpecificContactRole(e.target.value)} placeholder="Ex: CEO, Proprietario, Socio" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-phone" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> WhatsApp do decisor
                  </label>
                  <input id="specific-phone" type="tel" value={specificPhone} onChange={(e) => setSpecificPhone(formatPhone(e.target.value))} placeholder="(11) 99999-8888" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-email" className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> E-mail
                  </label>
                  <input id="specific-email" type="email" value={specificEmail} onChange={(e) => setSpecificEmail(e.target.value)} placeholder="joao@empresa.com" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* ===== CTA SECTION ===== */}
          <div className="mt-6">
            {dupWarning && (
              <div className="mb-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-amber-300 font-medium">{dupWarning}</p>
                  <button onClick={() => { setDupWarning(null); setDupOverride(false) }} className="text-[11px] text-text-muted hover:text-text-secondary mt-1 cursor-pointer">Cancelar</button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button size="lg" icon={<Upload className="h-4 w-4" />} onClick={handleSpecificSearch} loading={isCreatingSpecific} disabled={!specificName || !specificCnpj || specificCnpj.replace(/\D/g, '').length !== 14 || isCreatingSpecific || enrichment.isEnriching}>
                Salvar e enriquecer com IA
              </Button>
              {enrichment.isEnriching && <span className="text-[11px] text-amber-400 animate-pulse">Enriquecendo...</span>}
            </div>
            {/* CNPJ validation indicator */}
            <div className="mt-2">
              {specificCnpj && specificCnpj.replace(/\D/g, '').length < 14 && (
                <p className="text-[11px] text-text-muted">CNPJ incompleto ({specificCnpj.replace(/\D/g, '').length}/14 digitos)</p>
              )}
              {specificCnpj && specificCnpj.replace(/\D/g, '').length === 14 && (
                <p className="text-[11px] text-success flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> CNPJ valido — pronto para pesquisa
                </p>
              )}
            </div>
          </div>

          {/* ===== ENRICHMENT PROGRESS — TWO-PHASE VISUAL ===== */}
          {enrichment.progress && enrichment.progress.steps.length > 0 && (
            <div ref={enrichmentProgressRef} className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-border">
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-red to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(enrichment.progress.currentStep / enrichment.progress.totalSteps) * 100}%` }}
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[11px] uppercase tracking-[0.12em] text-amber-300 font-semibold">
                  Enriquecimento {enrichment.progress.isDone ? 'concluido' : 'em andamento'}
                </p>
                <span className="text-[10px] text-text-muted ml-auto font-mono">
                  {enrichment.progress.currentStep}/{enrichment.progress.totalSteps}
                </span>
              </div>

              {/* FASE 1: APIs Publicas */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-3 w-3 text-text-muted" />
                  <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">Fase 1: APIs Publicas (gratuitas)</p>
                </div>
                <div className="space-y-1 pl-1">
                  {enrichment.progress.steps.slice(0, 4).map((step) => (
                    <div key={step.source} className="flex items-center gap-2 text-[11px]">
                      {step.status === 'running' && <Loader2 className="h-3 w-3 text-amber-400 animate-spin shrink-0" />}
                      {step.status === 'done' && <CheckCircle className="h-3 w-3 text-success shrink-0" />}
                      {step.status === 'error' && <AlertCircle className="h-3 w-3 text-error shrink-0" />}
                      {step.status === 'skipped' && <X className="h-3 w-3 text-text-muted shrink-0" />}
                      {step.status === 'pending' && <div className="h-3 w-3 rounded-full border border-border shrink-0" />}
                      <span className={cn(
                        step.status === 'running' && 'text-amber-300',
                        step.status === 'done' && 'text-text-primary',
                        step.status === 'error' && 'text-error',
                        step.status === 'skipped' && 'text-text-muted line-through',
                        step.status === 'pending' && 'text-text-muted',
                      )}>
                        {step.label}
                      </span>
                      {(step.status === 'pending' || step.status === 'running') && step.estimatedMs && (
                        <span className="text-[9px] text-text-muted ml-auto">~{Math.round(step.estimatedMs / 1000)}s</span>
                      )}
                      {step.status === 'done' && step.detail && (
                        <span className="text-[9px] text-amber-300/70 bg-amber-400/5 border border-amber-400/10 rounded px-1.5 py-0.5 ml-auto">{step.detail}</span>
                      )}
                      {step.status === 'skipped' && <span className="text-[9px] text-text-muted">(sem dados)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-3" />

              {/* FASE 2: Inteligencia de Mercado */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3 w-3 text-text-muted" />
                  <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">Fase 2: Inteligencia de Mercado (APIs externas)</p>
                </div>
                <div className="space-y-1 pl-1">
                  {enrichment.progress.steps.slice(4).map((step) => (
                    <div key={step.source} className="flex items-center gap-2 text-[11px]">
                      {step.status === 'running' && <Loader2 className="h-3 w-3 text-amber-400 animate-spin shrink-0" />}
                      {step.status === 'done' && <CheckCircle className="h-3 w-3 text-success shrink-0" />}
                      {step.status === 'error' && <AlertCircle className="h-3 w-3 text-error shrink-0" />}
                      {step.status === 'skipped' && <X className="h-3 w-3 text-text-muted shrink-0" />}
                      {step.status === 'pending' && <div className="h-3 w-3 rounded-full border border-border shrink-0" />}
                      <span className={cn(
                        step.status === 'running' && 'text-amber-300',
                        step.status === 'done' && 'text-text-primary',
                        step.status === 'error' && 'text-error',
                        step.status === 'skipped' && 'text-text-muted line-through',
                        step.status === 'pending' && 'text-text-muted',
                      )}>
                        {step.label}
                      </span>
                      {(step.status === 'pending' || step.status === 'running') && step.estimatedMs && (
                        <span className="text-[9px] text-text-muted ml-auto">~{Math.round(step.estimatedMs / 1000)}s</span>
                      )}
                      {step.status === 'done' && step.detail && (
                        <span className="text-[9px] text-amber-300/70 bg-amber-400/5 border border-amber-400/10 rounded px-1.5 py-0.5 ml-auto">{step.detail}</span>
                      )}
                      {step.status === 'skipped' && <span className="text-[9px] text-text-muted">(sem dados)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== COMPLETION STATE ===== */}
              {enrichment.progress.isDone && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-[12px] text-success font-semibold">Lead enriquecido com sucesso!</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-text-secondary">
                      <p>Dados encontrados: <strong className="text-text-primary">{enrichment.progress.steps.filter(s => s.status === 'done').length} de {enrichment.progress.totalSteps} fontes</strong></p>
                      <p>Contatos descobertos: <strong className="text-text-primary">{enrichment.progress.steps.filter(s => s.status === 'done' && s.detail?.toLowerCase().includes('contato')).length > 0 ? 'Sim' : 'Verificar no lead'}</strong></p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="ghost" size="sm" onClick={resetSpecificForm}>
                        Novo lead
                      </Button>
                      {lastCreatedLead && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          enrichment.reset()
                          enrichment.enrich(lastCreatedLead.id, lastCreatedLead.data)
                          setTimeout(() => enrichmentProgressRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
                        }}>
                          Re-enriquecer
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { enrichment.reset(); window.location.hash = '#/leads' }}>
                        Ver lead completo <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Mass search form */}
      {searchMode === 'mass' && (<>
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
              {REVENUE_MIN_OPTIONS.map((r) => <option key={'min-' + r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento máximo</label>
            <select value={revenueMax} onChange={(e) => setRevenueMax(e.target.value)} className={selectClass}>
              {REVENUE_MAX_OPTIONS.map((r) => <option key={'max-' + r.value} value={r.value}>{r.label}</option>)}
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
          {n8n.phase === 'done' && <Button variant="ghost" size="sm" onClick={n8n.reset}>Nova pesquisa</Button>}
        </div>
      </Card>

      {/* Search history */}
      {history.length > 0 && n8n.phase === 'idle' && (
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
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
      </>)}

      {/* Processing animation */}
      {isSearching && (
        <Card className="py-12 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from ${n8n.elapsed * 30}deg, transparent 0deg, rgba(230,51,41,0.3) 60deg, transparent 120deg)` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-red animate-spin" />
            </div>
          </div>
          <p className="text-sm font-medium text-text-primary animate-[fade-in_0.5s_ease-out]" key={Math.floor(n8n.elapsed / 4)}>
            {CURIOSITY_MESSAGES[Math.floor(n8n.elapsed / 4) % CURIOSITY_MESSAGES.length]}
          </p>
          <p className="text-xs text-text-muted font-mono mt-2">{n8n.elapsed}s</p>
          <p className="text-[11px] text-text-muted mt-4">A pesquisa roda em background. Os leads serão salvos automaticamente.</p>
        </Card>
      )}

      {/* Error */}
      {n8n.phase === 'error' && (
        <Card className="p-4">
          <div className="flex items-center gap-3 text-error">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Erro na pesquisa</p>
              <p className="text-xs text-text-muted">{n8n.error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={n8n.reset} className="ml-auto">Tentar novamente</Button>
          </div>
        </Card>
      )}

      {/* Success */}
      {n8n.phase === 'done' && n8n.leadsCreated > 0 && (
        <Card className="p-8 text-center animate-[slide-up_0.4s_ease-out]">
          <div className="p-4 rounded-2xl bg-success/10 inline-flex mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">{n8n.leadsCreated} leads encontrados e salvos!</h3>
          <p className="text-sm text-text-muted mt-1">Pesquisa concluída em {n8n.elapsed}s. Leads com WhatsApp e dentro da faixa de faturamento.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="ghost" onClick={n8n.reset}>Nova pesquisa</Button>
            <Button onClick={() => window.location.hash = '#/leads'}>Ver leads</Button>
          </div>
        </Card>
      )}

      {n8n.phase === 'done' && n8n.leadsCreated === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-muted">Nenhum lead qualificado encontrado. Tente ajustar segmento, cidade ou faixa de faturamento.</p>
          <Button variant="ghost" onClick={n8n.reset} className="mt-4">Tentar novamente</Button>
        </Card>
      )}
    </div>
  )
}
