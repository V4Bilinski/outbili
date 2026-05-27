import { useState } from 'react'
import { X, ArrowRight, Check } from 'lucide-react'

// FASE 4 onboarding: tour de boas-vindas das telas principais. Nao-bloqueante (pode pular).
// Visto uma vez por navegador (localStorage). Aparece apos o 1o acesso (sem reset de senha pendente).
const STEPS = [
  { title: 'Bem-vindo ao OUTBILI', body: 'Sua central de prospecção B2B. Vamos dar um tour rápido pelas telas principais.' },
  { title: 'Dashboard', body: 'Visão geral do seu pipeline: indicadores, próximas ações e diagnóstico. Use o seletor "Meus / Todos" para focar na sua carteira.' },
  { title: 'Leads', body: 'Sua base de empresas. Filtre, busque e alterne entre lista e cards. A aba "Meus leads" mostra os que são seus.' },
  { title: 'Pipeline', body: 'Funil de vendas em kanban. Arraste leads entre etapas (Prospecção até Fechado) ou marque como Perdido. Use a busca para achar rápido.' },
  { title: 'Ficha do lead', body: 'Abra um lead para ver sócios, SPICED e presença digital, e registrar contatos. Cada ação fica no Histórico com seu nome, data e hora.' },
  { title: 'Tudo pronto', body: 'Toda empresa que você prospectar já entra com você como responsável. Bom trabalho!' },
]

const TOUR_KEY = 'outbili-tour-v1'

export function WelcomeTour() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem(TOUR_KEY) === 'done' } catch { return false }
  })

  if (done) return null

  const finish = () => {
    try { localStorage.setItem(TOUR_KEY, 'done') } catch { /* ignore */ }
    setDone(true)
  }

  const isLast = step === STEPS.length - 1
  const s = STEPS[step]

  return (
    <div className="fixed inset-0 z-[9990] bg-overlay backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-2xl animate-[fade-in_0.2s_ease-out]">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-bold text-text-primary">{s.title}</p>
          <button type="button" onClick={finish} className="text-text-muted hover:text-text-primary transition-colors shrink-0" title="Pular tour">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-red' : 'w-1.5 bg-elevated-hover'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={finish} className="text-xs text-text-muted hover:text-text-secondary transition-colors">Pular</button>
            <button
              type="button"
              onClick={() => (isLast ? finish() : setStep((v) => v + 1))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red text-white text-xs font-semibold hover:bg-red/90 transition-colors"
            >
              {isLast ? <>Começar <Check className="h-3.5 w-3.5" /></> : <>Próximo <ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
