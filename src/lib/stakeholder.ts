import type { Lead, Contact } from '../types'

// Cascata de resolucao do stakeholder (pessoa-chave) de um lead, com origem rastreavel.
// Ordem: decisor cadastrado > 1o contato > socio/decisor (QSA/Assertiva) > contato da Receita.
// Os dados ja cobrem 100% dos leads via contacts; os degraus de socio/Receita sao fallback
// defensivo para leads futuros que eventualmente caiam sem contato cadastrado.

export type StakeholderSource = 'decisor' | 'contato' | 'socio' | 'receita'

export interface ResolvedStakeholder {
  name: string
  role?: string
  email?: string
  whatsapp?: string
  source: StakeholderSource
  sourceLabel: string
}

const clean = (v?: string | null): string | undefined => {
  const t = (v ?? '').trim()
  return t.length > 0 ? t : undefined
}

// lead.partners e um JSON array [{nome, qualificacao}] (QSA CNPJa). Parse defensivo.
function firstPartner(raw?: string): { nome?: string; qualificacao?: string } | null {
  if (!raw) return null
  try {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && arr.length > 0 && arr[0] && typeof arr[0] === 'object') {
      return { nome: clean(arr[0].nome), qualificacao: clean(arr[0].qualificacao) }
    }
  } catch {
    // partners pode nao ser JSON valido — ignora
  }
  return null
}

export function resolveStakeholder(lead: Lead, contacts?: Contact[]): ResolvedStakeholder | null {
  const list = contacts ?? []

  // 1. Decisor cadastrado (estado canonico apos saneamento)
  const decisor = list.find((c) => c.contactType === 'decisor' && clean(c.name))
  if (decisor) {
    return {
      name: decisor.name,
      role: clean(decisor.role),
      // Fallback para o contato da Receita (mantem paridade com o bloco de cadastro antigo)
      email: clean(decisor.email) || clean(lead.rfEmail),
      whatsapp: clean(decisor.whatsapp) || clean(decisor.phone) || clean(lead.rfPhone),
      source: 'decisor',
      sourceLabel: 'Decisor',
    }
  }

  // 2. Primeiro contato disponivel
  const first = list.find((c) => clean(c.name))
  if (first) {
    return {
      name: first.name,
      role: clean(first.role),
      email: clean(first.email) || clean(lead.rfEmail),
      whatsapp: clean(first.whatsapp) || clean(first.phone) || clean(lead.rfPhone),
      source: 'contato',
      sourceLabel: 'Contato',
    }
  }

  // 3. Socio principal do QSA (lead.partners, JSON CNPJa)
  const partner = firstPartner(lead.partners)
  if (partner?.nome) {
    return {
      name: partner.nome,
      role: partner.qualificacao || 'Socio (QSA)',
      email: clean(lead.rfEmail),
      whatsapp: clean(lead.rfPhone),
      source: 'socio',
      sourceLabel: 'via Socio (QSA)',
    }
  }

  // 4. Contato da Receita Federal (ultimo recurso)
  const rfEmail = clean(lead.rfEmail)
  const rfPhone = clean(lead.rfPhone)
  if (rfEmail || rfPhone) {
    return {
      name: rfEmail || rfPhone!,
      role: 'Contato da Receita',
      email: rfEmail,
      whatsapp: rfPhone,
      source: 'receita',
      sourceLabel: 'via Receita Federal',
    }
  }

  return null
}

// Estilo do selo de origem (validade visivel). Verde = dado forte (decisor); ambar = fallback.
export function stakeholderSourceClass(source: StakeholderSource): string {
  switch (source) {
    case 'decisor': return 'text-success bg-success/10'
    case 'contato': return 'text-text-secondary bg-elevated-2'
    case 'socio': return 'text-warning bg-warning/10'
    case 'receita': return 'text-text-muted bg-elevated-2'
  }
}
