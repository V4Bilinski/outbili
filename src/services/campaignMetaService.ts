// campaignMetaService — backend Supabase (schema 'app.campaigns').
// CampaignMeta tem campos legados que nao mapeiam diretamente para colunas do schema
// (zapCampaignId, leadIds, variableMapping, filters, segmentBreakdown, tierBreakdown).
// Estrategia de compat: persistir esses campos em `steps` como JSON serializado.
// Pos-cutover, vale normalizar para uma tabela campaign_meta com colunas jsonb proprias.

import { supabase, generateRecordId, throwIfError } from '../lib/supabase'
import type { CampaignMeta } from '../types'

const TABLE = 'campaigns'

type StepsBlob = {
  zapCampaignId: string
  leadIds: string[]
  variableMapping: Record<string, string>
  filters: CampaignMeta['filters']
  segmentBreakdown: Record<string, number>
  tierBreakdown: Record<string, number>
}

function rowToMeta(row: any): CampaignMeta {
  let blob: Partial<StepsBlob> = {}
  if (row.steps) {
    try { blob = JSON.parse(row.steps) } catch { /* steps livre, ignora */ }
  }
  return {
    id: row.airtable_record_id || row.id,
    zapCampaignId: blob.zapCampaignId || '',
    templateName: row.name ?? '',
    leadIds: blob.leadIds || [],
    variableMapping: blob.variableMapping || {},
    filters: blob.filters || {},
    totalLeadsTargeted: row.total_leads ?? 0,
    segmentBreakdown: blob.segmentBreakdown || {},
    tierBreakdown: blob.tierBreakdown || {},
    createdAt: row.created_at ?? undefined,
  }
}

export async function listCampaignMetas(): Promise<CampaignMeta[]> {
  const { data, error } = await supabase.from(TABLE).select('*')
    .order('created_at', { ascending: false })
  throwIfError(error, 'listCampaignMetas')
  return (data || []).map(rowToMeta)
}

export async function getCampaignMetaByZapId(zapCampaignId: string): Promise<CampaignMeta | null> {
  // Busca por contains no JSON serializado em steps
  const { data, error } = await supabase.from(TABLE).select('*')
    .ilike('steps', `%"zapCampaignId":"${zapCampaignId}"%`)
    .limit(1)
  throwIfError(error, 'getCampaignMetaByZapId')
  if (!data || data.length === 0) return null
  return rowToMeta(data[0])
}

export async function saveCampaignMeta(meta: Omit<CampaignMeta, 'id'>): Promise<CampaignMeta> {
  const blob: StepsBlob = {
    zapCampaignId: meta.zapCampaignId,
    leadIds: meta.leadIds,
    variableMapping: meta.variableMapping,
    filters: meta.filters,
    segmentBreakdown: meta.segmentBreakdown,
    tierBreakdown: meta.tierBreakdown,
  }
  const row: Record<string, any> = {
    airtable_record_id: generateRecordId(),
    name: meta.templateName,
    segment: meta.filters.segment ?? null,
    total_leads: meta.totalLeadsTargeted,
    steps: JSON.stringify(blob),
  }
  if (meta.createdAt) row.created_at = meta.createdAt

  const { data, error } = await supabase.from(TABLE).insert(row).select('*').single()
  throwIfError(error, 'saveCampaignMeta')
  return rowToMeta(data)
}
