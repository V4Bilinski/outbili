import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// NOTA: o tipo `Database` gerado pelo MCP cobre apenas o schema `public`
// (CLI Supabase com --schema app,audit é a única forma de tipar tudo).
// Como o app vive 100% em `app` + `audit`, tipar com `any` aqui é mais honesto
// que mentir com um tipo vazio que faz `from()` retornar `never` no tsc -b.
// Tipos de domínio (Lead, Contact, Partner, etc) vivem em src/types/index.ts.
// Tech debt: ver Story 021 (limpeza pós-cutover) — regenerar tipos completos.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Supabase: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes em .env.local')
}

// Cliente principal: schema 'app' (CRM core)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'app'> = createClient<any, 'app'>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    db: { schema: 'app' },
    global: { headers: { 'x-application-name': 'outbili' } },
  },
)

// Cliente paralelo para schema 'audit' (trilha imutavel; SELECT restrito a admin)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAudit: SupabaseClient<any, 'audit'> = createClient<any, 'audit'>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    db: { schema: 'audit' },
    global: { headers: { 'x-application-name': 'outbili' } },
  },
)

// ---------- ID legado (compat com codigo que ainda espera 'rec...') ----------

// Gera um id sintetico no mesmo formato dos record ids do Airtable (rec + 14 chars).
// Usado quando o app cria um lead/contact novo apos o cutover, para manter o contrato
// da interface Lead/Contact (`id: string` com prefixo 'rec') sem quebrar componentes que
// montam URLs ou referencias com esse formato.
export function generateRecordId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = 'rec'
  for (let i = 0; i < 14; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// Helper: detecta se um id eh Airtable-style (rec + 14 alfanumericos) ou UUID Supabase.
// Usado por services que aceitam ambos formatos durante a transicao.
export function isAirtableId(id: string): boolean {
  return /^rec[A-Za-z0-9]{14}$/.test(id)
}

// ---------- Erro padronizado ----------

export class SupabaseError extends Error {
  code?: string
  details?: unknown
  hint?: string
  constructor(message: string, opts: { code?: string; details?: unknown; hint?: string } = {}) {
    super(message)
    this.name = 'SupabaseError'
    this.code = opts.code
    this.details = opts.details
    this.hint = opts.hint
  }
}

export function throwIfError(error: unknown, context: string): never | void {
  if (!error) return
  const e = error as { message?: string; code?: string; details?: unknown; hint?: string }
  throw new SupabaseError(`${context}: ${e.message || 'erro desconhecido'}`, {
    code: e.code,
    details: e.details,
    hint: e.hint,
  })
}
