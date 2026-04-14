import { listAllRecords, getRecord, createRecords, updateRecords, deleteRecords, mapRecords, mapRecord } from '../lib/airtable'
import type { Lead } from '../types'

const TABLE = 'Leads'

export async function getLeads(filter?: string): Promise<Lead[]> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: filter,
    sort: [{ field: 'companyName', direction: 'asc' }],
  })
  return mapRecords<Lead>(records)
}

export async function getLead(id: string): Promise<Lead> {
  const record = await getRecord(TABLE, id)
  return mapRecord<Lead>(record)
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const { id, createdAt, updatedAt, ...fields } = data as any
  const records = await createRecords(TABLE, [{ fields }])
  return mapRecord<Lead>(records[0])
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const { id: _id, createdAt, updatedAt, ...fields } = data as any
  const records = await updateRecords(TABLE, [{ id, fields }])
  return mapRecord<Lead>(records[0])
}

export async function deleteLead(id: string): Promise<void> {
  await deleteRecords(TABLE, [id])
}

export async function getLeadsByStatus(status: string): Promise<Lead[]> {
  return getLeads(`{status} = "${status}"`)
}

export async function getLeadsByTemperature(temperature: string): Promise<Lead[]> {
  return getLeads(`{temperatura} = "${temperature}"`)
}

export async function getHotLeads(): Promise<Lead[]> {
  return getLeads(`{temperatura} = "Quente"`)
}
