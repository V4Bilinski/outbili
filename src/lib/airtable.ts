const PAT = import.meta.env.VITE_AIRTABLE_PAT || ''
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || ''
const API_URL = `https://api.airtable.com/v0/${BASE_ID}`

// Token bucket rate limiter: 5 requests per second
class RateLimiter {
  private tokens: number
  private maxTokens: number
  private refillRate: number
  private lastRefill: number
  private queue: Array<{ resolve: () => void }> = []

  constructor(maxTokens = 5, refillRateMs = 200) {
    this.tokens = maxTokens
    this.maxTokens = maxTokens
    this.refillRate = refillRateMs
    this.lastRefill = Date.now()
  }

  private refill() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const newTokens = Math.floor(elapsed / this.refillRate)
    if (newTokens > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens)
      this.lastRefill = now
    }
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return
    }
    return new Promise((resolve) => {
      this.queue.push({ resolve })
      setTimeout(() => {
        this.refill()
        const item = this.queue.shift()
        if (item) {
          this.tokens--
          item.resolve()
        }
      }, this.refillRate)
    })
  }
}

const limiter = new RateLimiter()

async function airtableFetch(path: string, options: RequestInit = {}): Promise<any> {
  await limiter.acquire()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAT}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 429) {
    // Rate limited — wait and retry once
    await new Promise((r) => setTimeout(r, 1000))
    return airtableFetch(path, options)
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(error.error?.message || `Airtable error: ${res.status}`)
  }

  return res.json()
}

export interface AirtableRecord<T> {
  id: string
  fields: T
  createdTime: string
}

interface ListParams {
  filterByFormula?: string
  sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>
  maxRecords?: number
  pageSize?: number
  offset?: string
  fields?: string[]
}

export async function listRecords<T>(
  table: string,
  params?: ListParams,
): Promise<{ records: AirtableRecord<T>[]; offset?: string }> {
  const searchParams = new URLSearchParams()
  if (params?.filterByFormula) searchParams.set('filterByFormula', params.filterByFormula)
  if (params?.maxRecords) searchParams.set('maxRecords', String(params.maxRecords))
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params?.offset) searchParams.set('offset', params.offset)
  if (params?.fields) params.fields.forEach((f) => searchParams.append('fields[]', f))
  if (params?.sort) {
    params.sort.forEach((s, i) => {
      searchParams.set(`sort[${i}][field]`, s.field)
      if (s.direction) searchParams.set(`sort[${i}][direction]`, s.direction)
    })
  }

  const qs = searchParams.toString()
  return airtableFetch(`/${encodeURIComponent(table)}${qs ? `?${qs}` : ''}`)
}

export async function listAllRecords<T>(table: string, params?: Omit<ListParams, 'offset'>): Promise<AirtableRecord<T>[]> {
  const all: AirtableRecord<T>[] = []
  let offset: string | undefined

  do {
    const result = await listRecords<T>(table, { ...params, offset })
    all.push(...result.records)
    offset = result.offset
  } while (offset)

  return all
}

export async function getRecord<T>(table: string, id: string): Promise<AirtableRecord<T>> {
  return airtableFetch(`/${encodeURIComponent(table)}/${id}`)
}

export async function createRecords<T>(
  table: string,
  records: Array<{ fields: Partial<T> }>,
): Promise<AirtableRecord<T>[]> {
  const batches: AirtableRecord<T>[] = []
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map((r) => ({
      fields: mapFieldsToAirtable(r.fields as Record<string, any>),
    }))
    const result = await airtableFetch(`/${encodeURIComponent(table)}`, {
      method: 'POST',
      body: JSON.stringify({ records: batch }),
    })
    batches.push(...result.records)
  }
  return batches
}

export async function updateRecords<T>(
  table: string,
  records: Array<{ id: string; fields: Partial<T> }>,
): Promise<AirtableRecord<T>[]> {
  const batches: AirtableRecord<T>[] = []
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map((r) => ({
      id: r.id,
      fields: mapFieldsToAirtable(r.fields as Record<string, any>),
    }))
    const result = await airtableFetch(`/${encodeURIComponent(table)}`, {
      method: 'PATCH',
      body: JSON.stringify({ records: batch }),
    })
    batches.push(...result.records)
  }
  return batches
}

export async function deleteRecords(table: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10)
    const params = batch.map((id) => `records[]=${id}`).join('&')
    await airtableFetch(`/${encodeURIComponent(table)}?${params}`, { method: 'DELETE' })
  }
}

// Field name mapping: code → Airtable (for renamed fields)
const FIELD_TO_AIRTABLE: Record<string, string> = {
  temperature: 'temperatura',
}
const AIRTABLE_TO_FIELD: Record<string, string> = {
  temperatura: 'temperature',
}

// Map fields before sending to Airtable (code → Airtable names)
function mapFieldsToAirtable(fields: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {}
  for (const [key, value] of Object.entries(fields)) {
    const airtableKey = FIELD_TO_AIRTABLE[key] || key
    if (value !== undefined) mapped[airtableKey] = value
  }
  return mapped
}

// Map fields from Airtable (Airtable names → code)
function mapFieldsFromAirtable(fields: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {}
  for (const [key, value] of Object.entries(fields)) {
    const codeKey = AIRTABLE_TO_FIELD[key] || key
    mapped[codeKey] = value
  }
  return mapped
}

// Helper to map Airtable record to typed object
export function mapRecord<T extends { id: string }>(record: AirtableRecord<any>): T {
  return { id: record.id, ...mapFieldsFromAirtable(record.fields), createdAt: record.createdTime } as unknown as T
}

export function mapRecords<T extends { id: string }>(records: AirtableRecord<any>[]): T[] {
  return records.map(mapRecord<T>)
}
