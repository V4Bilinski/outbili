// Supabase Edge Function: social-enrich (Camada 2 - Fase 1)
// Atribuicao de redes sociais via Apify. Fonte EXCLUSIVA de redes sociais.
//
// Fluxo: POST { leadId, cnpj? }
//   1. Le o lead (address, city, trade_name) com service_role
//   2. Busca perfis no Instagram via Apify (instagram-scraper), termo =
//      trade_name + via(logradouro) + cidade  (NUNCA so o nome da franquia)
//   3. VALIDACAO ANTI-FILIAL: cruza businessAddress do perfil com o endereco
//      REAL do lead. So atribui quando o endereco/cidade confere.
//        - logradouro/numero batem  -> confianca ALTA
//        - so cidade bate            -> MEDIA (possivel outra filial)
//        - nada bate                 -> DESCARTA (provavel outra unidade)
//   4. Detecta mencao de socios na bio (atribuicao ao decisor)
//   5. Persiste em app.socio_redes (idempotente: limpa fonte=apify antes)
//
// Apify usado UNICA E EXCLUSIVAMENTE para redes sociais (nao toca WhatsApp/telefone).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_IG_ENDPOINT =
  'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items'

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Normaliza string para comparacao (sem acento, sem pontuacao, minuscula)
function norm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Extrai o nome da via do endereco (ex: "Rua Augusta, 962" -> "Augusta")
function extrairVia(address: string | null): string {
  if (!address) return ''
  const semNumero = address.split(',')[0]
  return semNumero
    .replace(/^(rua|r\.|av\.?|avenida|alameda|al\.|travessa|tv\.|rodovia|rod\.|pra[cç]a|estrada|estr\.)\s+/i, '')
    .trim()
}

interface MatchResult {
  confianca: 'alta' | 'media' | 'baixa'
  motivo: string
}

