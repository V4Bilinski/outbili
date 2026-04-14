/**
 * Cloudflare Worker — Assertiva Proxy para OUTBILI
 *
 * Proxy server-side que resolve CORS e autentica OAuth2 com a Assertiva.
 * REGRA CRITICA: retorna a resposta RAW completa da Assertiva sem filtrar
 * nenhum campo. O frontend (assertivaService.ts) e responsavel por mapear.
 *
 * Endpoints suportados:
 *   - lookup-cnpj       → /localize/v3/cnpj
 *   - get-decision-makers → /localize/v3/possiveis-decisores
 *   - lookup-cpf         → /localize/v3/cpf
 *   - lookup-phone       → /localize/v3/telefone
 *   - discover-endpoints → health check (testa quais endpoints respondem)
 *
 * Deploy: wrangler deploy
 * Secrets: wrangler secret put ASSERTIVA_CLIENT_ID
 *          wrangler secret put ASSERTIVA_CLIENT_SECRET
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Cache de token OAuth2 (em memoria do Worker — dura ate o isolate ser reciclado)
let tokenCache = { token: '', expiresAt: 0 }

async function getOAuth2Token(env) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const credentials = btoa(`${env.ASSERTIVA_CLIENT_ID}:${env.ASSERTIVA_CLIENT_SECRET}`)
  const baseUrl = env.ASSERTIVA_BASE_URL || 'https://api.assertivasolucoes.com.br'

  const res = await fetch(`${baseUrl}/oauth2/v3/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Assertiva auth ${res.status}: ${text}`)
  }

  const data = await res.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 10) * 1000,
  }
  return data.access_token
}

function buildAssertivePath(action, params) {
  switch (action) {
    case 'lookup-cnpj':
      return `/localize/v3/cnpj?cnpj=${params.cnpj}&idFinalidade=5`

    case 'get-decision-makers':
      return `/localize/v3/possiveis-decisores?cnpj=${params.cnpj}&idFinalidade=5${params.protocolo ? `&protocolo=${params.protocolo}` : ''}`

    case 'lookup-cpf':
      return `/localize/v3/cpf?cpf=${params.cpf}&idFinalidade=5`

    case 'lookup-phone':
      return `/localize/v3/telefone?telefone=${params.phone}&idFinalidade=5`

    default:
      return null
  }
}

async function discoverEndpoints(env) {
  const token = await getOAuth2Token(env)
  const baseUrl = env.ASSERTIVA_BASE_URL || 'https://api.assertivasolucoes.com.br'
  const endpoints = {
    cnpj: false,
    decisores: false,
    cpf: false,
    telefone: false,
  }

  const checks = [
    { key: 'cnpj', path: '/localize/v3/cnpj?cnpj=00000000000191&idFinalidade=5' },
    { key: 'cpf', path: '/localize/v3/cpf?cpf=00000000000&idFinalidade=5' },
  ]

  await Promise.allSettled(
    checks.map(async ({ key, path }) => {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        endpoints[key] = res.status !== 403 && res.status !== 401
      } catch {
        endpoints[key] = false
      }
    })
  )

  // Se CNPJ funciona, decisores e telefone provavelmente tambem
  endpoints.decisores = endpoints.cnpj
  endpoints.telefone = endpoints.cnpj

  return endpoints
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405, headers: CORS_HEADERS },
      )
    }

    try {
      const body = await request.json()
      const { action, ...params } = body

      if (!action) {
        return Response.json(
          { error: 'Missing action parameter' },
          { status: 400, headers: CORS_HEADERS },
        )
      }

      // Discover endpoints (health check)
      if (action === 'discover-endpoints') {
        const result = await discoverEndpoints(env)
        return Response.json(result, { headers: CORS_HEADERS })
      }

      // Montar path da API Assertiva
      const path = buildAssertivePath(action, params)
      if (!path) {
        return Response.json(
          { error: `Unknown action: ${action}` },
          { status: 400, headers: CORS_HEADERS },
        )
      }

      // Autenticar
      const token = await getOAuth2Token(env)
      const baseUrl = env.ASSERTIVA_BASE_URL || 'https://api.assertivasolucoes.com.br'

      // Chamar Assertiva
      const assertivaRes = await fetch(`${baseUrl}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!assertivaRes.ok) {
        const errText = await assertivaRes.text()
        return Response.json(
          { error: `Assertiva ${assertivaRes.status}`, message: errText },
          { status: assertivaRes.status, headers: CORS_HEADERS },
        )
      }

      // REGRA CRITICA: retornar resposta RAW completa sem filtrar campos.
      // O frontend (assertivaService.ts) mapeia os campos necessarios.
      // NUNCA adicionar transformacao/filtro aqui — sempre repassar tudo.
      const rawData = await assertivaRes.json()

      return Response.json(rawData, {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'no-store',
        },
      })

    } catch (err) {
      return Response.json(
        { error: 'Worker error', message: err.message || String(err) },
        { status: 500, headers: CORS_HEADERS },
      )
    }
  },
}
