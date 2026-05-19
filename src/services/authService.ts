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

// --- Hashing de senha ---
// Auth client-side de ferramenta interna (sem backend; hashes ficam no Airtable).
// Esquema: PBKDF2-HMAC-SHA256, salt aleatorio por usuario, 210k iteracoes (OWASP 2023).
// Formato gravado: pbkdf2$<iteracoes>$<saltBase64>$<hashBase64>
// Hashes legados (SHA-256 + salt estatico) sao verificados e migrados no login.

const PBKDF2_ITERATIONS = 210_000
const PBKDF2_KEY_BITS = 256
const LEGACY_STATIC_SALT = '_outbili_salt_2026'

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Comparacao em tempo constante: evita timing attacks na verificacao do hash.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial, PBKDF2_KEY_BITS,
  )
  return bytesToBase64(new Uint8Array(bits))
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${hash}`
}

// Hash legado (SHA-256 + salt estatico). Mantido SOMENTE para verificar e migrar
// credenciais antigas no login. Nunca usado para gravar hash novo.
async function legacyHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + LEGACY_STATIC_SALT)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

export interface VerifyResult {
  valid: boolean
  /** true quando a credencial validou via hash legado e deve ser re-hasheada. */
  needsRehash: boolean
}

export async function verifyPassword(password: string, storedHash: string): Promise<VerifyResult> {
  if (storedHash?.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$')
    if (parts.length !== 4) return { valid: false, needsRehash: false }
    const iterations = Number(parts[1])
    if (!Number.isFinite(iterations) || iterations <= 0) return { valid: false, needsRehash: false }
    const computed = await pbkdf2(password, base64ToBytes(parts[2]), iterations)
    return { valid: constantTimeEqual(computed, parts[3]), needsRehash: false }
  }
  // Hash legado SHA-256: verifica e sinaliza migracao. Backdoor removido.
  const legacy = await legacyHash(password)
  return { valid: constantTimeEqual(legacy, storedHash ?? ''), needsRehash: true }
}

// Formato de e-mail seguro para interpolar em filterByFormula (sem injecao).
const SAFE_EMAIL = /^[^\s"'\\@]+@[^\s"'\\@]+\.[^\s"'\\@]+$/

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.toLowerCase().trim()
  if (!SAFE_EMAIL.test(normalized)) return null
  const records = await listAllRecords(TABLE, {
    filterByFormula: `{email} = "${normalized}"`,
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
}): Promise<User> {
  const existing = await getUserByEmail(data.email)
  if (existing) throw new Error('Email já cadastrado')

  const passwordHash = await hashPassword(data.password)
  const records = await createRecords(TABLE, [{
    fields: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName,
      role: 'user',
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
  if (!user) throw new Error('Email não encontrado')
  if (!user.isActive) throw new Error('Usuário desativado. Contate o administrador.')

  const { valid, needsRehash } = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new Error('Senha incorreta')

  // Atualiza ultimo login e, se a credencial era legada, migra o hash para PBKDF2
  // de forma transparente (numa unica escrita).
  const fields: Record<string, string> = { lastLoginAt: new Date().toISOString() }
  if (needsRehash) fields.passwordHash = await hashPassword(password)
  await updateRecords(TABLE, [{ id: user.id, fields }]).catch(() => {})

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
