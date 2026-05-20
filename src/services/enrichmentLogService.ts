// enrichmentLogService — backend Supabase (schema 'app.enrichment_runs').

import { supabase, generateRecordId, throwIfError, isAirtableId } from '../lib/supabase'
import type { EnrichmentLogEntry } from '../types'

const TABLE = 'enrichment_runs'

function rowToEntry(row: any): EnrichmentLogEntry {
  return {
    id: row.airtable_record_id || row.id,
    detail: row.detail ?? '',
    source: row.source,
    status: row.status,
    timestamp: row.started_at ?? undefined,
    leadId: row._lead_airtable_id ?? undefined,
    createdAt: row.started_at ?? undefined,
  }
}

async function resolveLeadDbId(leadId: string): Promise<string | null> {
  const { data } = await supabase.from('leads').select('id')
    .eq(isAirtableId(leadId) ? 'airtable_record_id' : 'id', leadId).maybeSingle()
  return data?.id ?? null
}

export async function getEnrichmentLog(leadId: string): Promise<EnrichmentLogEntry[]> {
  const dbId = await resolveLeadDbId(leadId)
  if (!dbId) return []
  const { data, error } = await supabase.from(TABLE)
    .select('*, lead:leads!enrichment_runs_lead_id_fkey(airtable_record_id)')
    .eq('lead_id', dbId)
    .order('started_at', { ascending: false })
  throwIfError(error, 'getEnrichmentLog')
  return (data || []).map((row: any) =>
    rowToEntry({ ...row, _lead_airtable_id: row.lead?.airtable_record_id }),
  )
}

export async function logEnrichmentStep(
  leadId: string,
  source: string,
  status: 'done' | 'error' | 'skipped',
  detail: string,
): Promise<EnrichmentLogEntry> {
  const dbId = await resolveLeadDbId(leadId)
  // Falhar silencioso se lead nao existe ainda (logs orfaos)
  const now = new Date().toISOString()
  const row: Record<string, any> = {
    airtable_record_id: generateRecordId(),
    lead_id: dbId,
    source,
    status,
    detail,
    started_at: now,
    finished_at: status !== 'pending' ? now : null,
  }
  const { data, error } = await supabase.from(TABLE).insert(row)
    .select('*, lead:leads!enrichment_runs_lead_id_fkey(airtable_record_id)').single()
  throwIfError(error, 'logEnrichmentStep')
  return rowToEntry({ ...data, _lead_airtable_id: data.lead?.airtable_record_id })
}
