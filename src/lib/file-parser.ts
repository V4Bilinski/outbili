import * as XLSX from 'xlsx'

export interface ParsedCompany {
  companyName: string
  cnpj?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  segment?: string
  contactName?: string
  contactRole?: string
  instagram?: string
  linkedin?: string
  notes?: string
  raw: Record<string, string>
}

export interface ParseResult {
  companies: ParsedCompany[]
  fileType: string
  fileName: string
  totalRows: number
  columns: string[]
  errors: string[]
  rawText?: string
}

// --- Regex patterns for intelligent extraction ---
const PATTERNS = {
  cnpj: /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/g,
  cpf: /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g,
  phone: /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9?\s?\d{4}[\s-]?\d{4})/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  website: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s)]*)?/gi,
  instagram: /@[a-zA-Z0-9._]{2,30}|instagram\.com\/[a-zA-Z0-9._]+/gi,
  cep: /\d{5}-?\d{3}/g,
}

// Brazilian states for detection
const BR_STATES = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
])

const BR_STATE_NAMES: Record<string, string> = {
  'acre':'AC','alagoas':'AL','amapa':'AP','amazonas':'AM','bahia':'BA',
  'ceara':'CE','distrito federal':'DF','espirito santo':'ES','goias':'GO',
  'maranhao':'MA','mato grosso':'MT','mato grosso do sul':'MS','minas gerais':'MG',
  'para':'PA','paraiba':'PB','parana':'PR','pernambuco':'PE','piaui':'PI',
  'rio de janeiro':'RJ','rio grande do norte':'RN','rio grande do sul':'RS',
  'rondonia':'RO','roraima':'RR','santa catarina':'SC','sao paulo':'SP',
  'sergipe':'SE','tocantins':'TO',
}

// --- Column name mapping (fuzzy match for structured files) ---
const COLUMN_MAP: Record<string, keyof ParsedCompany> = {
  empresa: 'companyName', company: 'companyName', nome: 'companyName', 'nome da empresa': 'companyName',
  'razão social': 'companyName', 'razao social': 'companyName', name: 'companyName', 'nome fantasia': 'companyName',
  cnpj: 'cnpj', 'cnpj/cpf': 'cnpj',
  telefone: 'phone', phone: 'phone', tel: 'phone', celular: 'phone', whatsapp: 'phone', fone: 'phone',
  email: 'email', 'e-mail': 'email', mail: 'email',
  site: 'website', website: 'website', url: 'website', 'web site': 'website', dominio: 'website',
  endereco: 'address', endereço: 'address', address: 'address', logradouro: 'address', rua: 'address',
  cidade: 'city', city: 'city', municipio: 'city', município: 'city',
  estado: 'state', uf: 'state', state: 'state',
  segmento: 'segment', segment: 'segment', setor: 'segment', ramo: 'segment', atividade: 'segment', categoria: 'segment',
  contato: 'contactName', 'nome do contato': 'contactName', responsavel: 'contactName', responsável: 'contactName',
  decisor: 'contactName', proprietario: 'contactName', proprietário: 'contactName', dono: 'contactName', ceo: 'contactName',
  cargo: 'contactRole', role: 'contactRole', função: 'contactRole', funcao: 'contactRole',
  instagram: 'instagram', ig: 'instagram',
  linkedin: 'linkedin',
  observacao: 'notes', observação: 'notes', obs: 'notes', notas: 'notes', notes: 'notes', comentario: 'notes',
}

function mapColumnName(col: string): keyof ParsedCompany | null {
  const normalized = col.toLowerCase().trim().replace(/[_\-\.]/g, ' ')
  return COLUMN_MAP[normalized] || null
}

