/**
 * VibeProspecting (Explorium MCP) — HTTP client
 *
 * Protocolo: JSON-RPC 2.0 sobre Streamable HTTP (SSE)
 * Usado como fallback de pesquisa quando Apify falha.
 */

const VP_ENDPOINT = import.meta.env.VITE_VIBEPROSPECTING_URL || 'https://mcp-gemini.vibeprospecting.ai/mcp'
const VP_TOKEN = import.meta.env.VITE_VIBEPROSPECTING_TOKEN || ''

let sessionId: string | null = null
let mcpSessionId: string | null = null
let requestId = 0

function nextId() {
  return ++requestId
}

function parseSSE(raw: string): any {
  for (const line of raw.split('\n')) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.slice(6))
    }
  }
  return null
}

async function mcpCall(method: string, params: Record<string, any> = {}): Promise<any> {
  // Initialize session if needed
  if (!mcpSessionId) {
    const initRes = await fetch(VP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${VP_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: nextId(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'outbili', version: '1.0.0' },
        },
      }),
    })
    mcpSessionId = initRes.headers.get('mcp-session-id')
  }

  const res = await fetch(VP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${VP_TOKEN}`,
      ...(mcpSessionId ? { 'Mcp-Session-Id': mcpSessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextId(),
      method: 'tools/call',
      params: { name: method, arguments: params },
    }),
  })

  if (!res.ok) {
    throw new Error(`VibeProspecting error: ${res.status}`)
  }

  const text = await res.text()
  const parsed = parseSSE(text)
  if (parsed?.error) {
    throw new Error(parsed.error.message || 'VibeProspecting call failed')
  }

  return parsed?.result
}

// --- Public API ---

export interface VPBusinessMatch {
  businessId: string
  name: string
  domain?: string
  industry?: string
  employeeCount?: number
  revenue?: string
  city?: string
  state?: string
  country?: string
  description?: string
  linkedinUrl?: string
  website?: string
  phone?: string
  technologies?: string[]
}

export interface VPProspectMatch {
  prospectId: string
  firstName?: string
  lastName?: string
  fullName?: string
  title?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  company?: string
}

/**
 * Busca empresa por nome e/ou dominio.
 * Retorna dados firmograficos (tamanho, receita, industria, tecnologias).
 */
export async function matchBusiness(name: string, domain?: string): Promise<VPBusinessMatch | null> {
  try {
    const businesses = [{ name, ...(domain ? { domain } : {}) }]
    const result = await mcpCall('match-business', {
      businesses_to_match: businesses,
      ...(sessionId ? { session_id: sessionId } : {}),
    })

    // Extract session for future calls
    const content = result?.content
    if (!content?.length) return null

    const text = content.find((c: any) => c.type === 'text')?.text
    if (!text) return null

    // Parse the response — Explorium returns markdown tables or JSON
    const parsed = tryParseBusinessResponse(text)
    if (parsed?.sessionId) sessionId = parsed.sessionId
    return parsed?.business ?? null
  } catch {
    return null
  }
}

/**
 * Busca prospects (decisores/contatos) de uma empresa.
 */
export async function matchProspects(companyName: string, domain?: string): Promise<VPProspectMatch[]> {
  try {
    const result = await mcpCall('match-prospects', {
      prospects_to_match: [{ company_name: companyName, ...(domain ? { company_domain: domain } : {}) }],
      ...(sessionId ? { session_id: sessionId } : {}),
    })

    const content = result?.content
    if (!content?.length) return []

    const text = content.find((c: any) => c.type === 'text')?.text
    if (!text) return []

    return tryParseProspectsResponse(text)
  } catch {
    return []
  }
}

/**
 * Busca empresas com filtros (indústria, localização, tamanho).
 * Retorna ~10 resultados amostrais.
 */
export async function fetchEntities(filters: {
  industry?: string
  city?: string
  state?: string
  country?: string
  minEmployees?: number
  maxEmployees?: number
  keyword?: string
}): Promise<VPBusinessMatch[]> {
  try {
    const result = await mcpCall('fetch-entities', {
      entity_type: 'businesses',
      filters: {
        ...(filters.industry ? { industry: [filters.industry] } : {}),
        ...(filters.city ? { city: [filters.city] } : {}),
        ...(filters.state ? { state: [filters.state] } : {}),
        ...(filters.country ? { country: [filters.country || 'Brazil'] } : {}),
        ...(filters.minEmployees || filters.maxEmployees ? {
          employee_count: {
            ...(filters.minEmployees ? { min: filters.minEmployees } : {}),
            ...(filters.maxEmployees ? { max: filters.maxEmployees } : {}),
          },
        } : {}),
        ...(filters.keyword ? { keyword: filters.keyword } : {}),
      },
      ...(sessionId ? { session_id: sessionId } : {}),
    })

    const content = result?.content
    if (!content?.length) return []

    const text = content.find((c: any) => c.type === 'text')?.text
    if (!text) return []

    return tryParseEntitiesResponse(text)
  } catch {
    return []
  }
}

/**
 * Verifica se o serviço está disponível e autenticado.
 */
export async function isAvailable(): Promise<boolean> {
  try {
    if (!VP_TOKEN) return false
    await mcpCall('autocomplete', { field: 'industry', query: 'test' })
    return true
  } catch {
    return false
  }
}

/**
 * Reseta a sessao MCP (util em caso de erro).
 */
export function resetSession() {
  sessionId = null
  mcpSessionId = null
}

// --- Response parsers ---

function tryParseBusinessResponse(text: string): { business: VPBusinessMatch | null; sessionId?: string } | null {
  try {
    // Try JSON first
    const json = JSON.parse(text)
    if (json.businesses?.length) {
      const b = json.businesses[0]
      return {
        business: mapBusiness(b),
        sessionId: json.session_id,
      }
    }
  } catch {
    // Not JSON — parse markdown table or structured text
  }

  // Extract session_id from text
  const sidMatch = text.match(/session[_\s]?id[:\s]*[`"']?([a-zA-Z0-9_-]+)/i)

  // Extract key-value data from markdown or structured text
  const business: Partial<VPBusinessMatch> = { businessId: '' }
  const extract = (pattern: RegExp): string | undefined => {
    const m = text.match(pattern)
    return m?.[1]?.trim()
  }

  business.name = extract(/(?:company|business|name)[:\s|]*([^\n|]+)/i)
  business.domain = extract(/(?:domain|website)[:\s|]*([^\n|]+)/i)
  business.industry = extract(/(?:industry|sector|segment)[:\s|]*([^\n|]+)/i)
  business.city = extract(/(?:city|cidade)[:\s|]*([^\n|]+)/i)
  business.state = extract(/(?:state|estado|uf)[:\s|]*([^\n|]+)/i)
  business.phone = extract(/(?:phone|telefone)[:\s|]*([^\n|]+)/i)
  business.linkedinUrl = extract(/(?:linkedin)[:\s|]*(https?:\/\/[^\s|]+)/i)
  business.website = extract(/(?:website|site|url)[:\s|]*(https?:\/\/[^\s|]+)/i)
  business.description = extract(/(?:description|descri..o|about)[:\s|]*([^\n]+)/i)

  const empStr = extract(/(?:employee|funcionário|headcount)[:\s|]*([^\n|]+)/i)
  if (empStr) business.employeeCount = parseInt(empStr.replace(/\D/g, '')) || undefined

  business.revenue = extract(/(?:revenue|receita|faturamento)[:\s|]*([^\n|]+)/i)

  if (business.name) {
    return { business: business as VPBusinessMatch, sessionId: sidMatch?.[1] }
  }

  return null
}

