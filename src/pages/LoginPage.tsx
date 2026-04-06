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
    if (password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return }

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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-red/[0.03] blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-red/[0.05] blur-[100px] animate-[float_6s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Logo V4 */}
        <div className="text-center animate-[fade-in_0.5s_ease-out]">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] p-1.5 shadow-lg shadow-red/20 animate-[pulse-glow_3s_ease-in-out_infinite]">
              <img
                src="/outbili/v4-icon.png"
                alt="V4 Company"
                className="w-full h-full rounded-xl object-cover"
              />
            </div>
            <span className="text-2xl font-bold font-heading text-text-primary tracking-tight">OUTBILI</span>
          </div>
          <p className="text-xs text-text-muted animate-[fade-in_0.7s_ease-out]">Sistema de prospecção outbound · Bilinski&Co</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-surface border border-border p-6 space-y-5 animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)] backdrop-blur-sm shadow-2xl shadow-black/20">
          {/* Mode toggle */}
          <div className="flex rounded-xl p-1 bg-white/[0.03] border border-border">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
                mode === 'login' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <LogIn className="h-4 w-4" /> Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
                mode === 'signup' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <UserPlus className="h-4 w-4" /> Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="animate-[fade-in_0.3s_ease-out]">
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
                  placeholder="Mínimo 6 caracteres"
                  className={cn(inputClass, 'pr-12')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-red hover:bg-red-dark text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-red/25 active:scale-[0.98]"
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

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted animate-[fade-in_1s_ease-out]">
          <span>Criado por</span>
          <a
            href="https://www.instagram.com/luizhenriquexpro/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red hover:text-red-dark transition-colors font-medium"
          >
            @luizhenriquexpro
          </a>
          <span className="mx-1">·</span>
          <span className="font-medium text-text-secondary">V4 Bilinski&Co</span>
        </div>
      </div>
    </div>
  )
}
