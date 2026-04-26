/**
 * Recalcula SPICED para todos os leads com score 0 no Airtable.
 * Usa a mesma lógica de calculateSpicedDimensions do enrichmentService.
 *
 * Uso: node scripts/recalc-spiced.mjs
 */
import { readFileSync } from 'fs'

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
if (!PAT || !BASE_ID) { console.error('Missing VITE_AIRTABLE_PAT or VITE_AIRTABLE_BASE_ID'); process.exit(1) }

const AIRTABLE_API = `https://api.airtable.com/v0/${BASE_ID}/Leads`
const headers = { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' }

// --- SPICED calculation (same as enrichmentService.ts) ---
function calculateSpicedDimensions(data) {
  const yearsInMarket = data.yearsInMarket
    ?? (data.foundingDate
      ? Math.floor((Date.now() - new Date(data.foundingDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined)

  // S (Situação) 25%
  let spicedS = 1
  if (data.employees && data.employees > 5) spicedS++
  if (data.employees && data.employees > 20) spicedS++
  if (yearsInMarket && yearsInMarket > 3) spicedS++
  if (data.city && data.state) spicedS++
  if (data.capitalSocial && data.capitalSocial >= 100000) spicedS++
  if (data.isHeadquarters) spicedS++

  // P (Dor) 25%
  let spicedP = 1
  if (!data.website) spicedP++
  if (!data.instagram) spicedP++
  const emailDomain = data.emailDomain || (data.rfEmail?.split('@')[1]) || ''
  const isGenericEmail = /gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\./i.test(emailDomain)
  if (isGenericEmail || !emailDomain) spicedP++
  if (data.phoneType === 'LANDLINE' || (!data.assertivaWhatsappFlag && data.rfPhone)) spicedP++
  if (data.capitalSocial && data.capitalSocial < 50000 && yearsInMarket && yearsInMarket > 5) spicedP++
  if (data.simplesOptant && data.employees && data.employees > 10) spicedP++

  // I (Impacto) 20%
  let spicedI = 1
  const revenue = data.monthlyRevenue || 0
  const rendaDecisor = data.assertivaIncomeEstimate || 0
  if (revenue > 0) {
    if (revenue >= 100000) spicedI++
    if (revenue >= 200000) spicedI++
    if (revenue >= 500000) spicedI++
  } else if (rendaDecisor > 0) {
    if (rendaDecisor >= 10000) spicedI++
    if (rendaDecisor >= 30000) spicedI++
    if (rendaDecisor >= 100000) spicedI++
  } else if (data.capitalSocial) {
    if (data.capitalSocial >= 50000) spicedI++
    if (data.capitalSocial >= 200000) spicedI++
    if (data.capitalSocial >= 500000) spicedI++
  }
  if (data.taxRegime === 'lucro_presumido' || data.taxRegime === 'lucro_real') spicedI++
  if (data.employees && data.employees > 50) spicedI++

  // C (Evento Crítico) 15%
  let spicedC = 1
  if (yearsInMarket !== undefined && yearsInMarket < 2) spicedC += 2
  if (data.assertivaWhatsappFlag) spicedC++
  if (data.statusDate) {
    const statusDate = new Date(data.statusDate)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    if (!isNaN(statusDate.getTime()) && statusDate > sixMonthsAgo) spicedC++
  }
  if (data.registrationStatus === 'Ativa' && yearsInMarket !== undefined && yearsInMarket < 1) spicedC++

  // D (Decisão) 15%
  let spicedD = 1
  if (data.cnpj) spicedD++
  if (data.partners) spicedD++
  if (data.rfEmail || data.assertivaEmailValidated) spicedD++
  if (data.assertivaWhatsappFlag) spicedD++
  if (data.linkedin || data.website) spicedD++

  const cap = (n) => Math.min(5, Math.max(1, n))
  return { spicedS: cap(spicedS), spicedP: cap(spicedP), spicedI: cap(spicedI), spicedC: cap(spicedC), spicedD: cap(spicedD) }
}

function calculateScore(s, p, i, c, d) {
  return Math.round((s * 0.25 + p * 0.25 + i * 0.20 + c * 0.15 + d * 0.15) * 10) / 10
}

function getTemperature(score) {
  if (score >= 3.7) return 'Quente'
  if (score >= 2.5) return 'Morno'
  return 'Frio'
}

// --- Airtable helpers ---
async function fetchLeadsWithScore0(offset) {
  const params = new URLSearchParams({
    filterByFormula: '{score} = 0',
    'fields[]': ['companyName', 'cnpj', 'capitalSocial', 'foundingDate', 'city', 'state',
      'rfEmail', 'rfPhone', 'partners', 'website', 'instagram', 'linkedin',
      'employees', 'monthlyRevenue', 'taxRegime', 'isHeadquarters',
      'simplesOptant', 'assertivaWhatsappFlag', 'assertivaIncomeEstimate',
      'emailDomain', 'phoneType', 'statusDate', 'registrationStatus',
      'assertivaEmailValidated'].join(','),
    pageSize: '100',
  })
  // Airtable needs fields[] as repeated params
  const url = new URL(AIRTABLE_API)
  url.searchParams.set('filterByFormula', '{score} = 0')
  url.searchParams.set('pageSize', '100')
  const fieldsList = ['companyName', 'cnpj', 'capitalSocial', 'foundingDate', 'city', 'state',
    'rfEmail', 'rfPhone', 'partners', 'website', 'instagram', 'linkedin',
    'employees', 'monthlyRevenue', 'taxRegime', 'isHeadquarters',
    'simplesOptant', 'assertivaWhatsappFlag', 'assertivaIncomeEstimate',
    'emailDomain', 'phoneType', 'statusDate', 'registrationStatus', 'assertivaEmailValidated']
  for (const f of fieldsList) url.searchParams.append('fields[]', f)
  if (offset) url.searchParams.set('offset', offset)

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`Airtable fetch error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function updateBatch(records) {
  const res = await fetch(AIRTABLE_API, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ records, typecast: true }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Airtable update error: ${res.status} ${errText}`)
  }
  return res.json()
}

// --- Main ---
async function main() {
  console.log('Buscando leads com score 0...')
  let allRecords = []
  let offset = undefined

  do {
    const data = await fetchLeadsWithScore0(offset)
    allRecords.push(...data.records)
    offset = data.offset
    console.log(`  Fetched ${allRecords.length} records...`)
  } while (offset)

  console.log(`\nTotal: ${allRecords.length} leads com score 0\n`)

  if (allRecords.length === 0) {
    console.log('Nenhum lead para recalcular.')
    return
  }

  // Calculate SPICED for each
  const updates = allRecords.map((rec) => {
    const f = rec.fields
    const data = {
      cnpj: f.cnpj,
      capitalSocial: f.capitalSocial,
      foundingDate: f.foundingDate,
      city: f.city,
      state: f.state,
      rfEmail: f.rfEmail,
      rfPhone: f.rfPhone,
      partners: f.partners,
      website: f.website,
      instagram: f.instagram,
      linkedin: f.linkedin,
      employees: f.employees,
      monthlyRevenue: f.monthlyRevenue,
      taxRegime: f.taxRegime,
      isHeadquarters: f.isHeadquarters,
      simplesOptant: f.simplesOptant,
      assertivaWhatsappFlag: f.assertivaWhatsappFlag,
      assertivaIncomeEstimate: f.assertivaIncomeEstimate,
      emailDomain: f.emailDomain,
      phoneType: f.phoneType,
      statusDate: f.statusDate,
      registrationStatus: f.registrationStatus,
      assertivaEmailValidated: f.assertivaEmailValidated,
    }

    const spiced = calculateSpicedDimensions(data)
    const score = calculateScore(spiced.spicedS, spiced.spicedP, spiced.spicedI, spiced.spicedC, spiced.spicedD)
    const temperature = getTemperature(score)

    return {
      id: rec.id,
      fields: {
        score,
        temperatura: temperature,
        spicedS: spiced.spicedS,
        spicedP: spiced.spicedP,
        spicedI: spiced.spicedI,
        spicedC: spiced.spicedC,
        spicedD: spiced.spicedD,
      },
    }
  })

  // Log sample
  const sample = updates[0]
  console.log(`Exemplo: ${allRecords[0].fields.companyName}`)
  console.log(`  S=${sample.fields.spicedS} P=${sample.fields.spicedP} I=${sample.fields.spicedI} C=${sample.fields.spicedC} D=${sample.fields.spicedD}`)
  console.log(`  Score: ${sample.fields.score} → ${sample.fields.temperatura}\n`)

  // Score distribution
  const dist = { Quente: 0, Morno: 0, Frio: 0 }
  for (const u of updates) dist[u.fields.temperatura]++
  console.log(`Distribuição: Quente=${dist.Quente} Morno=${dist.Morno} Frio=${dist.Frio}\n`)

  // Update in batches of 10
  let updated = 0
  for (let i = 0; i < updates.length; i += 10) {
    const batch = updates.slice(i, i + 10)
    await updateBatch(batch)
    updated += batch.length
    console.log(`  Atualizados: ${updated}/${updates.length}`)
    // Rate limit: 5 req/sec
    if (i + 10 < updates.length) await new Promise(r => setTimeout(r, 250))
  }

  console.log(`\n✅ Recálculo completo: ${updated} leads atualizados com SPICED.`)
}

main().catch((err) => {
  console.error('ERRO:', err.message)
  process.exit(1)
})
