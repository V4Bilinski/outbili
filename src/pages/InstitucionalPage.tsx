import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useEffect } from 'react'
import { Search, Database, Filter, Brain, Send, ArrowRight, Shield, Target, CheckCircle, LogIn, UserPlus } from 'lucide-react'
import { AnimateIn } from '../components/ui/AnimateIn'

// Section label pattern: red bar + uppercase label
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-0.5 bg-red" />
      <span className="text-label font-semibold tracking-[0.1em] uppercase text-red">
        {children}
      </span>
    </div>
  )
}

// Gradient divider between sections
function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-red/30 to-transparent" />
    </div>
  )
}

const STATIONS = [
  { num: '01', icon: Search, name: 'Pesquisa', desc: 'Busca por segmento e localização via CNPJa' },
  { num: '02', icon: Database, name: 'Enriquecimento', desc: 'Cascata 3 níveis até o WhatsApp do decisor' },
  { num: '03', icon: Filter, name: 'Qualificação', desc: 'Score SPICED automático + temperatura' },
  { num: '04', icon: Brain, name: 'Inteligência', desc: '5 tabs: Reunião, Projeção, Vulnerabilidades, Competitiva, Argumentos' },
  { num: '05', icon: Send, name: 'Prospecção', desc: 'Campanhas WhatsApp via BilinskiZap' },
]

const TRAPS = [
  { code: 'T1', name: 'Cegueira', solution: 'SPICED automático com 5 dimensões' },
  { code: 'T2', name: 'Exposição', solution: 'Pesquisa por CNAE + localização' },
  { code: 'T3', name: 'Atenção', solution: 'Cascata 3 níveis Assertiva' },
  { code: 'T4', name: 'Interesse', solution: 'Argumentos + Projeção prontos' },
  { code: 'T5', name: 'Qualificação', solution: 'Score SPICED + temperatura' },
  { code: 'T6', name: 'Compromisso', solution: 'Pipeline com stage gates' },
  { code: 'T7', name: 'Decisão', solution: 'Roteiro de reunião completo' },
  { code: 'T8', name: 'Dependência', solution: 'Canal outbound próprio', highlight: true },
]

const RULES = [
  {
    rule: 'Não pescar sem qualificar.',
    context: 'Todo lead que entra no pipeline sem score SPICED é lixo disfarçado de oportunidade. O sistema qualifica antes de você gastar um minuto sequer.',
  },
  {
    rule: 'Não reunir sem preparar.',
    context: 'O OUTBILI monta 5 tabs de inteligência antes da sua reunião: roteiro, projeção, vulnerabilidades, concorrência e argumentos. Entrar na call "no escuro" é desperdiçar a hora mais cara do time.',
  },
  {
    rule: 'Não avançar sem completar.',
    context: 'Cada etapa do pipeline tem um checklist. Lead que pula etapa vira número bonito no funil e dinheiro parado na prática.',
  },
  {
    rule: 'Não depender de um canal.',
    context: 'O OUTBILI existe porque nenhuma unidade deveria ter 100% da receita nova vindo de um canal que não controla. Outbound é o nosso segundo motor.',
  },
  {
    rule: 'Resultado acima de volume.',
    context: 'Não meça quantos leads entraram. Meça quantos contratos fecharam. 5 leads quentes valem mais que 500 frios. O que importa é o que sai da linha, não o que entra.',
  },
]

