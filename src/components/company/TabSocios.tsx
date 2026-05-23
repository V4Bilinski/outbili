import { useCallback, useEffect, useState } from 'react'
import {
  Users, Phone, ShieldAlert, RefreshCw, TrendingUp, Link2, Sparkles, Building2,
  AtSign, Briefcase, Globe, ExternalLink, Share2,
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { WhatsAppIcon } from '../ui/WhatsAppIcon'
import { cn } from '../../lib/cn'
import type { Lead } from '../../types'
import {
  getSociosByLead,
  runDeepEnrichment,
  runSocialEnrich,
  type Socio,
  type SocioTelefone,
  type EmpresaTelefone,
  type RedeSocial,
} from '../../services/socioService'

function iconePlataforma(p: string) {
  if (p === 'instagram') return <AtSign className="h-3.5 w-3.5 text-text-secondary" />
  if (p === 'linkedin') return <Briefcase className="h-3.5 w-3.5 text-text-secondary" />
  return <Globe className="h-3.5 w-3.5 text-text-secondary" />
}

// Lista de redes sociais atribuídas (com validação de match exibida).
function RedesSociais({ redes }: { redes: RedeSocial[] }) {
  if (redes.length === 0) return null
  return (
    <div className="space-y-2">
      {redes.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {iconePlataforma(r.plataforma)}
              <span className="text-sm font-semibold text-text-primary truncate">
                @{r.handle || r.plataforma}
              </span>
              {typeof r.seguidores === 'number' && (
                <span className="text-[10px] text-text-muted">
                  {r.seguidores.toLocaleString('pt-BR')} seguidores
                </span>
              )}
              {r.confianca === 'alta' ? (
                <Badge variant="success" size="xs">match confirmado</Badge>
              ) : (
                <Badge variant="warning" size="xs">match provável</Badge>
              )}
            </div>
            {r.matchMotivo && <p className="text-[10px] text-text-muted mt-0.5">{r.matchMotivo}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {r.contatoExterno && (
              <a
                href={r.contatoExterno}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium bg-white/[0.05] text-text-secondary hover:bg-white/[0.1] min-h-[40px]"
                title={r.contatoExterno}
              >
                <Link2 className="h-3.5 w-3.5" /> Contato
              </a>
            )}
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium bg-red/10 text-red hover:bg-red/20 min-h-[40px]"
              title={r.url}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

interface Props {
  lead: Lead
}

// Formata E.164 brasileiro para leitura: +55 (11) 99651-8770
function formatBr(e164: string): string {
  const d = (e164 || '').replace(/\D/g, '')
  const nat = d.startsWith('55') ? d.slice(2) : d
  if (nat.length === 11) return `+55 (${nat.slice(0, 2)}) ${nat.slice(2, 7)}-${nat.slice(7)}`
  if (nat.length === 10) return `+55 (${nat.slice(0, 2)}) ${nat.slice(2, 6)}-${nat.slice(6)}`
  return e164
}

function indiceVariant(v: number): 'hot' | 'warm' | 'cold' {
  if (v >= 0.5) return 'hot'
  if (v >= 0.25) return 'warm'
  return 'cold'
}

// Linha de um número de WhatsApp pessoal do sócio, com acesso direto à conversa.
function WhatsAppRow({ tel }: { tel: SocioTelefone }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5',
        tel.naoPerturbe
          ? 'border-warning/25 bg-warning/[0.04]'
          : 'border-whatsapp/20 bg-whatsapp/[0.05]',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-primary tabular-nums">{formatBr(tel.e164)}</span>
          {tel.operadora && <span className="text-[10px] text-text-muted">{tel.operadora}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {tel.naoPerturbe ? (
            <Badge variant="warning" size="xs"><ShieldAlert className="h-2.5 w-2.5" /> não perturbe</Badge>
          ) : (
            <Badge variant="success" size="xs">liberado</Badge>
          )}
          {tel.whatsappConfirmado && <Badge variant="success" size="xs">confirmado</Badge>}
          {tel.isHot && <Badge variant="hot" size="xs">ativo</Badge>}
          {tel.ultimoContato && (
            <span className="text-[10px] text-text-muted">{tel.ultimoContato}</span>
          )}
        </div>
      </div>
      <a
        href={tel.waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[40px] bg-whatsapp/15 text-whatsapp hover:bg-whatsapp/25"
        title={`Abrir conversa no WhatsApp: ${tel.waLink}`}
      >
        <WhatsAppIcon className="text-sm" />
        Abrir WhatsApp
      </a>
    </div>
  )
}

// Banner com os telefones de contato da empresa que têm WhatsApp (consulta CNPJ).
// Canal corporativo compartilhado. Em PMEs, costuma ser o WhatsApp do administrador.
function EmpresaWhatsappBanner({ telefones }: { telefones: EmpresaTelefone[] }) {
  const comWhatsapp = telefones.filter((t) => t.whatsapp)
  if (comWhatsapp.length === 0) return null
  return (
    <div className="rounded-xl border border-whatsapp/25 bg-whatsapp/[0.04] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-whatsapp" />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          WhatsApp da empresa
        </span>
        <Badge variant="outline" size="xs">{comWhatsapp.length}</Badge>
      </div>
      <p className="text-[11px] text-text-muted mb-3">
        Telefones de contato da empresa com WhatsApp ativo (relação direta). Canal compartilhado dos sócios.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {comWhatsapp.map((t) => (
          <a
            key={t.id}
            href={t.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-lg border border-whatsapp/20 bg-whatsapp/[0.06] px-3 py-2.5 hover:bg-whatsapp/[0.12] transition-colors min-h-[44px]"
            title={`Abrir conversa no WhatsApp: ${t.waLink}`}
          >
            <span className="text-sm font-semibold text-text-primary tabular-nums">{formatBr(t.e164)}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-whatsapp shrink-0">
              <WhatsAppIcon className="text-sm" />
              Abrir
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function SocioCard({
  socio,
  temEmpresaWhatsapp,
  redes,
}: {
  socio: Socio
  temEmpresaWhatsapp: boolean
  redes: RedeSocial[]
}) {
  const whatsapps = socio.telefones.filter((t) => t.whatsappPessoal)
  const outros = socio.telefones.filter((t) => !t.whatsappPessoal)
  const indicePct = Math.round(socio.indiceProbabilidadeNegociacao * 100)

  return (
    <div className="rounded-xl border border-border bg-white/[0.02] overflow-hidden animate-[fade-in_0.4s_ease-out_both]">
      {/* Cabeçalho do sócio */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{socio.nome}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {socio.cargo || socio.participacao || 'Sócio / decisor'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={indiceVariant(socio.indiceProbabilidadeNegociacao)} size="sm">
            <TrendingUp className="h-2.5 w-2.5" /> {indicePct}%
          </Badge>
          <span className="text-[9px] text-text-muted uppercase tracking-wide">prob. negociação</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* TODOS os WhatsApps pessoais do sócio */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <WhatsAppIcon className="text-whatsapp text-sm" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              WhatsApp pessoal
            </span>
            <Badge variant="outline" size="xs">{whatsapps.length}</Badge>
          </div>
          {whatsapps.length > 0 ? (
            <div className="space-y-2">
              {whatsapps.map((t) => (
                <WhatsAppRow key={t.id} tel={t} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">
              {temEmpresaWhatsapp
                ? 'Sem WhatsApp pessoal na base Assertiva. Contato pelo WhatsApp da empresa (acima).'
                : 'Sem WhatsApp pessoal validado para este sócio.'}
            </p>
          )}
        </div>

        {/* Outros telefones (sem WhatsApp pessoal) */}
        {outros.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Outros telefones
              </span>
              <Badge variant="outline" size="xs">{outros.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {outros.map((t) => (
                <span
                  key={t.id}
                  className="text-xs text-text-secondary tabular-nums bg-white/[0.03] border border-border rounded-lg px-2.5 py-1.5"
                >
                  {formatBr(t.e164)}
                  {t.operadora && <span className="text-text-muted ml-1.5">{t.operadora}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Redes sociais do sócio (atribuídas via Apify, com match validado) */}
        {redes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Redes sociais
              </span>
              <Badge variant="outline" size="xs">{redes.length}</Badge>
            </div>
            <RedesSociais redes={redes} />
          </div>
        )}

        {/* Vínculos (familiares e societários) */}
        {socio.vinculos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Vínculos</span>
              <Badge variant="outline" size="xs">{socio.vinculos.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {socio.vinculos.map((v) => (
                <span
                  key={v.id}
                  className="text-xs text-text-secondary bg-white/[0.03] border border-border rounded-lg px-2.5 py-1.5"
                >
                  {v.tipo === 'familiar'
                    ? `${v.nomeRelacionado || 'Familiar'}${v.grauParentesco ? ` (${v.grauParentesco})` : ''}`
                    : `${v.razaoSocialVinculada || v.cnpjVinculado || 'Empresa vinculada'}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TabSocios({ lead }: Props) {
  const [socios, setSocios] = useState<Socio[]>([])
  const [empresaTelefones, setEmpresaTelefones] = useState<EmpresaTelefone[]>([])
  const [redes, setRedes] = useState<RedeSocial[]>([])
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [searchingSocial, setSearchingSocial] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSociosByLead(lead.id)
      setSocios(data.socios)
      setEmpresaTelefones(data.empresaTelefones)
      setRedes(data.redes)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha ao carregar sócios.')
    } finally {
      setLoading(false)
    }
  }, [lead.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  const enriquecer = async () => {
    if (!lead.cnpj) {
      setMsg('Lead sem CNPJ. Não é possível enriquecer os sócios.')
      return
    }
    setEnriching(true)
    setMsg(null)
    try {
      const r = await runDeepEnrichment(lead.cnpj, lead.id)
      if (!r.ok) {
        setMsg(`Falha no enriquecimento: ${r.error || 'erro desconhecido'}`)
        return
      }
      const aviso = r.warnings && r.warnings.length > 0 ? ` (${r.warnings.length} avisos)` : ''
      setMsg(`Enriquecimento concluído. ${r.numSocios} sócios processados${aviso}.`)
      await carregar()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha no enriquecimento.')
    } finally {
      setEnriching(false)
    }
  }

  const buscarRedes = async () => {
    setSearchingSocial(true)
    setMsg(null)
    try {
      const r = await runSocialEnrich(lead.id)
      if (!r.ok) {
        setMsg(`Falha na busca de redes: ${r.error || 'erro desconhecido'}`)
        return
      }
      setMsg(`Busca de redes sociais concluída. ${r.atribuidas} rede(s) atribuída(s) com match validado.`)
      await carregar()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha na busca de redes sociais.')
    } finally {
      setSearchingSocial(false)
    }
  }

  const redesEmpresa = redes.filter((r) => !r.socioId)
  const totalWaPessoal = socios.reduce(
    (acc, s) => acc + s.telefones.filter((t) => t.whatsappPessoal).length,
    0,
  )
  const totalWaEmpresa = empresaTelefones.filter((t) => t.whatsapp).length
  const temEmpresaWhatsapp = totalWaEmpresa > 0

  return (
    <div className="space-y-4">
      {/* Cabeçalho da tab */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-red" />
          <h3 className="text-sm font-semibold text-text-primary">Sócios e decisores</h3>
          {socios.length > 0 && (
            <Badge variant="outline" size="sm">
              {socios.length} sócios · {totalWaPessoal} WhatsApp pessoal · {totalWaEmpresa} da empresa
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={searchingSocial}
            icon={<Share2 className="h-3.5 w-3.5" />}
            onClick={buscarRedes}
          >
            Buscar redes
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={enriching}
            icon={socios.length > 0 ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            onClick={enriquecer}
          >
            {socios.length > 0 ? 'Reenriquecer' : 'Enriquecer decisores'}
          </Button>
        </div>
      </div>

      {msg && (
        <div className="text-xs text-text-secondary bg-white/[0.03] border border-border rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="text-xs text-text-muted py-8 text-center">Carregando sócios...</div>
      ) : socios.length === 0 && empresaTelefones.length === 0 && redes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white/[0.02] py-10 px-4 text-center">
          <Users className="h-8 w-8 text-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-text-secondary">Nenhum sócio enriquecido ainda.</p>
          <p className="text-xs text-text-muted mt-1">
            Clique em "Enriquecer decisores" para buscar sócios, telefones e WhatsApp pessoal via Assertiva.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <EmpresaWhatsappBanner telefones={empresaTelefones} />
          {redesEmpresa.length > 0 && (
            <div className="rounded-xl border border-border bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="h-4 w-4 text-red" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Redes sociais da empresa
                </span>
                <Badge variant="outline" size="xs">{redesEmpresa.length}</Badge>
              </div>
              <RedesSociais redes={redesEmpresa} />
            </div>
          )}
          {socios.map((s) => (
            <SocioCard
              key={s.id}
              socio={s}
              temEmpresaWhatsapp={temEmpresaWhatsapp}
              redes={redes.filter((r) => r.socioId === s.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
