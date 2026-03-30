import { Card, CardTitle } from '../components/ui/Card'
import { Search, X, ChevronDown, CheckCircle, Loader2, AlertCircle, History, UserPlus, Sparkles, Globe, Phone, Mail, MapPin, Hash, CircleDot, Shield, ArrowRight, Upload, FileUp, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/cn'
import { useN8nSearch } from '../hooks/useN8nSearch'
import { useLeadEnrichment } from '../hooks/useLeadEnrichment'
import { useMassEnrichment, loadPendingQueue, clearPendingQueue } from '../hooks/useMassEnrichment'
import { createLead, getLeads } from '../services/leadService'
import { createContact } from '../services/contactService'
import { toast } from 'sonner'
import { parseFile, ACCEPTED_FORMATS, type ParseResult } from '../lib/file-parser'

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
      <label className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">{label}</label>
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
      <label className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Estado / Região</label>
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

  // File upload states
  const [fileParseResult, setFileParseResult] = useState<ParseResult | null>(null)
  const [fileSelected, setFileSelected] = useState<Set<number>>(new Set())
  const [fileReadingStep, setFileReadingStep] = useState<'idle' | 'reading' | 'preview'>('idle')
  const [fileDragging, setFileDragging] = useState(false)
  const [fileImporting, setFileImporting] = useState(false)
  const [fileImportProgress, setFileImportProgress] = useState(0)
  const fileInputRef2 = useRef<HTMLInputElement>(null)
  const MAX_FILE_LEADS = 15

  const enrichmentProgressRef = useRef<HTMLDivElement>(null)

  const n8n = useN8nSearch()
  const enrichment = useLeadEnrichment()
  const massEnrichment = useMassEnrichment()
  const massEnrichmentRef = useRef<HTMLDivElement>(null)

  // Auto-trigger mass enrichment when n8n finds new leads (with dedup)
  useEffect(() => {
    if (n8n.phase === 'done' && n8n.leads.length > 0 && !massEnrichment.isRunning && massEnrichment.totalLeads === 0) {
      // Filter out leads already enriched (dedup)
      const leadsToEnrich = n8n.leads.filter((l) => l.enrichmentStatus !== 'complete')
      const skipped = n8n.leads.length - leadsToEnrich.length

      if (leadsToEnrich.length > 0) {
        toast.success(`${leadsToEnrich.length} leads para enriquecer${skipped > 0 ? ` (${skipped} ja completos)` : ''}`)
        massEnrichment.enrichAll(leadsToEnrich)
        setTimeout(() => massEnrichmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500)
      } else {
        toast.info('Todos os leads ja estao enriquecidos!')
      }
    }
  }, [n8n.phase, n8n.leads, n8n.leadsCreated, massEnrichment.isRunning, massEnrichment.totalLeads, massEnrichment.enrichAll])

  // Check for pending enrichment queue on mount (resume after refresh)
  const [pendingResume, setPendingResume] = useState<Array<{ leadId: string; companyName: string }> | null>(null)
  useEffect(() => {
    const pending = loadPendingQueue()
    if (pending && !massEnrichment.isRunning) {
      setPendingResume(pending)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // --- File upload handlers ---
  const handleFileUpload = useCallback(async (file: File) => {
    setFileReadingStep('reading')
    try {
      const result = await parseFile(file)
      if (result.companies.length === 0) {
        toast.error('Nenhuma empresa encontrada no arquivo. Verifique o formato.')
        setFileReadingStep('idle')
        return
      }
      if (result.companies.length > MAX_FILE_LEADS) {
        result.companies = result.companies.slice(0, MAX_FILE_LEADS)
        toast.info(`Limitado a ${MAX_FILE_LEADS} leads por vez. ${result.totalRows - MAX_FILE_LEADS} foram ignorados.`)
      }
      setFileParseResult(result)
      setFileSelected(new Set(result.companies.map((_, i) => i)))
      setTimeout(() => setFileReadingStep('preview'), 1500)
    } catch {
      toast.error('Erro ao processar arquivo')
      setFileReadingStep('idle')
    }
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setFileDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const resetFileUpload = () => {
    setFileParseResult(null)
    setFileSelected(new Set())
    setFileReadingStep('idle')
    setFileImporting(false)
    setFileImportProgress(0)
  }

  const handleFileImportAndEnrich = async () => {
    if (!fileParseResult || fileSelected.size === 0) return
    setFileImporting(true)
    setFileImportProgress(0)
    const companies = fileParseResult.companies.filter((_, i) => fileSelected.has(i))
    let done = 0
    const createdLeads: Array<{ id: string; data: Record<string, any> }> = []

    for (const company of companies) {
      try {
        const leadData: Record<string, any> = {
          companyName: company.companyName,
          cnpj: company.cnpj?.replace(/\D/g, '') || '',
          segment: company.segment || specificSegment || '',
          tier: 'Small',
          status: 'Novo',
          score: 0,
          temperature: 'Morno',
          ...(company.website && { website: company.website }),
          ...(company.instagram && { instagram: company.instagram }),
          ...(company.linkedin && { linkedin: company.linkedin }),
          ...(company.address && { address: company.address }),
          ...(company.city && { city: company.city }),
          ...(company.state && { state: company.state }),
          businessSummary: `${company.segment || 'Importado'} · Upload manual`,
          enrichmentStatus: 'pending',
          sourceHtmlReport: 'upload_manual',
        }

        const lead = await createLead(leadData as any)
        createdLeads.push({ id: lead.id, data: leadData })

        // Save contact if available
        if (lead.id && company.contactName && (company.phone || company.email)) {
          await createContact({
            name: company.contactName,
            role: company.contactRole || 'Contato',
            contactType: 'decisor',
            whatsapp: company.phone || '',
            email: company.email || '',
            leadId: lead.id,
          } as any)
        }
      } catch { /* continue with next */ }
      done++
      setFileImportProgress(Math.round((done / companies.length) * 100))
    }

    toast.success(`${createdLeads.length} leads importados! Iniciando enriquecimento...`)

    // Trigger mass enrichment for all created leads
    if (createdLeads.length > 0) {
      massEnrichment.enrichAll(createdLeads.map(l => ({ id: l.id, companyName: (l.data as any).companyName } as any)))
      setTimeout(() => massEnrichmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500)
    }

    setFileImporting(false)
    resetFileUpload()
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
    if (specificCnpj && specificCnpj.replace(/\D/g, '').length !== 14) { toast.error('CNPJ incompleto — preencha todos os 14 digitos ou deixe em branco'); return }
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
      const tier = !revenue ? 'Small' : revenue >= 830000 ? 'Medium=' : revenue >= 200000 ? 'Medium-' : revenue >= 100000 ? 'Small' : 'Micro+'

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
        temperature: 'Morno',
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
      if (cnpjClean) {
        const existingByCnpj = await getLeads(`{cnpj} = "${cnpjClean}"`)
        if (existingByCnpj.length > 0 && !dupOverride) {
          setDupWarning(`Ja existe um lead com este CNPJ: "${existingByCnpj[0].companyName}". Clique novamente para criar mesmo assim.`)
          setDupOverride(true)
          setIsCreatingSpecific(false)
          return
        }
      }
      {
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

      // 2. Save lead to Airtable (safe fields only — no Single Select risk)
      let lead: any
      try {
        lead = await createLead(leadData as any)
      } catch (saveErr: any) {
        // If full save fails, retry with minimal fields (name + cnpj only)
        const minimalData = {
          companyName: specificName,
          cnpj: specificCnpj.replace(/\D/g, ''),
          score: 0,
        }
        lead = await createLead(minimalData as any)
        toast.warning('Salvo com dados basicos — enriquecimento completara os demais campos')
      }
      setLastCreatedLead({ id: lead.id, data: leadData })

      // 3. Save contact if we have decision maker data (non-blocking)
      if (lead.id && specificContact && (whatsapp || specificEmail)) {
        createContact({
          name: specificContact,
          role: specificContactRole || 'Decisor',
          contactType: 'decisor',
          whatsapp: whatsapp,
          email: specificEmail || '',
          leadId: lead.id,
        } as any).catch(() => {})
      }

      toast.success(`${specificName} salvo! Iniciando enriquecimento...`)

      // 4. Trigger enrichment pipeline (runs in background, non-blocking)
      enrichment.enrich(lead.id, leadData)

      // 5. Trigger n8n for deep analysis (non-blocking, complementa o enriquecimento)
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
        <div className="flex rounded-xl p-1 bg-white/[0.03] border border-border gap-1">
          <button
            onClick={() => setSearchMode('mass')}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer', searchMode === 'mass' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]')}
          >
            <Search className="h-3.5 w-3.5" />
            <div className="text-left">
              <span className="block leading-tight">Em massa</span>
              <span className={cn('block text-[10px] font-normal leading-tight', searchMode === 'mass' ? 'text-white/70' : 'text-text-muted')}>Multiplos leads</span>
            </div>
          </button>
          <button
            onClick={() => setSearchMode('specific')}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer', searchMode === 'specific' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]')}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <div className="text-left">
              <span className="block leading-tight">Lead especifico</span>
              <span className={cn('block text-[10px] font-normal leading-tight', searchMode === 'specific' ? 'text-white/70' : 'text-text-muted')}>Cadastro manual</span>
            </div>
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
              <label htmlFor="specific-name" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome da empresa *</label>
              <input id="specific-name" type="text" value={specificName} onChange={(e) => setSpecificName(e.target.value)} placeholder="Ex: Clinica Odonto Premium" className={cn(inputClass, 'h-12 bg-white/[0.05] border-red/30 text-base')} />
            </div>

            {/* CNPJ field — optional when file is uploaded */}
            <div>
              <label htmlFor="specific-cnpj" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> CNPJ {fileReadingStep !== 'preview' ? '*' : <span className="text-text-muted font-normal">(opcional com arquivo)</span>}
              </label>
              <input id="specific-cnpj" type="text" value={specificCnpj} onChange={(e) => setSpecificCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className={cn(inputClass, 'h-12 bg-white/[0.05] border-red/30 text-base font-mono')} />
            </div>

            {/* Dynamic enrichment preview pills */}
            {specificName && (specificCnpj.replace(/\D/g, '').length >= 2 || specificName.length >= 3) && (
              <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="h-3 w-3" /> {specificCnpj ? 'Com nome + CNPJ buscamos automaticamente:' : 'Com o nome buscamos automaticamente:'}
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
              <label htmlFor="specific-segment" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Segmento <span className="text-text-muted font-normal">(opcional)</span></label>
              <input id="specific-segment" type="text" value={specificSegment} onChange={(e) => setSpecificSegment(e.target.value)} placeholder="Ex: Odontologia, Pet Shop, Estetica" className={inputClass} list="segments-list" />
              <datalist id="segments-list">
                {RECOMMENDED_SEGMENTS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* ===== FILE UPLOAD ZONE ===== */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium px-2">ou importe uma lista</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {fileReadingStep === 'idle' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setFileDragging(true) }}
                onDragLeave={() => setFileDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef2.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
                  fileDragging
                    ? 'border-red bg-red/5 scale-[1.01]'
                    : 'border-border/60 hover:border-red/30 hover:bg-white/[0.02]',
                )}
              >
                <Upload className={cn('h-6 w-6 mb-2 transition-colors', fileDragging ? 'text-red' : 'text-text-muted')} />
                <p className="text-sm font-medium text-text-primary">
                  {fileDragging ? 'Solte o arquivo aqui' : 'Enviar documento'}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  CSV, Excel, PDF, TXT, MD — ate {MAX_FILE_LEADS} leads por vez
                </p>
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                />
              </div>
            )}

            {/* Reading animation */}
            {fileReadingStep === 'reading' && (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-border text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-red/10 animate-pulse">
                    <FileUp className="h-5 w-5 text-red" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{fileParseResult?.fileName || 'Processando...'}</p>
                    <p className="text-[11px] text-amber-300 animate-pulse">Analisando estrutura e identificando leads...</p>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red to-amber-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {/* Preview parsed leads */}
            {fileReadingStep === 'preview' && fileParseResult && (
              <div className="rounded-2xl bg-white/[0.02] border border-border overflow-hidden animate-[fade-in_0.3s_ease-out]">
                {/* File info header */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{fileParseResult.fileName}</p>
                    <p className="text-[11px] text-success">
                      {fileParseResult.fileType} · {fileParseResult.companies.length} leads identificados
                    </p>
                  </div>
                  <button onClick={resetFileUpload} className="p-2 rounded-xl hover:bg-white/[0.04] text-text-muted hover:text-error transition-colors cursor-pointer" title="Remover arquivo">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Detected fields badges */}
                <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                  {['companyName', 'cnpj', 'phone', 'email', 'website', 'city', 'segment', 'contactName'].map((key) => {
                    const found = fileParseResult.companies.some((c: any) => c[key])
                    const labels: Record<string, string> = { companyName: 'Empresa', cnpj: 'CNPJ', phone: 'Telefone', email: 'E-mail', website: 'Website', city: 'Cidade', segment: 'Segmento', contactName: 'Contato' }
                    return (
                      <span key={key} className={cn(
                        'text-[10px] px-2 py-0.5 rounded-lg border',
                        found ? 'text-success bg-success/8 border-success/15 font-medium' : 'text-text-muted bg-white/[0.02] border-border/50 opacity-40',
                      )}>
                        {found ? '✓' : '·'} {labels[key]}
                      </span>
                    )
                  })}
                </div>

                {/* Lead list with checkboxes */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-text-muted">{fileSelected.size} de {fileParseResult.companies.length} selecionados</span>
                    <div className="flex gap-2">
                      <button onClick={() => setFileSelected(new Set(fileParseResult.companies.map((_, i) => i)))} className="text-[11px] text-red cursor-pointer hover:underline">Todos</button>
                      <button onClick={() => setFileSelected(new Set())} className="text-[11px] text-text-muted cursor-pointer hover:underline">Nenhum</button>
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-xl">
                    {fileParseResult.companies.map((company, i) => (
                      <label
                        key={i}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200',
                          fileSelected.has(i) ? 'bg-red/5 border border-red/15' : 'hover:bg-white/[0.02] border border-transparent',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={fileSelected.has(i)}
                          onChange={() => { const next = new Set(fileSelected); next.has(i) ? next.delete(i) : next.add(i); setFileSelected(next) }}
                          className="accent-red w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-text-primary truncate">{company.companyName}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {company.cnpj && <span className="text-[9px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded font-mono">{company.cnpj}</span>}
                            {company.phone && <span className="text-[9px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.phone}</span>}
                            {company.email && <span className="text-[9px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[120px]">{company.email}</span>}
                            {company.city && <span className="text-[9px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.city}</span>}
                            {company.segment && <span className="text-[9px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.segment}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Import CTA */}
                <div className="px-4 pb-4">
                  {fileImporting ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 text-red animate-spin" />
                        <span className="text-text-primary font-medium">Importando e enriquecendo...</span>
                        <span className="text-[11px] text-text-muted ml-auto font-mono">{fileImportProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-dark to-red transition-all duration-300" style={{ width: `${fileImportProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      icon={<Sparkles className="h-4 w-4" />}
                      onClick={handleFileImportAndEnrich}
                      disabled={fileSelected.size === 0}
                    >
                      Salvar {fileSelected.size} lead{fileSelected.size !== 1 ? 's' : ''} e enriquecer com IA
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== COLLAPSIBLE SECTIONS ===== */}
          <div className="space-y-3 mt-6">
            {/* Section: Location */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('location')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <MapPin className="h-3.5 w-3.5 text-red" />
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Localizacao</p>
                {sectionFilledCounts.location > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.location}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('location') && 'rotate-180')} />
              </button>
              {!expandedSections.has('location') && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">
                  {sectionFilledCounts.location > 0
                    ? [specificCity, specificState, specificAddress].filter(Boolean).join(' · ')
                    : 'Opcional — a IA busca esses dados automaticamente'}
                </p>
              )}
              <div className={cn('grid md:grid-cols-3 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('location') ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div>
                  <label htmlFor="specific-city" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cidade</label>
                  <input id="specific-city" type="text" value={specificCity} onChange={(e) => setSpecificCity(e.target.value)} placeholder="Ex: Sao Paulo" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-state" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Estado</label>
                  <select id="specific-state" value={specificState} onChange={(e) => setSpecificState(e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {ALL_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="specific-address" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Endereco</label>
                  <input id="specific-address" type="text" value={specificAddress} onChange={(e) => setSpecificAddress(e.target.value)} placeholder="Ex: Av. Paulista, 1000" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Section: Digital Presence */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('digital')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <Globe className="h-3.5 w-3.5 text-red" />
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Presenca digital</p>
                {sectionFilledCounts.digital > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.digital}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('digital') && 'rotate-180')} />
              </button>
              {!expandedSections.has('digital') && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">
                  {sectionFilledCounts.digital > 0
                    ? [specificWebsite, specificInstagram, specificLinkedin, specificFacebook].filter(Boolean).join(' · ')
                    : 'Opcional — a IA busca esses dados automaticamente'}
                </p>
              )}
              <div className={cn('px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('digital') ? 'max-h-[800px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="specific-website" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> Website
                    </label>
                    <input id="specific-website" type="url" value={specificWebsite} onChange={(e) => setSpecificWebsite(e.target.value)} placeholder="https://empresa.com.br" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="specific-instagram" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Instagram</label>
                    <input id="specific-instagram" type="text" value={specificInstagram} onChange={(e) => setSpecificInstagram(e.target.value)} placeholder="@empresa" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="specific-linkedin" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">LinkedIn</label>
                    <input id="specific-linkedin" type="url" value={specificLinkedin} onChange={(e) => setSpecificLinkedin(e.target.value)} placeholder="https://linkedin.com/company/empresa" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="specific-facebook" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Facebook</label>
                    <input id="specific-facebook" type="url" value={specificFacebook} onChange={(e) => setSpecificFacebook(e.target.value)} placeholder="https://facebook.com/empresa" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Business Metrics */}
            <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
              <button type="button" onClick={() => toggleSection('metrics')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
                <CircleDot className="h-3.5 w-3.5 text-red" />
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Metricas do negocio</p>
                {sectionFilledCounts.metrics > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.metrics}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('metrics') && 'rotate-180')} />
              </button>
              {!expandedSections.has('metrics') && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">
                  {specificRevenue
                    ? `R$ ${(parseInt(specificRevenue) / 1000).toFixed(0)}k/mes`
                    : 'Opcional — a IA busca esses dados automaticamente'}
                </p>
              )}
              <div className={cn('grid md:grid-cols-2 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('metrics') ? 'max-h-[300px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div>
                  <label htmlFor="specific-revenue" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento mensal estimado</label>
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
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Contato do decisor</p>
                {sectionFilledCounts.contact > 0 && (
                  <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{sectionFilledCounts.contact}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('contact') && 'rotate-180')} />
              </button>
              {!expandedSections.has('contact') && (
                <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">
                  {sectionFilledCounts.contact > 0
                    ? [specificContact, specificContactRole, specificPhone].filter(Boolean).join(' · ')
                    : 'Opcional — a IA busca esses dados automaticamente'}
                </p>
              )}
              <div className={cn('grid md:grid-cols-2 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('contact') ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
                <div>
                  <label htmlFor="specific-contact" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome do decisor</label>
                  <input id="specific-contact" type="text" value={specificContact} onChange={(e) => setSpecificContact(e.target.value)} placeholder="Ex: Dr. Joao Silva" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-contact-role" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cargo</label>
                  <input id="specific-contact-role" type="text" value={specificContactRole} onChange={(e) => setSpecificContactRole(e.target.value)} placeholder="Ex: CEO, Proprietario, Socio" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-phone" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> WhatsApp do decisor
                  </label>
                  <input id="specific-phone" type="tel" value={specificPhone} onChange={(e) => setSpecificPhone(formatPhone(e.target.value))} placeholder="(11) 99999-8888" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="specific-email" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
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
              <Button size="lg" icon={<Sparkles className="h-4 w-4" />} onClick={handleSpecificSearch} loading={isCreatingSpecific} disabled={!specificName || (specificCnpj.length > 0 && specificCnpj.replace(/\D/g, '').length !== 14) || isCreatingSpecific || enrichment.isEnriching}>
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
              {!specificCnpj && specificName && (
                <p className="text-[11px] text-text-muted">Sem CNPJ — a IA busca os dados pelo nome da empresa</p>
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
        {/* ===== HERO SECTION ===== */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-red/10 border border-red/20">
            <Search className="h-5 w-5 text-red" />
          </div>
          <div>
            <CardTitle>Pesquisa em massa</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">Defina o perfil ideal e encontre dezenas de leads qualificados automaticamente.</p>
          </div>
          {activeFilters > 0 && (
            <span className="ml-auto text-[11px] text-red font-medium bg-red/10 border border-red/20 px-2.5 py-1 rounded-full shrink-0">
              {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ===== MAIN FIELDS ===== */}
        <div className="space-y-4 mt-5">
          {/* Segmento — large, prominent (like Nome in specific) */}
          <TagInput label="Setor / Segmento *" placeholder="Digite ou selecione segmentos..." tags={segments} setTags={setSegments} suggestions={RECOMMENDED_SEGMENTS} suggestionsLabel="Segmentos recomendados" />

          {/* Estado — prominent */}
          <StateMultiSelect selected={states} setSelected={setStates} />
        </div>

        {/* Preview pills — what the AI will search for */}
        {segments.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-400/5 border border-amber-400/10 animate-[fade-in_0.3s_ease-out]">
            <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-3 w-3" /> Para cada lead encontrado, a IA busca automaticamente:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Google Maps', 'Website', 'WhatsApp', 'Instagram', 'CNPJ', 'Faturamento', 'Decisores', 'Score SPICED'].map((pill) => (
                <span key={pill} className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-amber-400/60" />
                  {pill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== COLLAPSIBLE SECTIONS (like specific lead) ===== */}
        <div className="space-y-3 mt-6">
          {/* Section: Localizacao */}
          <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
            <button type="button" onClick={() => toggleSection('mass-location')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
              <MapPin className="h-3.5 w-3.5 text-red" />
              <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Localizacao</p>
              {city && (
                <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">1</span>
              )}
              <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('mass-location') && 'rotate-180')} />
            </button>
            {!expandedSections.has('mass-location') && (
              <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">
                {city ? city : 'Opcional — refine por cidade para resultados mais precisos'}
              </p>
            )}
            <div className={cn('px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('mass-location') ? 'max-h-[200px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
              <div>
                <label className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Cidade</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Sao Paulo, Campinas, Curitiba" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section: Palavras-chave */}
          <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
            <button type="button" onClick={() => toggleSection('mass-keywords')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
              <Hash className="h-3.5 w-3.5 text-red" />
              <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Palavras-chave</p>
              {keywords.length > 0 && (
                <span className="text-[10px] bg-red/10 text-red border border-red/20 rounded-full px-2 py-0.5 font-medium">{keywords.length}</span>
              )}
              <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('mass-keywords') && 'rotate-180')} />
            </button>
            {!expandedSections.has('mass-keywords') && (
              <p className="text-[10px] text-text-muted px-4 pb-3 -mt-1">
                {keywords.length > 0 ? keywords.join(', ') : 'Opcional — refine com termos especificos do nicho'}
              </p>
            )}
            <div className={cn('px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('mass-keywords') ? 'max-h-[300px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
              <TagInput label="Termos de busca" placeholder="Ex: implantes, ortodontia, clinica..." tags={keywords} setTags={setKeywords} suggestions={['implantes', 'ortodontia', 'harmonizacao', 'manipulacao', 'planejados', 'pet shop', 'ecommerce', 'franquia', 'delivery', 'consultorio']} suggestionsLabel="Sugestoes" />
            </div>
          </div>

          {/* Section: Faturamento */}
          <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
            <button type="button" onClick={() => toggleSection('mass-revenue')} className="flex items-center gap-2 w-full p-4 cursor-pointer">
              <CircleDot className="h-3.5 w-3.5 text-red" />
              <p className="text-xs uppercase tracking-[0.12em] text-text-secondary font-semibold">Faixa de faturamento</p>
              <span className="text-[10px] text-text-muted font-mono ml-1">
                {REVENUE_MIN_OPTIONS.find(r => r.value === revenueMin)?.label || ''} — {REVENUE_MAX_OPTIONS.find(r => r.value === revenueMax)?.label || ''}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-text-muted ml-auto transition-transform duration-300', expandedSections.has('mass-revenue') && 'rotate-180')} />
            </button>
            <div className={cn('grid md:grid-cols-2 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out', expandedSections.has('mass-revenue') ? 'max-h-[200px] opacity-100 pb-4' : 'max-h-0 opacity-0')}>
              <div>
                <label className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento minimo</label>
                <select value={revenueMin} onChange={(e) => setRevenueMin(e.target.value)} className={selectClass}>
                  {REVENUE_MIN_OPTIONS.map((r) => <option key={'min-' + r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Faturamento maximo</label>
                <select value={revenueMax} onChange={(e) => setRevenueMax(e.target.value)} className={selectClass}>
                  {REVENUE_MAX_OPTIONS.map((r) => <option key={'max-' + r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ACTIVE FILTERS SUMMARY ===== */}
        {activeFilters > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-white/[0.02] border border-border animate-[fade-in_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">Resumo da pesquisa</p>
              <button onClick={() => { setSegments([]); setStates([]); setCity(''); setKeywords([]); setRevenueMin('70000'); setRevenueMax('2000000') }} className="text-[10px] text-text-muted hover:text-red cursor-pointer transition-colors">Limpar tudo</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {segments.map((s) => (
                <span key={`seg-${s}`} className="inline-flex items-center gap-1 bg-red/10 text-red border border-red/20 rounded-lg px-2.5 py-1 text-[11px] font-medium animate-[scale-in_0.2s_ease-out]">
                  {s}
                  <button onClick={() => setSegments(segments.filter((x) => x !== s))} className="cursor-pointer hover:text-red-vivid"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {states.map((s) => (
                <span key={`st-${s}`} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg px-2.5 py-1 text-[11px] font-medium animate-[scale-in_0.2s_ease-out]">
                  {s}
                  <button onClick={() => setStates(states.filter((x) => x !== s))} className="cursor-pointer hover:text-blue-300"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {city && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-2.5 py-1 text-[11px] font-medium animate-[scale-in_0.2s_ease-out]">
                  <MapPin className="h-3 w-3" /> {city}
                  <button onClick={() => setCity('')} className="cursor-pointer hover:text-emerald-300"><X className="h-3 w-3" /></button>
                </span>
              )}
              {keywords.map((k) => (
                <span key={`kw-${k}`} className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg px-2.5 py-1 text-[11px] font-medium animate-[scale-in_0.2s_ease-out]">
                  {k}
                  <button onClick={() => setKeywords(keywords.filter((x) => x !== k))} className="cursor-pointer hover:text-purple-300"><X className="h-3 w-3" /></button>
                </span>
              ))}
              <span className="inline-flex items-center gap-1 bg-white/5 text-text-muted border border-border rounded-lg px-2.5 py-1 text-[11px]">
                {REVENUE_MIN_OPTIONS.find(r => r.value === revenueMin)?.label} — {REVENUE_MAX_OPTIONS.find(r => r.value === revenueMax)?.label}
              </span>
            </div>
          </div>
        )}

        {/* ===== CTA SECTION ===== */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <Button size="lg" icon={<Search className="h-4 w-4" />} onClick={handleSearch} loading={isSearching} disabled={isSearching || segments.length === 0}>
              {isSearching ? 'Pesquisando...' : 'Pesquisar leads'}
            </Button>
            {n8n.phase === 'done' && <Button variant="ghost" size="sm" onClick={n8n.reset}>Nova pesquisa</Button>}
          </div>
          {segments.length === 0 && (
            <p className="text-[11px] text-text-muted mt-2">Selecione pelo menos um segmento para iniciar</p>
          )}
        </div>
      </Card>

      {/* Search history */}
      {history.length > 0 && n8n.phase === 'idle' && (
        <div className="animate-[fade-in_0.5s_ease-out]">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-text-muted" />
            <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium">Pesquisas recentes</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry)}
                className="flex-shrink-0 p-3.5 rounded-xl bg-white/[0.02] border border-border hover:border-red/30 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer text-left group"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {entry.segments.map((s) => <span key={s} className="text-[10px] text-red bg-red/10 border border-red/20 px-2 py-0.5 rounded-md font-medium">{s}</span>)}
                  {entry.states.map((s) => <span key={s} className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium">{s}</span>)}
                </div>
                <p className="text-[10px] text-text-muted group-hover:text-text-secondary transition-colors">
                  {entry.city && <><MapPin className="h-2.5 w-2.5 inline mr-0.5" />{entry.city} · </>}{new Date(entry.date).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
      </>)}

      {/* Processing animation */}
      {isSearching && (() => {
        // Progress: logarithmic curve (fast start, slow end) — max 300s, caps at 95%
        // When leads are found (polling phase), jump to 90%+
        const progressPct = n8n.phase === 'polling'
          ? Math.min(98, 90 + Math.min(8, n8n.leadsCreated))
          : Math.min(95, Math.round(Math.log(1 + n8n.elapsed) / Math.log(1 + 300) * 100))

        return (
        <Card className="animate-[fade-in_0.4s_ease-out]">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative p-2.5 rounded-xl bg-red/10 border border-red/20">
              <Loader2 className="h-5 w-5 text-red animate-spin" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Pesquisa em andamento</p>
              <p className="text-xs text-text-muted">
                {n8n.phase === 'polling'
                  ? `${n8n.leadsCreated} leads encontrados, finalizando...`
                  : 'Analisando mercado e coletando leads qualificados...'}
              </p>
            </div>
            <span className="ml-auto text-sm font-mono text-red font-bold">{progressPct}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-red via-amber-400 to-red rounded-full transition-all duration-1000"
              style={{
                width: `${progressPct}%`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </div>

          {/* Search steps visualization */}
          <div className="space-y-2 mb-5">
            {[
              { label: 'Enviando filtros para o motor de busca', done: n8n.elapsed > 3 },
              { label: 'Mapeando empresas no Google Maps', done: n8n.elapsed > 20 },
              { label: 'Coletando dados de contato e WhatsApp', done: n8n.elapsed > 60 },
              { label: 'Validando faturamento e qualificacao', done: n8n.elapsed > 120 },
              { label: 'Salvando leads no Airtable', done: n8n.phase === 'polling' },
            ].map((step, i) => {
              const isActive = !step.done && (i === 0 || (n8n.elapsed > [0, 3, 20, 60, 120][i]))
              return (
                <div key={step.label} className="flex items-center gap-2.5 text-[11px]">
                  {step.done ? (
                    <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                  )}
                  <span className={cn(
                    step.done && 'text-text-primary',
                    isActive && 'text-amber-300',
                    !step.done && !isActive && 'text-text-muted',
                  )}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Curiosity message */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
            <p className="text-[11px] text-text-secondary animate-[fade-in_0.5s_ease-out]" key={Math.floor(n8n.elapsed / 4)}>
              <Sparkles className="h-3 w-3 text-amber-400 inline mr-1.5" />
              {CURIOSITY_MESSAGES[Math.floor(n8n.elapsed / 4) % CURIOSITY_MESSAGES.length]}
            </p>
          </div>

          <p className="text-[10px] text-text-muted mt-3 text-center">A pesquisa roda em background. Os leads serao salvos automaticamente no Airtable.</p>
        </Card>
        )
      })()}

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
        <Card className="animate-[slide-up_0.4s_ease-out]">
          <div className="text-center py-4">
            <div className="p-4 rounded-2xl bg-success/10 border border-success/20 inline-flex mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">{n8n.leadsCreated} leads encontrados e salvos!</h3>
            <p className="text-sm text-text-muted mt-1">Pesquisa concluida em {n8n.elapsed}s. Leads com WhatsApp e dentro da faixa de faturamento.</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 mb-5">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
              <p className="text-lg font-bold font-mono text-red">{n8n.leadsCreated}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Leads salvos</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
              <p className="text-lg font-bold font-mono text-amber-400">{n8n.elapsed}s</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Tempo total</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
              <p className="text-lg font-bold font-mono text-success">{segments.length}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Segmentos</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={n8n.reset}>Nova pesquisa</Button>
            <Button onClick={() => window.location.hash = '#/leads'}>
              Ver leads <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Resume pending enrichment banner */}
      {pendingResume && !massEnrichment.isRunning && massEnrichment.totalLeads === 0 && (
        <Card className="animate-[fade-in_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">Enriquecimento pendente</p>
              <p className="text-xs text-text-muted">{pendingResume.length} lead{pendingResume.length > 1 ? 's' : ''} aguardando enriquecimento ({pendingResume.map(p => p.companyName).slice(0, 3).join(', ')}{pendingResume.length > 3 ? '...' : ''})</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { clearPendingQueue(); setPendingResume(null) }}>
                Descartar
              </Button>
              <Button size="sm" onClick={() => { setPendingResume(null); massEnrichment.resumeFromStorage() }}>
                Retomar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Mass enrichment progress */}
      {massEnrichment.totalLeads > 0 && (
        <Card className="animate-[fade-in_0.4s_ease-out]">
          <div ref={massEnrichmentRef}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
                <Sparkles className="h-5 w-5 text-amber-400" />
                {massEnrichment.isRunning && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {massEnrichment.isRunning ? 'Enriquecendo leads com IA...' : 'Enriquecimento concluido'}
                </p>
                <p className="text-xs text-text-muted">
                  {massEnrichment.completedLeads} de {massEnrichment.totalLeads} leads processados
                  {massEnrichment.failedLeads > 0 && ` (${massEnrichment.failedLeads} com erro)`}
                  {massEnrichment.isRunning && (
                    <span className="text-amber-300 ml-1">
                      {massEnrichment.etaSeconds > 0
                        ? `· ~${massEnrichment.etaSeconds >= 60 ? `${Math.round(massEnrichment.etaSeconds / 60)} min` : `${massEnrichment.etaSeconds}s`} restantes`
                        : `· ~${Math.round((massEnrichment.totalLeads * 90) / 2 / 60)} min estimados`
                      }
                    </span>
                  )}
                </p>
              </div>
              {massEnrichment.isRunning && (
                <Button variant="ghost" size="sm" onClick={massEnrichment.abort} className="ml-auto">
                  Parar
                </Button>
              )}
              {!massEnrichment.isRunning && (
                <Button variant="ghost" size="sm" onClick={() => { massEnrichment.reset(); n8n.reset() }} className="ml-auto">
                  Nova pesquisa
                </Button>
              )}
            </div>

            {/* Global progress bar */}
            <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-success rounded-full transition-all duration-500"
                style={{ width: `${(massEnrichment.completedLeads / massEnrichment.totalLeads) * 100}%` }}
              />
            </div>

            {/* Lead-by-lead progress (smart collapse) */}
            {(() => {
              const active = massEnrichment.queue.filter((q) => q.status === 'enriching')
              const done = massEnrichment.queue.filter((q) => q.status === 'done')
              const errored = massEnrichment.queue.filter((q) => q.status === 'error')
              const queued = massEnrichment.queue.filter((q) => q.status === 'queued')
              return (
                <div className="space-y-2">
                  {/* Completed summary (collapsed) */}
                  {done.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/5 border border-success/20">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs text-success font-medium">{done.length} lead{done.length > 1 ? 's' : ''} enriquecido{done.length > 1 ? 's' : ''}</span>
                      <span className="text-[10px] text-success/60 ml-auto">{done.reduce((a, q) => a + q.sourcesFound, 0)} fontes</span>
                    </div>
                  )}

                  {/* Error summary (collapsed) */}
                  {errored.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-error/5 border border-error/20">
                      <AlertCircle className="h-4 w-4 text-error shrink-0" />
                      <span className="text-xs text-error font-medium">{errored.length} com erro</span>
                      <span className="text-[10px] text-error/60 ml-auto truncate max-w-[200px]">{errored[0]?.error}</span>
                    </div>
                  )}

                  {/* Active leads (expanded with full detail) */}
                  {active.map((lead) => (
                    <div key={lead.leadId} className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 animate-[fade-in_0.3s_ease-out]">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 text-amber-400 animate-spin shrink-0" />
                        <p className="text-xs font-medium text-amber-300 truncate flex-1">{lead.companyName}</p>
                        <span className="text-[10px] text-text-muted font-mono">{massEnrichment.completedLeads + active.indexOf(lead) + 1}/{massEnrichment.totalLeads}</span>
                      </div>
                      {lead.progress && (
                        <>
                          <div className="flex items-center gap-1 mb-1.5">
                            {lead.progress.steps.map((step) => (
                              <div
                                key={step.source}
                                title={step.label}
                                className={cn(
                                  'h-2 flex-1 rounded-full transition-all duration-300',
                                  step.status === 'done' && 'bg-success',
                                  step.status === 'running' && 'bg-amber-400 animate-pulse',
                                  step.status === 'error' && 'bg-error',
                                  step.status === 'skipped' && 'bg-white/10',
                                  step.status === 'pending' && 'bg-white/[0.05]',
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-text-muted">
                            {lead.progress.steps.find((s) => s.status === 'running')?.label || 'Processando...'}
                          </p>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Queued summary (collapsed) */}
                  {queued.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-border">
                      <div className="h-4 w-4 rounded-full border border-border shrink-0 flex items-center justify-center">
                        <span className="text-[8px] text-text-muted font-mono">{queued.length}</span>
                      </div>
                      <span className="text-xs text-text-muted">{queued.length} na fila</span>
                      <span className="text-[10px] text-text-muted ml-auto truncate max-w-[200px]">
                        {queued.slice(0, 3).map((q) => q.companyName).join(', ')}{queued.length > 3 ? '...' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Completion summary */}
            {!massEnrichment.isRunning && massEnrichment.completedLeads > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
                    <p className="text-lg font-bold font-mono text-success">{massEnrichment.completedLeads}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Enriquecidos</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-center">
                    <p className="text-lg font-bold font-mono text-amber-400">
                      {massEnrichment.queue.reduce((acc, q) => acc + q.sourcesFound, 0)}
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Fontes coletadas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
                    <p className="text-lg font-bold font-mono text-red">
                      {massEnrichment.queue.filter((q) => q.sourcesFound >= 3).length}
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Score completo</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  <Button variant="ghost" onClick={() => { massEnrichment.reset(); n8n.reset() }}>Nova pesquisa</Button>
                  <Button onClick={() => window.location.hash = '#/leads'}>
                    Ver leads enriquecidos <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {n8n.phase === 'done' && n8n.leadsCreated === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-muted">Nenhum lead qualificado encontrado. Tente ajustar segmento, cidade ou faixa de faturamento.</p>
          <Button variant="ghost" onClick={() => { n8n.reset(); massEnrichment.reset() }} className="mt-4">Tentar novamente</Button>
        </Card>
      )}
    </div>
  )
}
