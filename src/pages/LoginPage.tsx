import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { createUser } from '../services/authService'
import { toast } from 'sonner'
import { LogIn, UserPlus, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '../lib/cn'

type Mode = 'login' | 'signup'

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const touch = (field: string) => setTouched((p) => ({ ...p, [field]: true }))

  const emailError = touched.email && email.length > 0 && !isValidEmail(email) ? 'Email inválido' : null
  const emailOk = email.length > 0 && isValidEmail(email)
  const passwordError = touched.password && password.length > 0 && password.length < 6 ? `Faltam ${6 - password.length} caractere${6 - password.length > 1 ? 's' : ''}` : null
  const passwordOk = password.length >= 6
  const nameError = touched.fullName && mode === 'signup' && fullName.length === 0 ? 'Nome obrigatório' : null

  const inputBase = 'h-12 w-full rounded-xl bg-white/[0.05] border text-sm text-text-primary px-4 placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors'
  const inputClass = (error: string | null, ok: boolean) => cn(
    inputBase,
    error ? 'border-error/50 focus:border-error/60 focus:ring-error/20' :
    ok ? 'border-success/40 focus:border-success/50 focus:ring-success/20' :
    'border-border focus:border-red/40 focus:ring-red/20',
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true, fullName: true })
    if (!email || !password) return
    if (!isValidEmail(email)) return
    if (mode === 'signup' && !fullName) return
    if (password.length < 6) return

    setIsLoading(true)
    setError(null)
    try {
      if (mode === 'signup') {
        await createUser({ email, password, fullName })
        toast.success('Conta criada. Fazendo login...')
      }
      await login(email, password)
      toast.success('Bem-vindo ao Outbili.')
      navigate('/')
    } catch (err: any) {
      const msg = err?.message || 'Email ou senha incorretos. Tente novamente.'
      setError(msg)
      toast.error(msg)
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
          <p className="text-sm font-semibold text-text-primary leading-snug animate-[fade-in_0.7s_ease-out] mt-1">
            Do CNPJ ao contrato.
          </p>
          <p className="text-xs text-text-secondary leading-snug animate-[fade-in_0.8s_ease-out] mt-0.5">
            Sem lista fria. Sem achismo. Sem trava.
          </p>
          <p className="text-xs text-text-muted animate-[fade-in_0.9s_ease-out] mt-1">
            Sistema de inteligência comercial · V4 Bilinski &amp; Co
          </p>
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
                <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => touch('fullName')}
                  placeholder="Seu nome"
                  className={inputClass(nameError, fullName.length > 0 && !nameError)}
                  autoComplete="name"
                />
                {nameError && <p className="text-micro text-error mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{nameError}</p>}
              </div>
            )}

            <div>
              <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touch('email')}
                  placeholder="seu@email.com"
                  className={cn(inputClass(emailError, emailOk), 'pr-10')}
                  autoComplete="email"
                />
                {emailOk && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}
                {emailError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-error" />}
              </div>
              {emailError && <p className="text-micro text-error mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{emailError}</p>}
            </div>

            <div>
              <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch('password')}
                  placeholder="Mínimo 6 caracteres"
                  className={cn(inputClass(passwordError, passwordOk), 'pr-20')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {passwordOk && <CheckCircle className="h-4 w-4 text-success" />}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-muted hover:text-text-primary cursor-pointer p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {passwordError && <p className="text-micro text-error mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{passwordError}</p>}
              {password.length > 0 && password.length < 6 && !touched.password && (
                <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-error to-warning rounded-full transition-all duration-300" style={{ width: `${(password.length / 6) * 100}%` }} />
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-error/40 bg-error/[0.08] px-4 py-3 flex items-start gap-2 animate-[fade-in_0.2s_ease-out]"
              >
                <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error leading-snug">{error}</p>
              </div>
            )}

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

        <div className="flex items-center justify-center gap-1.5 text-caption text-text-muted animate-[fade-in_1s_ease-out]">
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
