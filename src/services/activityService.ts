import { listAllRecords, createRecords, mapRecords, mapRecord } from '../lib/airtable'
import type { Activity } from '../types'

const TABLE = 'Activities'

export async function getActivities(leadId: string): Promise<Activity[]> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `{leadId} = "${leadId}"`,
    sort: [{ field: 'createdAt', direction: 'desc' }],
  })
  return mapRecords<Activity>(records)
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const { id, createdAt, ...fields } = data as any
  const records = await createRecords(TABLE, [{ fields }])
  return mapRecord<Activity>(records[0])
}
