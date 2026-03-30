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
}

// --- Column name mapping (fuzzy match) ---
const COLUMN_MAP: Record<string, keyof ParsedCompany> = {
  // Company name
  empresa: 'companyName', company: 'companyName', nome: 'companyName', 'nome da empresa': 'companyName',
  'razão social': 'companyName', 'razao social': 'companyName', name: 'companyName', 'nome fantasia': 'companyName',
  // CNPJ
  cnpj: 'cnpj', 'cnpj/cpf': 'cnpj',
  // Phone
  telefone: 'phone', phone: 'phone', tel: 'phone', celular: 'phone', whatsapp: 'phone', fone: 'phone',
  // Email
  email: 'email', 'e-mail': 'email', mail: 'email',
  // Website
  site: 'website', website: 'website', url: 'website', 'web site': 'website', dominio: 'website',
  // Address
  endereco: 'address', endereço: 'address', address: 'address', logradouro: 'address', rua: 'address',
  // City
  cidade: 'city', city: 'city', municipio: 'city', município: 'city',
  // State
  estado: 'state', uf: 'state', state: 'state',
  // Segment
  segmento: 'segment', segment: 'segment', setor: 'segment', ramo: 'segment', atividade: 'segment', categoria: 'segment',
  // Contact
  contato: 'contactName', 'nome do contato': 'contactName', responsavel: 'contactName', responsável: 'contactName',
  decisor: 'contactName', proprietario: 'contactName', proprietário: 'contactName', dono: 'contactName', ceo: 'contactName',
  // Contact role
  cargo: 'contactRole', role: 'contactRole', função: 'contactRole', funcao: 'contactRole',
  // Social
  instagram: 'instagram', ig: 'instagram',
  linkedin: 'linkedin',
  // Notes
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

  // If no mapped company name, try first text column with content
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
    cnpj: mapped.cnpj,
    phone: mapped.phone,
    email: mapped.email,
    website: mapped.website,
    address: mapped.address,
    city: mapped.city,
    state: mapped.state,
    segment: mapped.segment,
    contactName: mapped.contactName,
    contactRole: mapped.contactRole,
    instagram: mapped.instagram,
    linkedin: mapped.linkedin,
    notes: mapped.notes,
    raw: row,
  }
}

// --- CSV Parser ---
function parseCSV(text: string): { rows: Record<string, string>[]; columns: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], columns: [] }

  // Detect separator
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

// --- HTML Parser (extract tables or structured data) ---
function parseHTML(html: string): { rows: Record<string, string>[]; columns: string[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Try to find tables
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

  // Try to extract company names from headings or cards
  const names: string[] = []
  doc.querySelectorAll('h1, h2, h3, h4, .company-name, [class*="company"], [class*="empresa"]').forEach((el) => {
    const text = el.textContent?.trim()
    if (text && text.length > 2 && text.length < 100) names.push(text)
  })

  if (names.length > 0) {
    const columns = ['empresa']
    const rows = names.map((name) => ({ empresa: name }))
    return { rows, columns }
  }

  return { rows: [], columns: [] }
}

// --- Text/Notes Parser (one company per line or structured) ---
function parseText(text: string): { rows: Record<string, string>[]; columns: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && l.length > 2)

  // Check if it looks like a CSV
  if (lines[0]?.includes(',') || lines[0]?.includes(';') || lines[0]?.includes('\t')) {
    return parseCSV(text)
  }

  // Each line is a company name (possibly with extra info separated by - or |)
  const columns = ['empresa', 'info']
  const rows: Record<string, string>[] = []

  for (const line of lines) {
    // Skip obvious headers
    if (/^(empresa|company|nome|#|\d+\.)$/i.test(line)) continue

    const parts = line.split(/[\-\|–—]/).map((p) => p.trim())
    rows.push({
      empresa: parts[0] || line,
      info: parts.slice(1).join(' · ') || '',
    })
  }

  return { rows, columns }
}

// --- PDF Parser (using pdfjs-dist for proper text extraction) ---
async function parsePDF(buffer: ArrayBuffer): Promise<{ rows: Record<string, string>[]; columns: string[] }> {
  const pdfjsLib = await import('pdfjs-dist')

  // Use bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const lines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items by Y position to reconstruct lines
    const itemsByY = new Map<number, string[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      if (!itemsByY.has(y)) itemsByY.set(y, [])
      itemsByY.get(y)!.push(item.str)
    }

    // Sort by Y descending (PDF Y is bottom-up) and join each line
    const sortedYs = Array.from(itemsByY.keys()).sort((a, b) => b - a)
    for (const y of sortedYs) {
      const line = itemsByY.get(y)!.join(' ').trim()
      if (line) lines.push(line)
    }
  }

  const text = lines.join('\n')

  // Check if extracted text looks like a table (has separators)
  if (text.includes(';') || text.includes('\t') || text.includes(',')) {
    // Try CSV parse first (common in PDF exports)
    const csvResult = parseCSV(text)
    if (csvResult.rows.length > 0 && csvResult.columns.length > 1) {
      return csvResult
    }
  }

  return parseText(text)
}

// --- Main parser ---
export async function parseFile(file: File): Promise<ParseResult> {
  const errors: string[] = []
  const fileName = file.name
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  let rows: Record<string, string>[] = []
  let columns: string[] = []
  let fileType = ext

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
      fileType = 'PDF'
    } else if (ext === 'txt' || ext === 'md' || ext === 'text' || !ext) {
      const text = await file.text()
      const result = parseText(text)
      rows = result.rows
      columns = result.columns
      fileType = 'Texto'
    } else {
      // Try as text
      const text = await file.text()
      const result = parseText(text)
      rows = result.rows
      columns = result.columns
      fileType = ext.toUpperCase()
    }
  } catch (err: any) {
    errors.push(`Erro ao processar arquivo: ${err.message}`)
  }

  // Map rows to companies
  const companies: ParsedCompany[] = []
  for (const row of rows) {
    const company = rowToCompany(row, columns)
    if (company) companies.push(company)
  }

  if (companies.length === 0 && rows.length > 0) {
    errors.push('Nenhuma empresa identificada. Verifique se o arquivo contém uma coluna com nomes de empresas.')
  }

  return {
    companies,
    fileType,
    fileName,
    totalRows: rows.length,
    columns,
    errors,
  }
}

export const ACCEPTED_FORMATS = '.csv,.tsv,.xlsx,.xls,.html,.htm,.pdf,.txt,.md,.text'
export const FORMAT_LABELS = 'CSV, Excel, HTML, PDF, TXT'
