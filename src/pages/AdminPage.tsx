import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { getAllUsers, getActivityLog, updateUser, type User, type ActivityLogEntry } from '../services/authService'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Shield, Users, Activity, Eye, UserCheck, UserX, RefreshCw, Database, CheckCircle2, XCircle, Loader2, Zap, ArrowRight } from 'lucide-react'
import { useReEnrichment } from '../hooks/useReEnrichment'
import { useSpicedRecalc } from '../hooks/useSpicedRecalc'
import { toast } from 'sonner'
import { cn } from '../lib/cn'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: 'Login', color: 'text-success' },
  logout: { label: 'Logout', color: 'text-text-muted' },
  page_view: { label: 'Visualizou', color: 'text-info' },
  lead_created: { label: 'Criou lead', color: 'text-warning' },
  lead_enriched: { label: 'Enriqueceu', color: 'text-source-assertiva' },
  campaign_created: { label: 'Criou campanha', color: 'text-red' },
  campaign_dispatched: { label: 'Disparou campanha', color: 'text-red' },
  lead_imported: { label: 'Importou leads', color: 'text-warning' },
  pipeline_move: { label: 'Moveu no pipeline', color: 'text-info' },
  search: { label: 'Pesquisou', color: 'text-source-cnpja' },
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/pipeline': 'Pipeline',
  '/search': 'Pesquisa',
  '/campaigns': 'Campanhas',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
  '/admin': 'Admin',
}

