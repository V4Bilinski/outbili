import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useEffect } from 'react'
import { MotionConfig, useReducedMotion } from 'framer-motion'
import { Search, Database, Filter, Brain, Send, ArrowRight, Shield, Target, CheckCircle, LogIn, UserPlus, Zap, BarChart3, Clock, Rocket } from 'lucide-react'
import { AnimateIn } from '../components/ui/AnimateIn'
import { StaggerLetters } from '../components/animations/aiox'
import { InstitucionalNav } from '../components/layout/InstitucionalNav'
import { useTheme } from '../lib/theme-context'
import { Beam, OrbBackground, Counter } from '../components/institucional/effects'

// Section label pattern: pulsing dot + bold red label with glow
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 bg-red/[0.12] border border-red/30 rounded-full px-3.5 py-1.5 mb-5 shadow-[0_0_16px_rgba(230,51,41,0.18)]">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red" />
      </span>
      <span className="text-label font-bold tracking-[0.18em] uppercase text-[#FF6666]">
        {children}
      </span>
    </div>
  )
}

// Premium divider with center accent
function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-2">
      <div className="relative h-[1px] bg-gradient-to-r from-transparent via-red/40 to-transparent">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red shadow-[0_0_12px_rgba(230,51,41,0.6)]" />
      </div>
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
    rule: 'Não pesquisar sem qualificar.',
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

const ONBOARDING_STEPS = [
  {
    n: '01',
    tag: 'Cadastro',
    title: 'Crie seu acesso',
    desc: 'Entre com e-mail corporativo, defina senha e escolha o time de prospecção que vai operar a conta.',
    time: '2 min',
  },
  {
    n: '02',
    tag: 'Configuração',
    title: 'Defina o ICP do canal',
    desc: 'Selecione segmento, porte, região e faturamento. O sistema usa esses filtros para puxar empresas da base.',
    time: '5 min',
  },
  {
    n: '03',
    tag: 'Operação',
    title: 'Cole o CNPJ ou rode em lote',
    desc: 'Insira um CNPJ ou suba uma lista. As 5 etapas executam pesquisa, enriquecimento, qualificação e inteligência.',
    time: '3 min',
  },
  {
    n: '04',
    tag: 'Prospecção',
    title: 'Receba o WhatsApp do dono',
    desc: 'Contato do decisor entregue com score, contexto e gancho de abertura prontos para o primeiro toque.',
    time: 'instantâneo',
  },
]

const BEST_PRACTICES = [
  {
    icon: Target,
    title: 'ICP estreito vence volume',
    desc: 'Filtros bem calibrados entregam menos contatos, com taxa de conversão muito maior por toque.',
  },
  {
    icon: Zap,
    title: 'Aborde no mesmo dia',
    desc: 'Decisor recém-enriquecido converte mais. Quanto antes o primeiro toque, maior a janela de resposta.',
  },
  {
    icon: BarChart3,
    title: 'Cadência medida sempre melhora',
    desc: 'Acompanhe taxa por etapa, ajuste o ICP semanalmente e calibre o canal com base em dados reais.',
  },
]

