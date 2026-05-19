import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { AnimateIn } from '../components/ui/AnimateIn'
import { SectionDivider } from '../components/ui/SectionLabel'
import { useAuth } from '../lib/auth-context'
import { updateUser, changePassword, verifyPassword } from '../services/authService'
import { Mail, Shield, Clock, Eye, EyeOff, Loader2, AlertCircle, Save } from 'lucide-react'
import { toast } from 'sonner'

const inputClass = 'h-11 w-full rounded-xl bg-white/[0.05] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:outline-none focus:border-red/40 focus:ring-1 focus:ring-red/20 transition-colors'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [savingName, setSavingName] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  if (!user) return null

  const nameChanged = fullName.trim().length > 0 && fullName.trim() !== user.fullName

  const handleSaveName = async () => {
    if (!nameChanged) return
    setSavingName(true)
    try {
      await updateUser(user.id, { fullName: fullName.trim() })
      toast.success('Nome atualizado.')
    } catch (err: any) {
      toast.error(err?.message || 'Nao foi possivel atualizar o nome.')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError(null)
    if (!currentPw || !newPw || !confirmPw) { setPwError('Preencha todos os campos.'); return }
    if (newPw.length < 6) { setPwError('A nova senha precisa de no minimo 6 caracteres.'); return }
    if (newPw !== confirmPw) { setPwError('A nova senha e a confirmacao nao coincidem.'); return }
    if (newPw === currentPw) { setPwError('A nova senha deve ser diferente da atual.'); return }
    setChangingPw(true)
    try {
      const { valid } = await verifyPassword(currentPw, user.passwordHash)
      if (!valid) { setPwError('Senha atual incorreta.'); return }
      await changePassword(user.id, newPw)
      toast.success('Senha alterada com sucesso.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      setPwError(err?.message || 'Nao foi possivel alterar a senha.')
    } finally {
      setChangingPw(false)
    }
  }

  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Primeiro acesso'

  return (
    <div className="space-y-6">
      <AnimateIn>
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Configurações</h1>
          <p className="text-xs text-text-muted mt-0.5">Seu perfil e conta no Outbili.</p>
        </div>
      </AnimateIn>

      <SectionDivider />

      {/* Perfil */}
      <AnimateIn delay={80}>
      <Card>
        <CardTitle className="mb-5">Perfil</CardTitle>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-red/10 border border-red/20 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-red">{(user.fullName || user.email).charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-text-primary truncate">{user.fullName}</p>
              <Badge variant={user.role === 'admin' ? 'info' : 'outline'} size="sm">
                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
              </Badge>
            </div>
            <p className="text-label text-text-muted flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3 w-3" /> {user.email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome completo</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                className={inputClass}
                autoComplete="name"
              />
              <Button
                variant="primary"
                icon={savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                disabled={!nameChanged || savingName}
                onClick={handleSaveName}
              >
                Salvar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-caption text-text-muted uppercase flex items-center gap-1.5"><Shield className="h-3 w-3" /> Papel</p>
              <p className="text-sm text-text-primary mt-0.5">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-caption text-text-muted uppercase flex items-center gap-1.5"><Clock className="h-3 w-3" /> Último acesso</p>
              <p className="text-sm text-text-primary mt-0.5">{lastLogin}</p>
            </div>
          </div>
        </div>
      </Card>
      </AnimateIn>

      {/* Senha */}
      <AnimateIn delay={120}>
      <Card>
        <CardTitle className="mb-1">Senha</CardTitle>
        <p className="text-xs text-text-muted mb-5">Use uma senha forte e exclusiva. Mínimo de 6 caracteres.</p>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Senha atual</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setPwError(null) }}
              placeholder="Sua senha atual"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nova senha</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwError(null) }}
                placeholder="Mínimo 6 caracteres"
                className={inputClass}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-1 transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Confirmar nova senha</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setPwError(null) }}
              placeholder="Repita a nova senha"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          {pwError && (
            <div role="alert" className="rounded-xl border border-error/40 bg-error/[0.08] px-4 py-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error leading-snug">{pwError}</p>
            </div>
          )}

          <Button
            variant="primary"
            icon={changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            disabled={changingPw}
            onClick={handleChangePassword}
          >
            Alterar senha
          </Button>
        </div>
      </Card>
      </AnimateIn>

      <SectionDivider />

      {/* Sobre */}
      <AnimateIn delay={160}>
      <Card>
        <CardTitle className="mb-4">Sobre</CardTitle>
        <div className="flex items-center gap-4">
          <img src="/outbili/logo-white.png" alt="V4 Bilinski" className="h-8" />
          <div>
            <p className="text-sm font-semibold">OUTBILI v1.0</p>
            <p className="text-label text-text-muted">Inteligência comercial para prospecção outbound · V4 Bilinski &amp;Co</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button size="sm" variant="ghost" onClick={() => navigate('/glossario')}>Glossário</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/institucional')}>Página institucional</Button>
        </div>
      </Card>
      </AnimateIn>
    </div>
  )
}
