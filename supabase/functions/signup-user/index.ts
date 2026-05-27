// Supabase Edge Function: signup-user
// Operador 2026-05-27: self-signup com cargo + ativacao na hora, SEM verificacao de e-mail.
//
// Problema que resolve: supabase.auth.signUp() no client dispara e-mail de confirmacao;
// o SMTP padrao do Supabase tem rate limit baixo (~2-4/h) -> "email rate limit exceeded"
// bloqueava a criacao de contas.
//
// Solucao: cria o usuario via service_role com email_confirm=true. NAO envia e-mail
// (sem rate limit) e ja entra confirmado. O trigger handle_new_user popula app.profiles
// JA ativo, com o cargo escolhido (sdr/closer/viewer; admin NUNCA via signup) e o gate
// de dominio @v4company.com.
//
// Validacoes server-side (defense-in-depth, espelham o trigger):
//   - dominio @v4company.com
//   - cargo in {sdr, closer, viewer}
//   - senha minima 6
//
// Contrato: responde sempre 200 com { ok: boolean, error?: string, userId?: string }
// (erros de negocio em 200 simplificam o tratamento no client). 500 so em falha de infra.
//
// Deploy: supabase functions deploy signup-user --no-verify-jwt --use-api  (publica, sem JWT)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_DOMAINS = ['v4company.com']
const ALLOWED_ROLES = ['sdr', 'closer', 'viewer']

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

interface SignupBody {
  email?: string
  password?: string
  fullName?: string
  role?: string
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Metodo nao permitido' }, 405)
  }

  let body: SignupBody
  try {
    body = await req.json() as SignupBody
  } catch {
    return jsonResponse({ ok: false, error: 'Body JSON invalido' }, 200)
  }

  const email = String(body.email ?? '').toLowerCase().trim()
  const password = String(body.password ?? '')
  const fullName = String(body.fullName ?? '').trim()
  const role = String(body.role ?? '').trim()

  // Validacoes de negocio (espelham o trigger handle_new_user)
  if (!email || !password || !fullName) {
    return jsonResponse({ ok: false, error: 'Informe nome, e-mail e senha.' }, 200)
  }
  const domain = email.split('@')[1] ?? ''
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return jsonResponse({ ok: false, error: 'Cadastro permitido apenas para e-mails @v4company.com' }, 200)
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return jsonResponse({ ok: false, error: 'Cargo invalido. Escolha SDR, Closer ou Visualizador.' }, 200)
  }
  if (password.length < 6) {
    return jsonResponse({ ok: false, error: 'A senha deve ter ao menos 6 caracteres.' }, 200)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.error('[signup-user] env SUPABASE_URL/SERVICE_ROLE_KEY ausente')
    return jsonResponse({ ok: false, error: 'Configuracao do servidor ausente.' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Cria JA confirmado (email_confirm=true) -> nao envia e-mail, sem rate limit.
  // user_metadata.requested_role e' lido pelo trigger para associar o cargo + ativar.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, requested_role: role },
  })

  if (error) {
    const msg = error.message ?? 'Falha ao criar conta'
    if (/already.*(registered|exists)|duplicate|been registered/i.test(msg)) {
      return jsonResponse({ ok: false, error: 'E-mail ja cadastrado.' }, 200)
    }
    console.error('[signup-user] createUser erro:', msg)
    return jsonResponse({ ok: false, error: msg }, 200)
  }

  return jsonResponse({ ok: true, userId: data.user?.id ?? null }, 200)
})
