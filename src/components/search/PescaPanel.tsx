import { useState, useMemo } from 'react'
import { Card, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Fish, Loader2, CheckCircle, AlertCircle, ChevronDown, ArrowRight, Phone, Building2, User, DollarSign, Search, SortAsc, SortDesc, Copy, ExternalLink, MapPin } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SEGMENTS } from '../../lib/constants'
import { usePesca } from '../../hooks/usePesca'
import { toast } from 'sonner'
import type { PescaFilters, PescaPhase, PescaLead } from '../../types'

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

// Revenue options removidos — substituidos por PORTE_OPTIONS cards visuais

const PHASE_LABELS: Record<PescaPhase, string> = {
  idle: '',
  searching: 'Pesquisando empresas via CNPJa...',
  enriching: 'Classificando telefones e decisores...',
  deduplicating: 'Removendo duplicatas...',
  saving: 'Salvando no sistema...',
  assertiva_enriching: 'Enriquecendo com Assertiva (telefones + WhatsApp)...',
  done: 'Concluido!',
  error: 'Erro na pesquisa',
}

const PHASE_STEPS: PescaPhase[] = ['searching', 'enriching', 'deduplicating', 'saving', 'assertiva_enriching']

type DataFilter = 'all' | 'with-whatsapp' | 'with-decisor' | 'complete'
type SortField = 'company' | 'capital' | 'state'
type SortDir = 'asc' | 'desc'

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatCapital(value?: number): string {
  if (!value) return '-'
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value}`
}

function formatCnpj(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return cnpj
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
}

function formatWhatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => {})
}

// Classificação de qualidade do lead para priorização visual
function getLeadQuality(lead: PescaLead): 'gold' | 'silver' | 'bronze' {
  const hasWhatsapp = !!lead.whatsapp
  const hasDecisor = !!lead.decisorName
  const hasCapital = !!lead.capitalSocial
  if (hasWhatsapp && hasDecisor && hasCapital) return 'gold'
  if (hasWhatsapp && hasDecisor) return 'gold'
  if (hasWhatsapp || hasDecisor) return 'silver'
  return 'bronze'
}

const QUALITY_CONFIG = {
  gold: { label: 'Pronto', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', dot: 'bg-success' },
  silver: { label: 'Parcial', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', dot: 'bg-warning' },
  bronze: { label: 'Básico', color: 'text-text-muted', bg: 'bg-white/[0.03]', border: 'border-border', dot: 'bg-text-muted' },
}

// Cidades principais por estado (com codigos IBGE para CNPJa API)
const STATE_CITIES: Record<string, Array<{ name: string; ibge: number }>> = {
  SP: [
    { name: 'São Paulo', ibge: 3550308 }, { name: 'Campinas', ibge: 3509502 },
    { name: 'Santos', ibge: 3548500 }, { name: 'Ribeirão Preto', ibge: 3543402 },
    { name: 'Sorocaba', ibge: 3552205 }, { name: 'Osasco', ibge: 3534401 },
    { name: 'Guarulhos', ibge: 3518800 },
  ],
  RJ: [
    { name: 'Rio de Janeiro', ibge: 3304557 }, { name: 'Niterói', ibge: 3303302 },
    { name: 'Petrópolis', ibge: 3303906 }, { name: 'Volta Redonda', ibge: 3306305 },
    { name: 'Campos dos Goytacazes', ibge: 3301009 },
  ],
  MG: [
    { name: 'Belo Horizonte', ibge: 3106200 }, { name: 'Uberlandia', ibge: 3170206 },
    { name: 'Juiz de Fora', ibge: 3136702 }, { name: 'Contagem', ibge: 3118601 },
    { name: 'Betim', ibge: 3106705 },
  ],
  RS: [
    { name: 'Porto Alegre', ibge: 4314902 }, { name: 'Caxias do Sul', ibge: 4305108 },
    { name: 'Pelotas', ibge: 4314407 }, { name: 'Canoas', ibge: 4304606 },
    { name: 'Santa Maria', ibge: 4316907 },
  ],
  SC: [
    { name: 'Florianópolis', ibge: 4205407 }, { name: 'Joinville', ibge: 4209102 },
    { name: 'Blumenau', ibge: 4202404 }, { name: 'Chapecó', ibge: 4204202 },
    { name: 'Criciúma', ibge: 4204608 },
  ],
  PR: [
    { name: 'Curitiba', ibge: 4106902 }, { name: 'Londrina', ibge: 4113700 },
    { name: 'Maringá', ibge: 4115200 }, { name: 'Ponta Grossa', ibge: 4119905 },
    { name: 'Cascavel', ibge: 4104808 },
  ],
  BA: [
    { name: 'Salvador', ibge: 2927408 }, { name: 'Feira de Santana', ibge: 2910800 },
    { name: 'Vitoria da Conquista', ibge: 2933307 }, { name: 'Camacari', ibge: 2905701 },
  ],
  PE: [
    { name: 'Recife', ibge: 2611606 }, { name: 'Jaboatao dos Guararapes', ibge: 2607901 },
    { name: 'Olinda', ibge: 2609600 }, { name: 'Caruaru', ibge: 2604106 },
  ],
  CE: [
    { name: 'Fortaleza', ibge: 2304400 }, { name: 'Caucaia', ibge: 2303709 },
    { name: 'Juazeiro do Norte', ibge: 2307304 }, { name: 'Maracanau', ibge: 2307650 },
  ],
  GO: [
    { name: 'Goiânia', ibge: 5208707 }, { name: 'Aparecida de Goiania', ibge: 5201405 },
    { name: 'Anápolis', ibge: 5201108 },
  ],
  DF: [{ name: 'Brasilia', ibge: 5300108 }],
  ES: [
    { name: 'Vitoria', ibge: 3205309 }, { name: 'Vila Velha', ibge: 3205200 },
    { name: 'Serra', ibge: 3205002 }, { name: 'Cariacica', ibge: 3201308 },
  ],
  PA: [
    { name: 'Belém', ibge: 1501402 }, { name: 'Ananindeua', ibge: 1500800 },
    { name: 'Santarém', ibge: 1506807 },
  ],
  AM: [{ name: 'Manaus', ibge: 1302603 }],
  MA: [{ name: 'São Luís', ibge: 2111300 }],
  MT: [
    { name: 'Cuiabá', ibge: 5103403 }, { name: 'Várzea Grande', ibge: 5108402 },
    { name: 'Rondonópolis', ibge: 5107602 },
  ],
  MS: [{ name: 'Campo Grande', ibge: 5002704 }, { name: 'Dourados', ibge: 5003702 }],
  PB: [{ name: 'João Pessoa', ibge: 2507507 }, { name: 'Campina Grande', ibge: 2504009 }],
  RN: [{ name: 'Natal', ibge: 2408102 }, { name: 'Mossoró', ibge: 2408003 }],
  AL: [{ name: 'Maceió', ibge: 2704302 }],
  PI: [{ name: 'Teresina', ibge: 2211001 }],
  SE: [{ name: 'Aracajú', ibge: 2800308 }],
  RO: [{ name: 'Porto Velho', ibge: 1100205 }],
  TO: [{ name: 'Palmas', ibge: 1721000 }],
  AC: [{ name: 'Rio Branco', ibge: 1200401 }],
  AP: [{ name: 'Macapá', ibge: 1600303 }],
  RR: [{ name: 'Boa Vista', ibge: 1400100 }],
}

const PORTE_OPTIONS = [
  { id: 'micro', label: 'Micro', desc: 'Ate R$ 100k', min: 0, max: 100000, sizes: [1], icon: '🏪' },
  { id: 'pequena', label: 'Pequena', desc: 'R$ 100k - 500k', min: 100000, max: 500000, sizes: [1, 3], icon: '🏢' },
  { id: 'media', label: 'Media', desc: 'R$ 500k - 2M', min: 500000, max: 2000000, sizes: [3, 5], icon: '🏗' },
  { id: 'grande', label: 'Grande', desc: 'Acima de R$ 2M', min: 2000000, max: 10000000, sizes: [5], icon: '🏛' },
  { id: 'qualquer', label: 'Qualquer', desc: 'Todos os portes', min: 0, max: 10000000, sizes: [] as number[], icon: '🔍' },
]

export function PescaPanel() {
  const [segments, setSegments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const toggleCity = (c: string) => setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const [selectedPorte, setSelectedPorte] = useState('qualquer')
  const [revenueMin, setRevenueMin] = useState(0)
  const [revenueMax, setRevenueMax] = useState(10000000)
  const [companySizes, setCompanySizes] = useState<number[]>([])
  const [excludeMei, setExcludeMei] = useState(true)
  const [showAllStates, setShowAllStates] = useState(false)

  // Estado do painel de resultados
  const [dataFilter, setDataFilter] = useState<DataFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('company')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { phase, progress, leads, error, assertivaWarning, elapsed, startPesca, cancel, reset, retryFromError } = usePesca()

  const toggleSegment = (name: string) => {
    setSegments(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])
  }

  const toggleState = (uf: string) => {
    setStates(prev => prev.includes(uf) ? prev.filter(s => s !== uf) : [...prev, uf])
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleSelectPorte = (id: string) => {
    setSelectedPorte(id)
    const porte = PORTE_OPTIONS.find(p => p.id === id)
    if (porte) {
      setRevenueMin(porte.min)
      setRevenueMax(porte.max)
      setCompanySizes(porte.sizes)
    }
  }

  const handleStart = async () => {
    if (segments.length === 0) {
      toast.error('Selecione pelo menos um segmento')
      return
    }

    const slugs: string[] = segments
      .map(name => SEGMENTS.find(s => s.name === name)?.slug)
      .filter(Boolean) as string[]

    const filters: PescaFilters = {
      segments: slugs,
      states,
      revenueMin,
      revenueMax,
      excludeMei,
      cities: cities.length > 0
        ? cities.map(cityName => {
            for (const uf of states) {
              const match = (STATE_CITIES[uf] || []).find(c => c.name === cityName)
              if (match) return { name: match.name, ibgeCode: match.ibge }
            }
            return null
          }).filter((c): c is { name: string; ibgeCode: number } => c !== null)
        : undefined,
      companySizes: companySizes.length > 0 ? companySizes : undefined,
    }

    setDataFilter('all')
    setSearchQuery('')
    await startPesca(filters)
  }

  // Cidades disponiveis baseadas nos estados selecionados
  const availableCities = states.flatMap(uf => (STATE_CITIES[uf] || []).map(c => c.name))

  // Leads filtrados e ordenados para o painel de resultados
  const filteredLeads = useMemo(() => {
    let result = [...leads]

    // Filtro por qualidade de dados
    if (dataFilter === 'with-whatsapp') result = result.filter(l => l.whatsapp)
    else if (dataFilter === 'with-decisor') result = result.filter(l => l.decisorName)
    else if (dataFilter === 'complete') result = result.filter(l => l.whatsapp && l.decisorName)

    // Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(l =>
        l.companyName?.toLowerCase().includes(q) ||
        l.tradeName?.toLowerCase().includes(q) ||
        l.cnpj?.includes(q) ||
        l.decisorName?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q),
      )
    }

    // Ordenacao
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'company') return (a.companyName || '').localeCompare(b.companyName || '') * dir
      if (sortField === 'capital') return ((a.capitalSocial || 0) - (b.capitalSocial || 0)) * dir
      if (sortField === 'state') return (a.state || '').localeCompare(b.state || '') * dir
      return 0
    })

    return result
  }, [leads, dataFilter, searchQuery, sortField, sortDir])

  const isRunning = phase !== 'idle' && phase !== 'done' && phase !== 'error'
  const canStart = segments.length > 0 && !isRunning

  // Wizard step tracker
  const wizardStep = segments.length === 0 ? 0 : states.length === 0 ? 1 : 2
  const completionPct = segments.length > 0 && states.length > 0 ? 100 : segments.length > 0 ? 50 : 0

  // ========================================
  // IDLE: Formulario gamificado (wizard)
  // ========================================
  if (phase === 'idle') {
    return (
      <div className="space-y-4">
        {/* Header com progress bar */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-text-primary font-heading">Encontrar empresas</h2>
              <p className="text-xs text-text-muted mt-0.5">3 passos para leads qualificados com telefone e decisor</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={cn('h-2 w-8 rounded-full transition-all duration-500', i <= wizardStep ? 'bg-red shadow-sm shadow-red/30' : 'bg-white/[0.06]')} />
                ))}
              </div>
              {completionPct === 100 && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Pronto</span>}
            </div>
          </div>

          {/* Step 1: Segmento — grid de cards */}
          <div className={cn('rounded-xl border p-4 mb-3 transition-all', wizardStep === 0 ? 'border-red/30 bg-red/[0.03] ring-1 ring-red/10' : segments.length > 0 ? 'border-success/20 bg-success/[0.03]' : 'border-border')}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all', segments.length > 0 ? 'bg-success text-white' : wizardStep === 0 ? 'bg-red text-white' : 'bg-white/[0.06] text-text-muted')}>
                {segments.length > 0 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Qual segmento?</p>
                <p className="text-[11px] text-text-muted">Selecione um ou mais setores de atuação</p>
              </div>
              {segments.length > 0 && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{segments.length} selecionado{segments.length > 1 ? 's' : ''}</span>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {SEGMENTS.map(seg => (
                <button
                  key={seg.slug}
                  onClick={() => toggleSegment(seg.name)}
                  aria-pressed={segments.includes(seg.name)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all cursor-pointer border',
                    segments.includes(seg.name)
                      ? 'bg-red/15 text-red border-red/40 shadow-md shadow-red/10 ring-1 ring-red/20'
                      : 'bg-white/[0.02] text-text-muted border-border hover:border-red/20 hover:bg-red/[0.03] hover:text-text-secondary',
                  )}
                >
                  <span className="text-lg">{seg.slug === 'estetica' ? '💆' : seg.slug === 'odontologia' ? '🦷' : seg.slug === 'varejo' ? '🛒' : seg.slug === 'farmacia' ? '💊' : seg.slug === 'movelaria' ? '🛋' : seg.slug === 'servicos' ? '⚙' : seg.slug === 'alimentacao' ? '🍽' : seg.slug === 'saude' ? '🏥' : seg.slug === 'educacao' ? '📚' : seg.slug === 'tecnologia' ? '💻' : seg.slug === 'automotivo' ? '🚗' : seg.slug === 'petshop' ? '🐾' : seg.slug === 'fitness' ? '💪' : seg.slug === 'beleza' ? '💅' : seg.slug === 'imobiliario' ? '🏠' : seg.slug === 'construcao' ? '🔨' : seg.slug === 'moda' ? '👗' : seg.slug === 'decoracao' ? '🎨' : seg.slug === 'agronegocio' ? '🌾' : seg.slug === 'logistica' ? '📦' : '🏢'}</span>
                  <span className="text-[11px] font-medium leading-tight">{seg.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Estado + Cidade — nome completo */}
          <div className={cn('rounded-xl border p-4 mb-3 transition-all', wizardStep === 1 ? 'border-red/30 bg-red/[0.03] ring-1 ring-red/10' : states.length > 0 ? 'border-success/20 bg-success/[0.03]' : 'border-border opacity-60', segments.length === 0 && 'opacity-40 pointer-events-none')}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all', states.length > 0 ? 'bg-success text-white' : wizardStep === 1 ? 'bg-red text-white' : 'bg-white/[0.06] text-text-muted')}>
                {states.length > 0 ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Onde buscar?</p>
                <p className="text-[11px] text-text-muted">Estado e cidade (opcional)</p>
              </div>
              {states.length > 0 && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{states.length} estado{states.length > 1 ? 's' : ''}</span>}
            </div>
            {/* Estados principais — nome completo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {RECOMMENDED_STATES.map(uf => {
                const stateObj = ALL_STATES.find(s => s.uf === uf)
                return (
                  <button
                    key={uf}
                    onClick={() => toggleState(uf)}
                    aria-pressed={states.includes(uf)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border',
                      states.includes(uf)
                        ? 'bg-red/15 text-red border-red/40 ring-1 ring-red/20'
                        : 'bg-white/[0.02] text-text-muted border-border hover:border-red/20 hover:text-text-secondary',
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span>{stateObj?.name || uf}</span>
                    <span className="text-[10px] opacity-50 ml-auto">{uf}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowAllStates(!showAllStates)}
              aria-expanded={showAllStates}
              className="flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-xl text-xs text-text-muted hover:text-text-secondary cursor-pointer border border-dashed border-border hover:border-border-strong mb-2 transition-colors"
            >
              {showAllStates ? 'Mostrar menos' : `+${ALL_STATES.length - RECOMMENDED_STATES.length} outros estados`} <ChevronDown className={cn('h-3 w-3 transition-transform', showAllStates && 'rotate-180')} />
            </button>
            {showAllStates && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-border animate-[fade-in_0.2s_ease-out] mb-3">
                {ALL_STATES.filter(s => !RECOMMENDED_STATES.includes(s.uf)).map(s => (
                  <button
                    key={s.uf}
                    onClick={() => toggleState(s.uf)}
                    aria-pressed={states.includes(s.uf)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border',
                      states.includes(s.uf)
                        ? 'bg-red/15 text-red border-red/30'
                        : 'bg-white/[0.02] text-text-muted border-border hover:text-text-secondary',
                    )}
                  >
                    <span>{s.name}</span>
                    <span className="text-[9px] opacity-40 ml-auto">{s.uf}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Cidades — dropdown multi-select compacto */}
            {states.length > 0 && availableCities.length > 0 && (
              <div className="relative animate-[fade-in_0.2s_ease-out]">
                <label className="text-[11px] font-medium text-text-muted mb-1.5 block">Cidades (opcional)</label>
                {/* Trigger */}
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer',
                    cityDropdownOpen ? 'border-red/40 ring-1 ring-red/20 bg-red/[0.03]' : 'border-border bg-white/[0.04] hover:border-border-strong',
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0" />
                  {cities.length === 0 ? (
                    <span className="text-xs text-text-muted flex-1">Todas as cidades</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 flex-1">
                      {cities.map(c => (
                        <span key={c} className="text-[10px] font-medium bg-red/15 text-red px-2 py-0.5 rounded-full flex items-center gap-1">
                          {c}
                          <button
                            onClick={e => { e.stopPropagation(); toggleCity(c) }}
                            className="hover:text-white transition-colors"
                          >
                            <AlertCircle className="h-2.5 w-2.5 rotate-45" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronDown className={cn('h-3.5 w-3.5 text-text-muted shrink-0 transition-transform', cityDropdownOpen && 'rotate-180')} />
                </button>
                {/* Dropdown */}
                {cityDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 py-1 rounded-xl border border-border bg-surface shadow-xl shadow-black/30 max-h-48 overflow-y-auto animate-[fade-in_0.15s_ease-out]">
                    {availableCities.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleCity(c)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer',
                          cities.includes(c) ? 'bg-red/10 text-red' : 'text-text-secondary hover:bg-white/[0.04]',
                        )}
                      >
                        <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all', cities.includes(c) ? 'bg-red border-red' : 'border-border')}>
                          {cities.includes(c) && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        <span className="flex-1">{c}</span>
                        <span className="text-[10px] text-text-muted">{states.find(uf => (STATE_CITIES[uf] || []).some(city => city.name === c))}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Porte — cards visuais */}
          <div className={cn('rounded-xl border p-4 mb-4 transition-all', wizardStep === 2 ? 'border-red/30 bg-red/[0.03] ring-1 ring-red/10' : 'border-border', (segments.length === 0 || states.length === 0) && 'opacity-40 pointer-events-none')}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all', wizardStep === 2 ? 'bg-red text-white' : 'bg-white/[0.06] text-text-muted')}>
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Qual porte?</p>
                <p className="text-[11px] text-text-muted">Tamanho das empresas que quer encontrar</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PORTE_OPTIONS.map(porte => (
                <button
                  key={porte.id}
                  onClick={() => handleSelectPorte(porte.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all cursor-pointer border',
                    selectedPorte === porte.id
                      ? 'bg-red/15 text-red border-red/40 ring-1 ring-red/20'
                      : 'bg-white/[0.02] text-text-muted border-border hover:border-red/20 hover:text-text-secondary',
                  )}
                >
                  <span className="text-lg">{porte.icon}</span>
                  <span className="text-[11px] font-semibold">{porte.label}</span>
                  <span className="text-[9px] opacity-60">{porte.desc}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors border border-border group/mei">
              <input
                type="checkbox"
                checked={excludeMei}
                onChange={e => setExcludeMei(e.target.checked)}
                className="rounded border-border accent-red w-4 h-4"
              />
              <div className="flex-1">
                <span className="text-xs text-text-secondary font-medium">Excluir MEI</span>
                <span className="text-[10px] text-text-muted block">Microempreendedor individual (faturamento ate R$ 81k/ano)</span>
              </div>
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors cursor-help" aria-label="O que e MEI?">
                  <span className="text-[10px] font-bold">?</span>
                </div>
                <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 rounded-lg bg-surface border border-border shadow-xl shadow-black/30 text-[10px] text-text-secondary opacity-0 invisible group-hover/mei:opacity-100 group-hover/mei:visible transition-all z-30 pointer-events-none">
                  <p className="font-semibold text-text-primary mb-1">MEI = Microempreendedor Individual</p>
                  <p>Empresas com faturamento ate R$ 81.000/ano. Geralmente sao profissionais autonomos sem estrutura para investir em marketing digital.</p>
                </div>
              </div>
            </label>
          </div>

          {/* Estimativa pre-busca */}
          {canStart && (
            <div className="text-center py-1.5 animate-[fade-in_0.3s_ease-out]">
              <p className="text-[10px] text-text-muted">
                Estimativa: <span className="font-semibold text-text-secondary">~50-150 empresas</span> com telefone
                {states.length === 1 ? ` em ${states[0]}` : states.length > 1 ? ` em ${states.length} estados` : ''}
                {' · '}Tempo: ~2-4 min
              </p>
            </div>
          )}

          {/* CTA — destaque maximo quando pronto */}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              'w-full py-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2.5',
              canStart
                ? 'bg-red hover:bg-red-vivid text-white shadow-xl shadow-red/30 hover:shadow-red/40 hover:scale-[1.01]'
                : 'bg-white/[0.04] text-text-muted border border-border cursor-not-allowed',
            )}
          >
            {canStart ? (
              <>
                <ArrowRight className="h-4 w-4" />
                Pesquisar {segments.length} segmento{segments.length > 1 ? 's' : ''} em {cities.length > 0 ? cities.slice(0, 2).join(', ') + (cities.length > 2 ? ` +${cities.length - 2}` : '') : states.length ? states.join(', ') : 'todos os estados'}
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {segments.length === 0 ? 'Selecione um segmento para começar' : 'Selecione pelo menos um estado'}
              </>
            )}
          </Button>

          {/* Footer — fontes de dados */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-[10px] text-cyan-400/60 font-medium">CNPJa API</span>
            <span className="text-[10px] text-text-muted/40">→</span>
            <span className="text-[10px] text-purple-400/60 font-medium">Assertiva</span>
            <span className="text-[10px] text-text-muted/40">→</span>
            <span className="text-[10px] text-success/60 font-medium">Airtable</span>
          </div>
        </Card>
      </div>
    )
  }

  // ========================================
  // RUNNING: Progresso
  // ========================================
  if (isRunning) {
    const currentStepIndex = PHASE_STEPS.indexOf(phase as any)

    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red/10 border border-red/20 animate-pulse">
              <Fish className="h-5 w-5 text-red" />
            </div>
            <div>
              <CardTitle>Pesquisando...</CardTitle>
              <p className="text-xs text-text-muted mt-0.5">{PHASE_LABELS[phase]}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-text-secondary">{formatElapsed(elapsed)}</p>
            <button onClick={cancel} className="text-[10px] text-red hover:text-red-vivid cursor-pointer mt-0.5">
              Cancelar
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {PHASE_STEPS.map((step, i) => {
            const isActive = step === phase
            const isCompleted = currentStepIndex > i
            const isPending = currentStepIndex < i
            const hasWarning = step === 'assertiva_enriching' && assertivaWarning && (isCompleted || isActive)
            return (
              <div key={step} className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border transition-all',
                hasWarning ? 'border-warning/30 bg-warning/5'
                  : isActive ? 'border-red/30 bg-red/5'
                  : isCompleted ? 'border-success/20 bg-success/5'
                  : 'border-border bg-white/[0.02]',
              )}>
                {hasWarning && <AlertCircle className="h-4 w-4 text-warning shrink-0" />}
                {!hasWarning && isCompleted && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                {!hasWarning && isActive && <Loader2 className="h-4 w-4 text-red animate-spin shrink-0" />}
                {!hasWarning && isPending && <div className="h-4 w-4 rounded-full border border-border shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium', hasWarning ? 'text-warning' : isActive ? 'text-text-primary' : isCompleted ? 'text-success' : 'text-text-muted')}>
                    {PHASE_LABELS[step]}
                  </p>
                  {hasWarning && <p className="text-[10px] text-warning/70 mt-0.5 truncate">{assertivaWarning}</p>}
                </div>
                <span className="text-xs font-mono text-text-muted shrink-0">
                  {step === 'searching' && progress.found > 0 && `${progress.found}`}
                  {step === 'enriching' && progress.enriched > 0 && `${progress.enriched}/${progress.found}`}
                  {step === 'deduplicating' && progress.deduped > 0 && `${progress.deduped} únicos`}
                  {step === 'saving' && progress.saved > 0 && `${progress.saved}/${progress.deduped}`}
                  {step === 'assertiva_enriching' && progress.enriched > 0 && `${progress.enriched}/${progress.saved}`}
                </span>
              </div>
            )
          })}
        </div>

        <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red to-red-vivid rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, ((currentStepIndex + 1) / PHASE_STEPS.length) * 100)}%` }}
          />
        </div>
      </Card>
    )
  }

  // ========================================
  // ERROR — contextual com filtros usados e acoes claras
  // ========================================
  if (phase === 'error') {
    const isNoResults = error?.toLowerCase().includes('nenhum') || error?.toLowerCase().includes('0 empres')
    const isNetwork = error?.toLowerCase().includes('network') || error?.toLowerCase().includes('fetch') || error?.toLowerCase().includes('failed to')
    const isRateLimit = error?.toLowerCase().includes('rate limit') || error?.toLowerCase().includes('429')

    const errorTitle = isNoResults ? 'Nenhuma empresa encontrada' : isRateLimit ? 'Limite de requisições atingido' : isNetwork ? 'Erro de conexão' : 'Erro na PESCA'
    const errorHint = isNoResults
      ? 'Tente ampliar a busca: adicione mais segmentos, estados ou mude o porte.'
      : isRateLimit
        ? 'A API CNPJa atingiu o limite. Aguarde 1 minuto e tente novamente.'
        : isNetwork
          ? 'Verifique sua conexão com a internet e tente novamente.'
          : 'Algo inesperado aconteceu. Tente com filtros diferentes.'

    return (
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('p-2.5 rounded-xl border', isNoResults ? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20')}>
            {isNoResults ? <Search className="h-5 w-5 text-warning" /> : <AlertCircle className="h-5 w-5 text-error" />}
          </div>
          <div>
            <CardTitle>{errorTitle}</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">{errorHint}</p>
          </div>
        </div>

        {/* Resumo dos filtros usados */}
        {(segments.length > 0 || states.length > 0) && (
          <div className="rounded-lg bg-white/[0.03] border border-border p-3 mb-4 space-y-1.5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filtros usados</p>
            <div className="flex flex-wrap gap-1.5">
              {segments.map(s => (
                <span key={s} className="text-[10px] font-medium bg-red/10 text-red px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {states.map(s => (
                <span key={s} className="text-[10px] font-medium bg-white/[0.06] text-text-secondary px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {selectedPorte !== 'qualquer' && (
                <span className="text-[10px] font-medium bg-white/[0.06] text-text-secondary px-2 py-0.5 rounded-full">
                  {PORTE_OPTIONS.find(p => p.id === selectedPorte)?.label || selectedPorte}
                </span>
              )}
              {excludeMei && <span className="text-[10px] font-medium bg-white/[0.06] text-text-muted px-2 py-0.5 rounded-full">Sem MEI</span>}
            </div>
            {!isNoResults && error && (
              <p className="text-[10px] text-error/70 font-mono mt-1">{error}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={retryFromError} className="flex-1 py-2.5 text-sm bg-red hover:bg-red-vivid text-white rounded-xl font-semibold">
            {isNoResults ? 'Mudar filtros' : 'Tentar novamente'}
          </Button>
          {!isNoResults && (
            <Button onClick={() => { retryFromError() }} className="py-2.5 text-sm bg-white/[0.05] hover:bg-white/[0.08] text-text-secondary rounded-xl border border-border px-4">
              Mudar filtros
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // ========================================
  // DONE: Painel de Resultados (redesign Baziotti)
  // ========================================
  const leadsWithWhatsapp = leads.filter(l => l.whatsapp)
  const leadsWithDecisor = leads.filter(l => l.decisorName)
  const leadsComplete = leads.filter(l => l.whatsapp && l.decisorName)
  const qualityCounts = { gold: leads.filter(l => getLeadQuality(l) === 'gold').length, silver: leads.filter(l => getLeadQuality(l) === 'silver').length, bronze: leads.filter(l => getLeadQuality(l) === 'bronze').length }

  return (
    <div className="space-y-4 animate-[fade-in_0.4s_ease-out]">

      {/* Hero da conclusao */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-text-primary">{leads.length} leads extraidos</h2>
              <p className="text-xs text-text-muted">{formatElapsed(elapsed)} de extração via APIs públicas</p>
            </div>
          </div>
          <button onClick={reset} className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary border border-border hover:border-border-strong rounded-lg cursor-pointer transition-all">
            Nova PESCA
          </button>
        </div>
      </Card>

      {/* KPI Cards — hierarquia visual por prioridade */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Card principal: WhatsApp (dado mais valioso) */}
        <div className="p-3 rounded-xl bg-[#25D366]/8 border border-[#25D366]/20 text-center">
          <Phone className="h-4 w-4 text-whatsapp mx-auto mb-1" />
          <p className="text-2xl font-bold font-heading text-whatsapp">{leadsWithWhatsapp.length}</p>
          <p className="text-[10px] text-text-muted">com WhatsApp</p>
          <p className="text-[10px] font-medium text-whatsapp mt-0.5">{leads.length > 0 ? Math.round(leadsWithWhatsapp.length / leads.length * 100) : 0}% taxa</p>
        </div>
        <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
          <User className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold font-heading text-success">{leadsWithDecisor.length}</p>
          <p className="text-[10px] text-text-muted">com Decisor</p>
          <p className="text-[10px] font-medium text-success mt-0.5">{leads.length > 0 ? Math.round(leadsWithDecisor.length / leads.length * 100) : 0}% taxa</p>
        </div>
        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-center">
          <DollarSign className="h-4 w-4 text-warning mx-auto mb-1" />
          <p className="text-2xl font-bold font-heading text-warning">{leads.filter(l => l.capitalSocial).length}</p>
          <p className="text-[10px] text-text-muted">com Capital</p>
        </div>
        <div className="p-3 rounded-xl bg-red/5 border border-red/20 text-center">
          <Building2 className="h-4 w-4 text-red mx-auto mb-1" />
          <p className="text-2xl font-bold font-heading text-text-primary">{leads.length}</p>
          <p className="text-[10px] text-text-muted">total extraido</p>
        </div>
      </div>

      {/* Barra de qualidade visual */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-text-secondary">Qualidade dos dados</p>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.03]">
          {qualityCounts.gold > 0 && <div className="bg-success transition-all" style={{ width: `${qualityCounts.gold / leads.length * 100}%` }} />}
          {qualityCounts.silver > 0 && <div className="bg-warning transition-all" style={{ width: `${qualityCounts.silver / leads.length * 100}%` }} />}
          {qualityCounts.bronze > 0 && <div className="bg-text-muted/30 transition-all" style={{ width: `${qualityCounts.bronze / leads.length * 100}%` }} />}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-success" /> Pronto ({qualityCounts.gold})</span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-warning" /> Parcial ({qualityCounts.silver})</span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-text-muted/30" /> Básico ({qualityCounts.bronze})</span>
        </div>
      </Card>

      {/* Filtros e busca do painel de resultados */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
          {/* Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por empresa, CNPJ, decisor, cidade..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/[0.03] border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:border-red/50 focus:outline-none"
            />
          </div>

          {/* Filtros por qualidade */}
          <div className="flex gap-1 shrink-0">
            {([
              { key: 'all', label: 'Todos', count: leads.length },
              { key: 'with-whatsapp', label: 'WhatsApp', count: leadsWithWhatsapp.length },
              { key: 'with-decisor', label: 'Decisor', count: leadsWithDecisor.length },
              { key: 'complete', label: 'Completos', count: leadsComplete.length },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setDataFilter(f.key)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border whitespace-nowrap',
                  dataFilter === f.key
                    ? 'bg-red/15 text-red border-red/30'
                    : 'bg-white/[0.02] text-text-muted border-border hover:border-border-strong hover:text-text-secondary',
                )}
              >
                {f.label} <span className="ml-0.5 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-text-muted mb-2">
          {filteredLeads.length} de {leads.length} leads {dataFilter !== 'all' ? `(filtro: ${dataFilter === 'with-whatsapp' ? 'com WhatsApp' : dataFilter === 'with-decisor' ? 'com decisor' : 'completos'})` : ''}
        </p>

        {/* Tabela de resultados com priorizacao visual */}
        <div className="rounded-lg border border-border overflow-hidden" role="region" aria-label="Resultados da PESCA">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs" aria-label="Leads extraidos">
              <thead className="bg-white/[0.03] sticky top-0 z-10">
                <tr>
                  <th className="w-8 px-2 py-2.5" />
                  <th className="text-left px-3 py-2.5 text-text-muted font-medium cursor-pointer hover:text-text-secondary select-none" onClick={() => handleSort('company')}>
                    <span className="flex items-center gap-1">Empresa {sortField === 'company' && (sortDir === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}</span>
                  </th>
                  <th className="text-left px-3 py-2.5 text-text-muted font-medium">CNPJ</th>
                  <th className="text-left px-3 py-2.5 text-text-muted font-medium">Decisor</th>
                  <th className="text-left px-3 py-2.5 text-text-muted font-medium">WhatsApp</th>
                  <th className="text-right px-3 py-2.5 text-text-muted font-medium cursor-pointer hover:text-text-secondary select-none" onClick={() => handleSort('capital')}>
                    <span className="flex items-center gap-1 justify-end">Capital {sortField === 'capital' && (sortDir === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}</span>
                  </th>
                  <th className="text-left px-3 py-2.5 text-text-muted font-medium cursor-pointer hover:text-text-secondary select-none" onClick={() => handleSort('state')}>
                    <span className="flex items-center gap-1">UF {sortField === 'state' && (sortDir === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead, i) => {
                  const quality = getLeadQuality(lead)
                  const qc = QUALITY_CONFIG[quality]
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] group">
                      {/* Indicador de qualidade */}
                      <td className="px-2 py-2.5">
                        <span className={cn('w-2 h-2 rounded-full block mx-auto', qc.dot)} title={qc.label} />
                      </td>
                      {/* Empresa */}
                      <td className="px-3 py-2.5">
                        <p className="text-text-primary font-medium truncate max-w-[180px]">{lead.tradeName || lead.companyName}</p>
                        {lead.segment && <p className="text-[10px] text-text-muted truncate max-w-[180px]">{lead.segment}</p>}
                      </td>
                      {/* CNPJ */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => copyToClipboard(lead.cnpj)}
                          className="flex items-center gap-1 font-mono text-text-muted hover:text-text-secondary cursor-pointer group/cnpj"
                          title="Copiar CNPJ"
                        >
                          {formatCnpj(lead.cnpj)}
                          <Copy className="h-3 w-3 opacity-0 group-hover/cnpj:opacity-50 transition-opacity" />
                        </button>
                      </td>
                      {/* Decisor */}
                      <td className="px-3 py-2.5">
                        {lead.decisorName ? (
                          <div>
                            <p className="text-text-primary truncate max-w-[130px]">{lead.decisorName}</p>
                            {lead.decisorRole && <p className="text-[10px] text-text-muted truncate max-w-[130px]">{lead.decisorRole}</p>}
                          </div>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      {/* WhatsApp — CTA principal */}
                      <td className="px-3 py-2.5">
                        {lead.whatsapp ? (
                          <a
                            href={formatWhatsappLink(lead.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-whatsapp/10 text-whatsapp hover:bg-whatsapp/20 font-mono text-[11px] transition-all"
                          >
                            <Phone className="h-3 w-3" />
                            {lead.whatsapp.replace(/^55/, '')}
                            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                          </a>
                        ) : lead.phone ? (
                          <button
                            onClick={() => copyToClipboard(lead.phone!)}
                            className="text-text-muted font-mono hover:text-text-secondary cursor-pointer"
                            title="Copiar telefone"
                          >
                            {lead.phone.replace(/^55/, '')}
                          </button>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      {/* Capital */}
                      <td className="px-3 py-2.5 text-right text-text-muted">{formatCapital(lead.capitalSocial)}</td>
                      {/* UF */}
                      <td className="px-3 py-2.5 text-text-muted">{lead.state || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredLeads.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-text-muted">
              Nenhum lead encontrado com esses filtros.
            </div>
          )}
        </div>
      </Card>

      {/* Acoes finais */}
      <div className="flex gap-2">
        <Button
          onClick={reset}
          className="flex-1 py-2.5 text-sm bg-red hover:bg-red-vivid text-white rounded-xl flex items-center justify-center gap-2"
        >
          <Fish className="h-4 w-4" />
          Nova PESCA
        </Button>
        <a
          href="#/leads"
          className="flex-1 py-2.5 text-sm bg-white/[0.05] hover:bg-white/[0.08] text-text-secondary rounded-xl border border-border flex items-center justify-center gap-2"
        >
          Ver todos os Leads <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
