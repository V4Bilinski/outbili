import { listAllRecords, createRecords, mapRecords } from '../lib/airtable'
import type { Trademark } from '../types'

const TABLE = 'Trademarks'

export async function getTrademarks(leadId: string): Promise<Trademark[]> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `FIND("${leadId}", ARRAYJOIN({Lead})) > 0`,
  })
  return mapRecords<Trademark>(records)
}

export async function createTrademarks(leadId: string, trademarks: Omit<Trademark, 'id' | 'createdAt' | 'leadId'>[]): Promise<Trademark[]> {
  if (trademarks.length === 0) return []
  const records = await createRecords(TABLE, trademarks.map((t) => ({
    fields: { ...t, leadId } as any,
  })))
  return mapRecords<Trademark>(records)
}
