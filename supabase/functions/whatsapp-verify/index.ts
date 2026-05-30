// Supabase Edge Function: whatsapp-verify (WHATSAPP-VERIFY-01, Pilar 1)
//
// Valida AO VIVO se os telefones do decisor/sócio (e da empresa) têm WhatsApp,
// via ator Apify `vtrdev/whatsapp-number-validator` (pay-per-result, ~$0.001/nº).
// Grava comprovacao em socio_telefones/lead_phones (whatsapp_verified + jid + at + source).
//
// IMPORTANTE: este e o lugar LEGITIMO para enviar os telefones (PII) ao Apify — roda
// server-side com secrets de producao. Diferente das flags inferidas da Assertiva
// (whatsapp_pessoal/whatsapp_confirmado), aqui ha COMPROVACAO real de existencia.
//
// Fluxo: POST { leadId, jobId?, scope? }
//   scope = 'socios' (default) | 'all' (socios + telefones da empresa)
//   1. Resolve telefones do lead (socio_telefones via socio_id->socios.lead_id; lead_phones)
//   2. Dedup por E.164; chama o ator Apify em 1 batch (run-sync-get-dataset-items)
//   3. Persiste whatsapp_verified=true/false + jid + verified_at + source='apify:vtrdev'
//   4. Fecha o job (se veio da fila). Tudo best-effort, nunca derruba outros modos.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_ENDPOINT =
  'https://api.apify.com/v2/acts/vtrdev~whatsapp-number-validator/run-sync-get-dataset-items'

// deno-lint-ignore no-explicit-any
type SbClient = any

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// E.164 com + (o ator espera "+5511999999999"). So digitos -> prefixa +.
function toPlusE164(raw: string): string | null {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length < 10) return null
  return `+${d}`
}

