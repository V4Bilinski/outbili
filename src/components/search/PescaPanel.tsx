import { useState, useMemo } from 'react'
import { Card, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Fish, Loader2, CheckCircle, AlertCircle, ChevronDown, ArrowRight, Phone, Building2, User, DollarSign, Search, SortAsc, SortDesc, Copy, ExternalLink } from 'lucide-react'
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

const REVENUE_MIN_OPTIONS = [
  { value: 0, label: 'Qualquer' },
  { value: 10000, label: 'R$ 10k' },
  { value: 50000, label: 'R$ 50k' },
  { value: 70000, label: 'R$ 70k' },
  { value: 100000, label: 'R$ 100k' },
  { value: 200000, label: 'R$ 200k' },
  { value: 500000, label: 'R$ 500k' },
]

const REVENUE_MAX_OPTIONS = [
  { value: 200000, label: 'R$ 200k' },
  { value: 500000, label: 'R$ 500k' },
  { value: 1000000, label: 'R$ 1M' },
  { value: 2000000, label: 'R$ 2M' },
  { value: 5000000, label: 'R$ 5M' },
  { value: 10000000, label: 'R$ 10M+' },
]

const PHASE_LABELS: Record<PescaPhase, string> = {
  idle: '',
  searching: 'Pesquisando empresas via CNPJa...',
  enriching: 'Enriquecendo com Assertiva (telefones + decisores)...',
  deduplicating: 'Removendo duplicatas...',
  saving: 'Salvando no sistema...',
  done: 'Concluido!',
  error: 'Erro na pesquisa',
}

const PHASE_STEPS: PescaPhase[] = ['searching', 'enriching', 'deduplicating', 'saving']

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

