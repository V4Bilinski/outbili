// Configuração compartilhada das fases do pipeline.
// Mantido em arquivo próprio (sem JSX) para satisfazer react-refresh/only-export-components.

import { Phone, MessageCircle, Handshake, ClipboardList, Trophy, Ban } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StageChangeSource = 'pipeline-kanban' | 'company-page' | 'leads-page' | 'cadastro-manual' | 'upload-manual'

export const STAGE_SOURCE_LABEL: Record<StageChangeSource, string> = {
  'pipeline-kanban': 'Pipeline',
  'company-page': 'Ficha do lead',
  'leads-page': 'Lista de leads',
  'cadastro-manual': 'Cadastro Manual',
  'upload-manual': 'Upload de Lista',
}

export const PIPELINE_COLUMNS = [
  { value: 'Novo', label: 'Prospecção', color: 'var(--color-stage-prospect)' },
  { value: 'Contactado', label: 'Contactado', color: 'var(--color-stage-contacted)' },
  { value: 'Respondeu', label: 'Respondeu', color: 'var(--color-stage-replied)' },
  { value: 'Reunião', label: 'Reunião', color: 'var(--color-stage-meeting)' },
  { value: 'Proposta', label: 'Proposta', color: 'var(--color-stage-proposal)' },
  { value: 'Fechado', label: 'Fechado', color: 'var(--color-stage-closed)' },
  { value: 'Perdido', label: 'Perdido', color: 'var(--color-stage-lost)' },
] as const

export type PipelineStageValue = (typeof PIPELINE_COLUMNS)[number]['value']

export function getStageIndex(status?: string): number {
  const idx = PIPELINE_COLUMNS.findIndex((s) => s.value === (status || 'Novo'))
  return idx === -1 ? 0 : idx
}

export function getStageLabel(status?: string): string {
  return PIPELINE_COLUMNS.find((s) => s.value === status)?.label || status || 'Novo'
}

export function getStageColor(status?: string): string {
  return PIPELINE_COLUMNS.find((s) => s.value === status)?.color || 'var(--color-stage-prospect)'
}

export interface GateCheck { text: string; required: boolean }

export const STAGE_GATES: Record<string, { icon: LucideIcon; title: string; checks: GateCheck[] }> = {
  Contactado: {
    icon: Phone,
    title: 'Registrar primeiro contato',
    checks: [
      { text: 'Primeiro contato realizado via WhatsApp, email ou LinkedIn', required: true },
      { text: 'Mensagem personalizada enviada', required: true },
      { text: 'Canal de contato registrado no lead', required: false },
    ],
  },
  Respondeu: {
    icon: MessageCircle,
    title: 'Lead respondeu',
    checks: [
      { text: 'Resposta recebida do decisor', required: true },
      { text: 'Interesse confirmado ou objeção mapeada', required: true },
      { text: 'Próximo passo definido (reunião, proposta, follow-up)', required: false },
    ],
  },
  'Reunião': {
    icon: Handshake,
    title: 'Reunião agendada',
    checks: [
      { text: 'Data e horário da reunião confirmados', required: true },
      { text: 'Pauta/diagnóstico preparado', required: true },
      { text: 'Participantes definidos (quem do lado do cliente)', required: false },
    ],
  },
  Proposta: {
    icon: ClipboardList,
    title: 'Proposta enviada',
    checks: [
      { text: 'Proposta comercial elaborada e enviada', required: true },
      { text: 'Valor e escopo alinhados com o decisor', required: true },
      { text: 'Prazo de resposta combinado', required: false },
    ],
  },
  Fechado: {
    icon: Trophy,
    title: 'Negócio fechado!',
    checks: [
      { text: 'Contrato assinado ou aceite formal', required: true },
      { text: 'Pagamento confirmado ou faturado', required: true },
      { text: 'Onboarding iniciado', required: false },
    ],
  },
  Perdido: {
    icon: Ban,
    title: 'Marcar como perdido',
    checks: [
      { text: 'Motivo da perda registrado (sem interesse, sem fit, sem resposta, escolheu concorrente)', required: true },
      { text: 'Tentativas de contato esgotadas ou o lead declinou', required: true },
      { text: 'Indicar se o lead pode ser reativado no futuro', required: false },
    ],
  },
}

// Monta description da Activity com origem embutida (para parse no histórico).
// validatedItems: textos dos checks marcados (opcionais) que descrevem a validação da etapa.
export function buildStageChangeDescription(
  fromStatus: string,
  toStatus: string,
  notes: string,
  source: StageChangeSource,
  validatedItems: string[] = [],
): string {
  const fromLabel = getStageLabel(fromStatus)
  const toLabel = getStageLabel(toStatus)
  const sourceLabel = STAGE_SOURCE_LABEL[source]
  const base = `Movido de ${fromLabel} para ${toLabel} [via: ${sourceLabel}]`
  const blocks = [base]
  if (validatedItems.length) {
    blocks.push('Validado:\n' + validatedItems.map((t) => `• ${t}`).join('\n'))
  }
  if (notes.trim()) {
    blocks.push(`Obs: ${notes.trim()}`)
  }
  return blocks.join('\n\n')
}

// Parse de origem a partir da description da Activity (retorna null se ausente)
export function parseStageChangeSource(description?: string): string | null {
  if (!description) return null
  const match = description.match(/\[via:\s*([^\]]+)\]/)
  return match ? match[1].trim() : null
}
