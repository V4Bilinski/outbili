import { listAllRecords, createRecords, mapRecords } from '../lib/airtable'
import type { EnrichmentLogEntry } from '../types'

const TABLE = 'EnrichmentLog'

export async function getEnrichmentLog(leadId: string): Promise<EnrichmentLogEntry[]> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `FIND("${leadId}", ARRAYJOIN({Lead})) > 0`,
  })
  return mapRecords<EnrichmentLogEntry>(records)
}

export async function logEnrichmentStep(
  leadId: string,
  source: string,
  status: 'done' | 'error' | 'skipped',
  detail: string,
): Promise<EnrichmentLogEntry> {
  const records = await createRecords(TABLE, [{
    fields: {
      leadId,
      source,
      status,
      detail,
      timestamp: new Date().toISOString(),
    } as any,
  }])
  const r = records[0]
  return { id: r.id, detail, source, status, leadId, createdAt: r.createdTime } as EnrichmentLogEntry
}
