import { useState, useRef, useCallback } from 'react'
import { parseFile, ACCEPTED_FORMATS, FORMAT_LABELS, type ParseResult } from '../lib/file-parser'
import { useCreateLead } from '../hooks/useLeads'
import { Button } from './ui/Button'
import { cn } from '../lib/cn'
import { Upload, FileText, X, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'upload' | 'preview' | 'importing' | 'done'

interface ImportModalProps {
  open: boolean
  onClose: () => void
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [segment, setSegment] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createLead = useCreateLead()

  const handleFile = useCallback(async (file: File) => {
    setStep('preview')
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

    for (const company of companies) {
      try {
        await createLead.mutateAsync({
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
          businessSummary: company.notes || '',
        })
      } catch { /* toast already handled by mutation */ }
      done++
      setImportProgress(Math.round((done / companies.length) * 100))
    }

    setStep('done')
    toast.success(`${done} empresas importadas com sucesso`)
  }

  const reset = () => {
    setStep('upload')
    setParseResult(null)
    setSelected(new Set())
    setSegment('')
    setImportProgress(0)
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
                <div className={cn('p-4 rounded-2xl mb-4 transition-all', isDragging ? 'bg-red/10' : 'bg-white/[0.04]')}>
                  <Upload className={cn('h-8 w-8 transition-colors', isDragging ? 'text-red' : 'text-text-muted')} />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-xs text-text-muted text-center">
                  Planilhas (Excel, CSV), documentos (PDF, TXT), páginas HTML
                </p>
                <p className="text-[10px] text-text-muted mt-2">
                  O sistema identifica automaticamente colunas como: empresa, CNPJ, telefone, email, cidade, segmento
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

          {/* Step: Preview */}
          {step === 'preview' && parseResult && (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{parseResult.fileName}</p>
                  <p className="text-[11px] text-text-muted">
                    {parseResult.fileType} · {parseResult.totalRows} linhas · {parseResult.companies.length} empresas identificadas
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>Trocar arquivo</Button>
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

              {/* Segment selector */}
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

              {/* Companies list */}
              {parseResult.companies.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">{selected.size} de {parseResult.companies.length} selecionadas</span>
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(new Set(parseResult.companies.map((_, i) => i)))} className="text-[11px] text-red cursor-pointer hover:underline">Selecionar todas</button>
                      <button onClick={() => setSelected(new Set())} className="text-[11px] text-text-muted cursor-pointer hover:underline">Limpar</button>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5 rounded-xl border border-border p-2">
                    {parseResult.companies.map((company, i) => (
                      <label
                        key={i}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                          selected.has(i) ? 'bg-red/5 border border-red/15' : 'hover:bg-white/[0.02] border border-transparent',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => {
                            const next = new Set(selected)
                            next.has(i) ? next.delete(i) : next.add(i)
                            setSelected(next)
                          }}
                          className="accent-red w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{company.companyName}</p>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {company.phone && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.phone}</span>}
                            {company.email && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.email}</span>}
                            {company.city && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.city}{company.state ? `, ${company.state}` : ''}</span>}
                            {company.website && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[150px]">{company.website}</span>}
                            {company.segment && <span className="text-[10px] text-red bg-red/10 px-1.5 py-0.5 rounded">{company.segment}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected columns */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Colunas detectadas</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseResult.columns.map((col) => (
                    <span key={col} className="text-[10px] text-text-secondary bg-white/5 border border-border px-2 py-0.5 rounded-md">{col}</span>
                  ))}
                </div>
              </div>

              {/* Import button */}
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={reset}>Cancelar</Button>
                <Button
                  icon={<ArrowRight className="h-4 w-4" />}
                  onClick={handleImport}
                  disabled={selected.size === 0}
                >
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
              <p className="text-xs text-text-muted">{Math.round(importProgress / 100 * (selected.size || 1))} de {selected.size} processadas</p>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden max-w-xs mx-auto">
                <div className="h-full rounded-full bg-gradient-to-r from-red-dark to-red transition-all duration-300" style={{ width: `${importProgress}%` }} />
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="py-12 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-success/10 inline-flex mx-auto">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Importação concluída!</h3>
              <p className="text-sm text-text-muted">
                {selected.size} empresa{selected.size !== 1 ? 's' : ''} importada{selected.size !== 1 ? 's' : ''} com sucesso para o pipeline.
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