export function InstitucionalPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-bg text-text-primary overflow-x-hidden">

      {/* ===================== HERO ===================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Radial gradient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(230,51,41,0.08), transparent)',
          }}
        />

        {/* Grid background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(244,244,245,1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,244,245,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Decorative dots — top-right corner */}
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(230,51,41,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(ellipse at top right, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top right, black 20%, transparent 70%)',
          }}
        />

        {/* Decorative dots — bottom-left corner */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(230,51,41,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(ellipse at bottom left, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at bottom left, black 20%, transparent 70%)',
          }}
        />

        {/* Secondary ambient glow */}
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-red/[0.04] blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full bg-red/[0.03] blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">

          {/* Logo */}
          <AnimateIn delay={0} duration={600}>
            <img src="/outbili/logo-white.png" alt="V4 Bilinski &amp; Co" className="h-14 md:h-16 w-auto mx-auto mb-10 opacity-90" />
          </AnimateIn>

          {/* Hero badge with pulsing dot */}
          <AnimateIn delay={40} duration={600}>
            <div className="inline-flex items-center gap-2.5 border border-border rounded-full px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
              </span>
              <span className="text-label uppercase tracking-[0.15em] text-text-muted font-medium">
                Sistema de inteligência comercial
              </span>
            </div>
          </AnimateIn>

          {/* Headline with gradient text */}
          <AnimateIn delay={80} duration={600}>
            <h1
              className="font-heading font-bold tracking-tight leading-none mb-4"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #F4F4F5 0%, #E63329 60%, #FF6666 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Do CNPJ ao contrato.
              </span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={160} duration={600}>
            <h2
              className="font-heading font-bold tracking-tight leading-none text-text-secondary mb-8 whitespace-nowrap"
              style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.5rem)' }}
            >
              Sem lista fria. Sem achismo. Sem trava.
            </h2>
          </AnimateIn>

          <AnimateIn delay={240} duration={600}>
            <p className="text-text-muted text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
              O sistema de prospecção outbound da V4 Bilinski &amp; Co.
            </p>
            <p className="text-text-muted text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Fábrica de Receita operacionalizada em software.
            </p>
          </AnimateIn>

          {/* CTA buttons */}
          <AnimateIn delay={320} duration={600}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-red hover:bg-red-dark text-white font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(230,51,41,0.3)] active:scale-[0.98] cursor-pointer min-w-[180px] justify-center"
              >
                <LogIn className="h-4 w-4" />
                Acessar
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-transparent border border-border hover:border-red/40 hover:shadow-[0_0_12px_rgba(230,51,41,0.15)] text-text-primary font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 cursor-pointer min-w-[180px] justify-center"
              >
                <UserPlus className="h-4 w-4" />
                Criar acesso
              </button>
            </div>
          </AnimateIn>

          {/* Floating stat cards at bottom of hero */}
          <AnimateIn delay={440} duration={700}>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: 'Estações de trabalho', value: '5' },
                { label: 'Travas destruídas', value: '8' },
                { label: 'Níveis de enriquecimento', value: '3' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 border border-border rounded-xl px-5 py-3 bg-surface/60 backdrop-blur-sm"
                >
                  <span className="font-mono text-xl font-bold text-red">{stat.value}</span>
                  <span className="text-[12px] text-text-muted">{stat.label}</span>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-text-muted to-transparent" />
        </div>
      </section>

      <Divider />

      {/* ===================== O PROBLEMA ===================== */}
      <section className="py-20 md:py-24 bg-bg">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <div className="rounded-2xl bg-surface border border-border p-8 md:p-12 relative overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red/[0.04] blur-[80px] rounded-full pointer-events-none" />

              <div className="relative">
                <SectionLabel>O Problema</SectionLabel>
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">
                  Depender de um canal é uma trava.
                </h2>
                <div className="space-y-5 max-w-3xl">
                  <p className="text-text-secondary text-base md:text-lg leading-relaxed">
                    Toda unidade V4 conhece o LeadBroker. Funciona. Mas quando 100% da receita nova depende
                    de um canal que você não controla, você não tem operação comercial — tem esperança
                    gerenciada por terceiros.
                  </p>
                  <p className="text-text-secondary text-base md:text-lg leading-relaxed">
                    Prospecção outbound é um dos canais de maior rentabilidade no B2B. O OUTBILI
                    transforma isso em sistema.
                  </p>
                </div>

                {/* Tag */}
                <div className="mt-8">
                  <span className="inline-flex items-center bg-red/[0.15] text-[#FF6666] border border-red/30 rounded-full px-3 py-1 text-label font-semibold tracking-wider uppercase">
                    Canal próprio. Receita própria.
                  </span>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      <Divider />

      {/* ===================== LINHA DE MONTAGEM ===================== */}
      <section className="py-20 md:py-24 bg-surface/30">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>A Linha de Montagem</SectionLabel>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              5 estações. Zero improvisação.
            </h2>
            <p className="text-text-muted text-base mb-12">
              Cada estação entrega um output específico que alimenta a próxima.
            </p>
          </AnimateIn>

          {/* Desktop: horizontal row */}
          <div className="hidden md:flex items-stretch gap-2">
            {STATIONS.map((step, i, arr) => (
              <div key={step.num} className="flex items-stretch gap-2 flex-1">
                <AnimateIn delay={i * 80} className="flex-1">
                  <div className="group flex-1 h-full rounded-xl bg-surface border border-border hover:border-red/40 hover:shadow-[0_0_12px_rgba(230,51,41,0.15)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
                    {/* Red top bar accent */}
                    <div className="h-1 bg-red w-full" />
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xl font-bold text-red/30">{step.num}</span>
                        <div className="w-9 h-9 rounded-lg bg-red/10 flex items-center justify-center group-hover:bg-red/20 transition-colors">
                          <step.icon className="h-4 w-4 text-red" />
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-text-primary">{step.name}</p>
                      <p className="text-[12px] text-text-muted leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </AnimateIn>
                {i < arr.length - 1 && (
                  <div className="flex items-center flex-shrink-0 self-center mt-1">
                    <ArrowRight className="h-4 w-4 text-text-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: stacked */}
          <div className="md:hidden space-y-3">
            {STATIONS.map((step, i) => (
              <AnimateIn key={step.num} delay={i * 60}>
                <div className="group rounded-xl bg-surface border border-border hover:border-red/40 hover:shadow-[0_0_12px_rgba(230,51,41,0.15)] transition-all duration-300 relative overflow-hidden">
                  <div className="h-1 bg-red w-full" />
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <step.icon className="h-4 w-4 text-red" />
                    </div>
                    <div>
                      <p className="font-mono text-label text-red/40 mb-1">{step.num}</p>
                      <p className="font-semibold text-sm text-text-primary">{step.name}</p>
                      <p className="text-[12px] text-text-muted mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ===================== AS 8 TRAVAS ===================== */}
      <section className="py-20 md:py-24 bg-bg">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>As 8 Travas</SectionLabel>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              Cada funcionalidade destranca uma trava.
            </h2>
            <p className="text-text-muted text-base mb-12">
              Identificamos os 8 pontos de travamento do outbound e construímos uma solução para cada um.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRAPS.map((trap, i) => (
              <AnimateIn key={trap.code} delay={i * 60}>
                <div
                  className={[
                    'group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 h-full flex flex-col',
                    trap.highlight
                      ? 'bg-gradient-to-b from-red/[0.12] to-red/[0.04] border-red/50 hover:border-red hover:shadow-[0_0_30px_rgba(230,51,41,0.25)]'
                      : 'bg-surface-md border-border hover:border-red/40 hover:shadow-[0_0_16px_rgba(230,51,41,0.12)]',
                  ].join(' ')}
                >
                  {/* Red top accent bar */}
                  <div className={trap.highlight ? 'h-1 bg-red' : 'h-0.5 bg-red/30 group-hover:bg-red/60 transition-colors'} />

                  <div className="p-6 flex flex-col flex-1 gap-4">
                    {/* Code badge */}
                    <div className="flex items-center justify-between">
                      <div className={[
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        trap.highlight ? 'bg-red/25 ring-1 ring-red/40' : 'bg-white/[0.06] group-hover:bg-red/15 transition-colors',
                      ].join(' ')}>
                        <span className={[
                          'font-mono text-sm font-bold',
                          trap.highlight ? 'text-red' : 'text-text-secondary group-hover:text-red transition-colors',
                        ].join(' ')}>
                          {trap.code}
                        </span>
                      </div>
                      {trap.highlight && (
                        <Shield className="h-4 w-4 text-red animate-pulse" />
                      )}
                    </div>

                    {/* Name */}
                    <h3 className={[
                      'font-heading font-bold text-base',
                      trap.highlight ? 'text-white' : 'text-text-primary',
                    ].join(' ')}>
                      {trap.name}
                    </h3>

                    {/* Solution */}
                    <p className={[
                      'text-[13px] leading-relaxed flex-1',
                      trap.highlight ? 'text-text-secondary' : 'text-text-muted',
                    ].join(' ')}>
                      {trap.solution}
                    </p>

                    {/* Critical badge */}
                    {trap.highlight && (
                      <span className="inline-flex items-center self-start bg-red/20 text-red border border-red/40 rounded-full px-3 py-1 text-caption font-bold tracking-wider uppercase">
                        Trava crítica
                      </span>
                    )}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ===================== O MECANISMO ===================== */}
      <section className="py-20 md:py-24 bg-surface/30">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>O Mecanismo</SectionLabel>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              O WhatsApp do dono. Não o email do estagiário.
            </h2>
            <p className="text-text-muted text-base mb-12">
              Duas fontes de dados. Um pipeline. Zero improvisação.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CNPJa card — exec-box pattern: 4px red left border */}
            <AnimateIn delay={0}>
              <div className="group rounded-2xl bg-surface border border-border hover:border-red/40 hover:shadow-[0_0_12px_rgba(230,51,41,0.15)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden h-full">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red" />
                <div className="p-7 pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red/10 flex items-center justify-center group-hover:bg-red/20 transition-colors">
                      <Database className="h-5 w-5 text-red" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">CNPJa API</h3>
                      <span className="text-caption font-mono text-text-muted">Fonte cadastral</span>
                    </div>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Fonte única de dados cadastrais. CNPJ, sócios, QSA, endereço, atividades.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['CNPJ', 'QSA', 'Sócios', 'Endereço', 'CNAE'].map((tag) => (
                      <span
                        key={tag}
                        className="bg-red/[0.10] text-[#FF6666] border border-red/20 rounded-full px-2.5 py-0.5 text-caption font-semibold tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateIn>

            {/* Assertiva card — exec-box pattern */}
            <AnimateIn delay={80}>
              <div className="group rounded-2xl bg-surface border border-border hover:border-red/40 hover:shadow-[0_0_12px_rgba(230,51,41,0.15)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden h-full">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red" />
                <div className="p-7 pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red/10 flex items-center justify-center group-hover:bg-red/20 transition-colors">
                      <Target className="h-5 w-5 text-red" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Assertiva Localize</h3>
                      <span className="text-caption font-mono text-text-muted">Enriquecimento em cascata</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { level: 'Nível 1', desc: 'Telefones da empresa' },
                      { level: 'Nível 2', desc: 'Telefones dos decisores' },
                      { level: 'Nível 3', desc: 'WhatsApp pessoal do administrador' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-red" />
                        </div>
                        <div>
                          <span className="text-label font-mono text-red/60">{item.level}: </span>
                          <span className="text-sm text-text-secondary">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      <Divider />

      {/* ===================== O COMPROMISSO ===================== */}
      <section className="py-20 md:py-24 bg-bg">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <div className="rounded-2xl bg-surface border border-border p-8 md:p-12 relative overflow-hidden">
              {/* Inner ambient */}
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-red/[0.04] blur-[100px] rounded-full pointer-events-none" />

              <div className="relative">
                <SectionLabel>O Compromisso</SectionLabel>
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
                  5 regras de quem opera o OUTBILI.
                </h2>
                <p className="text-text-muted text-base mb-10 max-w-2xl">
                  Essas não são sugestões — são os princípios que garantem que cada hora investida no sistema gere resultado real.
                </p>
                <ol className="space-y-1">
                  {RULES.map((item, i) => (
                    <AnimateIn key={i} delay={i * 70}>
                      <li className="group rounded-xl p-5 hover:bg-white/[0.02] transition-all duration-300">
                        <div className="flex gap-5">
                          {/* Number */}
                          <span className="font-mono text-3xl font-bold text-red/25 w-10 flex-shrink-0 leading-none group-hover:text-red/50 transition-colors mt-1">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 space-y-2">
                            {/* Rule title */}
                            <h3 className="text-text-primary font-heading font-bold text-lg group-hover:text-white transition-colors">
                              {item.rule}
                            </h3>
                            {/* Context explanation */}
                            <p className="text-text-muted text-sm leading-relaxed">
                              {item.context}
                            </p>
                          </div>
                        </div>
                        {/* Subtle bottom line */}
                        {i < RULES.length - 1 && (
                          <div className="mt-5 ml-15 border-b border-border/50 group-hover:border-red/15 transition-colors" />
                        )}
                      </li>
                    </AnimateIn>
                  ))}
                </ol>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      <Divider />

      {/* ===================== CTA FINAL ===================== */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(230,51,41,0.07), transparent)',
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red/[0.05] blur-[120px] rounded-full pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(244,244,245,1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,244,245,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <AnimateIn>
            <SectionLabel>
              <span className="mx-auto">A decisão</span>
            </SectionLabel>
          </AnimateIn>

          <AnimateIn delay={80}>
            <blockquote
              className="font-heading font-bold text-text-secondary leading-tight max-w-3xl mx-auto mb-6"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}
            >
              "A maioria das empresas não tem problema de mercado. Tem problema de sistema de receita.
              Nós resolvemos o nosso."
            </blockquote>
          </AnimateIn>

          <AnimateIn delay={160}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-9 py-4 rounded-xl bg-red hover:bg-red-dark text-white font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(230,51,41,0.3)] active:scale-[0.98] cursor-pointer min-w-[220px] justify-center"
              >
                <LogIn className="h-4 w-4" />
                Acessar como usuário
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-9 py-4 rounded-xl bg-transparent border border-border hover:border-red/40 hover:shadow-[0_0_12px_rgba(230,51,41,0.15)] text-text-primary font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 cursor-pointer min-w-[220px] justify-center"
              >
                <UserPlus className="h-4 w-4" />
                Solicitar acesso
              </button>
            </div>
          </AnimateIn>

          <AnimateIn delay={320}>
            <img src="/outbili/logo-white.png" alt="V4 Bilinski &amp; Co" className="h-16 md:h-20 w-auto mx-auto mb-4 opacity-60" />
            <p className="text-label text-text-muted tracking-[0.15em] uppercase">
              OUTBILI — Sistema de inteligência comercial
            </p>
          </AnimateIn>
        </div>
      </section>

    </div>
  )
}
