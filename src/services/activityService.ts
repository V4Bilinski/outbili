// activityService — backend Supabase (schema 'app.activities').

import { supabase, generateRecordId, throwIfError, isAirtableId } from '../lib/supabase'
import type { Activity } from '../types'

const TABLE = 'activities'

function rowToActivity(row: any): Activity {
  return {
    id: row.airtable_record_id || row.id,
    leadId: row._lead_airtable_id || '',
    contactId: row._contact_airtable_id ?? undefined,
    type: row.type,
    description: row.description ?? '',
    createdBy: row.created_by ?? undefined,
    createdAt: row.occurred_at ?? row.created_at ?? undefined,
  }
}

async function resolveLeadDbId(leadId: string): Promise<string | null> {
  const { data } = await supabase.from('leads').select('id')
    .eq(isAirtableId(leadId) ? 'airtable_record_id' : 'id', leadId).maybeSingle()
  return data?.id ?? null
}

async function resolveContactDbId(contactId: string): Promise<string | null> {
  const { data } = await supabase.from('contacts').select('id')
    .eq(isAirtableId(contactId) ? 'airtable_record_id' : 'id', contactId).maybeSingle()
  return data?.id ?? null
}

export async function getActivities(leadId: string): Promise<Activity[]> {
  const dbId = await resolveLeadDbId(leadId)
  if (!dbId) return []
  const { data, error } = await supabase.from(TABLE)
    .select('*, lead:leads!activities_lead_id_fkey(airtable_record_id), contact:contacts!activities_contact_id_fkey(airtable_record_id)')
    .eq('lead_id', dbId)
    .order('occurred_at', { ascending: false })
  throwIfError(error, 'getActivities')
  return (data || []).map((row: any) =>
    rowToActivity({
      ...row,
      _lead_airtable_id: row.lead?.airtable_record_id,
      _contact_airtable_id: row.contact?.airtable_record_id,
    }),
  )
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const leadDbId = data.leadId ? await resolveLeadDbId(data.leadId) : null
  const contactDbId = data.contactId ? await resolveContactDbId(data.contactId) : null

  const row: Record<string, any> = {
    airtable_record_id: data.id || generateRecordId(),
    lead_id: leadDbId,
    contact_id: contactDbId,
    type: data.type || 'nota',
    description: data.description || null,
    occurred_at: new Date().toISOString(),
  }
  const { data: inserted, error } = await supabase.from(TABLE).insert(row)
    .select('*, lead:leads!activities_lead_id_fkey(airtable_record_id), contact:contacts!activities_contact_id_fkey(airtable_record_id)')
    .single()
  throwIfError(error, 'createActivity')
  return rowToActivity({
    ...inserted,
    _lead_airtable_id: inserted.lead?.airtable_record_id,
    _contact_airtable_id: inserted.contact?.airtable_record_id,
  })
}
