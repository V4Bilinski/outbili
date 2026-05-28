import { checkCredits } from './cnpjaService'
import { getAssertivaLastKnown } from './assertivaService'
import { isFirecrawlAvailable } from './firecrawlService'
import { supabase } from '../lib/supabase'

// Health-check das integracoes externas. Cada checagem resolve sempre (nunca
// lanca): uma integracao fora vira estado, nao excecao.
//
// Custo: as sondas ativas (CNPJa /credit, Apify /users/me, Supabase /health)
// sao gratuitas. A Assertiva NAO e sondada (lookup consome consulta paga): o
// status vem do ultimo resultado observado durante o enriquecimento real.

export type IntegrationState = 'ok' | 'degraded' | 'down' | 'optional' | 'unknown'
export type IntegrationId = 'cnpja' | 'assertiva' | 'apify' | 'firecrawl' | 'supabase'

export interface IntegrationStatus {
  id: IntegrationId
  label: string
  state: IntegrationState
  detail: string
  /** true para integracoes cuja falha afeta o fluxo principal (busca + enriquecimento). */
  core: boolean
}

export interface IntegrationHealth {
  checkedAt: number
  integrations: IntegrationStatus[]
  /** Integracoes core degradadas ou fora. */
  needsAttention: IntegrationStatus[]
}

async function checkCnpja(): Promise<IntegrationStatus> {
  try {
    await checkCredits()
    return {
      id: 'cnpja', label: 'CNPJa', state: 'ok', core: true,
      detail: 'Busca de empresas e dados cadastrais operando normalmente.',
    }
  } catch {
    return {
      id: 'cnpja', label: 'CNPJa', state: 'down', core: true,
      detail: 'CNPJa indisponivel. A busca de empresas e o enriquecimento cadastral estao fora no momento.',
    }
  }
}

function checkAssertiva(): IntegrationStatus {
  const last = getAssertivaLastKnown()
  if (last.state === 'ok') {
    return {
      id: 'assertiva', label: 'Assertiva', state: 'ok', core: true,
      detail: 'Operando. Confirmado no ultimo enriquecimento executado.',
    }
  }
  if (last.state === 'down') {
    return {
      id: 'assertiva', label: 'Assertiva', state: 'down', core: true,
      detail: 'Falhou no ultimo enriquecimento. Telefones, WhatsApp e decisores podem estar indisponiveis. Leads sao salvos com os dados cadastrais do CNPJa.',
    }
  }
  return {
    id: 'assertiva', label: 'Assertiva', state: 'unknown', core: true,
    detail: 'Sem sonda ativa (a consulta consome credito). O status e confirmado no primeiro enriquecimento.',
  }
}

async function checkApify(): Promise<IntegrationStatus> {
  const token = import.meta.env.VITE_APIFY_TOKEN
  if (!token) {
    return {
      id: 'apify', label: 'Apify', state: 'down', core: false,
      detail: 'Token do Apify nao configurado. Necessario para a extracao de redes sociais.',
    }
  }
  try {
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(token)}`)
    if (res.ok) {
      return {
        id: 'apify', label: 'Apify', state: 'ok', core: false,
        detail: 'Conectado. Disponivel para a extracao de redes sociais.',
      }
    }
    return {
      id: 'apify', label: 'Apify', state: 'down', core: false,
      detail: `Apify respondeu ${res.status}. Verifique o token configurado.`,
    }
  } catch {
    return {
      id: 'apify', label: 'Apify', state: 'down', core: false,
      detail: 'Nao foi possivel contatar o Apify.',
    }
  }
}

async function checkSupabase(): Promise<IntegrationStatus> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    return {
      id: 'supabase', label: 'Supabase', state: 'optional', core: false,
      detail: 'Supabase nao configurado. A migracao de banco de dados ainda nao esta ativa.',
    }
  }
  try {
    const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } })
    if (res.ok) {
      return {
        id: 'supabase', label: 'Supabase', state: 'ok', core: false,
        detail: 'Projeto acessivel. Conectado e pronto para a migracao de banco de dados.',
      }
    }
    return {
      id: 'supabase', label: 'Supabase', state: 'down', core: false,
      detail: `Supabase respondeu ${res.status}. Verifique a URL e a chave.`,
    }
  } catch {
    return {
      id: 'supabase', label: 'Supabase', state: 'down', core: false,
      detail: 'Nao foi possivel contatar o projeto Supabase.',
    }
  }
}

function checkFirecrawl(): IntegrationStatus {
  const available = isFirecrawlAvailable()
  return {
    id: 'firecrawl', label: 'Firecrawl', core: false,
    state: available ? 'ok' : 'optional',
    detail: available
      ? 'Conectado. Fallback de redes sociais disponivel.'
      : 'Fallback opcional de redes sociais nao configurado.',
  }
}

// Health server-side real via Edge Function `integration-health`: sonda o Apify
// de verdade (/users/me) e le o estado observado de Assertiva/Firecrawl no banco.
// Substitui os checks client-side de apify/assertiva/firecrawl, que liam
// `import.meta.env.VITE_*` ausentes no bundle (o token nunca deve ir ao client).
// Os checks locais permanecem como fallback gracioso se a Edge Function falhar.
async function fetchServerHealth(): Promise<Map<IntegrationId, IntegrationStatus> | null> {
  try {
    const { data, error } = await supabase.functions.invoke('integration-health', { method: 'GET' })
    const list = (data as { integrations?: IntegrationStatus[] } | null)?.integrations
    if (error || !Array.isArray(list)) return null
    const map = new Map<IntegrationId, IntegrationStatus>()
    for (const it of list) {
      map.set(it.id, { id: it.id, label: it.label, state: it.state, detail: it.detail, core: it.core })
    }
    return map
  } catch {
    return null
  }
}

export async function checkIntegrations(): Promise<IntegrationHealth> {
  const [cnpja, supabaseStatus, serverHealth] = await Promise.all([
    checkCnpja(),
    checkSupabase(),
    fetchServerHealth(),
  ])
  // assertiva/apify/firecrawl vem do health server-side real; fallback local se indisponivel.
  const assertiva = serverHealth?.get('assertiva') ?? checkAssertiva()
  const apify = serverHealth?.get('apify') ?? (await checkApify())
  const firecrawl = serverHealth?.get('firecrawl') ?? checkFirecrawl()
  const integrations = [cnpja, assertiva, apify, firecrawl, supabaseStatus]
  return {
    checkedAt: Date.now(),
    integrations,
    needsAttention: integrations.filter(
      (i) => i.core && (i.state === 'down' || i.state === 'degraded'),
    ),
  }
}
