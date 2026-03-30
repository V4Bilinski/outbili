import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { createUser } from '../services/authService'
import { toast } from 'sonner'
import { LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '../lib/cn'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const inputClass = 'h-12 w-full rounded-xl bg-white/[0.05] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/40 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Preencha email e senha'); return }
    if (mode === 'signup' && !fullName) { toast.error('Preencha seu nome'); return }
    if (password.length < 6) { toast.error('Senha deve ter no minimo 6 caracteres'); return }

    setIsLoading(true)
    try {
      if (mode === 'signup') {
        await createUser({ email, password, fullName })
        toast.success('Conta criada! Fazendo login...')
      }
      await login(email, password)
      toast.success('Bem-vindo ao Outbili!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-[fade-in_0.4s_ease-out]">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red to-red-dark flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold font-heading text-text-primary">OUTBILI</span>
          </div>
          <p className="text-xs text-text-muted">Sistema de prospeccao outbound · Bilinski&Co</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-surface border border-border p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex rounded-xl p-1 bg-white/[0.03] border border-border">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
                mode === 'login' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <LogIn className="h-4 w-4" /> Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
                mode === 'signup' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <UserPlus className="h-4 w-4" /> Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className={cn(inputClass, 'pr-12')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-red hover:bg-red-dark text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
              ) : mode === 'login' ? (
                <><LogIn className="h-4 w-4" /> Entrar</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Criar conta</>
              )}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-text-muted text-center">
          OUTBILI v1.0 · Bilinski&Co
        </p>
      </div>
    </div>
  )
}
