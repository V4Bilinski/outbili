import { listAllRecords, getRecord, createRecords, updateRecords, mapRecords, mapRecord } from '../lib/airtable'
import type { Campaign } from '../types'

const TABLE = 'Campaigns'

export async function getCampaigns(): Promise<Campaign[]> {
  const records = await listAllRecords(TABLE, {
    sort: [{ field: 'name', direction: 'asc' }],
  })
  return mapRecords<Campaign>(records)
}

export async function getCampaign(id: string): Promise<Campaign> {
  const record = await getRecord(TABLE, id)
  return mapRecord<Campaign>(record)
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const { id, createdAt, leadIds, ...fields } = data as any
  if (leadIds) fields.Leads = leadIds
  const records = await createRecords(TABLE, [{ fields }])
  return mapRecord<Campaign>(records[0])
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  const { id: _id, createdAt, leadIds, ...fields } = data as any
  const records = await updateRecords(TABLE, [{ id, fields }])
  return mapRecord<Campaign>(records[0])
}
