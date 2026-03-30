import { useState, useRef, useCallback, useEffect } from 'react'
import { parseFile, ACCEPTED_FORMATS, FORMAT_LABELS, type ParseResult } from '../lib/file-parser'
import { useCreateLead } from '../hooks/useLeads'
import { Button } from './ui/Button'
import { cn } from '../lib/cn'
import { Upload, X, CheckCircle, AlertTriangle, ArrowRight, Scan, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '../types'

type Step = 'upload' | 'reading' | 'preview' | 'importing' | 'done' | 'enriching'

// Fields that can be detected
const DETECTABLE_FIELDS = [
  { key: 'companyName', label: 'Empresa', icon: '🏢' },
  { key: 'cnpj', label: 'CNPJ', icon: '📋' },
  { key: 'phone', label: 'Telefone', icon: '📞' },
  { key: 'email', label: 'E-mail', icon: '📧' },
  { key: 'website', label: 'Website', icon: '🌐' },
  { key: 'city', label: 'Cidade', icon: '📍' },
  { key: 'state', label: 'Estado', icon: '🗺' },
  { key: 'segment', label: 'Segmento', icon: '🏷' },
  { key: 'contactName', label: 'Contato', icon: '👤' },
  { key: 'contactRole', label: 'Cargo', icon: '💼' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💡' },
  { key: 'address', label: 'Endereço', icon: '🏠' },
  { key: 'notes', label: 'Observações', icon: '📝' },
]

const READING_MESSAGES = [
  'Analisando estrutura do arquivo...',
  'Identificando colunas e dados...',
  'Mapeando campos de empresas...',
  'Extraindo informações de contato...',
  'Validando dados encontrados...',
]

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onEnrichRequest?: (leads: Lead[]) => void
}

// Animated reading step
function ReadingAnimation({ fileName, onComplete, parseResult }: {
  fileName: string
  onComplete: () => void
  parseResult: ParseResult | null
}) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [detectedFields, setDetectedFields] = useState<string[]>([])
  const [showComplete, setShowComplete] = useState(false)

  useEffect(() => {
    // Cycle messages
    const msgTimer = setInterval(() => {
      setMsgIndex((n) => Math.min(n + 1, READING_MESSAGES.length - 1))
    }, 800)

    // Progressively reveal detected fields
    if (parseResult) {
      const foundFields = DETECTABLE_FIELDS
        .filter((f) => parseResult.companies.some((c: any) => c[f.key]))
        .map((f) => f.key)

      let i = 0
      const fieldTimer = setInterval(() => {
        if (i < foundFields.length) {
          setDetectedFields((prev) => [...prev, foundFields[i]])
          i++
        } else {
          clearInterval(fieldTimer)
          setTimeout(() => {
            setShowComplete(true)
            setTimeout(onComplete, 800)
          }, 500)
        }
      }, 300)

      return () => { clearInterval(msgTimer); clearInterval(fieldTimer) }
    }

    // Fallback if no parseResult yet
    const fallbackTimer = setTimeout(() => {
      setShowComplete(true)
      setTimeout(onComplete, 500)
    }, 3000)

    return () => { clearInterval(msgTimer); clearTimeout(fallbackTimer) }
  }, [parseResult, onComplete])

  return (
    <div className="py-8 space-y-6">
      {/* File being read */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border mx-auto max-w-sm">
        <div className="p-2.5 rounded-xl bg-red/10 animate-pulse">
          <Scan className="h-5 w-5 text-red" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">{fileName}</p>
          <p className="text-[11px] text-text-muted animate-[fade-in_0.3s_ease-out]" key={msgIndex}>
            {READING_MESSAGES[msgIndex]}
          </p>
        </div>
      </div>

      {/* Scanning animation */}
      <div className="relative max-w-md mx-auto">
        {/* Scan line */}
        {!showComplete && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red to-transparent animate-[scan_1.5s_ease-in-out_infinite] z-10" />
        )}

        {/* Fields grid — light up when detected */}
        <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl bg-white/[0.01] border border-border">
          {DETECTABLE_FIELDS.map((field) => {
            const isDetected = detectedFields.includes(field.key)
            return (
              <div
                key={field.key}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-500',
                  isDetected
                    ? 'bg-success/8 border-success/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]'
                    : 'bg-white/[0.01] border-border/50 opacity-30',
                )}
              >
                <span className="text-sm">{field.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium transition-colors', isDetected ? 'text-success' : 'text-text-muted')}>
                    {field.label}
                  </p>
                </div>
                {isDetected && (
                  <CheckCircle className="h-3.5 w-3.5 text-success animate-[fade-in_0.3s_ease-out] shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      {showComplete && parseResult && (
        <div className="text-center animate-[slide-up_0.4s_ease-out]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
            <Sparkles className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-success">
              {parseResult.companies.length} empresas identificadas · {detectedFields.length} campos mapeados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function ImportModal({ open, onClose, onEnrichRequest }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [segment, setSegment] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [createdLeads, setCreatedLeads] = useState<Lead[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createLead = useCreateLead()

  const handleFile = useCallback(async (file: File) => {
    setStep('reading')
    const result = await parseFile(file)
    setParseResult(result)
    setSelected(new Set(result.companies.map((_, i) => i)))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    if (!parseResult) return
    setStep('importing')
    const companies = parseResult.companies.filter((_, i) => selected.has(i))
    let done = 0
    const imported: Lead[] = []

    for (const company of companies) {
      try {
        const lead = await createLead.mutateAsync({
          companyName: company.companyName,
          cnpj: company.cnpj || '',
          segment: segment || company.segment || '',
          tier: 'Small',
          status: 'Novo',
          score: 0,
          temperature: 'COLD',
          spicedS: 0, spicedP: 0, spicedI: 0, spicedC: 0, spicedD: 0,
          website: company.website || '',
          instagram: company.instagram || '',
          linkedin: company.linkedin || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          businessSummary: [company.notes, company.contactName ? `Contato: ${company.contactName}${company.contactRole ? ` (${company.contactRole})` : ''}` : ''].filter(Boolean).join(' · '),
          sourceHtmlReport: 'importado_manual',
        })
        imported.push(lead)
      } catch { /* error handled by mutation */ }
      done++
      setImportProgress(Math.round((done / companies.length) * 100))
    }

    setCreatedLeads(imported)
    setStep('done')
    toast.success(`${done} empresas importadas com sucesso`)
  }

  const reset = () => {
    setStep('upload')
    setParseResult(null)
    setSelected(new Set())
    setSegment('')
    setImportProgress(0)
    setCreatedLeads([])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-surface border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-surface/95 backdrop-blur-xl rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold font-heading text-text-primary">Importar empresas</h2>
            <p className="text-xs text-text-muted mt-0.5">Aceita {FORMAT_LABELS}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.04] text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
                  isDragging
                    ? 'border-red bg-red/5 scale-[1.02]'
                    : 'border-border hover:border-border-strong hover:bg-white/[0.02]',
                )}
              >
                <div className={cn('p-4 rounded-2xl mb-4 transition-all', isDragging ? 'bg-red/10 scale-110' : 'bg-white/[0.04]')}>
                  <Upload className={cn('h-8 w-8 transition-colors', isDragging ? 'text-red' : 'text-text-muted')} />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-xs text-text-muted text-center">
                  Planilhas (Excel, CSV), documentos (PDF, TXT), páginas HTML
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { ext: 'XLSX', label: 'Excel' },
                  { ext: 'CSV', label: 'CSV' },
                  { ext: 'PDF', label: 'PDF' },
                  { ext: 'HTML', label: 'HTML' },
                  { ext: 'TXT', label: 'Texto' },
                ].map((f) => (
                  <div key={f.ext} className="p-2.5 rounded-xl bg-white/[0.02] border border-border text-center">
                    <p className="text-[10px] font-bold font-mono text-text-muted">.{f.ext}</p>
                    <p className="text-[9px] text-text-muted">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Reading with animation */}
          {step === 'reading' && (
            <ReadingAnimation
              fileName={parseResult?.fileName || 'Processando...'}
              parseResult={parseResult}
              onComplete={() => setStep('preview')}
            />
          )}

          {/* Step: Preview */}
          {step === 'preview' && parseResult && (
            <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/15">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{parseResult.fileName}</p>
                  <p className="text-[11px] text-success">
                    {parseResult.fileType} · {parseResult.companies.length} empresas · {parseResult.columns.length} colunas
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>Trocar</Button>
              </div>

              {/* Detected fields summary */}
              <div className="flex flex-wrap gap-1.5">
                {DETECTABLE_FIELDS.filter((f) => parseResult.companies.some((c: any) => c[f.key])).map((field) => (
                  <span key={field.key} className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/8 border border-success/15 px-2 py-1 rounded-lg">
                    {field.icon} {field.label}
                  </span>
                ))}
                {DETECTABLE_FIELDS.filter((f) => !parseResult.companies.some((c: any) => c[f.key])).slice(0, 4).map((field) => (
                  <span key={field.key} className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-white/[0.03] border border-border px-2 py-1 rounded-lg opacity-40">
                    {field.icon} {field.label}
                  </span>
                ))}
              </div>

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-warning/8 border border-warning/20">
                  {parseResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-warning flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Segment */}
              {parseResult.companies.length > 0 && (
                <div>
                  <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Segmento (aplicar a todos)</label>
                  <input
                    type="text"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    placeholder="Ex: Odontologia, Estética, Varejo..."
                    className="h-10 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none"
                  />
                </div>
              )}

              {/* Companies */}
              {parseResult.companies.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">{selected.size} de {parseResult.companies.length} selecionadas</span>
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(new Set(parseResult.companies.map((_, i) => i)))} className="text-[11px] text-red cursor-pointer hover:underline">Todas</button>
                      <button onClick={() => setSelected(new Set())} className="text-[11px] text-text-muted cursor-pointer hover:underline">Nenhuma</button>
                    </div>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto space-y-1.5 rounded-xl border border-border p-2">
                    {parseResult.companies.map((company, i) => (
                      <label
                        key={i}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                          selected.has(i) ? 'bg-red/5 border border-red/15' : 'hover:bg-white/[0.02] border border-transparent',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => { const next = new Set(selected); next.has(i) ? next.delete(i) : next.add(i); setSelected(next) }}
                          className="accent-red w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{company.companyName}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {company.phone && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.phone}</span>}
                            {company.email && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.email}</span>}
                            {company.city && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.city}{company.state ? `, ${company.state}` : ''}</span>}
                            {company.website && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[120px]">{company.website}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={reset}>Cancelar</Button>
                <Button icon={<ArrowRight className="h-4 w-4" />} onClick={handleImport} disabled={selected.size === 0}>
                  Importar {selected.size} empresa{selected.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-border" />
                <div className="absolute inset-0 rounded-full border-2 border-red border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold font-mono text-red">{importProgress}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-text-primary">Importando empresas...</p>
              <p className="text-xs text-text-muted">{Math.round(importProgress / 100 * (selected.size || 1))} de {selected.size}</p>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden max-w-xs mx-auto">
                <div className="h-full rounded-full bg-gradient-to-r from-red-dark to-red transition-all duration-300" style={{ width: `${importProgress}%` }} />
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="py-12 text-center space-y-4 animate-[slide-up_0.4s_ease-out]">
              <div className="p-4 rounded-2xl bg-success/10 inline-flex mx-auto">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Importação concluída!</h3>
              <p className="text-sm text-text-muted">
                {createdLeads.length} empresa{createdLeads.length !== 1 ? 's' : ''} adicionada{createdLeads.length !== 1 ? 's' : ''} ao pipeline.
              </p>

              {/* Enrichment CTA */}
              {createdLeads.length > 0 && onEnrichRequest && (
                <div className="p-4 rounded-2xl bg-red/5 border border-red/15 text-left space-y-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red/10">
                      <Zap className="h-5 w-5 text-red" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Enriquecer dados automaticamente?</p>
                      <p className="text-[11px] text-text-muted">
                        CNPJ, Google Maps, Instagram, LinkedIn, contatos e mais
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    icon={<Zap className="h-4 w-4" />}
                    onClick={() => {
                      onEnrichRequest(createdLeads)
                      reset()
                      onClose()
                      toast.success(`Enriquecimento iniciado para ${createdLeads.length} empresa${createdLeads.length !== 1 ? 's' : ''}`)
                    }}
                  >
                    Enriquecer {createdLeads.length} empresa{createdLeads.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}

              <p className="text-[11px] text-text-muted">
                Identificadas com a tag <span className="text-info font-medium bg-info/10 px-1.5 py-0.5 rounded">Importado manual</span> na lista de leads.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="ghost" onClick={() => { reset(); onClose() }}>Fechar</Button>
                <Button onClick={() => { reset(); onClose() }} icon={<ArrowRight className="h-4 w-4" />}>Ver leads</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