export function InstitucionalPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? 'always' : 'never'}>
    <div className="min-h-screen bg-bg text-text-primary overflow-x-hidden">

      <InstitucionalNav />

      {/* ===================== HERO ===================== */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden scroll-mt-20">

        {/* Beam de luz cônico no topo (efeito notio portado, vermelho da marca) */}
        <Beam className="top-0" />

        {/* Orbe ambiente difuso atrás da headline (efeito notio portado) */}
        <OrbBackground className="top-[38%] left-1/2 -translate-x-1/2 w-[42rem] h-[42rem]" />

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
            <img src={theme === 'light' ? '/outbili/logo-black.png' : '/outbili/logo-white.png'} alt="V4 Bilinski &amp; Co" className="h-14 md:h-16 w-auto mx-auto mb-10 opacity-90" />
          </AnimateIn>

          {/* Hero badge — padrão benchmark com glow pulsante */}
          <AnimateIn delay={40} duration={600}>
            <div className="inline-flex items-center gap-3 bg-red/[0.18] border border-red/40 rounded-full px-5 py-2 mb-8 shadow-[0_0_24px_rgba(230,51,41,0.3)] animate-pulse-glow">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red" />
              </span>
              <span className="text-label uppercase tracking-[0.18em] text-[#FF6666] font-bold">
                Sistema de inteligência comercial
              </span>
            </div>
          </AnimateIn>

          {/* Headline com gradient text original */}
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
              className="font-heading font-extrabold tracking-tight leading-none text-text-primary mb-8 whitespace-nowrap"
              style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.5rem)' }}
            >
              Sem lista fria. Sem achismo. Sem trava.
            </h2>
          </AnimateIn>

          <AnimateIn delay={240} duration={600}>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
              O motor de receita outbound da V4 Bilinski &amp; Co.
            </p>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Fábrica de Receita, dentro de um pipeline.
            </p>
          </AnimateIn>

          {/* CTA buttons — glow constante + ring */}
          <AnimateIn delay={320} duration={600}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/login')}
                className="group relative flex items-center gap-2 px-8 py-4 rounded-xl bg-red hover:bg-red-vivid text-white font-bold text-sm transition-all duration-300 shadow-[0_0_24px_rgba(230,51,41,0.4)] hover:shadow-[0_0_40px_rgba(230,51,41,0.6)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-w-[200px] justify-center ring-1 ring-red/30 hover:ring-red/60"
              >
                <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                Acessar
              </button>
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-surface/40 backdrop-blur-sm border border-red/30 hover:border-red/60 text-text-primary font-bold text-sm transition-all duration-300 shadow-[0_0_16px_rgba(230,51,41,0.12)] hover:shadow-[0_0_28px_rgba(230,51,41,0.3)] hover:-translate-y-0.5 hover:bg-surface/70 active:scale-[0.98] cursor-pointer min-w-[200px] justify-center"
              >
                <UserPlus className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Criar acesso
              </button>
            </div>
          </AnimateIn>

          {/* Floating stat cards at bottom of hero — animated stagger + hover glow */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Etapas do funil', value: 5 },
              { label: 'Travas destruídas', value: 8 },
              { label: 'Níveis até o decisor', value: 3 },
            ].map((stat, i) => (
              <AnimateIn key={stat.label} delay={440 + i * 90} duration={600}>
                <div
                  className="group flex items-center gap-3 border border-border rounded-xl px-5 py-3 bg-surface/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-red/50 hover:bg-surface/80 hover:shadow-[0_0_24px_rgba(230,51,41,0.25)] cursor-default"
                >
                  <span className="font-mono text-xl font-bold text-red animate-pulse-glow group-hover:text-red-vivid transition-colors">
                    <Counter value={stat.value} duration={1.6} />
                  </span>
                  <span className="text-[12px] text-text-secondary group-hover:text-text-primary transition-colors">
                    {stat.label}
                  </span>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-text-muted to-transparent" />
        </div>
      </section>

      <Divider />

      {/* ===================== O PROBLEMA ===================== */}
      <section id="problema" className="py-20 md:py-24 bg-bg scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <div className="group rounded-2xl bg-surface border border-border hover:border-red/40 p-8 md:p-12 relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(230,51,41,0.18)] hover:-translate-y-0.5">
              {/* Inner glow — mais vibrante e animado */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-red/[0.08] blur-[80px] rounded-full pointer-events-none animate-pulse-glow" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-red/[0.05] blur-[60px] rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <SectionLabel>O Problema</SectionLabel>
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8 text-text-primary">
                  Depender de um canal é uma trava.
                </h2>
                <div className="space-y-5 max-w-3xl">
                  <p className="text-text-primary text-base md:text-lg leading-relaxed">
                    Toda unidade V4 conhece o LeadBroker. Funciona. Mas quando 100% da receita nova depende
                    de um canal que você não controla, você não tem operação comercial. Tem esperança
                    gerenciada por terceiros.
                  </p>
                  <p className="text-text-primary text-base md:text-lg leading-relaxed">
                    Prospecção outbound é um dos canais de maior rentabilidade no B2B. O OUTBILI
                    vira sua cota mensal.
                  </p>
                </div>

                {/* Tag — brilho pulsante */}
                <div className="mt-8">
                  <span className="inline-flex items-center gap-2 bg-red/[0.18] text-[#FF6666] border border-red/40 rounded-full px-4 py-1.5 text-label font-bold tracking-wider uppercase animate-pulse-glow shadow-[0_0_16px_rgba(230,51,41,0.25)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-70" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
                    </span>
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
      <section id="montagem" className="py-20 md:py-24 bg-surface/30 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>O Funil</SectionLabel>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              5 etapas. Zero improvisação.
            </h2>
            <p className="text-text-muted text-base mb-12">
              Cada etapa entrega um lead mais quente que a anterior.
            </p>
          </AnimateIn>

          {/* Desktop: horizontal row */}
          <div className="hidden md:flex items-stretch gap-2">
            {STATIONS.map((step, i, arr) => (
              <div key={step.num} className="flex items-stretch gap-2 flex-1">
                <AnimateIn delay={i * 80} className="flex-1">
                  <div className="group flex-1 h-full rounded-xl bg-surface border border-red/15 hover:border-red/60 shadow-[0_0_12px_rgba(230,51,41,0.08)] hover:shadow-[0_0_28px_rgba(230,51,41,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] relative overflow-hidden cursor-default">
                    {/* Red top bar accent — pulsa no hover */}
                    <div className="h-1 bg-red w-full group-hover:animate-pulse" />
                    <div className="absolute inset-0 bg-red/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xl font-extrabold text-red/40 group-hover:text-red transition-colors">{step.num}</span>
                        <div className="w-10 h-10 rounded-lg bg-red/15 ring-1 ring-red/20 flex items-center justify-center group-hover:bg-red/30 group-hover:ring-red/50 group-hover:scale-110 transition-all duration-300 shadow-[0_0_12px_rgba(230,51,41,0.15)]">
                          <step.icon className="h-5 w-5 text-red" />
                        </div>
                      </div>
                      <p className="font-extrabold text-sm text-text-primary">{step.name}</p>
                      <p className="text-[12px] text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </AnimateIn>
                {i < arr.length - 1 && (
                  <div className="flex items-center flex-shrink-0 self-center mt-1">
                    <ArrowRight className="h-4 w-4 text-red/60 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: stacked */}
          <div className="md:hidden space-y-3">
            {STATIONS.map((step, i) => (
              <AnimateIn key={step.num} delay={i * 60}>
                <div className="group rounded-xl bg-surface border border-red/15 hover:border-red/60 shadow-[0_0_12px_rgba(230,51,41,0.08)] hover:shadow-[0_0_24px_rgba(230,51,41,0.25)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                  <div className="h-1 bg-red w-full" />
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red/15 ring-1 ring-red/20 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_12px_rgba(230,51,41,0.15)]">
                      <step.icon className="h-5 w-5 text-red" />
                    </div>
                    <div>
                      <p className="font-mono text-label font-extrabold text-red/60 mb-1">{step.num}</p>
                      <p className="font-extrabold text-sm text-text-primary">{step.name}</p>
                      <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{step.desc}</p>
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
      <section id="travas" className="py-20 md:py-24 bg-bg scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>Travas</SectionLabel>
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
                    'group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] h-full flex flex-col cursor-default',
                    trap.highlight
                      ? 'bg-gradient-to-b from-red/[0.18] to-red/[0.06] border-red/60 hover:border-red shadow-[0_0_24px_rgba(230,51,41,0.2)] hover:shadow-[0_0_44px_rgba(230,51,41,0.4)] animate-pulse-glow'
                      : 'bg-surface-md border-border hover:border-red/50 hover:shadow-[0_0_24px_rgba(230,51,41,0.18)]',
                  ].join(' ')}
                >
                  {/* Red top accent bar */}
                  <div className={trap.highlight ? 'h-1 bg-red animate-pulse' : 'h-0.5 bg-red/30 group-hover:bg-red/70 transition-colors duration-300'} />

                  {/* Inner ambient glow on hover */}
                  <div className="absolute inset-0 bg-red/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative p-6 flex flex-col flex-1 gap-4">
                    {/* Code badge */}
                    <div className="flex items-center justify-between">
                      <div className={[
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110',
                        trap.highlight ? 'bg-red/30 ring-2 ring-red/50' : 'bg-elevated-3 group-hover:bg-red/20 group-hover:ring-1 group-hover:ring-red/30',
                      ].join(' ')}>
                        <span className={[
                          'font-mono text-sm font-bold transition-colors duration-300',
                          trap.highlight ? 'text-red' : 'text-text-secondary group-hover:text-red',
                        ].join(' ')}>
                          {trap.code}
                        </span>
                      </div>
                      {trap.highlight && (
                        <Shield className="h-5 w-5 text-red animate-pulse drop-shadow-[0_0_8px_rgba(230,51,41,0.6)]" />
                      )}
                    </div>

                    {/* Name */}
                    <h3 className={[
                      'font-heading font-extrabold text-base tracking-tight',
                      trap.highlight ? 'text-text-primary' : 'text-text-primary group-hover:text-text-primary transition-colors',
                    ].join(' ')}>
                      {trap.name}
                    </h3>

                    {/* Solution */}
                    <p className={[
                      'text-[13px] leading-relaxed flex-1 transition-colors duration-300',
                      trap.highlight ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary',
                    ].join(' ')}>
                      {trap.solution}
                    </p>

                    {/* Critical badge — brilho pulsante */}
                    {trap.highlight && (
                      <span className="inline-flex items-center gap-1.5 self-start bg-red/25 text-red border border-red/50 rounded-full px-3 py-1 text-caption font-bold tracking-wider uppercase shadow-[0_0_16px_rgba(230,51,41,0.35)]">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red" />
                        </span>
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
      <section id="mecanismo" className="py-20 md:py-24 bg-surface/30 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>As Fontes</SectionLabel>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              O WhatsApp do dono. Não o email do estagiário.
            </h2>
            <p className="text-text-muted text-base mb-12">
              Duas fontes de dados. Um pipeline. Zero improvisação.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CNPJa card */}
            <AnimateIn delay={0}>
              <div className="group rounded-2xl bg-surface border border-red/20 hover:border-red/60 shadow-[0_0_16px_rgba(230,51,41,0.1)] hover:shadow-[0_0_32px_rgba(230,51,41,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] relative overflow-hidden h-full cursor-default">
                {/* Left accent bar — pulsa */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red shadow-[0_0_8px_rgba(230,51,41,0.6)] group-hover:w-1.5 transition-all" />
                {/* Inner ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-red/[0.03] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-red/[0.06] blur-[60px] rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-7 pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red/15 ring-1 ring-red/30 flex items-center justify-center group-hover:bg-red/30 group-hover:ring-red/60 group-hover:scale-110 transition-all duration-300 shadow-[0_0_16px_rgba(230,51,41,0.2)]">
                      <Database className="h-6 w-6 text-red" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-text-primary text-lg">CNPJa API</h3>
                      <span className="text-caption font-mono text-[#FF6666] uppercase tracking-wider font-bold">Fonte cadastral</span>
                    </div>
                  </div>
                  <p className="text-text-primary text-sm leading-relaxed">
                    Fonte única de dados cadastrais. CNPJ, sócios, QSA, endereço, atividades.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['CNPJ', 'QSA', 'Sócios', 'Endereço', 'CNAE'].map((tag) => (
                      <span
                        key={tag}
                        className="bg-red/[0.18] text-[#FF6666] border border-red/40 rounded-full px-3 py-1 text-caption font-bold tracking-wider shadow-[0_0_8px_rgba(230,51,41,0.15)] hover:bg-red/30 hover:border-red transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateIn>

            {/* Assertiva card */}
            <AnimateIn delay={80}>
              <div className="group rounded-2xl bg-surface border border-red/20 hover:border-red/60 shadow-[0_0_16px_rgba(230,51,41,0.1)] hover:shadow-[0_0_32px_rgba(230,51,41,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] relative overflow-hidden h-full cursor-default">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red shadow-[0_0_8px_rgba(230,51,41,0.6)] group-hover:w-1.5 transition-all" />
                <div className="absolute inset-0 bg-gradient-to-br from-red/[0.03] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-red/[0.06] blur-[60px] rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-7 pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red/15 ring-1 ring-red/30 flex items-center justify-center group-hover:bg-red/30 group-hover:ring-red/60 group-hover:scale-110 transition-all duration-300 shadow-[0_0_16px_rgba(230,51,41,0.2)]">
                      <Target className="h-6 w-6 text-red" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-text-primary text-lg">Assertiva Localize</h3>
                      <span className="text-caption font-mono text-[#FF6666] uppercase tracking-wider font-bold">Enriquecimento em cascata</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { level: 'Nível 1', desc: 'Telefones da empresa' },
                      { level: 'Nível 2', desc: 'Telefones dos decisores' },
                      { level: 'Nível 3', desc: 'WhatsApp pessoal do administrador' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 group/item">
                        <div className="w-6 h-6 rounded-full bg-red/20 ring-1 ring-red/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(230,51,41,0.2)] group-hover/item:scale-110 transition-transform">
                          <CheckCircle className="h-3.5 w-3.5 text-red" />
                        </div>
                        <div>
                          <span className="text-label font-mono font-bold text-[#FF6666] uppercase tracking-wider">{item.level}: </span>
                          <span className="text-sm text-text-primary">{item.desc}</span>
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

      {/* ===================== COMO COMEÇAR (ONBOARDING) ===================== */}
      <section id="como-comecar" className="py-20 md:py-24 bg-bg scroll-mt-20 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red/[0.05] blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-red/[0.04] blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6">
          <AnimateIn>
            <SectionLabel>Playbook</SectionLabel>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              Cole o CNPJ. O resto é sistema.
            </h2>
            <p className="text-text-primary text-base md:text-lg max-w-2xl mb-12 leading-relaxed">
              Você não precisa ser especialista em dados nem em prospecção. Abre, cola o CNPJ, recebe o contato. O funil faz o trabalho pesado por baixo.
            </p>
          </AnimateIn>

          {/* 4 Steps — timeline horizontal desktop, stack mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {ONBOARDING_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 80}>
                <div className="group relative h-full rounded-2xl bg-surface border border-red/15 hover:border-red/60 shadow-[0_0_16px_rgba(230,51,41,0.08)] hover:shadow-[0_0_32px_rgba(230,51,41,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] overflow-hidden cursor-default">
                  {/* Top accent bar — pulsa */}
                  <div className="h-1 bg-red w-full group-hover:animate-pulse" />
                  {/* Inner ambient on hover */}
                  <div className="absolute inset-0 bg-red/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative p-6 flex flex-col gap-4 h-full">
                    {/* Header: número grande + tempo */}
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-4xl font-extrabold text-red/40 group-hover:text-red transition-colors leading-none group-hover:drop-shadow-[0_0_12px_rgba(230,51,41,0.6)]">
                        {step.n}
                      </span>
                      <div className="flex items-center gap-1.5 bg-red/[0.12] border border-red/30 rounded-full px-2.5 py-1 shadow-[0_0_8px_rgba(230,51,41,0.15)]">
                        <Clock className="h-3 w-3 text-[#FF6666]" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF6666]">
                          {step.time}
                        </span>
                      </div>
                    </div>

                    {/* Tag */}
                    <span className="inline-flex w-fit text-[10px] font-bold uppercase tracking-[0.18em] text-red">
                      {step.tag}
                    </span>

                    {/* Title */}
                    <h3 className="font-heading font-extrabold text-lg text-text-primary tracking-tight">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed flex-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Best Practices */}
          <AnimateIn>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red/30 to-red/50" />
              <span className="text-label font-bold tracking-[0.18em] uppercase text-[#FF6666]">
                Boas práticas
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-red/50 via-red/30 to-transparent" />
            </div>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {BEST_PRACTICES.map((practice, i) => (
              <AnimateIn key={practice.title} delay={i * 90}>
                <div className="group h-full rounded-2xl bg-surface border border-red/20 hover:border-red/60 shadow-[0_0_12px_rgba(230,51,41,0.08)] hover:shadow-[0_0_28px_rgba(230,51,41,0.25)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col gap-4 cursor-default">
                  <div className="w-12 h-12 rounded-xl bg-red/15 ring-1 ring-red/30 flex items-center justify-center group-hover:bg-red/30 group-hover:ring-red/60 group-hover:scale-110 transition-all duration-300 shadow-[0_0_16px_rgba(230,51,41,0.2)]">
                    <practice.icon className="h-6 w-6 text-red" />
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-text-primary tracking-tight">
                    {practice.title}
                  </h3>
                  <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">
                    {practice.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Section CTA — glass card transparente */}
          <AnimateIn delay={200}>
            <div className="group relative rounded-2xl bg-red/[0.04] backdrop-blur-md border border-red/25 hover:border-red/50 shadow-[0_0_24px_rgba(230,51,41,0.12)] hover:shadow-[0_0_40px_rgba(230,51,41,0.25)] transition-all duration-500 overflow-hidden">
              {/* Inner ambient glow */}
              <div className="absolute -top-12 left-1/4 w-72 h-32 bg-red/[0.10] blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 right-1/4 w-64 h-28 bg-red/[0.08] blur-[50px] rounded-full pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5 p-6 md:p-8">
                <p className="text-text-primary text-sm md:text-base font-semibold text-center sm:text-left leading-relaxed lg:whitespace-nowrap">
                  Sem treinamento de semanas. Sem consultoria. Sem mistério.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="group/btn flex items-center gap-2 px-6 py-3 rounded-xl bg-red hover:bg-red-vivid text-white font-bold text-sm uppercase tracking-[0.1em] transition-all duration-300 shadow-[0_0_20px_rgba(230,51,41,0.4)] hover:shadow-[0_0_36px_rgba(230,51,41,0.6)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ring-1 ring-red/40 hover:ring-red flex-shrink-0"
                >
                  <Rocket className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
                  Começar a prospectar
                </button>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      <Divider />

      {/* ===================== O COMPROMISSO ===================== */}
      <section id="compromisso" className="py-20 md:py-24 bg-bg scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <div className="rounded-2xl bg-surface border border-border p-8 md:p-12 relative overflow-hidden">
              {/* Inner ambient */}
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-red/[0.04] blur-[100px] rounded-full pointer-events-none" />

              <div className="relative">
                <SectionLabel>O Compromisso</SectionLabel>
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
                  5 regras de quem vende com o OUTBILI.
                </h2>
                <p className="text-text-muted text-base mb-10 max-w-2xl">
                  Essas não são sugestões. São os princípios que garantem que cada hora investida no sistema gere resultado real.
                </p>
                <ol className="space-y-2">
                  {RULES.map((item, i) => (
                    <AnimateIn key={i} delay={i * 70}>
                      <li className="group rounded-xl p-5 hover:bg-red/[0.05] hover:border-red/30 border border-transparent transition-all duration-300 cursor-default">
                        <div className="flex gap-6">
                          {/* Number — maior + glow */}
                          <span className="font-mono text-4xl md:text-5xl font-extrabold text-red/40 w-14 flex-shrink-0 leading-none group-hover:text-red transition-colors mt-1 group-hover:drop-shadow-[0_0_12px_rgba(230,51,41,0.6)]">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 space-y-2">
                            {/* Rule title */}
                            <h3 className="text-text-primary font-heading font-extrabold text-lg md:text-xl tracking-tight">
                              {item.rule}
                            </h3>
                            {/* Context explanation */}
                            <p className="text-text-secondary group-hover:text-text-primary text-sm leading-relaxed transition-colors">
                              {item.context}
                            </p>
                          </div>
                        </div>
                        {/* Bottom divider — gradient red on hover */}
                        {i < RULES.length - 1 && (
                          <div className="mt-5 ml-20 h-px bg-gradient-to-r from-border/50 to-transparent group-hover:from-red/40 transition-colors" />
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
            <div className="flex justify-center">
              <SectionLabel>A decisão</SectionLabel>
            </div>
          </AnimateIn>

          {/* Signature animada — Stagger Letters (AIOX brandbook adapted) */}
          <div className="flex justify-center mb-8" aria-hidden="true">
            <StaggerLetters
              text="FECHE"
              fontSize="clamp(1.75rem, 4vw, 3rem)"
              underline
            />
          </div>

          <AnimateIn delay={80}>
            <blockquote
              className="font-heading font-extrabold text-text-primary leading-tight max-w-3xl mx-auto mb-6"
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
                className="group relative flex items-center gap-2 px-9 py-4 rounded-xl bg-red hover:bg-red-vivid text-white font-bold text-sm transition-all duration-300 shadow-[0_0_28px_rgba(230,51,41,0.45)] hover:shadow-[0_0_44px_rgba(230,51,41,0.65)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-w-[240px] justify-center ring-1 ring-red/40 hover:ring-red"
              >
                <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                Entrar
              </button>
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center gap-2 px-9 py-4 rounded-xl bg-surface/40 backdrop-blur-sm border border-red/30 hover:border-red/60 text-text-primary font-bold text-sm transition-all duration-300 shadow-[0_0_16px_rgba(230,51,41,0.12)] hover:shadow-[0_0_28px_rgba(230,51,41,0.3)] hover:-translate-y-0.5 hover:bg-surface/70 active:scale-[0.98] cursor-pointer min-w-[240px] justify-center"
              >
                <UserPlus className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Solicitar acesso
              </button>
            </div>
          </AnimateIn>

          <AnimateIn delay={320}>
            <img src="/outbili/logo-white.png" alt="V4 Bilinski &amp; Co" className="h-16 md:h-20 w-auto mx-auto mb-4 opacity-60" />
            <p className="text-label text-text-muted tracking-[0.15em] uppercase">
              OUTBILI · Sistema de inteligência comercial
            </p>
          </AnimateIn>
        </div>
      </section>

    </div>
    </MotionConfig>
  )
}
