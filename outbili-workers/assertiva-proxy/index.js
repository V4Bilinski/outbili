// Cloudflare Worker — Assertiva API Proxy (CORS-free)
// Recebe POST do browser OUTBILI, faz OAuth2 server-side, chama Assertiva, retorna JSON.

const BASE_URL = 'https://api.assertivasolucoes.com.br';

// Token cache (Worker-level, persiste entre requests na mesma instância)
let tokenCache = null;

async function getToken(env) {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = btoa(`${env.ASSERTIVA_CLIENT_ID}:${env.ASSERTIVA_CLIENT_SECRET}`);
  const res = await fetch(`${BASE_URL}/oauth2/v3/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Assertiva auth ${res.status}: ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 10) * 1000,
  };
  return data.access_token;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: corsHeaders(),
      });
    }

    try {
      const body = await request.json();
      const { action, cnpj, cpf, phone, protocolo } = body;

      const token = await getToken(env);

      // Montar path baseado na ação
      let path;
      switch (action) {
        case 'lookup-cnpj':
          path = `/localize/v3/cnpj?cnpj=${cnpj}&idFinalidade=5`;
          break;
        case 'get-decision-makers':
          path = `/localize/v3/possiveis-decisores?cnpj=${cnpj}&idFinalidade=5${protocolo ? `&protocolo=${protocolo}` : ''}`;
          break;
        case 'lookup-cpf':
          path = `/localize/v3/cpf?cpf=${cpf}&idFinalidade=5`;
          break;
        case 'lookup-phone':
          path = `/localize/v3/telefone?telefone=${phone}&idFinalidade=5`;
          break;
        default:
          return new Response(JSON.stringify({ error: `Ação '${action}' não suportada` }), {
            status: 400, headers: corsHeaders(),
          });
      }

      // Chamar Assertiva
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ error: `Assertiva ${res.status}`, message: errText }), {
          status: res.status, headers: corsHeaders(),
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200, headers: corsHeaders(),
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Erro interno do proxy' }), {
        status: 500, headers: corsHeaders(),
      });
    }
  },
};
