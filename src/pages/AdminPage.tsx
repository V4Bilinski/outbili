import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { getAllUsers, getActivityLog, updateUser, type User, type ActivityLogEntry } from '../services/authService'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Shield, Users, Activity, Eye, UserCheck, UserX, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/cn'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: 'Login', color: 'text-success' },
  logout: { label: 'Logout', color: 'text-text-muted' },
  page_view: { label: 'Visualizou', color: 'text-info' },
  lead_created: { label: 'Criou lead', color: 'text-warning' },
  lead_enriched: { label: 'Enriqueceu', color: 'text-purple-400' },
  campaign_created: { label: 'Criou campanha', color: 'text-red' },
  campaign_dispatched: { label: 'Disparou campanha', color: 'text-red' },
  lead_imported: { label: 'Importou leads', color: 'text-warning' },
  pipeline_move: { label: 'Moveu no pipeline', color: 'text-info' },
  search: { label: 'Pesquisou', color: 'text-cyan-400' },
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/pipeline': 'Pipeline',
  '/search': 'Pesquisa',
  '/campaigns': 'Campanhas',
  '/reports': 'Relatorios',
  '/settings': 'Configuracoes',
  '/admin': 'Admin',
}

export function AdminPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [tab, setTab] = useState<'activity' | 'users'>('activity')

  const loadData = async () => {
    setLoading(true)
    try {
      const [u, l] = await Promise.all([
        getAllUsers(),
        getActivityLog({ limit: 200 }),
      ])
      setUsers(u)
      setLogs(l)
    } catch (err: any) {
      toast.error('Erro ao carregar dados: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const toggleUserActive = async (user: User) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive })
      toast.success(`${user.fullName} ${user.isActive ? 'desativado' : 'ativado'}`)
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-error mx-auto" />
          <p className="text-lg font-bold text-text-primary">Acesso restrito</p>
          <p className="text-sm text-text-muted">Apenas administradores podem acessar esta pagina.</p>
        </div>
      </div>
    )
  }

  const filteredLogs = selectedUser
    ? logs.filter((l) => l.userId === selectedUser)
    : logs

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-[fade-in_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red" />
            <h1 className="text-xl font-bold font-heading gradient-text">Administracao</h1>
          </div>
          <p className="text-xs text-text-muted mt-0.5">Usuarios, atividades e controle de acesso</p>
        </div>
        <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={loadData}>
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono">{users.length}</p>
          <p className="text-[10px] text-text-muted uppercase">Usuarios</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono text-success">{users.filter(u => u.isActive).length}</p>
          <p className="text-[10px] text-text-muted uppercase">Ativos</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono text-info">{logs.length}</p>
          <p className="text-[10px] text-text-muted uppercase">Acoes registradas</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono">{logs.filter(l => l.action === 'login').length}</p>
          <p className="text-[10px] text-text-muted uppercase">Logins</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 bg-white/[0.03] border border-border gap-1 w-fit">
        <button
          onClick={() => setTab('activity')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            tab === 'activity' ? 'bg-red text-white' : 'text-text-muted hover:text-text-secondary')}
        >
          <Activity className="h-4 w-4" /> Atividades
        </button>
        <button
          onClick={() => setTab('users')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            tab === 'users' ? 'bg-red text-white' : 'text-text-muted hover:text-text-secondary')}
        >
          <Users className="h-4 w-4" /> Usuarios
        </button>
      </div>

      {/* Activity Log */}
      {tab === 'activity' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Log de atividades</CardTitle>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="text-xs bg-white/[0.04] border border-border rounded-lg px-3 py-1.5 text-text-primary cursor-pointer"
            >
              <option value="">Todos os usuarios</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-1">
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Nenhuma atividade registrada</p>
            ) : (
              filteredLogs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'text-text-muted' }
                const pageLabel = log.page ? PAGE_LABELS[log.page] || log.page : ''
                const time = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''

                return (
                  <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', actionInfo.color.replace('text-', 'bg-'))} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-semibold', actionInfo.color)}>{actionInfo.label}</span>
                        {pageLabel && <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{pageLabel}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-text-secondary">{log.userName || log.userEmail}</span>
                        {log.details && <span className="text-[10px] text-text-muted truncate">{log.details}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono shrink-0">{time}</span>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      )}

      {/* Users Management */}
      {tab === 'users' && (
        <Card>
          <CardTitle className="mb-4">Usuarios do sistema</CardTitle>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red/20 to-red-dark/20 flex items-center justify-center text-sm font-bold text-red shrink-0">
                  {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{user.fullName}</p>
                    <Badge variant={user.role === 'admin' ? 'error' : 'info'} size="sm">{user.role === 'admin' ? 'Admin' : 'Usuario'}</Badge>
                    {!user.isActive && <Badge variant="default" size="sm">Desativado</Badge>}
                  </div>
                  <p className="text-[11px] text-text-muted">{user.email}</p>
                  {user.lastLoginAt && (
                    <p className="text-[10px] text-text-muted">Ultimo login: {new Date(user.lastLoginAt).toLocaleString('pt-BR')}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => { setSelectedUser(user.id); setTab('activity') }}
                  >
                    Ver acoes
                  </Button>
                  {user.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant={user.isActive ? 'danger' : 'secondary'}
                      icon={user.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      onClick={() => toggleUserActive(user)}
                    >
                      {user.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
