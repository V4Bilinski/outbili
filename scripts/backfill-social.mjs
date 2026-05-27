/**
 * Backfill de redes sociais para leads existentes.
 *
 * Fluxo:
 *   1. Lista todos leads do Airtable com CNPJ
 *   2. Filtra: leads SEM Instagram E SEM LinkedIn (prioridades) — ou --force
 *   3. Para cada lead:
 *      a) Consulta Assertiva via Worker (redes sociais)
 *      b) Se Assertiva vazio E lead tem website → Firecrawl fallback
 *      c) Persiste instagram/linkedin/tiktok/facebook + auditoria no Airtable
 *   4. Relatório final
 *
 * Uso:
 *   node scripts/backfill-social.mjs               # real, só leads sem IG+LI
 *   node scripts/backfill-social.mjs --dry-run     # simula, sem escrever
 *   node scripts/backfill-social.mjs --force       # re-processa todos
 *   node scripts/backfill-social.mjs --limit=10    # processa só 10 leads
 */
import { readFileSync } from 'fs'

// DEPRECATED (W3 cutover Supabase): este script grava no AIRTABLE, que nao e mais a
// fonte de dados (migrada para Supabase). O backfill de redes sociais agora e feito
// pela Edge Function social-enrich (enfileirada via app.enrichment_jobs, mode 'social').
// Para nao escrever em base morta, abortamos a execucao.
console.error('backfill-social.mjs DEPRECATED: usa Airtable (descontinuado no cutover Supabase W3). Nao executar. Use a Edge Function social-enrich via fila enrichment_jobs.')
process.exit(1)

// Carregar .env.local
try {
  const envContent = readFileSync('.env.local', 'utf8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
} catch { /* ignore */ }

const PAT = process.env.VITE_AIRTABLE_PAT
const BASE_ID = process.env.VITE_AIRTABLE_BASE_ID
const ASSERTIVA_WORKER = process.env.VITE_ASSERTIVA_WORKER_URL
const FIRECRAWL_KEY = process.env.VITE_FIRECRAWL_API_KEY

if (!PAT || !BASE_ID) {
  console.error('❌ Missing VITE_AIRTABLE_PAT or VITE_AIRTABLE_BASE_ID em .env.local')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : Infinity

const AIRTABLE_API = `https://api.airtable.com/v0/${BASE_ID}/Leads`
const headers = { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' }

// --- URL classifier (espelha socialMediaExtractor.ts) ---
function classifyUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  const url = raw.trim()
  if (!url) return null
  if (/^(mailto:|tel:|javascript:|#)/i.test(url)) return null
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return { platform: 'instagram', url }
  if (lower.includes('linkedin.com') || lower.includes('lnkd.in')) return { platform: 'linkedin', url }
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok.com')) return { platform: 'tiktok', url }
  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.me')) return { platform: 'facebook', url }
  return null
}

function normalizeUrl(raw) {
  if (!raw) return ''
  let url = raw.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  try {
    const parsed = new URL(url)
    parsed.protocol = 'https:'
    parsed.hostname = parsed.hostname.toLowerCase()
    const tracking = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','igshid','_r','ref_src','ref_url','si','feature']
    for (const p of tracking) parsed.searchParams.delete(p)
    let clean = parsed.toString()
    if (clean.endsWith('/') && parsed.pathname.length > 1) clean = clean.replace(/\/$/, '')
    return clean
  } catch {
    return url
  }
}

function extractSocialsFromLinks(links) {
  const result = {}
  for (const link of links) {
    const c = classifyUrl(link)
    if (!c) continue
    if (!result[c.platform]) result[c.platform] = normalizeUrl(c.url)
  }
  return result
}

// --- Assertiva lookup via Worker ---
async function assertivaLookup(cnpj) {
  if (!ASSERTIVA_WORKER) return null
  try {
    const res = await fetch(ASSERTIVA_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lookup-cnpj', cnpj: cnpj.replace(/\D/g, '') }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const resp = data?.resposta || data
    const rawRedes = Array.isArray(resp?.redesSociais) ? resp.redesSociais : []
    const result = { website: resp?.dadosCadastrais?.site || null }
    for (const r of rawRedes) {
      const tipo = (r.tipo || r.rede || r.nome || '').toLowerCase()
      const url = r.url || r.link || r.perfil
      if (!url) continue
      if (tipo.includes('instagram')) result.instagram = url
      else if (tipo.includes('linkedin')) result.linkedin = url
      else if (tipo.includes('tiktok')) result.tiktok = url
      else if (tipo.includes('facebook')) result.facebook = url
    }
    return result
  } catch {
    return null
  }
}

// --- Firecrawl scrape ---
async function firecrawlScrape(websiteUrl) {
  if (!FIRECRAWL_KEY || !websiteUrl) return null
  let url = websiteUrl.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  const ctl = new AbortController()
  const to = setTimeout(() => ctl.abort(), 20000)
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['html','links'], onlyMainContent: false, waitFor: 1500, timeout: 18000 }),
      signal: ctl.signal,
    })
    clearTimeout(to)
    if (!res.ok) return null
    const data = await res.json()
    const payload = data?.data || data
    const allLinks = []
    if (Array.isArray(payload?.links)) {
      for (const l of payload.links) {
        const href = typeof l === 'string' ? l : (l?.url || l?.href)
        if (href) allLinks.push(href)
      }
    }
    if (allLinks.length === 0 && typeof payload?.html === 'string') {
      const rx = /href=["']([^"']+)["']/gi
      let m
      while ((m = rx.exec(payload.html)) !== null) allLinks.push(m[1])
    }
    if (allLinks.length === 0) return null
    return extractSocialsFromLinks(allLinks)
  } catch {
    clearTimeout(to)
    return null
  }
}