// VALIDACAO ANTI-FILIAL: o perfil pertence MESMO a esta unidade?
function avaliarMatch(
  lead: { address: string | null; city: string | null },
  ba: Record<string, unknown> | undefined,
): MatchResult {
  const leadStreet = norm(lead.address)
  const leadCity = norm((lead.city ?? '').split(',')[0])
  const baStreet = norm(ba?.['street_address'])
  const baCity = norm(String(ba?.['city_name'] ?? '').split(',')[0])

  if (leadStreet && baStreet && (baStreet.includes(leadStreet) || leadStreet.includes(baStreet))) {
    return { confianca: 'alta', motivo: `endereco confere: ${ba?.['street_address']}` }
  }
  if (leadCity && baCity && (baCity.includes(leadCity) || leadCity.includes(baCity))) {
    return {
      confianca: 'media',
      motivo: `apenas cidade confere (${ba?.['city_name'] ?? '?'}); possivel outra filial da franquia`,
    }
  }
  return {
    confianca: 'baixa',
    motivo: `endereco divergente (${ba?.['city_name'] ?? 'sem endereco'}); provavel outra unidade`,
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), {
      status: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  try {
    const { leadId } = (await req.json()) as { leadId?: string; cnpj?: string }
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apifyToken = Deno.env.get('API_APIFY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY ausentes')
    if (!apifyToken) throw new Error('API_APIFY nao configurado no env da Edge Function')

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const warnings: string[] = []

    // 1. Dados do lead
    const { data: leadData, error: leadErr } = await supabase
      .schema('app')
      .from('leads')
      .select('id, address, city, state, trade_name, company_name, website')
      .eq('id', leadId)
      .single()
    if (leadErr || !leadData) throw new Error(`Lead nao encontrado: ${leadErr?.message}`)
    const lead = leadData as {
      id: string; address: string | null; city: string | null; state: string | null
      trade_name: string | null; company_name: string | null; website: string | null
    }

    // 2. Termo de busca ESPECIFICO (nome + via + cidade), nunca so a franquia
    const nomeBase = (lead.trade_name || lead.company_name || '').trim()
    const via = extrairVia(lead.address)
    const cidade = (lead.city || '').split(',')[0].trim()
    const termo = [nomeBase, via || cidade].filter(Boolean).join(' ')
    if (!termo) throw new Error('Lead sem nome/endereco para busca social')

    // 3. Apify Instagram (run-sync). Apify = exclusivo redes sociais.
    const apifyRes = await fetch(`${APIFY_IG_ENDPOINT}?token=${apifyToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search: termo,
        searchType: 'user',
        searchLimit: 8,
        resultsType: 'details',
      }),
    })
    if (!apifyRes.ok) {
      const txt = await apifyRes.text()
      throw new Error(`Apify ${apifyRes.status}: ${txt.slice(0, 200)}`)
    }
    const perfis = (await apifyRes.json()) as Record<string, unknown>[]

    // Socios do lead (para detectar mencao na bio)
    const { data: sociosData } = await supabase
      .schema('app')
      .from('socios')
      .select('id, nome')
      .eq('lead_id', leadId)
    const socios = ((sociosData as { id: string; nome: string }[]) || [])

    // 4. Avaliar cada perfil + montar registros validados
    type RedeRow = {
      lead_id: string; socio_id: string | null; plataforma: string; url: string
      handle: string | null; nome_exibicao: string | null; bio: string | null
      seguidores: number | null; verificado: boolean; contato_externo: string | null
      fonte: string; confianca: string; match_motivo: string; raw: unknown
    }
    const rows: RedeRow[] = []
    const avaliados: { handle: string; confianca: string; motivo: string }[] = []

    for (const p of perfis) {
      const ba = p['businessAddress'] as Record<string, unknown> | undefined
      const m = avaliarMatch(lead, ba)
      const handle = String(p['username'] ?? '')
      avaliados.push({ handle, confianca: m.confianca, motivo: m.motivo })

      // ANTI-FILIAL: descarta o que nao confere endereco/cidade
      if (m.confianca === 'baixa') continue

      const bio = String(p['biography'] ?? '')
      const bioNorm = norm(bio)
      // Detecta socio mencionado na bio (primeiro + ultimo nome)
      let socioMencionado: string | null = null
      const mencoes: string[] = []
      for (const s of socios) {
        const partes = s.nome.trim().split(/\s+/)
        const primeiro = norm(partes[0])
        const ultimo = norm(partes[partes.length - 1])
        if (primeiro && ultimo && bioNorm.includes(primeiro) && bioNorm.includes(ultimo)) {
          socioMencionado = s.id
          mencoes.push(s.nome)
        }
      }
      const motivoFinal =
        m.motivo + (mencoes.length > 0 ? ` | bio menciona socio: ${mencoes.join(', ')}` : '')

      rows.push({
        lead_id: leadId,
        socio_id: mencoes.length === 1 ? socioMencionado : null,
        plataforma: 'instagram',
        url: String(p['url'] ?? `https://www.instagram.com/${handle}`),
        handle,
        nome_exibicao: (p['fullName'] as string) || null,
        bio: bio || null,
        seguidores: typeof p['followersCount'] === 'number' ? (p['followersCount'] as number) : null,
        verificado: Boolean(p['verified']),
        contato_externo: (p['externalUrl'] as string) || null,
        fonte: 'apify',
        confianca: m.confianca,
        match_motivo: motivoFinal,
        raw: p,
      })
    }

    // 5. Persistir (idempotente: limpa redes apify do lead antes)
    const { error: delErr } = await supabase
      .schema('app')
      .from('socio_redes')
      .delete()
      .eq('lead_id', leadId)
      .eq('fonte', 'apify')
    if (delErr) warnings.push(`Erro ao limpar redes anteriores: ${delErr.message}`)

    if (rows.length > 0) {
      const { error: insErr } = await supabase.schema('app').from('socio_redes').insert(rows)
      if (insErr) warnings.push(`Erro ao inserir redes: ${insErr.message}`)
    }

    // Alimenta o painel "Presença Digital" do header (lead_social -> lead.instagram).
    // A melhor rede Instagram de match alta e a presenca digital da empresa.
    const melhorIg =
      rows.find((r) => r.plataforma === 'instagram' && r.confianca === 'alta') ||
      rows.find((r) => r.plataforma === 'instagram')
    if (melhorIg) {
      const rawIg = (melhorIg.raw as Record<string, unknown>) || {}
      const { error: lsErr } = await supabase
        .schema('app')
        .from('lead_social')
        .upsert(
          {
            lead_id: leadId,
            platform: 'instagram',
            url: melhorIg.url,
            handle: melhorIg.handle,
            followers: melhorIg.seguidores,
            is_verified: melhorIg.verificado,
            is_business: Boolean(rawIg['isBusinessAccount']),
            category: (rawIg['businessCategoryName'] as string) || null,
            bio: melhorIg.bio,
            source: 'apify',
            extracted_at: new Date().toISOString(),
          },
          { onConflict: 'lead_id,platform' },
        )
      if (lsErr) warnings.push(`Erro ao popular lead_social (presenca digital): ${lsErr.message}`)

      const updatePayload: Record<string, unknown> = {
        social_media_source: 'apify',
        social_media_extracted_at: new Date().toISOString(),
      }
      // O link da bio (linktr.ee, etc.) vira o website de presenca digital do lead,
      // exibido ao lado das redes sociais. Nao sobrescreve um website ja existente.
      if (!lead.website && melhorIg.contato_externo) {
        updatePayload.website = melhorIg.contato_externo
      }
      const { error: leadErr2 } = await supabase
        .schema('app')
        .from('leads')
        .update(updatePayload)
        .eq('id', leadId)
      if (leadErr2) warnings.push(`Erro ao marcar presenca digital no lead: ${leadErr2.message}`)
    }

    return new Response(
      JSON.stringify({
        termoBusca: termo,
        perfisAvaliados: avaliados,
        redesAtribuidas: rows.map((r) => ({
          plataforma: r.plataforma,
          handle: r.handle,
          url: r.url,
          confianca: r.confianca,
          match_motivo: r.match_motivo,
          contato_externo: r.contato_externo,
          socio_id: r.socio_id,
        })),
        warnings: warnings.length > 0 ? warnings : undefined,
      }),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[social-enrich] erro:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
