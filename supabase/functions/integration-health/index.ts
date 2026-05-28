// Supabase Edge Function: integration-health
//
// Health-check SERVER-SIDE real das integracoes de enriquecimento.
//
// Motivo (W3 — pos-cutover): os checks client-side de Apify/Firecrawl liam
// `import.meta.env.VITE_*`, que (corretamente) NAO existem no bundle publico —
// expor o token do Apify no client seria falha de seguranca. Resultado: o painel
// reportava falso-negativo ("Indisponivel"/"Nao configurado") enquanto as Edge
// Functions (social-enrich/assertiva-enrich) operavam normalmente com os secrets
// server-side (API_APIFY etc.). Esta funcao roda com service_role e reflete a
// realidade: sonda o Apify de verdade (/users/me) e le o estado observado em
// app.enrichment_runs (Assertiva) e app.lead_social (redes via Apify/site).
//
// Contrato de saida (casa com IntegrationStatus do client):
//   { checkedAt: number, integrations: [{ id, label, state, detail, core, lastAt? }] }
//   ids retornados: 'assertiva' | 'apify' | 'firecrawl'
// CNPJa e Supabase continuam sondados no client (gratuitos e ja corretos).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAY_MS = 86_400_000
const FRESH_DAYS = 14 // extracao de redes ate 14d atras = operando

type IntegrationState = 'ok' | 'degraded' | 'down' | 'optional' | 'unknown'
interface IntegrationStatus {
  id: string
  label: string
  state: IntegrationState
  detail: string
  core: boolean
  lastAt?: string | null
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Apify: sonda ativa e gratuita (/users/me). E a prova de operacao funcional real.
async function probeApify(token: string | undefined): Promise<IntegrationStatus> {
  if (!token) {
    return {
      id: 'apify', label: 'Apify', state: 'down', core: false,
      detail: 'Secret API_APIFY ausente na Edge Function. Extracao de redes sociais indisponivel.',
    }
  }
  try {
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(token)}`)
    if (res.ok) {
      return {
        id: 'apify', label: 'Apify', state: 'ok', core: false,
        detail: 'Conectado (sonda /users/me). Disponivel para a extracao de redes sociais.',
      }
    }
    return {
      id: 'apify', label: 'Apify', state: 'down', core: false,
      detail: `Apify respondeu ${res.status}. Verifique o token API_APIFY.`,
    }
  } catch {
    return { id: 'apify', label: 'Apify', state: 'down', core: false, detail: 'Nao foi possivel contatar o Apify.' }
  }
}

async function lastRunStatus(sb: SupabaseClient, source: string): Promise<{ status: string; started_at: string } | null> {
  const { data } = await sb
    .schema('app').from('enrichment_runs')
    .select('status, started_at').eq('source', source)
    .order('started_at', { ascending: false }).limit(1).maybeSingle()
  return (data as { status: string; started_at: string } | null) ?? null
}

async function lastSocialAt(sb: SupabaseClient, source: string): Promise<string | null> {
  const { data } = await sb
    .schema('app').from('lead_social')
    .select('created_at').eq('source', source)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  return (data as { created_at: string } | null)?.created_at ?? null
}

function checkAssertiva(run: { status: string; started_at: string } | null): IntegrationStatus {
  if (!run) {
    return {
      id: 'assertiva', label: 'Assertiva', state: 'unknown', core: true,
      detail: 'Sem enriquecimento registrado ainda. O status e confirmado no primeiro enriquecimento.',
    }
  }
  if (run.status === 'done') {
    return {
      id: 'assertiva', label: 'Assertiva', state: 'ok', core: true,
      detail: 'Operando. Confirmado no ultimo enriquecimento executado.', lastAt: run.started_at,
    }
  }
  return {
    id: 'assertiva', label: 'Assertiva', state: 'down', core: true,
    detail: 'Falhou no ultimo enriquecimento. Telefones, WhatsApp e decisores podem estar indisponiveis. Leads sao salvos com os dados cadastrais do CNPJa.',
    lastAt: run.started_at,
  }
}

// Firecrawl/site: as redes extraidas do proprio site sao gravadas com source
// 'firecrawl' pela social-enrich. Recencia = operando.
function checkFirecrawl(lastAt: string | null): IntegrationStatus {
  if (!lastAt) {
    return {
      id: 'firecrawl', label: 'Firecrawl / site', state: 'optional', core: false,
      detail: 'Sem extracao de redes via site registrada ainda.',
    }
  }
  const ageDays = Math.round((Date.now() - new Date(lastAt).getTime()) / DAY_MS)
  if (ageDays <= FRESH_DAYS) {
    return {
      id: 'firecrawl', label: 'Firecrawl / site', state: 'ok', core: false,
      detail: `Operando. Extracao de redes via site ativa (ultima ha ${ageDays}d).`, lastAt,
    }
  }
  return {
    id: 'firecrawl', label: 'Firecrawl / site', state: 'degraded', core: false,
    detail: `Sem extracoes recentes via site (ultima ha ${ageDays}d).`, lastAt,
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })
  const headers = { ...corsHeaders(), 'Content-Type': 'application/json' }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apifyToken = Deno.env.get('API_APIFY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY ausentes')

    const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    const [apify, assertivaRun, firecrawlAt] = await Promise.all([
      probeApify(apifyToken),
      lastRunStatus(sb, 'assertiva_decisores'),
      lastSocialAt(sb, 'firecrawl'),
    ])

    const integrations: IntegrationStatus[] = [
      checkAssertiva(assertivaRun),
      apify,
      checkFirecrawl(firecrawlAt),
    ]
    return new Response(JSON.stringify({ checkedAt: Date.now(), integrations }), { headers })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: message }), { status: 500, headers })
  }
})
