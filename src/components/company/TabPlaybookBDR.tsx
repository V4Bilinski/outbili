import { useState } from 'react'
import { AccordionItem } from '../ui/AccordionItem'
import { Badge } from '../ui/Badge'
import { CopyButton } from '../ui/CopyButton'
import { Phone } from 'lucide-react'
import { WhatsAppIcon } from '../ui/WhatsAppIcon'
import { LinkedInIcon } from '../ui/LinkedInIcon'
import { cn } from '../../lib/cn'
import type { Lead, Contact } from '../../types'
import { detectTravas, generatePlaybookBDR } from '../../services/strategicAnalysisService'

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, activeColor: 'text-whatsapp', borderColor: 'border-whatsapp', isCustomIcon: true },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, activeColor: 'text-info', borderColor: 'border-info', isCustomIcon: true },
  { id: 'ligacao', label: 'Ligação', icon: Phone, activeColor: 'text-red', borderColor: 'border-red', isCustomIcon: false },
] as const

function ScriptCard({ label, text, labelColor, bgColor, borderColor, showCharCount, maxChars }: {
  label: string; text: string; labelColor: string; bgColor: string; borderColor: string
  showCharCount?: boolean; maxChars?: number
}) {
  return (
    <div className={cn('p-4 rounded-xl border', bgColor, borderColor)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-[10px] uppercase tracking-wider font-medium', labelColor)}>{label}</span>
        <CopyButton text={text} />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{text}</p>
      {showCharCount && (
        <div className="flex justify-end mt-2">
          <span className={cn('text-[10px] font-mono', (text.length > (maxChars || 300)) ? 'text-error' : 'text-text-muted')}>
            {text.length}/{maxChars || 300}
          </span>
        </div>
      )}
    </div>
  )
}

export function TabPlaybookBDR({ lead, contacts }: { lead: Lead; contacts?: Contact[] }) {
  const [activeChannel, setActiveChannel] = useState('whatsapp')
  const travas = detectTravas(lead)
  // Pegar primeiro nome do decisor dos contacts (prioridade) ou partners
  const decisorContact = contacts?.find(c => c.contactType === 'decisor') || contacts?.[0]
  const playbook = generatePlaybookBDR(lead, travas, decisorContact?.name)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WhatsAppIcon className="text-sm text-whatsapp" />
          <h3 className="text-sm font-semibold font-heading">Playbook BDR</h3>
        </div>
        <Badge variant="error" size="sm">{playbook.travaPrincipal}</Badge>
      </div>

      {/* Contexto rápido */}
      <div className="p-4 rounded-xl bg-surface-md border border-border">
        <p className="text-sm text-text-secondary">{playbook.contexto}</p>
      </div>

      {/* Sub-abas de canal */}
      <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all',
              'border-b-2 cursor-pointer min-h-[44px]',
              activeChannel === ch.id
                ? `${ch.activeColor} ${ch.borderColor}`
                : 'text-text-muted border-transparent hover:text-text-secondary',
            )}
          >
            {ch.isCustomIcon ? <ch.icon className="text-sm" /> : <ch.icon className="h-3.5 w-3.5" />}
            {ch.label}
          </button>
        ))}
      </div>

      {/* Conteúdo do canal ativo */}
      <div className="space-y-4 animate-[fade-in_0.15s_ease-out]" key={activeChannel}>
        {activeChannel === 'whatsapp' && (
          <>
            <ScriptCard
              label="Primeira mensagem"
              text={playbook.canais.whatsapp.abertura}
              labelColor="text-whatsapp" bgColor="bg-whatsapp/[0.04]" borderColor="border-whatsapp/15"
              showCharCount maxChars={300}
            />
            <ScriptCard
              label="Follow-up 48h"
              text={playbook.canais.whatsapp.followUp}
              labelColor="text-warning" bgColor="bg-warning/[0.04]" borderColor="border-warning/15"
              showCharCount maxChars={300}
            />

            {/* Objeções */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Objeções e respostas</span>
              {Object.entries(playbook.canais.whatsapp.objecoes).map(([objecao, resposta], i) => (
                <AccordionItem
                  key={i}
                  accentColor="var(--color-error)"
                  title={
                    <span className="text-sm text-error italic">&ldquo;{objecao}&rdquo;</span>
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-text-secondary leading-relaxed">{resposta}</p>
                    <CopyButton text={resposta} className="shrink-0" />
                  </div>
                </AccordionItem>
              ))}
            </div>

            <ScriptCard
              label="CTA — Fechamento para reunião"
              text={playbook.canais.whatsapp.cta}
              labelColor="text-red" bgColor="bg-red/[0.06]" borderColor="border-red/20"
            />
          </>
        )}

        {activeChannel === 'linkedin' && (
          <>
            <ScriptCard
              label="Nota de conexão"
              text={playbook.canais.linkedin.conexao}
              labelColor="text-info" bgColor="bg-info/[0.04]" borderColor="border-info/15"
              showCharCount maxChars={300}
            />
            <ScriptCard
              label="InMail (se não aceitar conexão)"
              text={playbook.canais.linkedin.inmail}
              labelColor="text-info" bgColor="bg-info/[0.04]" borderColor="border-info/15"
            />
            <ScriptCard
              label="Comentário em post do decisor"
              text={playbook.canais.linkedin.comentario}
              labelColor="text-text-muted" bgColor="bg-white/[0.02]" borderColor="border-border"
            />
          </>
        )}

        {activeChannel === 'ligacao' && (
          <>
            <ScriptCard
              label="Abertura (primeiros 30 segundos)"
              text={playbook.canais.ligacao.abertura}
              labelColor="text-red" bgColor="bg-red/[0.04]" borderColor="border-red/15"
            />

            {/* Perguntas de qualificação */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium block mb-3">3 perguntas de qualificação</span>
              <div className="space-y-3">
                {playbook.canais.ligacao.qualificacao.map((pergunta, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-red mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-text-secondary">{pergunta}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Frase-gatilho */}
            <div className="p-4 rounded-xl bg-red/[0.06] border border-red/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-red font-medium">Frase-gatilho</span>
                <CopyButton text={playbook.canais.ligacao.gatilho} />
              </div>
              <p className="text-sm font-medium text-text-primary leading-relaxed">{playbook.canais.ligacao.gatilho}</p>
            </div>

            {/* Objeções */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Objeções por telefone</span>
              {Object.entries(playbook.canais.ligacao.objecoes).map(([objecao, resposta], i) => (
                <AccordionItem
                  key={i}
                  accentColor="var(--color-error)"
                  title={<span className="text-sm text-error italic">&ldquo;{objecao}&rdquo;</span>}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-text-secondary leading-relaxed">{resposta}</p>
                    <CopyButton text={resposta} className="shrink-0" />
                  </div>
                </AccordionItem>
              ))}
            </div>

            <ScriptCard
              label="Fechamento — agendar reunião"
              text={playbook.canais.ligacao.fechamento}
              labelColor="text-red" bgColor="bg-red/[0.06]" borderColor="border-red/20"
            />
          </>
        )}
      </div>

      {/* Footer — Produto DR recomendado */}
      <div className="p-5 rounded-xl bg-red/[0.05] border border-red/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-red font-medium">Produto recomendado</span>
            <p className="text-sm font-semibold text-red mt-1">{playbook.produtoRecomendado.nome} — {playbook.produtoRecomendado.faixa}</p>
            <p className="text-xs text-text-muted mt-1">{playbook.produtoRecomendado.justificativa}</p>
          </div>
          <CopyButton
            text={`Produto recomendado: ${playbook.produtoRecomendado.nome} (${playbook.produtoRecomendado.faixa}). ${playbook.produtoRecomendado.justificativa}`}
            label="Copiar"
          />
        </div>
      </div>
    </div>
  )
}