interface PhoneRow {
  table: 'socio_telefones' | 'lead_phones'
  id: string
  e164: string        // como esta no banco (com +)
  plus: string        // normalizado +digits para o ator
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), {
      status: 405, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  let jobId: string | undefined
  let supabaseForJob: SbClient = null

  try {
    const body = await req.json() as { leadId?: string; jobId?: string; scope?: 'socios' | 'all' }
    const leadId = body.leadId
    jobId = body.jobId
    const scope = body.scope ?? 'all'
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId obrigatorio' }), {
        status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apifyToken = Deno.env.get('API_APIFY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY ausentes')
    if (!apifyToken) throw new Error('API_APIFY nao configurado no env da Edge Function')

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    supabaseForJob = supabase
    const warnings: string[] = []

    // ── 1. Coleta telefones do lead ──
    const phones: PhoneRow[] = []

    // 1a. Telefones de SOCIOS (via socio_id -> socios.lead_id). Sem coluna lead_id direta.
    const { data: sociosData, error: socErr } = await supabase
      .schema('app').from('socios').select('id').eq('lead_id', leadId)
    if (socErr) warnings.push(`socios lookup: ${socErr.message}`)
    const socioIds = ((sociosData as { id: string }[]) || []).map((s) => s.id)

    if (socioIds.length > 0) {
      const { data: telData, error: telErr } = await supabase
        .schema('app').from('socio_telefones')
        .select('id, telefone_e164')
        .in('socio_id', socioIds)
      if (telErr) warnings.push(`socio_telefones lookup: ${telErr.message}`)
      for (const t of (telData as { id: string; telefone_e164: string }[]) || []) {
        const plus = toPlusE164(t.telefone_e164)
        if (plus) phones.push({ table: 'socio_telefones', id: t.id, e164: t.telefone_e164, plus })
      }
    }

    // 1b. Telefones da EMPRESA (scope 'all').
    if (scope === 'all') {
      const { data: lpData, error: lpErr } = await supabase
        .schema('app').from('lead_phones')
        .select('id, e164').eq('lead_id', leadId)
      if (lpErr) warnings.push(`lead_phones lookup: ${lpErr.message}`)
      for (const p of (lpData as { id: string; e164: string }[]) || []) {
        const plus = toPlusE164(p.e164)
        if (plus) phones.push({ table: 'lead_phones', id: p.id, e164: p.e164, plus })
      }
    }

    if (phones.length === 0) {
      await finishJob(supabase, jobId, true, null)
      return new Response(
        JSON.stringify({ ok: true, verified: 0, withWhatsapp: 0, motivo: 'Lead sem telefones para validar', warnings }),
        { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
      )
    }

    // ── 2. Chama o ator Apify (1 batch, numeros unicos) ──
    const uniquePlus = Array.from(new Set(phones.map((p) => p.plus)))
    const apifyRes = await fetch(`${APIFY_ENDPOINT}?token=${apifyToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_numbers: uniquePlus }),
    })
    if (!apifyRes.ok) {
      const txt = await apifyRes.text().catch(() => '')
      throw new Error(`Apify ${apifyRes.status}: ${txt.slice(0, 200)}`)
    }
    const items = (await apifyRes.json()) as Record<string, unknown>[]

    // Mapeia resultado por digitos -> { exists, jid }
    const verdict = new Map<string, { exists: boolean; jid: string | null }>()
    for (const it of Array.isArray(items) ? items : []) {
      const numDigits = String(it['phone'] ?? it['number'] ?? '').replace(/\D/g, '')
      if (!numDigits) continue
      const exists = Boolean(it['hasWhatsapp'] ?? it['exists'])
      const jid = (it['jid'] as string) || (exists ? `${numDigits}@s.whatsapp.net` : null)
      verdict.set(numDigits, { exists, jid })
    }

    // ── 3. Persiste por linha (cada telefone do banco recebe o veredito do seu numero) ──
    const nowIso = new Date().toISOString()
    let verifiedCount = 0
    let withWhatsapp = 0
    const bySocio: PhoneRow[] = phones.filter((p) => p.table === 'socio_telefones')
    const byEmpresa: PhoneRow[] = phones.filter((p) => p.table === 'lead_phones')

    const persistGroup = async (rows: PhoneRow[], table: string) => {
      for (const row of rows) {
        const v = verdict.get(row.plus.replace(/\D/g, ''))
        if (v === undefined) { warnings.push(`sem veredito p/ ${table}:${row.id}`); continue }
        const { error: upErr } = await supabase
          .schema('app').from(table)
          .update({
            whatsapp_verified: v.exists,
            whatsapp_verified_at: nowIso,
            whatsapp_jid: v.jid,
            whatsapp_verify_source: 'apify:vtrdev',
          })
          .eq('id', row.id)
        if (upErr) { warnings.push(`update ${table}:${row.id}: ${upErr.message}`); continue }
        verifiedCount++
        if (v.exists) withWhatsapp++
      }
    }
    await persistGroup(bySocio, 'socio_telefones')
    await persistGroup(byEmpresa, 'lead_phones')

    await finishJob(supabase, jobId, true, null)

    return new Response(
      JSON.stringify({
        ok: true,
        scope,
        telefones: phones.length,
        numerosUnicos: uniquePlus.length,
        verificados: verifiedCount,
        comWhatsapp: withWhatsapp,
        warnings: warnings.length > 0 ? warnings : undefined,
      }),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[whatsapp-verify] erro:', message)
    if (jobId && supabaseForJob) await finishJob(supabaseForJob, jobId, false, message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})

// Fecha o job da fila (best-effort). retrying se attempts<3, senao failed.
async function finishJob(supabase: SbClient, jobId: string | undefined, ok: boolean, error: string | null) {
  if (!jobId) return
  try {
    if (ok) {
      await supabase.schema('app').from('enrichment_jobs')
        .update({ status: 'done', finished_at: new Date().toISOString() }).eq('id', jobId)
    } else {
      const { data } = await supabase.schema('app').from('enrichment_jobs')
        .select('attempts').eq('id', jobId).single()
      const attempts = typeof data?.attempts === 'number' ? data.attempts : 0
      await supabase.schema('app').from('enrichment_jobs')
        .update({ status: attempts < 3 ? 'retrying' : 'failed', finished_at: new Date().toISOString(), error })
        .eq('id', jobId)
    }
  } catch (e) {
    console.error('[whatsapp-verify] finishJob falhou:', e instanceof Error ? e.message : String(e))
  }
}
