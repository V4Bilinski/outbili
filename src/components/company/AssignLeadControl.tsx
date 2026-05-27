import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { listAssignableProfiles, assignLead, type AssignableProfile } from '../../services/leadService'
import { toast } from 'sonner'
import { UserCircle2, Loader2 } from 'lucide-react'

interface Props {
  leadId: string
  assignedTo?: string | null
  onAssigned?: (profileId: string | null) => void
}

// FASE 1 multi-usuario: controle de Responsavel pelo lead.
// admin: select completo (atribui/redistribui/devolve ao pool).
// SDR: ve o dono; se o lead estiver sem dono, pode "Pegar para mim" (self-claim).
// A RPC assign_lead valida a autorizacao no banco e registra no historico.
export function AssignLeadControl({ leadId, assignedTo, onAssigned }: Props) {
  const { isAdmin, user } = useAuth()
  const [profiles, setProfiles] = useState<AssignableProfile[]>([])
  const [owner, setOwner] = useState<string | null>(assignedTo ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setOwner(assignedTo ?? null) }, [assignedTo])
  useEffect(() => { listAssignableProfiles().then(setProfiles).catch(() => {}) }, [])

  const ownerName = profiles.find((p) => p.id === owner)?.fullName
  const isMine = !!owner && owner === user?.profileId

  const change = async (profileId: string | null) => {
    setSaving(true)
    try {
      await assignLead(leadId, profileId)
      setOwner(profileId)
      const nome = profiles.find((p) => p.id === profileId)?.fullName || 'pool'
      toast.success(profileId ? `Responsável: ${nome}` : 'Lead devolvido ao pool')
      onAssigned?.(profileId)
    } catch (e: any) {
      toast.error(`Falha ao atribuir: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-text-muted">
      <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
      <span className="shrink-0">Responsável:</span>
      {isAdmin ? (
        <select
          value={owner ?? ''}
          disabled={saving}
          onChange={(e) => change(e.target.value || null)}
          className="bg-white/5 border border-border rounded-md px-1.5 py-0.5 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-red/40 disabled:opacity-50 max-w-[180px]"
        >
          <option value="">Sem dono (pool)</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
      ) : owner ? (
        <span className={`font-medium ${isMine ? 'text-red' : 'text-text-secondary'}`}>
          {isMine ? 'Você' : (ownerName || 'Outro usuário')}
        </span>
      ) : (
        <button
          type="button"
          disabled={saving}
          onClick={() => change(user?.profileId ?? null)}
          className="font-medium text-red hover:text-red/80 transition-colors disabled:opacity-50"
        >
          Pegar para mim
        </button>
      )}
      {saving && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  )
}
