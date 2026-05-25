// Supabase Edge Function: assertiva-proxy
// Story W3-09 (Fase A) — substitui o Cloudflare Worker + n8n no roteamento do
// enriquecimento RASO da Assertiva.
//
// Espelha o padrão de auth/CORS de `assertiva-enrich` (W3-08): OAuth2 server-side
// com cache de token no isolate, corsHeaders() e tratamento de OPTIONS.
//
// Dispatcher por `action` no body { action, ...params }, cobrindo as 5 ações
// consumidas por src/services/assertivaService.ts:
//   - lookup-cnpj        { cnpj }
//   - get-decision-makers { cnpj, protocolo }
//   - lookup-cpf         { cpf }
//   - lookup-phone       { phone }
//   - discover-endpoints {}   -> mapa de disponibilidade (probe barato, sem consulta paga)
//
// CRÍTICO — RETORNO RAW: a função devolve o JSON RAW da Assertiva
// ({ resposta, cabecalho, ... }) SEM mapear. Os mappers do service esperam
// `raw.resposta || raw` e `raw.cabecalho?.protocolo`.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ASSERTIVA_BASE_URL = 'https://api.assertivasolucoes.com.br'

// ---------------------------------------------------------------------------
// Cache de token OAuth2 (escopo do isolate; persiste entre requests quentes)
// ---------------------------------------------------------------------------
interface TokenCache {
  token: string
  expiresAt: number
}
let tokenCache: TokenCache | null = null

// ---------------------------------------------------------------------------
// Helpers: CORS
// ---------------------------------------------------------------------------
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// OAuth2: obtem ou renova token da Assertiva (idêntico ao assertiva-enrich)
// ---------------------------------------------------------------------------
async function getAssertivaToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const clientId = Deno.env.get('ASSERTIVA_CLIENT_ID')
  const clientSecret = Deno.env.get('ASSERTIVA_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('ASSERTIVA_CLIENT_ID ou ASSERTIVA_CLIENT_SECRET nao configurados no env')
  }

  const credentials = btoa(`${clientId}:${clientSecret}`)

  const res = await fetch(`${ASSERTIVA_BASE_URL}/oauth2/v3/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    // Não vaza credenciais: só o status. (O corpo da Assertiva no auth não
    // contém o segredo, mas evitamos repassá-lo para reduzir superfície.)
    throw new Error(`Assertiva auth falhou (${res.status})`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }

  // Margem de seguranca de 30s para evitar uso de token expirado
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  }

  return tokenCache.token
}

// ---------------------------------------------------------------------------
// Helper: GET autenticado na Assertiva, devolve o JSON RAW.
// Em erro de etapa lança com status + path (sem token/credenciais).
// ---------------------------------------------------------------------------
async function assertivaGetRaw(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${ASSERTIVA_BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // Limita o corpo do erro e nunca inclui o token usado.
    throw new Error(`Assertiva ${res.status} em ${path}: ${text.slice(0, 300)}`)
  }

  return await res.json()
}

// ---------------------------------------------------------------------------
// Dispatcher por ação
// ---------------------------------------------------------------------------
interface ProxyBody {
  action?: string
  cnpj?: string
  cpf?: string
  phone?: string
  protocolo?: string
  idFinalidade?: string
}

async function dispatch(body: ProxyBody, token: string, idFinalidade: string): Promise<unknown> {
  const { action } = body

  switch (action) {
    case 'lookup-cnpj': {
      const cnpj = String(body.cnpj ?? '').replace(/\D/g, '')
      if (!cnpj) throw new Error('lookup-cnpj: parametro `cnpj` obrigatorio')
      return await assertivaGetRaw(
        token,
        `/localize/v3/cnpj?cnpj=${cnpj}&idFinalidade=${idFinalidade}`,
      )
    }

    case 'get-decision-makers': {
      const cnpj = String(body.cnpj ?? '').replace(/\D/g, '')
      const protocolo = String(body.protocolo ?? '')
      if (!cnpj) throw new Error('get-decision-makers: parametro `cnpj` obrigatorio')
      if (!protocolo) throw new Error('get-decision-makers: parametro `protocolo` obrigatorio')
      return await assertivaGetRaw(
        token,
        `/localize/v3/possiveis-decisores?cnpj=${cnpj}&protocolo=${encodeURIComponent(protocolo)}&idFinalidade=${idFinalidade}`,
      )
    }

    case 'lookup-cpf': {
      const cpf = String(body.cpf ?? '').replace(/\D/g, '')
      if (!cpf) throw new Error('lookup-cpf: parametro `cpf` obrigatorio')
      return await assertivaGetRaw(
        token,
        `/localize/v3/cpf?cpf=${cpf}&idFinalidade=${idFinalidade}`,
      )
    }

    case 'lookup-phone': {
      const phone = String(body.phone ?? '').replace(/\D/g, '')
      if (!phone) throw new Error('lookup-phone: parametro `phone` obrigatorio')
      // Validação reversa por telefone na Localize V3.
      return await assertivaGetRaw(
        token,
        `/localize/v3/telefone?telefone=${phone}&idFinalidade=${idFinalidade}`,
      )
    }

    case 'discover-endpoints': {
      // Probe BARATO: não consome consulta cadastral paga. Reporta o mapa de
      // disponibilidade das ações expostas por esta função (contrato Localize V3
      // contratado). O service espera { cnpj, decisores, cpf, telefone, email }.
      return {
        cnpj: true,
        decisores: true,
        cpf: true,
        telefone: true,
        // email não tem endpoint dedicado: emails vêm embutidos no payload de
        // CNPJ/CPF (resp.emails). Marcado false pois não há ação própria.
        email: false,
      }
    }

    default:
      throw new Error(`Acao desconhecida: ${String(action)}`)
  }
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------
serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo nao permitido' }, 405)
  }

  let body: ProxyBody
  try {
    body = await req.json() as ProxyBody
  } catch {
    return jsonResponse({ error: 'Body JSON invalido' }, 400)
  }

  if (!body.action) {
    return jsonResponse({ error: 'Parametro `action` obrigatorio' }, 400)
  }

  try {
    // idFinalidade: body > env > default '5' (mesmo fallback do assertiva-enrich)
    const idFinalidade =
      body.idFinalidade ??
      Deno.env.get('ASSERTIVA_ID_FINALIDADE') ??
      '5'

    // `discover-endpoints` não precisa de token (probe estático), mas obter o
    // token aqui mantém o caminho único e valida que as credenciais existem
    // sem consumir consulta paga.
    const token = await getAssertivaToken()

    const raw = await dispatch(body, token, idFinalidade)

    // RETORNO RAW: repassa o JSON da Assertiva sem mapear.
    return jsonResponse(raw, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[assertiva-proxy] erro:', message)
    // message já é sanitizada (status + path, sem token/credenciais).
    return jsonResponse({ error: message }, 502)
  }
})
