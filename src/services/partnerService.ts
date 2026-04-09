import { listAllRecords, createRecords, mapRecords } from '../lib/airtable'
import type { Partner } from '../types'

const TABLE = 'Partners'

export async function getPartners(leadId: string): Promise<Partner[]> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `FIND("${leadId}", ARRAYJOIN({Lead})) > 0`,
  })
  return mapRecords<Partner>(records)
}

export async function createPartners(leadId: string, partners: Omit<Partner, 'id' | 'createdAt' | 'leadId'>[]): Promise<Partner[]> {
  if (partners.length === 0) return []
  const records = await createRecords(TABLE, partners.map((p) => ({
    fields: { ...p, leadId } as any,
  })))
  return mapRecords<Partner>(records)
}
