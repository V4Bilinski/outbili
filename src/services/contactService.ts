import { listAllRecords, getRecord, createRecords, updateRecords, deleteRecords, mapRecords, mapRecord } from '../lib/airtable'
import type { Contact, Lead } from '../types'

const TABLE = 'Contacts'

export async function getContacts(leadId?: string): Promise<Contact[]> {
  if (!leadId) {
    return mapRecords<Contact>(await listAllRecords(TABLE))
  }

  // Estratégia: buscar os Contact IDs a partir do Lead (linked record "Contacts")
  // e depois buscar cada contact individualmente. Isso garante que funciona
  // independente de como o contact foi criado (leadId texto OU Lead linked record).
  const leadRecord = await getRecord<Lead>('Leads', leadId)
  const linkedContactIds: string[] = (leadRecord.fields as any).Contacts || []

  // Buscar também por campo texto legado {leadId}
  const byTextField = await listAllRecords(TABLE, {
    filterByFormula: `{leadId} = "${leadId}"`,
  })
  const textIds = new Set(byTextField.map(r => r.id))

  // Combinar IDs únicos
  const allIds = new Set([...linkedContactIds, ...textIds])

  if (allIds.size === 0) return []

  // Buscar contacts individuais (para os que vieram do linked record)
  const results = [...byTextField]
  for (const cid of linkedContactIds) {
    if (!textIds.has(cid)) {
      try {
        const rec = await getRecord<Contact>(TABLE, cid)
        results.push(rec)
      } catch { /* contact deletado */ }
    }
  }

  // Mapear e ordenar: Assertiva (com WhatsApp) tem PRIORIDADE
  const contacts = mapRecords<Contact>(results)
  contacts.sort((a, b) => {
    if (a.whatsapp && !b.whatsapp) return -1
    if (!a.whatsapp && b.whatsapp) return 1
    if (a.source === 'assertiva' && b.source !== 'assertiva') return -1
    if (a.source !== 'assertiva' && b.source === 'assertiva') return 1
    return 0
  })
  return contacts
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
