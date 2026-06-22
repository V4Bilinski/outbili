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

// Sistema multi-usuario, handoff livre: qualquer usuario autenticado pode reatribuir
// o lead (pegar para si, delegar a outro responsavel ou devolver ao pool). A RPC
// assign_lead valida a autorizacao no banco e registra a mudanca no historico (audit).
export function AssignLeadControl({ leadId, assignedTo, onAssigned }: Props) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<AssignableProfile[]>([])
  const [owner, setOwner] = useState<string | null>(assignedTo ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setOwner(assignedTo ?? null) }, [assignedTo])
  useEffect(() => { listAssignableProfiles().then(setProfiles).catch(() => {}) }, [])

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
      <select
        value={owner ?? ''}
        disabled={saving}
        onChange={(e) => change(e.target.value || null)}
        className={`bg-elevated-2 border border-border rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-red/40 disabled:opacity-50 max-w-[180px] ${isMine ? 'text-red font-medium' : 'text-text-secondary'}`}
      >
        <option value="">Sem dono (pool)</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>{p.fullName}</option>
        ))}
      </select>
      {saving && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  )
}
