import { listAllRecords, createRecords, mapRecords, mapRecord } from '../lib/airtable'
import type { Activity } from '../types'

const TABLE = 'Activities'

export async function getActivities(leadId: string): Promise<Activity[]> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `OR({leadId} = "${leadId}", FIND("${leadId}", ARRAYJOIN({LeadActivity})) > 0)`,
  })
  // Sort by createdTime descending (use record metadata, not field)
  const mapped = mapRecords<Activity>(records)
  return mapped.reverse()
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const { id, createdAt, ...fields } = data as any
  const records = await createRecords(TABLE, [{ fields }])
  return mapRecord<Activity>(records[0])
}