export function AdminPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [tab, setTab] = useState<'activity' | 'users' | 'enrichment'>('activity')
  const { state: reEnrichState, diagnostics, diagLoading, loadDiagnostics, startReEnrich, abort } = useReEnrichment()
  const { progress: recalcProgress, recalcAll } = useSpicedRecalc()

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
      toast.error('Não foi possível carregar os dados. Verifique a conexão.')
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
          <p className="text-sm text-text-muted">Apenas administradores podem acessar esta página.</p>
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
            <h1 className="text-xl font-bold font-heading gradient-text">Administração</h1>
          </div>
          <p className="text-xs text-text-muted mt-0.5">Usuários, atividades e controle de acesso</p>
        </div>
        <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={loadData}>
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono">{users.length}</p>
          <p className="text-[10px] text-text-muted uppercase">Usuários</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono text-success">{users.filter(u => u.isActive).length}</p>
          <p className="text-[10px] text-text-muted uppercase">Ativos</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
          <p className="text-2xl font-bold font-mono text-info">{logs.length}</p>
          <p className="text-[10px] text-text-muted uppercase">Ações registradas</p>
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
          <Users className="h-4 w-4" /> Usuários
        </button>
        <button
          onClick={() => { setTab('enrichment'); loadDiagnostics() }}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            tab === 'enrichment' ? 'bg-red text-white' : 'text-text-muted hover:text-text-secondary')}
        >
          <Database className="h-4 w-4" /> Enriquecimento
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
              <option value="">Todos os usuários</option>
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

      {/* Enrichment */}
      {tab === 'enrichment' && (
        <div className="space-y-4">
          {/* Diagnostico */}
          {diagLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : diagnostics ? (
            <>
              <Card>
                <CardTitle className="mb-3">Diagnostico de dados</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
                    <p className="text-2xl font-bold font-mono">{diagnostics.totalLeads}</p>
                    <p className="text-[10px] text-text-muted uppercase">Total de leads</p>
                  </div>
                  <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-center">
                    <p className="text-2xl font-bold font-mono text-error">{diagnostics.missingEmployees}</p>
                    <p className="text-[10px] text-text-muted uppercase">Sem funcionarios</p>
                  </div>
                  <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-center">
                    <p className="text-2xl font-bold font-mono text-error">{diagnostics.missingFoundingDate}</p>
                    <p className="text-[10px] text-text-muted uppercase">Sem data abertura</p>
                  </div>
                  <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-center">
                    <p className="text-2xl font-bold font-mono text-warning">{diagnostics.estimateOnly}</p>
                    <p className="text-[10px] text-text-muted uppercase">Apenas estimativa</p>
                  </div>
                  <div className="p-3 rounded-xl bg-info/5 border border-info/20 text-center">
                    <p className="text-2xl font-bold font-mono text-info">{diagnostics.needsReEnrich}</p>
                    <p className="text-[10px] text-text-muted uppercase">Precisam re-enriquecer</p>
                  </div>
                  <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
                    <p className="text-2xl font-bold font-mono text-success">{diagnostics.alreadyComplete}</p>
                    <p className="text-[10px] text-text-muted uppercase">Ja completos</p>
                  </div>
                </div>
              </Card>

              {/* Acoes */}
              <Card>
                <CardTitle className="mb-3">Re-enriquecimento em lote</CardTitle>
                <p className="text-xs text-text-muted mb-4">
                  Atualiza dados de funcionarios, data de abertura e anos no mercado usando CNPJa + Assertiva. Dados reais substituem estimativas.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    icon={<Database className="h-4 w-4" />}
                    disabled={reEnrichState.isRunning || diagnostics.needsReEnrich === 0}
                    onClick={() => startReEnrich('missing')}
                  >
                    Re-enriquecer dados faltantes ({diagnostics.needsReEnrich})
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<RefreshCw className="h-4 w-4" />}
                    disabled={reEnrichState.isRunning || diagnostics.totalLeads === 0}
                    onClick={() => {
                      if (confirm(`Forcar re-enriquecimento de TODOS os ${diagnostics.totalLeads} leads? Isso consome creditos de API.`)) {
                        startReEnrich('all')
                      }
                    }}
                  >
                    Forcar re-enriquecimento total
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<RefreshCw className="h-3.5 w-3.5" />}
                    onClick={loadDiagnostics}
                    disabled={diagLoading}
                  >
                    Atualizar diagnostico
                  </Button>
                </div>
              </Card>

              {/* Recalculo SPICED v2 */}
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-warning" />
                  <CardTitle>Recalcular SPICED v2 em massa</CardTitle>
                </div>
                <p className="text-xs text-text-muted mb-4">
                  Recalcula score e temperatura de todos os leads usando a nova formula SPICED v2 (CNPJa + Assertiva only). Nao consome creditos de API — usa apenas os dados ja existentes no Airtable.
                </p>

                {!recalcProgress.isRunning && !recalcProgress.isDone && (
                  <Button
                    variant="primary"
                    icon={<Zap className="h-4 w-4" />}
                    disabled={recalcProgress.isRunning || diagnostics.totalLeads === 0}
                    onClick={() => {
                      if (confirm(`Recalcular SPICED de ${diagnostics.totalLeads} leads? Scores e temperaturas serao atualizados.`)) {
                        recalcAll()
                        toast.success('Recalculo SPICED iniciado')
                      }
                    }}
                  >
                    Recalcular SPICED de {diagnostics.totalLeads} leads
                  </Button>
                )}

                {/* Progresso */}
                {recalcProgress.isRunning && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 text-warning animate-spin" />
                      <span className="text-sm text-text-primary truncate">{recalcProgress.currentLead}</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-warning to-red rounded-full transition-all duration-300"
                        style={{ width: `${recalcProgress.total > 0 ? (recalcProgress.processed / recalcProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-text-muted">
                      <span className="text-success">{recalcProgress.updated} atualizados</span>
                      <span>{recalcProgress.skipped} sem mudanca</span>
                      <span className="ml-auto">{recalcProgress.processed}/{recalcProgress.total}</span>
                    </div>
                  </div>
                )}

                {/* Resultado */}
                {recalcProgress.isDone && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Recalculo concluido</p>
                        <p className="text-xs text-text-muted">
                          {recalcProgress.updated} leads atualizados · {recalcProgress.skipped} sem mudanca · {recalcProgress.total} total
                        </p>
                      </div>
                    </div>

                    {/* Tabela de mudancas */}
                    {recalcProgress.changes.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                          Leads com score/temperatura alterados ({recalcProgress.changes.length})
                        </p>
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead className="bg-surface-md sticky top-0">
                              <tr className="border-b border-border">
                                <th className="text-left py-2 px-3 text-text-muted font-medium">Empresa</th>
                                <th className="text-center py-2 px-3 text-text-muted font-medium">Score</th>
                                <th className="text-center py-2 px-3 text-text-muted font-medium">Temperatura</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recalcProgress.changes.map((c) => (
                                <tr key={c.id} className="border-b border-border/30">
                                  <td className="py-2 px-3 text-text-primary font-medium truncate max-w-[200px]">{c.name}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="font-mono text-text-muted">{c.oldScore}</span>
                                    <ArrowRight className="h-3 w-3 inline mx-1 text-text-muted" />
                                    <span className={cn('font-mono font-bold', c.newScore >= 4 ? 'text-hot' : c.newScore >= 3 ? 'text-warm' : 'text-success')}>{c.newScore}</span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="text-text-muted">{c.oldTemp}</span>
                                    <ArrowRight className="h-3 w-3 inline mx-1 text-text-muted" />
                                    <span className={cn('font-bold', c.newTemp === 'Quente' ? 'text-hot' : c.newTemp === 'Morno' ? 'text-warm' : 'text-success')}>{c.newTemp}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <p className="text-sm text-text-muted text-center py-8">Clique na aba para carregar diagnostico</p>
            </Card>
          )}

          {/* Progresso */}
          {reEnrichState.isRunning && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Processando...</CardTitle>
                <Button size="sm" variant="danger" onClick={abort}>Parar</Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-red animate-spin" />
                  <span className="text-sm text-text-primary truncate">{reEnrichState.currentLead}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red to-red-vivid rounded-full transition-all duration-500"
                    style={{ width: `${reEnrichState.total > 0 ? ((reEnrichState.completed + reEnrichState.failed + reEnrichState.skipped) / reEnrichState.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" /> {reEnrichState.completed} atualizados
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-error" /> {reEnrichState.failed} erros
                  </span>
                  <span>{reEnrichState.skipped} pulados</span>
                  <span className="ml-auto">
                    {reEnrichState.completed + reEnrichState.failed + reEnrichState.skipped}/{reEnrichState.total}
                    {reEnrichState.etaSeconds > 0 && ` · ETA ${Math.ceil(reEnrichState.etaSeconds / 60)} min`}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Resultado final */}
          {!reEnrichState.isRunning && reEnrichState.results.length > 0 && (
            <Card>
              <CardTitle className="mb-3">Resultado do re-enriquecimento</CardTitle>
              <div className="flex items-center gap-4 mb-3 text-sm">
                <span className="text-success font-semibold">{reEnrichState.completed} atualizados</span>
                <span className="text-error font-semibold">{reEnrichState.failed} erros</span>
                <span className="text-text-muted">{reEnrichState.skipped} pulados</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {reEnrichState.results.filter(r => !r.skipped).map((r) => (
                  <div key={r.leadId} className="flex items-center gap-2 text-[11px] py-1 border-b border-border/50">
                    {r.error ? (
                      <XCircle className="h-3 w-3 text-error shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                    )}
                    <span className="text-text-secondary font-mono truncate">{r.leadId.slice(0, 8)}</span>
                    <span className="text-text-muted">
                      {r.error || `${Object.keys(r.updated).length} campos via ${r.source}`}
                    </span>
                    {r.updated.employees && (
                      <Badge variant="info" size="sm">{r.updated.employees} func</Badge>
                    )}
                    {r.updated.yearsInMarket !== undefined && (
                      <Badge variant="default" size="sm">{r.updated.yearsInMarket} anos</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Users Management */}
      {tab === 'users' && (
        <Card>
          <CardTitle className="mb-4">Usuários do sistema</CardTitle>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red/20 to-red-dark/20 flex items-center justify-center text-sm font-bold text-red shrink-0">
                  {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{user.fullName}</p>
                    <Badge variant={user.role === 'admin' ? 'error' : 'info'} size="sm">{user.role === 'admin' ? 'Admin' : 'Usuário'}</Badge>
                    {!user.isActive && <Badge variant="default" size="sm">Desativado</Badge>}
                  </div>
                  <p className="text-[11px] text-text-muted">{user.email}</p>
                  {user.lastLoginAt && (
                    <p className="text-[10px] text-text-muted">Último login: {new Date(user.lastLoginAt).toLocaleString('pt-BR')}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => { setSelectedUser(user.id); setTab('activity') }}
                  >
                    Ver ações
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