function rowToCompany(row: Record<string, string>, columns: string[]): ParsedCompany | null {
  const mapped: Record<string, string> = {}
  let hasName = false

  for (const col of columns) {
    const value = (row[col] || '').toString().trim()
    if (!value) continue
    const field = mapColumnName(col)
    if (field) {
      mapped[field] = value
      if (field === 'companyName') hasName = true
    }
  }

  if (!hasName) {
    for (const col of columns) {
      const value = (row[col] || '').toString().trim()
      if (value && value.length > 2 && !/^\d+$/.test(value)) {
        mapped.companyName = value
        hasName = true
        break
      }
    }
  }

  if (!hasName || !mapped.companyName) return null

  return {
    companyName: mapped.companyName || '',
    cnpj: mapped.cnpj, phone: mapped.phone, email: mapped.email,
    website: mapped.website, address: mapped.address, city: mapped.city,
    state: mapped.state, segment: mapped.segment, contactName: mapped.contactName,
    contactRole: mapped.contactRole, instagram: mapped.instagram,
    linkedin: mapped.linkedin, notes: mapped.notes, raw: row,
  }
}

// =============================================
// INTELLIGENT TEXT ANALYZER (pattern-based)
// Reads the document first, detects entities,
// then groups them into company records
// =============================================

function extractAllPatterns(text: string) {
  const cnpjs = [...new Set((text.match(PATTERNS.cnpj) || []).map(c => c.replace(/\D/g, '')).filter(c => c.length === 14))]
  const phones = [...new Set((text.match(PATTERNS.phone) || []).map(p => p.replace(/\D/g, '')))]
  const emails = [...new Set(text.match(PATTERNS.email) || [])]
  const websites = [...new Set((text.match(PATTERNS.website) || []).filter(w =>
    !w.includes('@') && !w.match(/^\d/) && w.includes('.') && w.length > 5
    && !w.match(/\.(pdf|jpg|png|gif|svg|css|js)$/i)
  ))]
  const instagrams = [...new Set((text.match(PATTERNS.instagram) || []).map(i =>
    i.replace(/instagram\.com\//i, '@').replace(/^@/, '')
  ))]

  return { cnpjs, phones, emails, websites, instagrams }
}

function detectState(text: string): string | undefined {
  // Check for UF abbreviations
  const ufMatch = text.match(/\b([A-Z]{2})\b/g)
  if (ufMatch) {
    for (const m of ufMatch) {
      if (BR_STATES.has(m)) return m
    }
  }
  // Check for full state names
  const lower = text.toLowerCase()
  for (const [name, uf] of Object.entries(BR_STATE_NAMES)) {
    if (lower.includes(name)) return uf
  }
  return undefined
}

function detectCity(text: string, state?: string): string | undefined {
  // Common patterns: "Cidade/UF", "Cidade - UF", "Cidade, UF"
  if (state) {
    const cityPattern = new RegExp(`([A-ZÀ-Ú][a-zà-ú]+(?:\\s+[A-ZÀ-Ú][a-zà-ú]+)*)\\s*[/,\\-–]\\s*${state}`, 'g')
    const match = cityPattern.exec(text)
    if (match) return match[1].trim()
  }
  return undefined
}

function isLikelyCompanyName(text: string): boolean {
  if (text.length < 3 || text.length > 120) return false
  if (/^\d+$/.test(text)) return false
  if (text.match(PATTERNS.email)) return false
  if (text.match(PATTERNS.cnpj)) return false
  // Company name indicators
  const indicators = /\b(ltda|eireli|me|epp|s\.?a\.?|ss|empresa|clinica|cl[ií]nica|consultorio|consult[oó]rio|laborat[oó]rio|farm[aá]cia|loja|com[eé]rcio|ind[uú]stria|servi[cç]os|studio|est[eé]tica|academia|pet\s*shop|agência|ag[eê]ncia|escola|instituto|hospital|odonto|dental)\b/i
  const hasIndicator = indicators.test(text)
  // Starts with uppercase and has reasonable word count
  const wordCount = text.split(/\s+/).length
  const startsUpper = /^[A-ZÀ-Ú]/.test(text)
  return hasIndicator || (startsUpper && wordCount >= 2 && wordCount <= 10)
}

function analyzeUnstructuredText(text: string): ParsedCompany[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  const extracted = extractAllPatterns(text)
  const companies: ParsedCompany[] = []

  // Strategy 1: If CNPJs found, use them as anchors to group data
  if (extracted.cnpjs.length > 0) {
    for (const cnpj of extracted.cnpjs) {
      const formatted = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
      // Find the line containing this CNPJ
      const cnpjLineIdx = lines.findIndex(l => l.replace(/\D/g, '').includes(cnpj))
      if (cnpjLineIdx === -1) continue

      // Look for company name in surrounding lines (before and after)
      let companyName = ''
      const searchRange = 5

      // Check lines before CNPJ for company name
      for (let i = Math.max(0, cnpjLineIdx - searchRange); i < cnpjLineIdx; i++) {
        const cleaned = lines[i].replace(/cnpj\s*:?\s*/i, '').trim()
        if (isLikelyCompanyName(cleaned)) {
          companyName = cleaned
          break
        }
      }

      // If not found before, check the CNPJ line itself (might have "Nome - CNPJ")
      if (!companyName) {
        const cnpjLine = lines[cnpjLineIdx]
        const beforeCnpj = cnpjLine.split(/\d{2}\.?\d{3}\.?\d{3}/)[0].trim()
        if (beforeCnpj && isLikelyCompanyName(beforeCnpj.replace(/[-–|:;]/g, '').trim())) {
          companyName = beforeCnpj.replace(/[-–|:;]\s*$/, '').trim()
        }
      }

      // Check lines after CNPJ
      if (!companyName) {
        for (let i = cnpjLineIdx + 1; i <= Math.min(lines.length - 1, cnpjLineIdx + searchRange); i++) {
          const cleaned = lines[i].replace(/raz[aã]o\s*social\s*:?\s*/i, '').replace(/nome\s*fantasia\s*:?\s*/i, '').trim()
          if (isLikelyCompanyName(cleaned)) {
            companyName = cleaned
            break
          }
        }
      }

      if (!companyName) companyName = `Empresa CNPJ ${formatted}`

      // Extract surrounding context for additional fields
      const context = lines.slice(
        Math.max(0, cnpjLineIdx - searchRange),
        Math.min(lines.length, cnpjLineIdx + searchRange + 1)
      ).join(' ')

      const contextPatterns = extractAllPatterns(context)
      const state = detectState(context)
      const city = detectCity(context, state)

      companies.push({
        companyName,
        cnpj: formatted,
        phone: contextPatterns.phones[0],
        email: contextPatterns.emails[0],
        website: contextPatterns.websites[0],
        city,
        state,
        instagram: contextPatterns.instagrams[0],
        raw: { _source: 'intelligent_extraction', _cnpj: cnpj },
      })
    }
  }

  // Strategy 2: If no CNPJs, look for company names as anchors
  if (companies.length === 0) {
    const companyLines: Array<{ name: string; lineIdx: number }> = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip very short lines, numbers-only, and common headers
      if (line.length < 4) continue
      if (/^(empresa|nome|cnpj|telefone|email|endereco|cidade|#|\d+\.|---)/i.test(line)) continue

      if (isLikelyCompanyName(line)) {
        companyLines.push({ name: line, lineIdx: i })
      }
    }

    for (const { name, lineIdx } of companyLines) {
      const context = lines.slice(
        Math.max(0, lineIdx - 2),
        Math.min(lines.length, lineIdx + 5)
      ).join(' ')

      const contextPatterns = extractAllPatterns(context)
      const state = detectState(context)
      const city = detectCity(context, state)

      companies.push({
        companyName: name,
        cnpj: contextPatterns.cnpjs[0] ? contextPatterns.cnpjs[0].replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : undefined,
        phone: contextPatterns.phones[0],
        email: contextPatterns.emails[0],
        website: contextPatterns.websites[0],
        city,
        state,
        instagram: contextPatterns.instagrams[0],
        raw: { _source: 'intelligent_extraction', _line: String(lineIdx) },
      })
    }
  }

  // Strategy 3: Last resort — if we found emails/phones but no companies, create entries from them
  if (companies.length === 0 && (extracted.emails.length > 0 || extracted.phones.length > 0)) {
    const emailDomains = extracted.emails.map(e => {
      const domain = e.split('@')[1]?.split('.')[0]
      return domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : null
    }).filter(Boolean)

    for (let i = 0; i < Math.max(extracted.emails.length, extracted.phones.length); i++) {
      companies.push({
        companyName: emailDomains[i] || `Lead ${i + 1}`,
        email: extracted.emails[i],
        phone: extracted.phones[i],
        website: extracted.websites[i],
        raw: { _source: 'pattern_fallback' },
      })
    }
  }

  // Deduplicate by CNPJ or company name
  const seen = new Set<string>()
  return companies.filter(c => {
    const key = c.cnpj || c.companyName.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// --- CSV Parser ---
function parseCSV(text: string): { rows: Record<string, string>[]; columns: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], columns: [] }

  const firstLine = lines[0]
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','

  const columns = firstLine.split(sep).map((c) => c.replace(/^["']|["']$/g, '').trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(sep).map((v) => v.replace(/^["']|["']$/g, '').trim())
    const row: Record<string, string> = {}
    columns.forEach((col, j) => { row[col] = values[j] || '' })
    rows.push(row)
  }

  return { rows, columns }
}

// --- Excel Parser ---
function parseExcel(buffer: ArrayBuffer): { rows: Record<string, string>[]; columns: string[] } {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

  if (json.length === 0) return { rows: [], columns: [] }

  const columns = Object.keys(json[0])
  const rows = json.map((row) => {
    const mapped: Record<string, string> = {}
    for (const key of columns) {
      mapped[key] = String(row[key] ?? '')
    }
    return mapped
  })

  return { rows, columns }
}

// --- HTML Parser ---
function parseHTML(html: string): { rows: Record<string, string>[]; columns: string[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const tables = doc.querySelectorAll('table')
  if (tables.length > 0) {
    const table = tables[0]
    const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'))
      .map((th) => th.textContent?.trim() || '')
    const bodyRows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'))

    const columns = headers.length > 0 ? headers : [`Col1`, `Col2`, `Col3`]
    const rows: Record<string, string>[] = []

    bodyRows.forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim() || '')
      if (cells.length > 0 && cells.some((c) => c)) {
        const row: Record<string, string> = {}
        columns.forEach((col, i) => { row[col] = cells[i] || '' })
        rows.push(row)
      }
    })

    return { rows, columns }
  }

  const names: string[] = []
  doc.querySelectorAll('h1, h2, h3, h4, .company-name, [class*="company"], [class*="empresa"]').forEach((el) => {
    const text = el.textContent?.trim()
    if (text && text.length > 2 && text.length < 100) names.push(text)
  })

  if (names.length > 0) {
    return { rows: names.map((name) => ({ empresa: name })), columns: ['empresa'] }
  }

  return { rows: [], columns: [] }
}

// --- Word/DOCX Parser (mammoth) ---
async function parseDocx(buffer: ArrayBuffer): Promise<{ rows: Record<string, string>[]; columns: string[]; rawText: string }> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  const rawText = result.value || ''
  return { rows: [], columns: [], rawText }
}

// --- PDF Parser (pdfjs-dist) ---
async function parsePDF(buffer: ArrayBuffer): Promise<{ rows: Record<string, string>[]; columns: string[]; rawText: string }> {
  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const lines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    const itemsByY = new Map<number, string[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      if (!itemsByY.has(y)) itemsByY.set(y, [])
      itemsByY.get(y)!.push(item.str)
    }

    const sortedYs = Array.from(itemsByY.keys()).sort((a, b) => b - a)
    for (const y of sortedYs) {
      const line = itemsByY.get(y)!.join(' ').trim()
      if (line) lines.push(line)
    }
  }

  const rawText = lines.join('\n')

  // Try structured parse first (CSV-like)
  if (rawText.includes(';') || rawText.includes('\t')) {
    const csvLines = rawText.split(/\r?\n/).filter(l => l.trim())
    if (csvLines.length >= 2) {
      const firstLine = csvLines[0]
      const sep = firstLine.includes('\t') ? '\t' : ';'
      const colCount = firstLine.split(sep).length
      if (colCount >= 2) {
        const csvResult = parseCSV(rawText)
        if (csvResult.rows.length > 0 && csvResult.columns.length > 1) {
          return { ...csvResult, rawText }
        }
      }
    }
  }

  // Otherwise return raw text for intelligent analysis
  return { rows: [], columns: [], rawText }
}

// --- Main parser ---
export async function parseFile(file: File): Promise<ParseResult> {
  const errors: string[] = []
  const fileName = file.name
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  let rows: Record<string, string>[] = []
  let columns: string[] = []
  let fileType = ext
  let rawText = ''

  try {
    if (ext === 'csv' || ext === 'tsv') {
      const text = await file.text()
      const result = parseCSV(text)
      rows = result.rows
      columns = result.columns
      fileType = 'CSV'
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer()
      const result = parseExcel(buffer)
      rows = result.rows
      columns = result.columns
      fileType = 'Excel'
    } else if (ext === 'html' || ext === 'htm') {
      const text = await file.text()
      const result = parseHTML(text)
      rows = result.rows
      columns = result.columns
      fileType = 'HTML'
    } else if (ext === 'pdf') {
      const buffer = await file.arrayBuffer()
      const result = await parsePDF(buffer)
      rows = result.rows
      columns = result.columns
      rawText = result.rawText
      fileType = 'PDF'
    } else if (ext === 'docx' || ext === 'doc') {
      const buffer = await file.arrayBuffer()
      const result = await parseDocx(buffer)
      rawText = result.rawText
      fileType = 'Word'
    } else if (ext === 'txt' || ext === 'md' || ext === 'text' || !ext) {
      rawText = await file.text()
      fileType = 'Texto'
    } else {
      rawText = await file.text()
      fileType = ext.toUpperCase()
    }
  } catch (err: any) {
    errors.push(`Erro ao processar arquivo: ${err.message}`)
  }

  // =============================================
  // INTELLIGENT ANALYSIS LAYER
  // For structured files (CSV, Excel): use column mapping
  // For unstructured files (PDF, TXT): use pattern detection
  // =============================================

  let companies: ParsedCompany[] = []

  if (rows.length > 0 && columns.length > 0) {
    // Structured file — use column mapping
    for (const row of rows) {
      const company = rowToCompany(row, columns)
      if (company) companies.push(company)
    }
  }

  if (companies.length === 0 && rawText) {
    // Unstructured file — use intelligent pattern extraction
    companies = analyzeUnstructuredText(rawText)
    if (companies.length > 0) {
      // Set columns based on what was detected
      columns = ['empresa']
      if (companies.some(c => c.cnpj)) columns.push('cnpj')
      if (companies.some(c => c.phone)) columns.push('telefone')
      if (companies.some(c => c.email)) columns.push('email')
      if (companies.some(c => c.website)) columns.push('website')
      if (companies.some(c => c.city)) columns.push('cidade')
      if (companies.some(c => c.state)) columns.push('estado')
    }
  }

  if (companies.length === 0 && (rows.length > 0 || rawText)) {
    errors.push('Nenhuma empresa identificada. O sistema analisou o documento por CNPJs, nomes de empresas, telefones e emails mas nao encontrou dados estruturados.')
  }

  return {
    companies,
    fileType,
    fileName,
    totalRows: companies.length || rows.length,
    columns,
    errors,
    rawText: rawText || undefined,
  }
}

export const ACCEPTED_FORMATS = '.csv,.tsv,.xlsx,.xls,.html,.htm,.pdf,.docx,.doc,.txt,.md,.text'
export const FORMAT_LABELS = 'CSV, Excel, Word, PDF, TXT'
