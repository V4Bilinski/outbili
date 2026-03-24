import { Card, CardTitle } from '../components/ui/Card'
import { Search, MapPin, Globe, TrendingUp, X, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/cn'

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

// --- Main page ---
export function SearchPage() {
  const [segments, setSegments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [revenueMin, setRevenueMin] = useState('')
  const [revenueMax, setRevenueMax] = useState('')

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'
  const selectClass = cn(inputClass, 'appearance-none cursor-pointer')

  const activeFilters = segments.length + states.length + (city ? 1 : 0) + keywords.length + (revenueMin ? 1 : 0) + (revenueMax ? 1 : 0)

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
          <Button size="lg" icon={<Search className="h-4 w-4" />}>
            Pesquisar via Apify
          </Button>
          <span className="text-[11px] text-text-muted">Estimativa: 30-120 segundos</span>
        </div>
      </Card>

      {/* Data sources */}
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
    </div>
  )
}
