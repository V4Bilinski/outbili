import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { login as loginService, logActivity, type User } from '../services/authService'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'outbili_user'
const ADMIN_EMAIL = 'luizhenrique.benicio@v4company.com'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  track: (action: string, details?: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id && parsed?.email) {
          setUser(parsed)
        }
      }
    } catch { /* invalid stored data */ }
    setIsLoading(false)
  }, [])

  // Track page views
  useEffect(() => {
    if (user) {
      logActivity({
        action: 'page_view',
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        page: location.pathname,
      })
    }
  }, [location.pathname, user])

  const login = useCallback(async (email: string, password: string) => {
    const loggedUser = await loginService(email, password)
    setUser(loggedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser))

    logActivity({
      action: 'login',
      userId: loggedUser.id,
      userEmail: loggedUser.email,
      userName: loggedUser.fullName,
      details: `Login realizado`,
    })
  }, [])

  const logout = useCallback(() => {
    if (user) {
      logActivity({
        action: 'logout',
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
      })
    }
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const track = useCallback((action: string, details?: string) => {
    if (!user) return
    logActivity({
      action,
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      page: location.pathname,
      details,
    })
  }, [user, location.pathname])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL,
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
