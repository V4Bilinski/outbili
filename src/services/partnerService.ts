// partnerService — backend Supabase (schema 'app').
// Substitui a tabela Airtable 'Partners' por 'app.lead_partners' (decomposicao do JSON).

import { supabase, generateRecordId, throwIfError } from '../lib/supabase'
import type { Partner } from '../types'

const TABLE = 'lead_partners'

function rowToPartner(row: any): Partner {
  return {
    id: row.airtable_record_id || row.id,
    name: row.name,
    qualification: row.qualification ?? undefined,
    since: row.since ?? undefined,
    ageRange: row.age_range ?? undefined,
    personType: row.person_type ?? undefined,
    cpf: undefined, // cifrado em cpf_encrypted (pendencia PII pos-W2)
    leadId: row._lead_airtable_id ?? undefined,
    createdAt: row.created_at ?? undefined,
  }
}

async function resolveLeadDbId(leadId: string): Promise<string | null> {
  const { data } = await supabase.from('leads').select('id')
    .or(`airtable_record_id.eq.${leadId},id.eq.${leadId}`).maybeSingle()
  return data?.id ?? null
}

export async function getPartners(leadId: string): Promise<Partner[]> {
  const dbId = await resolveLeadDbId(leadId)
  if (!dbId) return []
  const { data, error } = await supabase.from(TABLE)
    .select('*, lead:leads!lead_partners_lead_id_fkey(airtable_record_id)')
    .eq('lead_id', dbId)
    .order('name')
  throwIfError(error, 'getPartners')
  return (data || []).map((row: any) =>
    rowToPartner({ ...row, _lead_airtable_id: row.lead?.airtable_record_id }),
  )
}

export async function createPartners(
  leadId: string,
  partners: Omit<Partner, 'id' | 'createdAt' | 'leadId'>[],
): Promise<Partner[]> {
  if (partners.length === 0) return []
  const dbId = await resolveLeadDbId(leadId)
  if (!dbId) throw new Error(`createPartners: lead nao encontrado: ${leadId}`)

  const rows = partners.map((p) => ({
    lead_id: dbId,
    airtable_record_id: generateRecordId(),
    name: p.name,
    qualification: p.qualification ?? null,
    since: p.since ?? null,
    age_range: p.ageRange ?? null,
    person_type: p.personType ?? null,
  }))
  const { data, error } = await supabase.from(TABLE).insert(rows)
    .select('*, lead:leads!lead_partners_lead_id_fkey(airtable_record_id)')
  throwIfError(error, 'createPartners')
  return (data || []).map((row: any) =>
    rowToPartner({ ...row, _lead_airtable_id: row.lead?.airtable_record_id }),
  )
}