export function PescaPanel() {
  const [segments, setSegments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [revenueMin, setRevenueMin] = useState(0)
  const [revenueMax, setRevenueMax] = useState(2000000)
  const [excludeMei, setExcludeMei] = useState(true)
  const [showAllStates, setShowAllStates] = useState(false)

  // Estado do painel de resultados
  const [dataFilter, setDataFilter] = useState<DataFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('company')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { phase, progress, leads, error, elapsed, startPesca, cancel, reset, resetExecution } = usePesca()

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

  const handleStart = async () => {
    if (segments.length === 0) {
      toast.error('Selecione pelo menos um segmento')
      return
    }
    if (revenueMin > 0 && revenueMax > 0 && revenueMin > revenueMax) {
      toast.error('Capital social mínimo não pode ser maior que o máximo')
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
    }

    setDataFilter('all')
    setSearchQuery('')
    await startPesca(filters)
  }

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

  // ========================================
  // IDLE: Formulario de busca
  // ========================================
  if (phase === 'idle') {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red/10 border border-red/20">
            <Fish className="h-5 w-5 text-red" />
          </div>
          <div>
            <CardTitle>Pesquisa em massa</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              CNPJa + Assertiva: empresas com CNPJ, decisor e WhatsApp confirmado
            </p>
          </div>
        </div>

        {/* Segmentos */}
        <div className="mb-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">Segmento *</label>
          <div className="flex flex-wrap gap-1.5">
            {SEGMENTS.map(seg => (
              <button
                key={seg.slug}
                onClick={() => toggleSegment(seg.name)}
                aria-pressed={segments.includes(seg.name)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
                  segments.includes(seg.name)
                    ? 'bg-red/20 text-red border-red/30'
                    : 'bg-white/[0.03] text-text-muted border-border hover:border-border-strong hover:text-text-secondary',
                )}
              >
                {seg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Estados */}
        <div className="mb-4">
          <label className="text-xs font-medium text-text-secondary mb-2 block">
            Estados {states.length > 0 && <span className="text-text-muted">({states.length} selecionados)</span>}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {RECOMMENDED_STATES.map(uf => (
              <button
                key={uf}
                onClick={() => toggleState(uf)}
                aria-pressed={states.includes(uf)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
                  states.includes(uf)
                    ? 'bg-red/20 text-red border-red/30'
                    : 'bg-white/[0.03] text-text-muted border-border hover:border-border-strong hover:text-text-secondary',
                )}
              >
                {uf}
              </button>
            ))}
            <button
              onClick={() => setShowAllStates(!showAllStates)}
              aria-expanded={showAllStates}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-secondary cursor-pointer"
            >
              {showAllStates ? 'Menos' : 'Mais'} <ChevronDown className={cn('h-3 w-3 transition-transform', showAllStates && 'rotate-180')} />
            </button>
          </div>
          {showAllStates && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-border">
              {ALL_STATES.filter(s => !RECOMMENDED_STATES.includes(s.uf)).map(s => (
                <button
                  key={s.uf}
                  onClick={() => toggleState(s.uf)}
                  aria-pressed={states.includes(s.uf)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer border',
                    states.includes(s.uf)
                      ? 'bg-red/20 text-red border-red/30'
                      : 'bg-white/[0.03] text-text-muted border-border hover:text-text-secondary',
                  )}
                >
                  {s.uf}
                </button>
              ))}
            </div>
          )}
          {states.length === 0 && (
            <p className="text-[10px] text-text-muted mt-1">Nenhum selecionado = busca em todos os estados</p>
          )}
        </div>

        {/* Faixa de Capital */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Capital Social Min</label>
            <select
              value={revenueMin}
              onChange={e => setRevenueMin(Number(e.target.value))}
              className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-red/50 focus:outline-none"
            >
              {REVENUE_MIN_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Capital Social Max</label>
            <select
              value={revenueMax}
              onChange={e => setRevenueMax(Number(e.target.value))}
              className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-red/50 focus:outline-none"
            >
              {REVENUE_MAX_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Excluir MEI */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeMei}
              onChange={e => setExcludeMei(e.target.checked)}
              className="rounded border-border accent-red"
            />
            <span className="text-xs text-text-secondary">Excluir MEI (microempreendedor individual)</span>
          </label>
        </div>

        {/* CTA */}
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-3 text-sm font-bold bg-red hover:bg-red-vivid text-white rounded-xl transition-all shadow-lg shadow-red/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Search className="h-4 w-4" />
          Pesquisar empresas
        </Button>

        <p className="text-[10px] text-text-muted text-center mt-2">
          Pesquisa via CNPJa (dados cadastrais) + Assertiva (telefones e decisores)
        </p>
      </Card>
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
              <CardTitle>PESCA em andamento</CardTitle>
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
            return (
              <div key={step} className={cn('flex items-center gap-3 p-2.5 rounded-lg border transition-all', isActive ? 'border-red/30 bg-red/5' : isCompleted ? 'border-success/20 bg-success/5' : 'border-border bg-white/[0.02]')}>
                {isCompleted && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                {isActive && <Loader2 className="h-4 w-4 text-red animate-spin shrink-0" />}
                {isPending && <div className="h-4 w-4 rounded-full border border-border shrink-0" />}
                <p className={cn('text-xs font-medium flex-1', isActive ? 'text-text-primary' : isCompleted ? 'text-success' : 'text-text-muted')}>
                  {PHASE_LABELS[step]}
                </p>
                <span className="text-xs font-mono text-text-muted shrink-0">
                  {step === 'searching' && progress.found > 0 && `${progress.found}`}
                  {step === 'enriching' && progress.enriched > 0 && `${progress.enriched}/${progress.found}`}
                  {step === 'deduplicating' && progress.deduped > 0 && `${progress.deduped} únicos`}
                  {step === 'saving' && progress.saved > 0 && `${progress.saved}/${progress.deduped}`}
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
  // ERROR
  // ========================================
  if (phase === 'error') {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-error/10 border border-error/20">
            <AlertCircle className="h-5 w-5 text-error" />
          </div>
          <div>
            <CardTitle>Erro na PESCA</CardTitle>
            <p className="text-xs text-error mt-0.5">{error}</p>
          </div>
        </div>
        <Button onClick={resetExecution} className="w-full py-2.5 text-sm bg-white/[0.05] hover:bg-white/[0.08] text-text-secondary rounded-xl border border-border">
          Tentar novamente
        </Button>
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