// --- Fetch leads paginado ---
async function fetchAllLeads() {
  const all = []
  let offset
  do {
    const params = new URLSearchParams()
    params.set('pageSize', '100')
    if (offset) params.set('offset', offset)
    const res = await fetch(`${AIRTABLE_API}?${params}`, { headers })
    if (!res.ok) throw new Error(`Airtable list error: ${res.status}`)
    const data = await res.json()
    all.push(...data.records)
    offset = data.offset
  } while (offset)
  return all
}

// --- Update batch ---
async function updateBatch(records) {
  if (DRY_RUN || !records.length) return
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10)
    const res = await fetch(AIRTABLE_API, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ records: batch }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error(`  ⚠️  Batch update failed: ${res.status} ${err.slice(0, 200)}`)
    }
  }
}

// --- Main ---
async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  Backfill de Redes Sociais — OUTBILI')
  console.log('═══════════════════════════════════════════════')
  console.log(`  Dry-run: ${DRY_RUN ? 'SIM' : 'NÃO'}`)
  console.log(`  Force: ${FORCE ? 'SIM (todos leads)' : 'NÃO (só sem IG+LI)'}`)
  console.log(`  Limit: ${LIMIT === Infinity ? 'sem limite' : LIMIT}`)
  console.log(`  Assertiva Worker: ${ASSERTIVA_WORKER ? '✓' : '✗'}`)
  console.log(`  Firecrawl: ${FIRECRAWL_KEY ? '✓' : '✗'}`)
  console.log('')

  console.log('📡 Buscando leads…')
  const allRecords = await fetchAllLeads()
  console.log(`   Total: ${allRecords.length} leads\n`)

  const targets = allRecords.filter((r) => {
    const f = r.fields
    if (!f.cnpj) return false
    if (FORCE) return true
    const hasBothPriorities = !!(f.instagram && f.linkedin)
    return !hasBothPriorities
  }).slice(0, LIMIT)

  console.log(`🎯 Alvo: ${targets.length} leads ${FORCE ? '(force)' : 'sem IG+LI'}\n`)

  if (targets.length === 0) {
    console.log('✅ Nada para fazer.')
    return
  }

  const stats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    noCnpj: 0,
    noWebsite: 0,
    assertivaFound: 0,
    firecrawlFound: 0,
    errors: 0,
  }

  const updates = []

  for (let i = 0; i < targets.length; i++) {
    const rec = targets[i]
    const f = rec.fields
    const nome = (f.companyName || '').slice(0, 40).padEnd(40)
    process.stdout.write(`[${String(i + 1).padStart(3)}/${targets.length}] ${nome} `)

    const merged = {}
    let source = null

    // Fase 1: Assertiva
    const assertiva = await assertivaLookup(f.cnpj)
    if (assertiva) {
      if (assertiva.instagram && !f.instagram) merged.instagram = normalizeUrl(assertiva.instagram)
      if (assertiva.linkedin && !f.linkedin) merged.linkedin = normalizeUrl(assertiva.linkedin)
      if (assertiva.tiktok && !f.tiktok) merged.tiktok = normalizeUrl(assertiva.tiktok)
      if (assertiva.facebook && !f.facebook) merged.facebook = normalizeUrl(assertiva.facebook)
      if (assertiva.website && !f.website) merged.website = normalizeUrl(assertiva.website)
      if (Object.keys(merged).length) {
        source = 'assertiva'
        stats.assertivaFound++
      }
    }

    // Fase 2: Firecrawl fallback (se ainda sem IG+LI E tem website)
    const hasIG = merged.instagram || f.instagram
    const hasLI = merged.linkedin || f.linkedin
    const website = merged.website || f.website

    if ((!hasIG || !hasLI) && website && FIRECRAWL_KEY) {
      const fc = await firecrawlScrape(website)
      if (fc) {
        let found = 0
        if (fc.instagram && !merged.instagram && !f.instagram) { merged.instagram = fc.instagram; found++ }
        if (fc.linkedin && !merged.linkedin && !f.linkedin) { merged.linkedin = fc.linkedin; found++ }
        if (fc.tiktok && !merged.tiktok && !f.tiktok) { merged.tiktok = fc.tiktok; found++ }
        if (fc.facebook && !merged.facebook && !f.facebook) { merged.facebook = fc.facebook; found++ }
        if (found > 0) {
          source = source ? 'mixed' : 'firecrawl'
          stats.firecrawlFound++
        }
      }
    }

    if (!website) stats.noWebsite++

    const status = []
    if (merged.instagram) status.push('IG:✓')
    if (merged.linkedin) status.push('LI:✓')
    if (merged.tiktok) status.push('TT:✓')
    if (merged.facebook) status.push('FB:✓')

    if (Object.keys(merged).length > 0) {
      merged.socialMediaExtractedAt = new Date().toISOString()
      merged.socialMediaSource = source || 'assertiva'
      updates.push({ id: rec.id, fields: merged })
      stats.updated++
      console.log(`→ ${status.join(' ') || '—'} [${source}]`)
    } else {
      stats.skipped++
      console.log('→ nenhuma rede nova')
    }

    stats.processed++

    // Batch write a cada 10 leads
    if (updates.length >= 10) {
      await updateBatch(updates.splice(0, 10))
    }

    // Rate limit: 1 req/seg respeitando free tier Firecrawl
    await new Promise((r) => setTimeout(r, 1100))
  }

  // Flush final
  if (updates.length) await updateBatch(updates)

  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log('  Resumo')
  console.log('═══════════════════════════════════════════════')
  console.log(`  Processados:        ${stats.processed}`)
  console.log(`  Atualizados:        ${stats.updated}`)
  console.log(`  Skipped (sem rede): ${stats.skipped}`)
  console.log(`  Sem website:        ${stats.noWebsite}`)
  console.log(`  Assertiva hit:      ${stats.assertivaFound}`)
  console.log(`  Firecrawl hit:      ${stats.firecrawlFound}`)
  if (DRY_RUN) console.log('\n⚠️  DRY-RUN: nada foi escrito no Airtable')
  console.log('')
}

main().catch((err) => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
