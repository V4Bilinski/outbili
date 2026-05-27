// authService — backend 100% Supabase.
// Substitui implementação Airtable (W3-06 cutover, mergeado em W3-07).
// Auth via supabase.auth.* (signInWithPassword, signOut, updateUser).
// Perfis em app.profiles. Log de atividades em audit.user_activity.

import { supabase, supabaseAudit, throwIfError } from '../lib/supabase'

// Mantém shape histórico do User pra back-compat dos consumers (LoginPage, SettingsPage, AdminPage).
// id continua sendo string mas agora é o auth.users.id (uuid).
export interface User {
  id: string
  profileId?: string  // profiles.id — usado para atribuicao (assigned_to/created_by referenciam profiles.id)
  email: string
  passwordHash: string  // sempre '' — preservado pra não quebrar SettingsPage
  fullName: string
  role: 'admin' | 'sdr' | 'closer' | 'viewer' | 'user'
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

export interface VerifyResult {
  valid: boolean
  needsRehash: boolean  // sempre false (Supabase Auth gerencia hashing)
}

// ----------------------------- Helpers -----------------------------

function rowToUser(profile: any, authUser?: { email?: string }): User {
  return {
    id: profile.user_id ?? profile.id,
    profileId: profile.id,
    email: profile.email ?? authUser?.email ?? '',
    passwordHash: '',
    fullName: profile.full_name ?? '',
    role: profile.role ?? 'viewer',
    isActive: profile.is_active ?? false,
    lastLoginAt: profile.last_login_at ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at ?? undefined,
  }
}

async function profileByAuthId(authUserId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUserId)
    .is('deleted_at', null)
    .maybeSingle()
  throwIfError(error, 'profileByAuthId')
  return data
}

// ----------------------------- Verify (compat) -----------------------------

// Mantida apenas pra SettingsPage (re-validação antes de trocar senha).
// Como Supabase não expõe verify-only, fazemos signInWithPassword com email + senha atual.
// O caller passa email no lugar de storedHash quando quer essa verificação.
export async function verifyPassword(password: string, emailOrHash: string): Promise<VerifyResult> {
  if (!emailOrHash.includes('@')) {
    // Legado: alguém ainda passou um hash — sempre rejeita pra forçar fluxo novo
    return { valid: false, needsRehash: false }
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: emailOrHash,
    password,
  })
  return { valid: !error, needsRehash: false }
}

// ----------------------------- Login / Logout -----------------------------

export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  })
  if (error) {
    if (/invalid login credentials/i.test(error.message)) throw new Error('Email ou senha incorretos')
    throw new Error(error.message)
  }
  if (!data.user) throw new Error('Falha no login')

  const profile = await profileByAuthId(data.user.id)
  if (!profile) throw new Error('Perfil não encontrado. Contate o administrador.')
  if (!profile.is_active) throw new Error('Usuário desativado. Contate o administrador.')

  // Atualiza last_login_at
  await supabase.from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('user_id', data.user.id)
    .then(() => {}, () => {})

  // Log de login
  logActivity({
    action: 'login',
    userId: data.user.id,
    userEmail: data.user.email ?? '',
    userName: profile.full_name ?? '',
    details: 'Login realizado',
  }).catch(() => {})

  return rowToUser({ ...profile, last_login_at: new Date().toISOString() }, data.user)
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

// ----------------------------- Profile CRUD -----------------------------

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .maybeSingle()
  throwIfError(error, 'getUserByEmail')
  return data ? rowToUser(data) : null
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .is('deleted_at', null)
    .order('full_name')
  throwIfError(error, 'getAllUsers')
  return (data || []).map((r: any) => rowToUser(r))
}

// Cargos auto-selecionáveis no autocadastro. 'admin' NÃO entra aqui — só por promoção
// via adminUpdateUser. Espelha o gate do trigger handle_new_user no banco.
export type SignupRole = 'sdr' | 'closer' | 'viewer'

// Domínios autorizados a se cadastrar (gate de domínio). Reforço client-side do
// mesmo gate aplicado no trigger handle_new_user (defense-in-depth).
export const ALLOWED_SIGNUP_DOMAINS = ['v4company.com']

export function isAllowedSignupEmail(email: string): boolean {
  const domain = (email.toLowerCase().trim().split('@')[1] || '').trim()
  return ALLOWED_SIGNUP_DOMAINS.includes(domain)
}

