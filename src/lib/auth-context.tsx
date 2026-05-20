import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { login as loginService, logout as logoutService, logActivity, type User } from '../services/authService'
import { supabase } from './supabase'
import { useLocation } from 'react-router-dom'

const ADMIN_ROLE = 'admin'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  needsPasswordReset: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  track: (action: string, details?: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function rowToUser(profile: any, sessionUser?: { email?: string | null }): User {
  return {
    id: profile.user_id ?? profile.id,
    email: profile.email ?? sessionUser?.email ?? '',
    passwordHash: '',
    fullName: profile.full_name ?? '',
    role: profile.role ?? 'viewer',
    isActive: profile.is_active ?? false,
    lastLoginAt: profile.last_login_at ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at ?? undefined,
  }
}

async function hydrateUserFromSession(authUserId: string, sessionUser: { email?: string | null }): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUserId)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) {
    console.warn('[auth] hydrate profile error:', error.message)
    return null
  }
  if (!data) return null
  if (!data.is_active) {
    // Sessão válida mas profile inativo — força logout
    await supabase.auth.signOut()
    return null
  }
  return rowToUser(data, sessionUser)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  // Hidrata sessão Supabase no mount + assina onAuthStateChange.
  useEffect(() => {
    let cancelled = false

    const sync = async (session: any | null) => {
      if (!session?.user) {
        if (!cancelled) {
          setUser(null)
          setNeedsPasswordReset(false)
        }
        return
      }
      const hydrated = await hydrateUserFromSession(session.user.id, session.user)
      if (cancelled) return
      setUser(hydrated)
      setNeedsPasswordReset(!!session.user.user_metadata?.force_password_reset)
    }

    supabase.auth.getSession()
      .then(({ data }) => sync(data.session))
      .catch(err => console.warn('[auth] getSession error:', err))
      .finally(() => { if (!cancelled) setIsLoading(false) })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session)
    })

    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  // Track page views (best-effort)
  useEffect(() => {
    if (user) {
      logActivity({
        action: 'page_view',
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        page: location.pathname + location.hash,
      }).catch(() => {})
    }
  }, [location.pathname, location.hash, user])

  const login = useCallback(async (email: string, password: string) => {
    const loggedUser = await loginService(email, password)
    setUser(loggedUser)
    // force_password_reset é atualizado pelo onAuthStateChange (que dispara após signIn)
  }, [])

  const logout = useCallback(async () => {
    if (user) {
      logActivity({
        action: 'logout',
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
      }).catch(() => {})
    }
    await logoutService()
    setUser(null)
    setNeedsPasswordReset(false)
  }, [user])

  const track = useCallback((action: string, details?: string) => {
    if (!user) return
    logActivity({
      action,
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      page: location.pathname + location.hash,
      details,
    }).catch(() => {})
  }, [user, location.pathname, location.hash])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAdmin: user?.role === ADMIN_ROLE,
      needsPasswordReset,
      login,
      logout,
      track,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
