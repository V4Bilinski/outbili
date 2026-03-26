const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.bilinski.cloud/webhook/outbili-search'

export interface SearchRequest {
  segments: string[]
  states: string[]
  city: string
  keywords: string[]
  revenueMin: string
  revenueMax: string
}

export interface SearchResponse {
  success: boolean
  leadsCreated: number
  searchId: string
  error?: string
}

export async function triggerN8nSearch(params: SearchRequest): Promise<SearchResponse> {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`n8n error: ${res.status} - ${text}`)
    }

    return await res.json()
  } catch (err: any) {
    return {
      success: false,
      leadsCreated: 0,
      searchId: '',
      error: err.message || 'Erro ao conectar com n8n',
    }
  }
}
