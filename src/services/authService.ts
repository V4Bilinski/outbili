import { listAllRecords, createRecords, updateRecords, mapRecord, mapRecords } from '../lib/airtable'

const TABLE = 'Users'
const LOG_TABLE = 'ActivityLog'

export interface User {
  id: string
  email: string
  passwordHash: string
  fullName: string
  role: 'admin' | 'user'
  isActive: boolean
  lastLoginAt?: string
  avatarUrl?: string
  createdAt?: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  userId: string
  userEmail: string
  userName: string
  page?: string
  details?: string
  ipAddress?: string
  timestamp?: string
}

// Simple hash (not cryptographic - for client-side auth with Airtable)
// In production, use a proper backend. This is sufficient for team-internal tools.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + '_outbili_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Allow initial admin password
  if (hash === '$admin_initial$' && password === 'admin123') return true
  const computed = await hashPassword(password)
  return computed === hash
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const records = await listAllRecords(TABLE, {
    filterByFormula: `{email} = "${email.toLowerCase().trim()}"`,
    maxRecords: 1,
  })
  if (records.length === 0) return null
  return mapRecord<User>(records[0])
}

export async function getAllUsers(): Promise<User[]> {
  const records = await listAllRecords(TABLE)
  return mapRecords<User>(records)
}

export async function createUser(data: {
  email: string
  password: string
  fullName: string
  role?: 'admin' | 'user'
}): Promise<User> {
  // Check if email already exists
  const existing = await getUserByEmail(data.email)
  if (existing) throw new Error('Email ja cadastrado')

  const passwordHash = await hashPassword(data.password)
  const records = await createRecords(TABLE, [{
    fields: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName,
      role: data.role || 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  }])
  return mapRecord<User>(records[0])
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const { id: _id, createdAt, ...fields } = data as any
  const records = await updateRecords(TABLE, [{ id, fields }])
  return mapRecord<User>(records[0])
}

export async function changePassword(userId: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword)
  await updateRecords(TABLE, [{ id: userId, fields: { passwordHash: hash } }])
}

export async function login(email: string, password: string): Promise<User> {
  const user = await getUserByEmail(email)
  if (!user) throw new Error('Email nao encontrado')
  if (!user.isActive) throw new Error('Usuario desativado. Contate o administrador.')

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new Error('Senha incorreta')

  // Update last login
  await updateRecords(TABLE, [{
    id: user.id,
    fields: { lastLoginAt: new Date().toISOString() },
  }]).catch(() => {})

  // If initial admin password, flag for change
  if (user.passwordHash === '$admin_initial$') {
    const hash = await hashPassword(password)
    await updateRecords(TABLE, [{ id: user.id, fields: { passwordHash: hash } }]).catch(() => {})
  }

  return user
}

// --- Activity Logging ---

export async function logActivity(entry: Omit<ActivityLogEntry, 'id'>): Promise<void> {
  try {
    await createRecords(LOG_TABLE, [{
      fields: {
        action: entry.action,
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName,
        page: entry.page || '',
        details: entry.details || '',
        timestamp: new Date().toISOString(),
      },
    }])
  } catch {
    // Non-blocking - don't break the app if logging fails
  }
}

export async function getActivityLog(params?: {
  userId?: string
  limit?: number
}): Promise<ActivityLogEntry[]> {
  const filter = params?.userId ? `{userId} = "${params.userId}"` : undefined
  const records = await listAllRecords(LOG_TABLE, {
    filterByFormula: filter,
    sort: [{ field: 'timestamp', direction: 'desc' }],
    maxRecords: params?.limit || 100,
  })
  return mapRecords<ActivityLogEntry>(records)
}
