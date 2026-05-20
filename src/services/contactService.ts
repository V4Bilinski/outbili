// contactService — backend Supabase (schema 'app').
// Mantem a API publica do service legado (getContacts, createContact, updateContact, deleteContact).
// O leadId continua sendo o `rec...` (airtable_record_id de app.leads) para compat com componentes.

import { supabase, generateRecordId, throwIfError, isAirtableId } from '../lib/supabase'
import type { Contact } from '../types'

const TABLE = 'contacts'

function rowToContact(row: any): Contact {
  return {
    id: row.airtable_record_id || row.id,
    leadId: row._lead_airtable_id || '', // resolvido via JOIN em getContacts
    name: row.name,
    role: row.role ?? undefined,
    contactType: row.contact_type ?? 'decisor',
    whatsapp: row.whatsapp ?? row.whatsapp_e164 ?? '',
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    cpf: undefined, // cifrado em cpf_encrypted (pendencia PII pos-W2)
    whatsappConfirmed: row.whatsapp_confirmed ?? undefined,
    phoneIsHot: row.phone_is_hot ?? undefined,
    source: row.source ?? undefined,
    bilinskizapContactId: row.bilinskizap_contact_id ?? undefined,
    createdAt: row.created_at ?? undefined,
  }
}

function contactToRow(data: Partial<Contact>): Record<string, any> {
  const row: Record<string, any> = {}
  const set = (k: string, v: any) => { if (v !== undefined) row[k] = v }
  set('name', data.name)
  set('role', data.role)
  set('contact_type', data.contactType)
  set('whatsapp', data.whatsapp)
  if (data.whatsapp) {
    const digits = data.whatsapp.replace(/\D/g, '')
    if (digits) set('whatsapp_e164', '+' + digits)
  }
  set('phone', data.phone)
  set('email', data.email)
  set('whatsapp_confirmed', data.whatsappConfirmed)
  set('phone_is_hot', data.phoneIsHot)
  set('source', data.source)
  set('bilinskizap_contact_id', data.bilinskizapContactId)
  return row
}

async function resolveLeadId(leadIdOrRec: string): Promise<string | null> {
  const { data } = await supabase.from('leads').select('id')
    .eq(isAirtableId(leadIdOrRec) ? 'airtable_record_id' : 'id', leadIdOrRec).maybeSingle()
  return data?.id ?? null
}

export async function getContacts(leadId?: string): Promise<Contact[]> {
  // Embed lead para recuperar airtable_record_id e devolver Contact.leadId no formato 'rec...'
  let q: any = supabase.from(TABLE).select('*, lead:leads!contacts_lead_id_fkey(airtable_record_id)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (leadId) {
    const dbId = await resolveLeadId(leadId)
    if (!dbId) return []
    q = q.eq('lead_id', dbId)
  }

  const { data, error } = await q
  throwIfError(error, 'getContacts')

  const contacts: Contact[] = (data || []).map((row: any) => ({
    ...rowToContact({ ...row, _lead_airtable_id: row.lead?.airtable_record_id }),
  }))

  // Prioriza Assertiva-com-WhatsApp (regra legada)
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
  const leadDbId = data.leadId ? await resolveLeadId(data.leadId) : null
  const recordId = data.id || generateRecordId()
  const row = {
    ...contactToRow(data),
    lead_id: leadDbId,
    airtable_record_id: recordId,
  }
  const { data: inserted, error } = await supabase.from(TABLE).insert(row)
    .select('*, lead:leads!contacts_lead_id_fkey(airtable_record_id)').single()
  throwIfError(error, 'createContact')
  return {
    ...rowToContact({ ...inserted, _lead_airtable_id: inserted.lead?.airtable_record_id }),
    leadId: inserted.lead?.airtable_record_id ?? data.leadId ?? '',
  }
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
  const row = contactToRow(data)
  if (data.leadId !== undefined) {
    const ld = await resolveLeadId(data.leadId)
    if (ld) row.lead_id = ld
  }
  const { data: updated, error } = await supabase.from(TABLE).update(row)
    .eq(isAirtableId(id) ? 'airtable_record_id' : 'id', id)
    .select('*, lead:leads!contacts_lead_id_fkey(airtable_record_id)').single()
  throwIfError(error, 'updateContact')
  return {
    ...rowToContact({ ...updated, _lead_airtable_id: updated.lead?.airtable_record_id }),
    leadId: updated.lead?.airtable_record_id ?? '',
  }
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq(isAirtableId(id) ? 'airtable_record_id' : 'id', id)
  throwIfError(error, 'deleteContact')
}
