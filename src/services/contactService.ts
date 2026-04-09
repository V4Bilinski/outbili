import { listAllRecords, createRecords, updateRecords, deleteRecords, mapRecords, mapRecord } from '../lib/airtable'
import type { Contact } from '../types'

const TABLE = 'Contacts'

export async function getContacts(leadId?: string): Promise<Contact[]> {
  const filter = leadId
    ? `OR({leadId} = "${leadId}", FIND("${leadId}", ARRAYJOIN({Lead})) > 0)`
    : undefined
  const records = await listAllRecords(TABLE, { filterByFormula: filter })
  return mapRecords<Contact>(records)
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  const { id, createdAt, ...fields } = data as any
  const records = await createRecords(TABLE, [{ fields }])
  return mapRecord<Contact>(records[0])
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
  const { id: _id, createdAt, ...fields } = data as any
  const records = await updateRecords(TABLE, [{ id, fields }])
  return mapRecord<Contact>(records[0])
}

export async function deleteContact(id: string): Promise<void> {
  await deleteRecords(TABLE, [id])
}
