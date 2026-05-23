// socioService — Deep enrichment de sócios/decisores via Assertiva (W3-08).
//
// Fonte 100% Supabase: dados persistidos em app.socios / app.socio_telefones /
// app.socio_vinculos pela Edge Function `assertiva-enrich`. Sem n8n, sem Airtable,
// sem Worker Cloudflare.
//
// O telefone de WhatsApp é PESSOAL do sócio (vem da consulta CPF, relacao="Direto"),
// nunca o telefone da empresa. O link wa.me dá acesso direto à conversa.

import { supabase } from '../lib/supabase'

export interface SocioTelefone {
  id: string
  e164: string
  /** Link de acesso direto ao WhatsApp (https://wa.me/<digitos>) */
  waLink: string
  /** WhatsApp pessoal validado pela Assertiva (aplicativos.whatsApp) */
  whatsappPessoal: boolean
  whatsappConfirmado: boolean
  isHot: boolean
  /** Número opt-out (Procon "não perturbe"). Quando true, evitar abordagem. */
  naoPerturbe: boolean
  operadora?: string
  ultimoContato?: string
  origem?: string
  ranking?: number
}

export interface SocioVinculo {
  id: string
  tipo: 'familiar' | 'societario_cruzado'
  nomeRelacionado?: string
  grauParentesco?: string
  cnpjVinculado?: string
  razaoSocialVinculada?: string
}

export interface Socio {
  id: string
  nome: string
  participacao?: string
  cargo?: string
  indiceProbabilidadeNegociacao: number
  telefones: SocioTelefone[]
  vinculos: SocioVinculo[]
}

export interface DeepEnrichResult {
  ok: boolean
  numSocios: number
  warnings?: string[]
  error?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Resolve o UUID real do app.leads a partir do id exposto (UUID ou airtable_record_id). */
async function resolveLeadUuid(leadIdOrRec: string): Promise<string> {
  if (UUID_RE.test(leadIdOrRec)) return leadIdOrRec
  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .eq('airtable_record_id', leadIdOrRec)
    .single()
  if (error || !data) throw new Error('Lead não localizado para enriquecimento de sócios.')
  return (data as { id: string }).id
}

/** Gera o link de acesso direto ao WhatsApp a partir de um número E.164. */
export function waLink(e164: string): string {
  return `https://wa.me/${(e164 || '').replace(/\D/g, '')}`
}

function mapTelefone(row: Record<string, unknown>): SocioTelefone {
  const raw = (row.raw as Record<string, unknown>) || {}
  const e164 = String(row.telefone_e164 ?? '')
  return {
    id: String(row.id),
    e164,
    waLink: waLink(e164),
    whatsappPessoal: Boolean(row.whatsapp_pessoal),
    whatsappConfirmado: Boolean(row.whatsapp_confirmado),
    isHot: Boolean(row.is_hot),
    naoPerturbe: String(raw.naoPerturbe) === 'true',
    operadora: (raw.operadora as string) || undefined,
    ultimoContato: (raw.ultimoContato as string) || undefined,
    origem: (row.origem as string) || undefined,
    ranking: (row.ranking as number) ?? undefined,
  }
}

/** Ordena telefones: WhatsApp pessoal abordável primeiro; depois por ranking. */
function ordenarTelefones(a: SocioTelefone, b: SocioTelefone): number {
  const peso = (t: SocioTelefone) =>
    (t.whatsappPessoal ? 2 : 0) + (t.naoPerturbe ? -3 : 0) + (t.isHot ? 1 : 0)
  return peso(b) - peso(a) || (a.ranking ?? 99) - (b.ranking ?? 99)
}

/** Busca o grafo de sócios persistido para um lead (100% Supabase). */
export async function getSociosByLead(leadIdOrRec: string): Promise<Socio[]> {
  const leadId = await resolveLeadUuid(leadIdOrRec)
  const { data, error } = await supabase
    .from('socios')
    .select(
      'id, nome, participacao, cargo, indice_probabilidade_negociacao, ' +
        'socio_telefones(*), socio_vinculos(*)',
    )
    .eq('lead_id', leadId)
    .order('indice_probabilidade_negociacao', { ascending: false })
  if (error) throw new Error(error.message)

  return ((data as unknown as Record<string, unknown>[]) || []).map((s) => ({
    id: String(s.id),
    nome: String(s.nome ?? ''),
    participacao: (s.participacao as string) || undefined,
    cargo: (s.cargo as string) || undefined,
    indiceProbabilidadeNegociacao: Number(s.indice_probabilidade_negociacao) || 0,
    telefones: ((s.socio_telefones as Record<string, unknown>[]) || [])
      .map(mapTelefone)
      .sort(ordenarTelefones),
    vinculos: ((s.socio_vinculos as Record<string, unknown>[]) || []).map((v) => ({
      id: String(v.id),
      tipo: (v.tipo as 'familiar' | 'societario_cruzado') ?? 'familiar',
      nomeRelacionado: (v.nome_relacionado as string) || undefined,
      grauParentesco: (v.grau_parentesco as string) || undefined,
      cnpjVinculado: (v.cnpj_vinculado as string) || undefined,
      razaoSocialVinculada: (v.razao_social_vinculada as string) || undefined,
    })),
  }))
}

/**
 * Dispara o enriquecimento profundo via Edge Function `assertiva-enrich`.
 * Persiste o grafo de sócios no Supabase. Autentica com a sessão atual (JWT).
 */
export async function runDeepEnrichment(
  cnpj: string,
  leadIdOrRec: string,
): Promise<DeepEnrichResult> {
  const leadId = await resolveLeadUuid(leadIdOrRec)
  const { data, error } = await supabase.functions.invoke('assertiva-enrich', {
    body: { cnpj: (cnpj || '').replace(/\D/g, ''), leadId },
  })
  if (error) return { ok: false, numSocios: 0, error: error.message }
  const socios = (data as { socios?: unknown[]; warnings?: string[] })?.socios
  const warnings = (data as { warnings?: string[] })?.warnings
  return {
    ok: true,
    numSocios: Array.isArray(socios) ? socios.length : 0,
    warnings: warnings && warnings.length > 0 ? warnings : undefined,
  }
}