function tryParseProspectsResponse(text: string): VPProspectMatch[] {
  try {
    const json = JSON.parse(text)
    if (Array.isArray(json.prospects)) {
      return json.prospects.map(mapProspect)
    }
  } catch {
    // Parse from text
  }

  // Extract from markdown table rows
  const prospects: VPProspectMatch[] = []
  const rows = text.split('\n').filter(line => line.includes('|') && !line.includes('---'))
  for (const row of rows.slice(1)) { // skip header
    const cells = row.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length >= 3) {
      prospects.push({
        prospectId: '',
        fullName: cells[0] || undefined,
        title: cells[1] || undefined,
        email: cells.find(c => c.includes('@')) || undefined,
        phone: cells.find(c => /\d{8,}/.test(c.replace(/\D/g, ''))) || undefined,
        linkedinUrl: cells.find(c => c.includes('linkedin.com')) || undefined,
      })
    }
  }
  return prospects
}

function tryParseEntitiesResponse(text: string): VPBusinessMatch[] {
  try {
    const json = JSON.parse(text)
    if (Array.isArray(json.businesses)) {
      return json.businesses.map(mapBusiness)
    }
    if (Array.isArray(json.results)) {
      return json.results.map(mapBusiness)
    }
  } catch {
    // Parse from text
  }

  // Fallback: try to extract from markdown table
  const businesses: VPBusinessMatch[] = []
  const rows = text.split('\n').filter(line => line.includes('|') && !line.includes('---'))
  for (const row of rows.slice(1)) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length >= 2) {
      businesses.push({
        businessId: '',
        name: cells[0],
        domain: cells.find(c => c.includes('.'))?.replace(/https?:\/\//, '') || undefined,
        industry: cells[2] || undefined,
      })
    }
  }
  return businesses
}

function mapBusiness(b: any): VPBusinessMatch {
  return {
    businessId: b.business_id || b.id || '',
    name: b.name || b.company_name || '',
    domain: b.domain || b.website_domain || undefined,
    industry: b.industry || b.sector || undefined,
    employeeCount: b.employee_count || b.employees || undefined,
    revenue: b.revenue || b.annual_revenue || undefined,
    city: b.city || undefined,
    state: b.state || undefined,
    country: b.country || undefined,
    description: b.description || undefined,
    linkedinUrl: b.linkedin_url || b.linkedin || undefined,
    website: b.website || b.domain ? `https://${b.domain}` : undefined,
    phone: b.phone || undefined,
    technologies: b.technologies || undefined,
  }
}

function mapProspect(p: any): VPProspectMatch {
  return {
    prospectId: p.prospect_id || p.id || '',
    firstName: p.first_name || undefined,
    lastName: p.last_name || undefined,
    fullName: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || undefined,
    title: p.title || p.job_title || undefined,
    email: p.email || p.work_email || undefined,
    phone: p.phone || p.direct_phone || undefined,
    linkedinUrl: p.linkedin_url || undefined,
    company: p.company || p.company_name || undefined,
  }
}
