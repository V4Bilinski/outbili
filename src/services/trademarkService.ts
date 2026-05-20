// trademarkService — backend Supabase (schema 'app.lead_trademarks').

import { supabase, generateRecordId, throwIfError, isAirtableId } from '../lib/supabase'
import type { Trademark } from '../types'

const TABLE = 'lead_trademarks'

function rowToTrademark(row: any): Trademark {
  return {
    id: row.airtable_record_id || row.id,
    marca: row.marca,
    numero: row.numero ?? undefined,
    status: row.status ?? undefined,
    classe: row.classe ?? undefined,
    leadId: row._lead_airtable_id ?? undefined,
    createdAt: row.created_at ?? undefined,
  }
}

async function resolveLeadDbId(leadId: string): Promise<string | null> {
  const { data } = await supabase.from('leads').select('id')
    .eq(isAirtableId(leadId) ? 'airtable_record_id' : 'id', leadId).maybeSingle()
  return data?.id ?? null
}

export async function getTrademarks(leadId: string): Promise<Trademark[]> {
  const dbId = await resolveLeadDbId(leadId)
  if (!dbId) return []
  const { data, error } = await supabase.from(TABLE)
    .select('*, lead:leads!lead_trademarks_lead_id_fkey(airtable_record_id)')
    .eq('lead_id', dbId)
    .order('marca')
  throwIfError(error, 'getTrademarks')
  return (data || []).map((row: any) =>
    rowToTrademark({ ...row, _lead_airtable_id: row.lead?.airtable_record_id }),
  )
}

export async function createTrademarks(
  leadId: string,
  trademarks: Omit<Trademark, 'id' | 'createdAt' | 'leadId'>[],
): Promise<Trademark[]> {
  if (trademarks.length === 0) return []
  const dbId = await resolveLeadDbId(leadId)
  if (!dbId) throw new Error(`createTrademarks: lead nao encontrado: ${leadId}`)

  const rows = trademarks.map((t) => ({
    lead_id: dbId,
    airtable_record_id: generateRecordId(),
    marca: t.marca,
    numero: t.numero ?? null,
    status: t.status ?? null,
    classe: t.classe ?? null,
  }))
  const { data, error } = await supabase.from(TABLE).insert(rows)
    .select('*, lead:leads!lead_trademarks_lead_id_fkey(airtable_record_id)')
  throwIfError(error, 'createTrademarks')
  return (data || []).map((row: any) =>
    rowToTrademark({ ...row, _lead_airtable_id: row.lead?.airtable_record_id }),
  )
}
