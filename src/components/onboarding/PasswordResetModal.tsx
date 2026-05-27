import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { toast } from 'sonner'
import { Lock, Loader2, ShieldCheck } from 'lucide-react'

// FASE 4 onboarding: troca de senha obrigatoria no 1o acesso (force_password_reset).
// Bloqueante: o usuario so prossegue apos definir a senha pessoal.
export function PasswordResetModal() {
  const { changePassword, user } = useAuth()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (pw.length < 8) { toast.error('A senha precisa ter ao menos 8 caracteres.'); return }
    if (pw !== confirm) { toast.error('As senhas não conferem.'); return }
    setSaving(true)
    try {
      await changePassword(pw)
      toast.success('Senha definida. Bem-vindo ao OUTBILI!')
    } catch (e: any) {
      toast.error(`Falha ao definir senha: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-red" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Defina sua senha</p>
            <p className="text-xs text-text-muted">
              Primeiro acesso{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}. Crie uma senha pessoal para continuar.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nova senha (mín. 8 caracteres)"
              className="w-full text-sm bg-white/[0.04] border border-border rounded-lg pl-9 pr-3 py-2.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-red/40"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="Confirmar senha"
              className="w-full text-sm bg-white/[0.04] border border-border rounded-lg pl-9 pr-3 py-2.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-red/40"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red text-white text-sm font-semibold hover:bg-red/90 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Definir senha e continuar
        </button>
      </div>
    </div>
  )
}
