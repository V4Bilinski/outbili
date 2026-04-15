import { listAllRecords, createRecords, mapRecords } from '../lib/airtable'
import type { CampaignMeta } from '../types'

const TABLE = 'Campaigns'

export async function listCampaignMetas(): Promise<CampaignMeta[]> {
  const records = await listAllRecords(TABLE, {
    sort: [{ field: 'createdAt', direction: 'desc' }],
  })
  return mapRecords<CampaignMeta>(records).map(normalizeMeta)
}

export async function getCampaignMetaByZapId(zapCampaignId: string): Promise<CampaignMeta | null> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `{zapCampaignId} = "${zapCampaignId}"`,
    maxRecords: 1,
  })
  if (records.length === 0) return null
  return normalizeMeta(mapRecords<CampaignMeta>(records)[0])
}

export async function saveCampaignMeta(meta: Omit<CampaignMeta, 'id'>): Promise<CampaignMeta> {
  const fields: Record<string, string | number> = {
    zapCampaignId: meta.zapCampaignId,
    templateName: meta.templateName,
    totalLeadsTargeted: meta.totalLeadsTargeted,
    createdAt: meta.createdAt || new Date().toISOString(),
    leadIds: JSON.stringify(meta.leadIds),
    variableMapping: JSON.stringify(meta.variableMapping),
    filters: JSON.stringify(meta.filters),
    segmentBreakdown: JSON.stringify(meta.segmentBreakdown),
    tierBreakdown: JSON.stringify(meta.tierBreakdown),
  }

  const records = await createRecords(TABLE, [{ fields }])
  return normalizeMeta(mapRecords<CampaignMeta>(records)[0])
}

function normalizeMeta(meta: CampaignMeta): CampaignMeta {
  return {
    ...meta,
    leadIds: parseJson(meta.leadIds as unknown as string, []),
    variableMapping: parseJson(meta.variableMapping as unknown as string, {}),
    filters: parseJson(meta.filters as unknown as string, {}),
    segmentBreakdown: parseJson(meta.segmentBreakdown as unknown as string, {}),
    tierBreakdown: parseJson(meta.tierBreakdown as unknown as string, {}),
  }
}

function parseJson<T>(value: string | T, fallback: T): T {
  if (typeof value === 'object' && value !== null) return value as T
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