// Cria conta via supabase.auth.signUp. O trigger on_auth_user_created popula app.profiles
// JÁ ativo e no cargo escolhido (requested_role), com gate de domínio @v4company.com.
// Caller deve chamar login() em seguida (signUp não loga automaticamente quando confirmação está OFF).
export async function createUser(input: {
  email: string
  password: string
  fullName: string
  role: SignupRole
}): Promise<User> {
  const email = input.email.toLowerCase().trim()
  // Gate de domínio (1ª barreira; o trigger reforça no banco)
  if (!isAllowedSignupEmail(email)) {
    throw new Error('Cadastro permitido apenas para e-mails @v4company.com')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      // requested_role é lido pelo trigger handle_new_user para associar o cargo.
      data: { full_name: input.fullName, requested_role: input.role },
    },
  })
  if (error) {
    if (/already registered|user.*exists/i.test(error.message)) throw new Error('Email já cadastrado')
    throw new Error(error.message)
  }
  if (!data.user) throw new Error('Falha ao criar conta')

  // Garante full_name no profile (caso trigger não pegue do raw_user_meta_data).
  // O role/is_active são definidos pelo trigger (fonte da verdade) — não sobrescrevemos aqui.
  await supabase.from('profiles')
    .update({ full_name: input.fullName })
    .eq('user_id', data.user.id)
    .then(() => {}, () => {})

  return {
    id: data.user.id,
    email,
    passwordHash: '',
    fullName: input.fullName,
    role: input.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
}

// Atualiza campos do profile. Apenas full_name, role, is_active, avatar_url.
// Aceita id = auth.users.id (preferido) ou app.profiles.id (compat).
export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const update: Record<string, any> = {}
  if (data.fullName !== undefined) update.full_name = data.fullName
  if (data.role !== undefined) update.role = data.role
  if (data.isActive !== undefined) update.is_active = data.isActive
  if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl
  update.updated_at = new Date().toISOString()

  // Tenta atualizar primeiro por user_id (auth.users.id). Se nada bate, tenta por profiles.id.
  const byUserId = await supabase.from('profiles').update(update).eq('user_id', id).select('*').maybeSingle()
  if (byUserId.data) return rowToUser(byUserId.data)

  const byProfileId = await supabase.from('profiles').update(update).eq('id', id).select('*').maybeSingle()
  throwIfError(byProfileId.error, 'updateUser')
  if (!byProfileId.data) throw new Error(`Usuário não encontrado: ${id}`)
  return rowToUser(byProfileId.data)
}

// Admin gerencia QUALQUER usuario (editar perfil / ativar / desativar) via RPC SECURITY DEFINER.
// Necessario porque a RLS de app.profiles so permite UPDATE do proprio profile (user_id = auth.uid).
// targetId aceita user_id (auth) ou profiles.id. So envia os campos informados.
export async function adminUpdateUser(targetId: string, data: Partial<User>): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user', {
    p_target_user_id: targetId,
    p_full_name: data.fullName ?? null,
    p_role: data.role ?? null,
    p_is_active: data.isActive ?? null,
  })
  if (error) throw new Error(error.message)
}

// Troca senha do user logado (usa Supabase Auth — só funciona com sessão ativa do próprio user).
// Ignora userId (kept pra compat) — Supabase Auth troca sempre do session.user.
export async function changePassword(_userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)

  // Limpa force_password_reset se estava setado
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.auth.updateUser({
      data: { ...user.user_metadata, force_password_reset: false },
    }).then(() => {}, () => {})
  }
}

// ----------------------------- Activity Log (audit.user_activity) -----------------------------

export async function logActivity(entry: Omit<ActivityLogEntry, 'id'>): Promise<void> {
  try {
    // RLS exige user_id = auth.uid() — não faz sentido logar sem sessão ativa
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    await supabaseAudit.from('user_activity').insert({
      user_id: session.user.id,  // sempre o auth.uid corrente (não confia em entry.userId obsoleto)
      user_email: entry.userEmail,
      user_name: entry.userName || null,
      action: entry.action,
      page: entry.page || null,
      details: entry.details || null,
      occurred_at: entry.timestamp ?? new Date().toISOString(),
    })
  } catch {
    // Non-blocking: log não pode quebrar UX
  }
}

export async function getActivityLog(params?: {
  userId?: string
  limit?: number
}): Promise<ActivityLogEntry[]> {
  let q = supabaseAudit.from('user_activity').select('*').order('occurred_at', { ascending: false })
  if (params?.userId) q = q.eq('user_id', params.userId)
  q = q.limit(params?.limit ?? 100)

  const { data, error } = await q
  throwIfError(error, 'getActivityLog')
  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    userId: row.user_id ?? '',
    userEmail: row.user_email,
    userName: row.user_name ?? '',
    page: row.page ?? undefined,
    details: row.details ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    timestamp: row.occurred_at,
  }))
}
