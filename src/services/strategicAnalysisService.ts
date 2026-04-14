import type { Lead, TravaDetectada, ProjecaoCompetitiva, PlaybookBDR } from '../types'
import { COMPETITIVE_DIMENSIONS, computeLeadDimensions, buildCanonicalCompetitiveJson } from '../lib/competitive'
import type { DimensionLevel } from '../lib/competitive'

// =============================================
// Strategic Analysis Generator
// Generates personalized business intelligence
// from enrichment data for each lead
// =============================================

interface StrategicAnalysis {
  hypotheticalTrap: string
  discoveryQuestions: string // JSON string[]
  eligibilityChecklist: string // JSON {label,value}[]
  meetingPrep: string // JSON {agenda,objecoes,checklist}
  salesArguments: string // JSON {eixo,argumento,objecao,resposta,impactoROI}[]
  vulnerabilities: string // JSON {titulo,impacto,descricao,impactoFinanceiro}[]
  competitiveAnalysis: string // JSON
  projectionData: string // JSON
  productPortfolio: string
}

// --- Trap Detection (data-driven) ---
function detectTrap(lead: Partial<Lead>): string {
  const hasWebsite = !!lead.website
  const hasInstagram = !!lead.instagram
  const lowRating = (lead.googleRating || 0) < 3.5
  const fewReviews = (lead.googleReviewsCount || 0) < 15
  const noDigital = !hasWebsite && !hasInstagram
  const lowFollowers = (lead.instagramFollowers || 0) < 500
  const highRevenue = (lead.monthlyRevenue || 0) >= 200000 || (lead.capitalSocial || 0) >= 300000
  const lowEmployees = (lead.employees || 0) < 10 && (lead.employees || 0) > 0
  const segment = (lead.segment || '').toLowerCase()

  if (noDigital) return `T1 - Aquisição de clientes: ${lead.companyName} sem presença digital estruturada`
  if (lowRating && fewReviews) return `T2 - Conversão de vendas: ${lead.companyName} com rating ${lead.googleRating || 'N/A'}/5 e apenas ${lead.googleReviewsCount || 0} avaliações`
  if (hasInstagram && lowFollowers) return `T6 - Posicionamento de marca: ${lead.companyName} com apenas ${lead.instagramFollowers || 0} seguidores`
  if (highRevenue && lowEmployees) return `T7 - Escalabilidade: ${lead.companyName} fatura alto mas equipe enxuta (${lead.employees || '?'} func.)`
  if (!hasWebsite && hasInstagram) return `T8 - Dependência de canal: ${lead.companyName} depende exclusivamente do Instagram`
  if (!lead.inpiHasRegisteredTrademark && highRevenue) return `T5 - Margem operacional: ${lead.companyName} sem marca registrada no INPI`
  if (segment.includes('odonto') || segment.includes('estetic') || segment.includes('saude'))
    return `T4 - Recorrência: ${lead.companyName} no segmento ${lead.segment} precisa de estratégia de retenção`
  return `T1 - Aquisição de clientes: ${lead.companyName} precisa de estratégia de geração de demanda`
}

// --- Discovery Questions (personalized) ---
function generateDiscoveryQuestions(lead: Partial<Lead>): string[] {
  const questions: string[] = []
  const segment = (lead.segment || 'varejo').toLowerCase()
  const name = lead.companyName || 'a empresa'
  const revenue = lead.monthlyRevenue || 0
  const rating = lead.googleRating || 0
  const reviews = lead.googleReviewsCount || 0
  const followers = lead.instagramFollowers || 0
  const employees = lead.employees || 0
  const hasWebsite = !!lead.website

  // Revenue-based
  if (revenue > 0) {
    questions.push(`Com faturamento estimado de R$ ${Math.round(revenue / 1000)}k/mês, qual porcentagem ${name} investe atualmente em marketing e aquisição de clientes?`)
  } else {
    questions.push(`Qual é o investimento mensal atual de ${name} em marketing e aquisição de novos clientes?`)
  }

  // Digital presence-based
  if (!hasWebsite) {
    questions.push(`${name} não possui website próprio. Como os clientes encontram vocês hoje? A maioria vem por indicação, redes sociais ou outra fonte?`)
  } else if (rating > 0 && rating < 4.0) {
    questions.push(`${name} tem nota ${rating}/5 no Google com ${reviews} avaliações. Vocês tem alguma estratégia para melhorar a reputação online e responder avaliações negativas?`)
  } else if (rating >= 4.5) {
    questions.push(`${name} tem excelente nota ${rating}/5 no Google. Como vocês aproveitam essa reputação para converter mais clientes que pesquisam online?`)
  }

  // Social media-based
  if (followers > 0 && followers < 1000) {
    questions.push(`Com ${followers} seguidores no Instagram, qual é a taxa de conversão atual de seguidores em clientes reais? Vocês medem isso?`)
  } else if (followers >= 5000) {
    questions.push(`Com ${followers.toLocaleString('pt-BR')} seguidores, qual porcentagem do faturamento de ${name} vem diretamente do Instagram?`)
  } else if (!lead.instagram) {
    questions.push(`${name} não tem perfil no Instagram. Como vocês se posicionam frente a concorrentes que estão ativos nas redes sociais?`)
  }

  // Segment-specific
  if (segment.includes('odonto') || segment.includes('dental')) {
    questions.push(`Quantos pacientes novos ${name} recebe por mês? E qual a taxa de retorno para manutenção sem precisar ligar?`)
  } else if (segment.includes('estetic') || segment.includes('beleza')) {
    questions.push(`Qual procedimento tem a maior margem em ${name}? E qual a recorrência média dos clientes?`)
  } else if (segment.includes('pet') || segment.includes('animal')) {
    questions.push(`Qual o ticket médio por cliente em ${name}? E quantos voltam mensalmente para banho/tosa ou ração?`)
  } else if (segment.includes('varejo') || segment.includes('comércio')) {
    questions.push(`Se um concorrente abrisse ao lado oferecendo 20% de desconto, como ${name} protegeria sua base de clientes?`)
  } else {
    questions.push(`Qual é o maior desafio de ${name} hoje para crescer: atrair novos clientes, reter os atuais, ou aumentar o ticket médio?`)
  }

  // Team/scale-based
  if (employees > 0 && employees < 10) {
    questions.push(`Com uma equipe de ${employees} pessoas, quais processos de ${name} você gostaria de automatizar para liberar tempo para crescer?`)
  } else if (employees >= 20) {
    questions.push(`Com ${employees} funcionários, como ${name} mede a produtividade da equipe e identifica gargalos operacionais?`)
  } else {
    questions.push(`Se você pudesse resolver apenas um problema de ${name} nos próximos 90 dias, qual seria e por que?`)
  }

  return questions.slice(0, 5)
}

// --- Eligibility Checklist ---
function generateEligibilityChecklist(lead: Partial<Lead>): Array<{ label: string; value: boolean }> {
  const revenue = lead.monthlyRevenue || 0
  const score = lead.score || 0
  const hasContact = !!(lead.rfPhone || lead.rfEmail)

  return [
    { label: `Faturamento acima de R$50k/mês`, value: revenue >= 50000 || revenue === 0 },
    { label: `Decisor identificado com contato`, value: hasContact },
    { label: `Empresa ativa na Receita Federal`, value: lead.registrationStatus === 'Ativa' || !lead.registrationStatus },
    { label: `Score SPICED >= 2.5`, value: score >= 2.5 || score === 0 },
    { label: `Segmento compatível com ICP`, value: !!lead.segment },
    { label: `Presença digital mapeada`, value: !!(lead.website || lead.instagram || lead.linkedin) },
    { label: `Localização identificada`, value: !!(lead.city && lead.state) },
  ]
}

// --- Meeting Prep ---
function generateMeetingPrep(lead: Partial<Lead>): { agenda: Array<{ minutos: string; objetivo: string; script: string }>; objecoes: Array<{ objecao: string; resposta: string }>; checklist: string[] } {
  const name = lead.companyName || 'a empresa'
  const segment = lead.segment || 'o segmento'
  const rating = lead.googleRating || 0
  const reviews = lead.googleReviewsCount || 0
  const followers = lead.instagramFollowers || 0
  const revenue = lead.monthlyRevenue || 0
  const partners = lead.partners ? JSON.parse(lead.partners) : []
  const decisor = partners[0]?.nome || 'o decisor'

  return {
    agenda: [
      { minutos: '0-5', objetivo: 'Rapport e contexto', script: `Cumprimentar ${decisor}. Mencionar que analisamos ${name} e identificamos oportunidades específicas para ${segment}.` },
      { minutos: '5-15', objetivo: 'Diagnóstico atual', script: `Perguntar sobre desafios atuais.${rating > 0 ? ` Mencionar nota ${rating}/5 no Google (${reviews} avaliações) como ponto de partida.` : ''}${followers > 0 ? ` Comentar sobre os ${followers} seguidores no Instagram.` : ''}` },
      { minutos: '15-25', objetivo: 'Dores e impacto', script: `Aprofundar nas dores identificadas. Quantificar: "Se ${name} conseguisse X, qual seria o impacto no faturamento${revenue > 0 ? ` de R$ ${Math.round(revenue / 1000)}k/mês` : ''}?"` },
      { minutos: '25-35', objetivo: 'Solução e diferencial', script: `Apresentar como a V4 resolve essas dores especificamente para ${segment}. Mostrar cases similares.` },
      { minutos: '35-45', objetivo: 'Próximos passos', script: `Proposta de parceria. Definir timeline e expectativas. Agendar follow-up com ${decisor}.` },
    ],
    objecoes: [
      { objecao: 'Já trabalhamos com uma agência', resposta: `Entendo. A questão não é trocar, mas complementar. Analisando ${name}, vimos gaps específicos${!lead.website ? ' como falta de website' : rating < 4 ? ` como nota ${rating}/5 no Google` : ''} que talvez não estejam sendo endereçados.` },
      { objecao: 'Está caro / Não tenho orçamento', resposta: `${revenue > 0 ? `Com faturamento de R$ ${Math.round(revenue / 1000)}k/mês, o investimento se paga em X meses.` : 'O investimento se paga quando medimos o retorno por cliente adquirido.'} A pergunta é: quanto custa NÃO investir?` },
      { objecao: 'Preciso pensar / Vou avaliar', resposta: `Claro, ${decisor}. Enquanto avalia, posso enviar uma projeção personalizada de ${name} mostrando o ROI esperado em 90 dias?` },
    ],
    checklist: [
      `Revisar dados de ${name} no Outbili antes da reunião`,
      `Preparar proposta personalizada para ${segment}`,
      partners.length > 0 ? `Verificar perfil LinkedIn de ${decisor}` : 'Identificar decisor no LinkedIn',
      `Separar cases de sucesso do segmento ${segment}`,
      `Testar link de reunião e gravar se possível`,
    ],
  }
}

// --- Sales Arguments ---
function generateSalesArguments(lead: Partial<Lead>): Array<{ eixo: string; argumento: string; objecao: string; resposta: string; impactoROI: string }> {
  const name = lead.companyName || 'a empresa'
  const rating = lead.googleRating || 0
  const reviews = lead.googleReviewsCount || 0
  const followers = lead.instagramFollowers || 0
  const hasWebsite = !!lead.website
  const revenue = lead.monthlyRevenue || 0

  const args = []

  if (!hasWebsite || rating < 4) {
    args.push({
      eixo: 'Presença Digital',
      argumento: !hasWebsite
        ? `${name} não tem website. 87% dos consumidores pesquisam online antes de comprar.`
        : `${name} tem nota ${rating}/5 com ${reviews} avaliações. Empresas com 4.5+ convertem 35% mais.`,
      objecao: 'Nossos clientes vem por indicação',
      resposta: 'Indicação é ótimo, mas limitado. Um cliente indicado também pesquisa online. Se encontrar rating baixo ou nada, a indicação perde força.',
      impactoROI: revenue > 0 ? `Potencial de +${Math.round(revenue * 0.15 / 1000)}k/mês com presença digital estruturada` : 'Aumento estimado de 15-25% em novos clientes',
    })
  }

  if (followers < 1000 || !lead.instagram) {
    args.push({
      eixo: 'Redes Sociais',
      argumento: !lead.instagram
        ? `${name} sem Instagram. Concorrentes do segmento tem média de 2-5k seguidores.`
        : `${name} com ${followers} seguidores. Para o segmento, o benchmark é 3-5x mais.`,
      objecao: 'Redes sociais não trazem clientes',
      resposta: 'Instagram é o novo cartão de visita. 70% das pessoas checam o perfil antes de visitar. Sem presença = perda de confiança.',
      impactoROI: 'Aumento de 20-40% na visibilidade local em 90 dias',
    })
  }

  args.push({
    eixo: 'Aquisição de Clientes',
    argumento: `${name} pode estar perdendo clientes para concorrentes mais visíveis online no segmento ${lead.segment || 'local'}.`,
    objecao: 'Já tentamos marketing digital e não funcionou',
    resposta: 'A maioria falha por falta de estratégia integrada. Anúncios isolados não funcionam. Precisa de funil: atrair > converter > reter.',
    impactoROI: revenue > 0 ? `ROI estimado de 3-5x sobre investimento em ${lead.segment}` : 'ROI médio de 3-5x no segmento',
  })

  args.push({
    eixo: 'Retenção e Recorrência',
    argumento: `Adquirir um novo cliente custa 5-7x mais que reter um existente. ${name} tem estratégia de reativação?`,
    objecao: 'Nossos clientes já são fieis',
    resposta: `Ótimo! Mas sem sistema de CRM e comunicação, fidelidade depende de memória. WhatsApp automatizado pode aumentar retorno em 30%.`,
    impactoROI: 'Aumento de 25-35% na taxa de retorno de clientes',
  })

  return args.slice(0, 4)
}

// --- Vulnerabilities ---
function generateVulnerabilities(lead: Partial<Lead>): Array<{ titulo: string; impacto: 'ALTO' | 'MEDIO' | 'BAIXO'; descricao: string; impactoFinanceiro: string }> {
  const vulns = []
  const revenue = lead.monthlyRevenue || 0

  if (!lead.website) {
    vulns.push({ titulo: 'Ausência de website', impacto: 'ALTO' as const, descricao: `${lead.companyName} não possui website próprio. Clientes que pesquisam online não encontram a empresa, perdendo para concorrentes com presença digital.`, impactoFinanceiro: revenue > 0 ? `Perda estimada de ${Math.round(revenue * 0.20 / 1000)}k/mês em clientes que pesquisam online` : 'Perda significativa de clientes que pesquisam online' })
  }

  if ((lead.googleRating || 0) < 4.0 && (lead.googleRating || 0) > 0) {
    vulns.push({ titulo: `Rating Google abaixo da média (${lead.googleRating}/5)`, impacto: 'ALTO' as const, descricao: `Com nota ${lead.googleRating}/5 e ${lead.googleReviewsCount || 0} avaliações, ${lead.companyName} perde credibilidade frente a concorrentes com 4.5+.`, impactoFinanceiro: 'Redução de 20-35% na conversão de clientes que pesquisam no Google' })
  }

  if (!lead.instagram) {
    vulns.push({ titulo: 'Sem presença no Instagram', impacto: 'MEDIO' as const, descricao: `${lead.companyName} não tem perfil no Instagram. No segmento ${lead.segment || 'local'}, redes sociais são o principal canal de descoberta.`, impactoFinanceiro: 'Invisibilidade para 70% do público que usa Instagram para descobrir negócios locais' })
  } else if ((lead.instagramFollowers || 0) < 500) {
    vulns.push({ titulo: `Poucos seguidores (${lead.instagramFollowers})`, impacto: 'MEDIO' as const, descricao: `${lead.companyName} tem apenas ${lead.instagramFollowers} seguidores. Benchmark do segmento ${lead.segment || ''}: 2.000-5.000.`, impactoFinanceiro: 'Alcance orgânico limitado, dependência de anúncios pagos' })
  }

  if (!lead.inpiHasRegisteredTrademark) {
    vulns.push({ titulo: 'Marca não registrada no INPI', impacto: 'MEDIO' as const, descricao: `${lead.companyName} não possui marca registrada. Risco de perda do nome comercial se concorrente registrar primeiro.`, impactoFinanceiro: 'Risco jurídico e de rebrand forçado (custo médio R$ 30-80k)' })
  }

  if ((lead.domainActive === false)) {
    vulns.push({ titulo: 'Domínio .br inativo ou expirado', impacto: 'ALTO' as const, descricao: `O domínio de ${lead.companyName} está inativo ou expirado. Emails corporativos e website podem estar fora do ar.`, impactoFinanceiro: 'Perda total de presença web e emails corporativos' })
  }

  if ((lead.googleReviewsCount || 0) < 10 && (lead.googleReviewsCount || 0) > 0) {
    vulns.push({ titulo: `Poucas avaliações (${lead.googleReviewsCount})`, impacto: 'BAIXO' as const, descricao: `${lead.companyName} tem apenas ${lead.googleReviewsCount} avaliações no Google. Negócios com 50+ avaliações convertem significativamente mais.`, impactoFinanceiro: 'Perda de confiança vs concorrentes com mais social proof' })
  }

  if (vulns.length === 0) {
    vulns.push({ titulo: 'Oportunidade de crescimento digital', impacto: 'MEDIO' as const, descricao: `${lead.companyName} tem base sólida mas pode expandir presença digital para acelerar crescimento.`, impactoFinanceiro: 'Potencial de 20-40% de crescimento com estratégia digital integrada' })
  }

  return vulns.slice(0, 6)
}

// --- Competitive Analysis ---
function generateCompetitiveAnalysis(
  lead: Partial<Lead>,
  realCompetitors?: Array<{ name: string; rating: number; reviews: number; website?: string; category?: string }>,
): string {
  const segment = lead.segment || 'Varejo'
  const city = lead.city || 'região'

  // Lead's own dimensions (data-driven)
  const leadDims = computeLeadDimensions(lead)

  // Build competitors — use real data if available, otherwise generate contextual placeholders
  const competitors = realCompetitors && realCompetitors.length > 0
    ? realCompetitors.slice(0, 3).map((c) => {
        const dims: Record<string, DimensionLevel> = {}
        for (const dim of COMPETITIVE_DIMENSIONS) {
          if (dim === 'Presença digital') dims[dim] = c.website ? (c.reviews > 50 ? 'Forte' : 'Média') : 'Fraca'
          else if (dim === 'Qualidade percebida') dims[dim] = c.rating >= 4.5 ? 'Forte' : c.rating >= 3.5 ? 'Média' : 'Fraca'
          else if (dim === 'Atendimento') dims[dim] = c.rating >= 4.5 ? 'Forte' : c.rating >= 4.0 ? 'Média' : 'Fraca'
          else if (dim === 'Força da marca') dims[dim] = c.reviews >= 100 ? 'Forte' : c.reviews >= 30 ? 'Média' : 'Fraca'
          else dims[dim] = 'Média'
        }
        return { nome: c.name, website: c.website, rating: c.rating, reviews: c.reviews, category: c.category, dimensoes: dims }
      })
    : [
        {
          nome: `Líder ${segment} (${city})`,
          dimensoes: Object.fromEntries(COMPETITIVE_DIMENSIONS.map((d) => {
            if (d === 'Presença digital' || d === 'Força da marca') return [d, 'Forte' as DimensionLevel]
            if (d === 'Atendimento' || d === 'Inovação') return [d, 'Fraca' as DimensionLevel]
            return [d, 'Média' as DimensionLevel]
          })) as Record<string, DimensionLevel>,
        },
        {
          nome: `Referência regional (${segment})`,
          dimensoes: Object.fromEntries(COMPETITIVE_DIMENSIONS.map((d) => {
            if (d === 'Atendimento' || d === 'Qualidade percebida') return [d, 'Forte' as DimensionLevel]
            if (d === 'Presença digital' || d === 'Inovação') return [d, 'Fraca' as DimensionLevel]
            return [d, 'Média' as DimensionLevel]
          })) as Record<string, DimensionLevel>,
        },
        {
          nome: `Player nacional (${segment})`,
          dimensoes: Object.fromEntries(COMPETITIVE_DIMENSIONS.map((d) => {
            if (d === 'Presença digital' || d === 'Inovação' || d === 'Força da marca') return [d, 'Forte' as DimensionLevel]
            if (d === 'Preço médio') return [d, 'Fraca' as DimensionLevel]
            return [d, 'Média' as DimensionLevel]
          })) as Record<string, DimensionLevel>,
        },
      ]

  return buildCanonicalCompetitiveJson(leadDims, competitors)
}

// --- Projection Data ---
function generateProjectionData(lead: Partial<Lead>): string {
  const revenue = lead.monthlyRevenue || 100000
  const margem = lead.taxRegime === 'lucro_presumido' || lead.taxRegime === 'lucro_real' ? 0.15 : 0.12

  return JSON.stringify([
    { label: 'Conservador', receitaIncrementalMes: Math.round(revenue * 0.10), custoOperacional: Math.round(revenue * 0.03), investimentoMarketing: Math.round(revenue * 0.05), resultadoMensal: Math.round(revenue * 0.02), resultadoAnual: Math.round(revenue * 0.02 * 12), margemLiquida: margem },
    { label: 'Moderado', receitaIncrementalMes: Math.round(revenue * 0.20), custoOperacional: Math.round(revenue * 0.05), investimentoMarketing: Math.round(revenue * 0.08), resultadoMensal: Math.round(revenue * 0.07), resultadoAnual: Math.round(revenue * 0.07 * 12), margemLiquida: margem + 0.03 },
    { label: 'Agressivo', receitaIncrementalMes: Math.round(revenue * 0.35), custoOperacional: Math.round(revenue * 0.08), investimentoMarketing: Math.round(revenue * 0.12), resultadoMensal: Math.round(revenue * 0.15), resultadoAnual: Math.round(revenue * 0.15 * 12), margemLiquida: margem + 0.05 },
  ])
}

// --- Product Portfolio ---
function generateProductPortfolio(lead: Partial<Lead>): string {
  const cnae = lead.cnaePrimary || ''
  const segment = lead.segment || ''
  const secondary = lead.cnaeSecondary ? JSON.parse(lead.cnaeSecondary) : []

  const items = [`Atividade principal: ${cnae || segment || 'Não identificado'}`]
  if (secondary.length > 0) {
    items.push(`Atividades secundárias: ${secondary.slice(0, 3).join('; ')}`)
  }
  if (lead.instagramCategory) {
    items.push(`Categoria Instagram: ${lead.instagramCategory}`)
  }

  return items.join('\n')
}

// --- Helper: extract decision maker from partners JSON ---
function extractDecisionMaker(partnersJson?: string): { nome: string; qualificacao: string } | null {
  if (!partnersJson) return null
  try {
    const raw: Array<Record<string, string>> = JSON.parse(partnersJson)
    if (!raw.length) return null
    // Normalizar: aceitar nome/nome_socio e qualificacao/qualificacao_socio
    const partners = raw.map(p => ({
      nome: p.nome || p.nome_socio || '',
      qualificacao: p.qualificacao || p.qualificacao_socio || '',
    }))
    const priorities = ['administrador', 'socio-administrador', 'sócio-administrador', 'diretor', 'ceo', 'fundador', 'presidente', 'gerente']
    for (const keyword of priorities) {
      const match = partners.find(p => p.qualificacao?.toLowerCase().includes(keyword))
      if (match && match.nome) return match
    }
    const first = partners.find(p => p.nome && p.nome.length > 2)
    return first || null
  } catch { return null }
}

// =============================================
// Fábrica de Receita — Diagnóstico de Travas
// =============================================

export function detectTravas(lead: Partial<Lead>): TravaDetectada[] {
  const travas: TravaDetectada[] = []
  const empresa = lead.companyName || 'a empresa'
  const segmento = lead.segment || 'seu segmento'
  const revenue = lead.monthlyRevenue || 0
  const employees = lead.employees || 0
  const years = lead.yearsInMarket || 0
  const capital = lead.capitalSocial || 0
  const revenueStr = revenue > 0 ? `R$ ${Math.round(revenue / 1000)}k/mês` : 'faturamento não informado'
  const revenuePerEmp = employees > 0 && revenue > 0 ? Math.round(revenue / employees) : 0

  const drProduto = lead.tier === 'Medium=' ? 'DR-E (Estratégico — R$ 350k/ano)'
    : lead.tier === 'Medium-' ? 'DR-T (Tático — R$ 150k/ano)'
    : lead.tier === 'Small' ? 'DR-O (Operacional — R$ 50k/ano)'
    : 'DR-X (Raio-X Diagnóstico — R$ 4.000, 45 dias)'

  // ═══════════════════════════════════════════════════════
  // T1 Cegueira — SOMENTE para leads genuinamente sem dados
  // Lead com revenue OU employees OU capitalSocial NÃO é cego
  // ═══════════════════════════════════════════════════════
  if (!revenue && !employees && !capital && (!lead.enrichmentStatus || lead.enrichmentStatus === 'none')) {
    travas.push({
      codigo: 'T1', nome: 'Cegueira', severidade: 'CRITICA',
      sinaisDetectados: ['Sem dados financeiros', 'Sem dados operacionais', 'Enriquecimento pendente'],
      impactoEstimado: 'Impacto indireto em todas as decisões',
      step: {
        situacao: `${empresa} não possui nenhum dado financeiro ou operacional disponível. Decisões são tomadas completamente no escuro.`,
        trava: `Sem diagnóstico estruturado, é impossível identificar onde a receita está travada. A cegueira alimenta todas as outras travas.`,
        estrategia: `Diagnóstico urgente: enriquecer dados via CNPJá + Assertiva, mapear as 8 travas de receita e auditar a presença digital do segmento de ${segmento}.`,
        produto: drProduto,
      },
      acaoImediata: `Enriquecer o lead urgentemente e agendar reunião de diagnóstico — ${empresa} precisa de visibilidade.`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T5 Qualificação — receita baixa para o tamanho da equipe
  // Prioridade: detecta ineficiência operacional concreta
  // ═══════════════════════════════════════════════════════
  const t5Sinais: string[] = []
  if (employees > 15 && revenue > 0 && revenuePerEmp < 25000) t5Sinais.push(`${employees} func. com receita/func. de R$ ${Math.round(revenuePerEmp / 1000)}k (baixa)`)
  if (employees > 30 && revenue < 200000) t5Sinais.push(`${employees} funcionários para ${revenueStr}`)
  if (capital < 50000 && years > 5 && revenue > 0) t5Sinais.push(`Capital R$ ${Math.round(capital / 1000)}k após ${years} anos`)
  if (t5Sinais.length >= 1) {
    travas.push({
      codigo: 'T5', nome: 'Qualificação', severidade: 'ALTA',
      sinaisDetectados: t5Sinais,
      impactoEstimado: `R$ ${Math.max(8, Math.round(revenue * 0.08 / 1000))}k–${Math.max(18, Math.round(revenue * 0.15 / 1000))}k/mês`,
      step: {
        situacao: `${empresa} tem ${employees} funcionários mas receita de ${revenueStr}${revenuePerEmp > 0 ? ` (R$ ${Math.round(revenuePerEmp / 1000)}k por funcionário)` : ''}. A equipe opera abaixo da capacidade produtiva.`,
        trava: `A empresa investe em estrutura mas não converte proporcionalmente. Leads errados no pipeline ou processo comercial ineficiente desperdiçam o potencial da equipe.`,
        estrategia: `Redesenho do ICP, implementação de lead scoring (SPICED), e reestruturação do processo comercial para aumentar a taxa de conversão e o ticket médio.`,
        produto: drProduto,
      },
      acaoImediata: `Perguntar: "De cada 10 leads que entram, quantos viram cliente? E qual o ticket médio atual de ${empresa}?"`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T7 Decisão — fatura bem mas não tem estrutura de autoridade
  // ═══════════════════════════════════════════════════════
  const t7Sinais: string[] = []
  if (revenue > 200000 && !lead.website) t7Sinais.push(`Fatura ${revenueStr} sem website`)
  if (revenue > 100000 && !lead.inpiHasRegisteredTrademark) t7Sinais.push('Sem marca registrada no INPI')
  if (revenue > 200000 && !lead.instagram) t7Sinais.push('Sem presença no Instagram')
  if (revenue > 500000 && employees < 10) t7Sinais.push(`Fatura ${revenueStr} com apenas ${employees} func.`)
  if (t7Sinais.length >= 1 && revenue > 100000) {
    travas.push({
      codigo: 'T7', nome: 'Decisão', severidade: 'ALTA',
      sinaisDetectados: t7Sinais,
      impactoEstimado: `R$ ${Math.round(revenue * 0.1 / 1000)}k–${Math.round(revenue * 0.2 / 1000)}k/mês em fechamentos perdidos`,
      step: {
        situacao: `${empresa} fatura ${revenueStr} mas carece de elementos de autoridade: ${!lead.website ? 'sem website, ' : ''}${!lead.inpiHasRegisteredTrademark ? 'sem marca registrada, ' : ''}${!lead.instagram ? 'sem Instagram' : ''}. Prospects avaliam e não fecham.`,
        trava: `Clientes qualificados chegam à decisão final mas desistem. A falta de presença profissional, cases documentados e proposta estruturada gera insegurança.`,
        estrategia: `Construir autoridade digital: website profissional, registro de marca INPI, cases de sucesso documentados e proposta comercial com ROI projetado.`,
        produto: drProduto,
      },
      acaoImediata: `Perguntar: "Quantas propostas ${empresa} envia por mês? E dessas, quantas fecham? O que os prospects dizem quando não fecham?"`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T6 Compromisso — empresa antiga com ticket estagnado
  // ═══════════════════════════════════════════════════════
  const t6Sinais: string[] = []
  if (years > 8 && revenue > 0 && revenue < 500000) t6Sinais.push(`${years} anos no mercado com ${revenueStr}`)
  if ((lead.tier === 'Micro+' || lead.tier === 'Small') && years > 5) t6Sinais.push(`Tier ${lead.tier} após ${years} anos`)
  if (lead.taxRegime === 'simples' && revenue > 200000) t6Sinais.push(`Simples Nacional com ${revenueStr} — pode estar no limite`)
  if (t6Sinais.length >= 1) {
    travas.push({
      codigo: 'T6', nome: 'Compromisso', severidade: 'MEDIA',
      sinaisDetectados: t6Sinais,
      impactoEstimado: `R$ ${Math.max(5, Math.round(revenue * 0.05 / 1000))}k–${Math.max(12, Math.round(revenue * 0.12 / 1000))}k/mês`,
      step: {
        situacao: `${empresa} opera há ${years} anos no ${lead.taxRegime || 'regime atual'} com faturamento de ${revenueStr}. A receita está estagnada proporcionalmente ao tempo de mercado.`,
        trava: `Prospects demonstram interesse mas abandonam antes de fechar. O ciclo de venda é longo, falta urgência e a proposta não gera comprometimento imediato.`,
        estrategia: `Reestruturar a proposta comercial com gatilhos de urgência, garantias de resultado e cases do segmento de ${segmento}. Implementar follow-up automatizado com cadência de 5 toques.`,
        produto: drProduto,
      },
      acaoImediata: `Usar dado de custo da inação: "Cada mês sem escalar custa R$ ${Math.max(10, Math.round(revenue * 0.1 / 1000))}k em receita potencial não capturada."`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T2 Exposição — sem presença digital (só se tem dados financeiros)
  // Não é prioritária se o lead tem travas financeiras mais urgentes
  // ═══════════════════════════════════════════════════════
  const t2Sinais: string[] = []
  if (!lead.website) t2Sinais.push('Sem website')
  if (!lead.instagram) t2Sinais.push('Sem Instagram')
  if ((lead.instagramFollowers || 0) < 500 && lead.instagram) t2Sinais.push(`Apenas ${lead.instagramFollowers || 0} seguidores`)
  if (t2Sinais.length >= 1 && (revenue > 0 || employees > 0)) {
    travas.push({
      codigo: 'T2', nome: 'Exposição', severidade: travas.length === 0 ? 'ALTA' : 'MEDIA',
      sinaisDetectados: t2Sinais,
      impactoEstimado: `R$ ${Math.max(10, Math.round(revenue * 0.08 / 1000))}k–${Math.max(25, Math.round(revenue * 0.15 / 1000))}k/mês`,
      step: {
        situacao: `${empresa} fatura ${revenueStr} no segmento de ${segmento} mas ${!lead.website && !lead.instagram ? 'não tem presença digital' : !lead.website ? 'não tem website' : 'tem presença digital limitada'}. Potenciais clientes não encontram a empresa online.`,
        trava: `Sem exposição digital, a empresa depende de indicação e boca a boca. O público-alvo busca soluções online e encontra concorrentes que investem em tráfego.`,
        estrategia: `Estruturar presença digital: ${!lead.website ? 'website otimizado para conversão, ' : ''}${!lead.instagram ? 'perfil Instagram profissional, ' : ''}Google Meu Negócio ativo + campanha de tráfego pago para alcance imediato.`,
        produto: drProduto,
      },
      acaoImediata: `Mostrar que concorrentes de ${segmento} com presença digital faturam 2-3x mais. Perguntar: "De onde vêm seus clientes hoje?"`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T8 Retenção — empresa madura, equipe grande, risco de churn
  // ═══════════════════════════════════════════════════════
  const t8Sinais: string[] = []
  if (years > 10 && employees > 5) t8Sinais.push(`${years} anos no mercado com ${employees} funcionários`)
  if (years > 10 && revenue > 0 && revenue < 300000) t8Sinais.push(`Empresa madura com receita de ${revenueStr}`)
  if (lead.simplesOptant && employees > 10) t8Sinais.push(`Simples Nacional com ${employees} funcionários — estrutura de retenção ausente`)
  if (t8Sinais.length >= 1) {
    travas.push({
      codigo: 'T8', nome: 'Retenção', severidade: 'MEDIA',
      sinaisDetectados: t8Sinais,
      impactoEstimado: `R$ ${Math.max(8, Math.round(revenue * 0.06 / 1000))}k–${Math.max(20, Math.round(revenue * 0.15 / 1000))}k/mês em clientes perdidos`,
      step: {
        situacao: `${empresa} está há ${years} anos no mercado com ${employees} funcionários. A maturidade sugere base de clientes recorrentes mas sem estratégia ativa de retenção.`,
        trava: `Perder 1 cliente custa 5-7x mais que reter. Sem NPS, régua de relacionamento ou programa de fidelidade, o churn corrói a base silenciosamente.`,
        estrategia: `Implementar programa de retenção: NPS automatizado, régua de relacionamento por WhatsApp, ofertas de recompra e estratégia de upsell para aumentar LTV.`,
        produto: drProduto,
      },
      acaoImediata: `Perguntar: "Qual a taxa de retorno dos seus clientes? Quantos compram mais de uma vez? ${empresa} mede o NPS?"`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T3 Atenção — só se TEM presença digital mas é fraca
  // ═══════════════════════════════════════════════════════
  if (lead.googleRating && lead.googleRating < 3.5) {
    travas.push({
      codigo: 'T3', nome: 'Atenção', severidade: 'ALTA',
      sinaisDetectados: [`Rating ${lead.googleRating}/5 no Google`, `${lead.googleReviewsCount || 0} avaliações`],
      impactoEstimado: `R$ ${Math.max(8, Math.round(revenue * 0.08 / 1000))}k–${Math.max(20, Math.round(revenue * 0.15 / 1000))}k/mês`,
      step: {
        situacao: `${empresa} tem rating de ${lead.googleRating}/5 no Google com ${lead.googleReviewsCount || 0} avaliações. A percepção de qualidade está abaixo do aceitável para o segmento.`,
        trava: `O público vê a empresa online mas não se interessa. Reputação fraca = desconfiança = lead perdido antes mesmo de chegar ao funil.`,
        estrategia: `Campanha intensiva de reputação: solicitar avaliações 5 estrelas, responder todas avaliações negativas, otimizar perfil Google Meu Negócio.`,
        produto: drProduto,
      },
      acaoImediata: `Mostrar: "${empresa} tem ${lead.googleRating}/5 — a média do segmento de ${segmento} é 4.2. Isso custa clientes todos os dias."`,
    })
  }

  // ═══════════════════════════════════════════════════════
  // T4 Interesse — tem exposição mas não converte
  // ═══════════════════════════════════════════════════════
  if (lead.website && !lead.assertivaWhatsappFlag) {
    const emailDomain = lead.emailDomain || ''
    const isGeneric = /gmail|hotmail|yahoo|outlook|live|bol|uol/i.test(emailDomain)
    const sinais = ['Website sem WhatsApp Business vinculado']
    if (isGeneric) sinais.push(`Email genérico (${emailDomain})`)
    travas.push({
      codigo: 'T4', nome: 'Interesse', severidade: 'MEDIA',
      sinaisDetectados: sinais,
      impactoEstimado: `R$ ${Math.max(5, Math.round(revenue * 0.05 / 1000))}k–${Math.max(15, Math.round(revenue * 0.12 / 1000))}k/mês`,
      step: {
        situacao: `${empresa} tem website mas sem WhatsApp Business${isGeneric ? ' e email genérico' : ''}. Visitantes chegam mas não têm canal direto para converter.`,
        trava: `Tráfego sem funil de captura é desperdício. Visitantes vão, olham e saem — sem forma fácil de contato, nenhum vira lead.`,
        estrategia: `Implementar WhatsApp Business com chatbot, formulários de captura com oferta de valor, e automação de follow-up para nutrir leads.`,
        produto: drProduto,
      },
      acaoImediata: `Perguntar: "Quantos visitantes o site de ${empresa} recebe por mês? E quantos viram contato?"`,
    })
  }

  // Ordenar: travas com impacto financeiro mais alto primeiro
  // CRITICA > ALTA > MEDIA, e dentro da mesma severidade, por revenue impact
  const order = { CRITICA: 0, ALTA: 1, MEDIA: 2 }
  travas.sort((a, b) => order[a.severidade] - order[b.severidade])

  return travas.slice(0, 5)
}

// =============================================
// Projeção Competitiva
// =============================================

export function generateProjecaoCompetitiva(lead: Partial<Lead>): ProjecaoCompetitiva {
  const segmento = lead.segment || 'Varejo'
  const revenue = lead.monthlyRevenue || 200000
  const leadDims = computeLeadDimensions(lead)

  // Benchmark: segmento ideal = tudo Forte
  const benchmarkSegmento: Record<string, string> = {}
  for (const dim of COMPETITIVE_DIMENSIONS) {
    benchmarkSegmento[dim] = 'Forte'
  }

  // Benchmark digital com gaps
  const benchmarkDigital = COMPETITIVE_DIMENSIONS.map(dim => {
    const leadNivel = leadDims[dim] || 'Fraca'
    const benchmarkNivel = 'Forte'
    const gap = leadNivel === 'Forte' ? '✓' : leadNivel === 'Média' ? '↑' : '↑↑'
    return { dimensao: dim, leadNivel, benchmarkNivel, gap }
  })

  // Oportunidades baseadas no segmento
  const oportunidades = [
    `Empresas de ${segmento} que investem em tráfego pago crescem 2-3x mais rápido que as que dependem de orgânico`,
    `O segmento de ${segmento} tem taxa média de conversão de 2-4% — otimização pode dobrar esse número`,
    `Automação de WhatsApp no segmento de ${segmento} reduz tempo de resposta de 24h para 5min`,
  ]

  // 3 cenários
  const ganhoMes = Math.round(revenue * 0.20)
  const perdaMes = Math.round(revenue * 0.15)
  const cenarios = [
    {
      label: 'Com Destrava Receita',
      impactoMes: ganhoMes,
      impactoAno: ganhoMes * 12,
      travasResolvidas: ['Exposição', 'Atenção', 'Interesse'],
      descricao: `Implementação de funil completo com tráfego pago + CRO + automação. Projeção baseada em +20% de receita incremental sobre ${lead.monthlyRevenue ? `R$ ${Math.round(revenue/1000)}k/mês` : 'faturamento atual'}.`,
    },
    {
      label: 'Sem ação',
      impactoMes: 0,
      impactoAno: 0,
      travasResolvidas: [],
      descricao: 'Estagnação com inflação corroendo margem. Sem investimento em aquisição, a base de clientes encolhe naturalmente por churn.',
    },
    {
      label: 'Concorrente cresce',
      impactoMes: -perdaMes,
      impactoAno: -perdaMes * 12,
      travasResolvidas: [],
      descricao: `Concorrentes do segmento de ${segmento} que já investem em digital capturam o market share. Projeção de -15% em 12 meses.`,
    },
  ]

  // Gaps para resolver
  const gapsParaResolver = COMPETITIVE_DIMENSIONS
    .filter(dim => leadDims[dim] === 'Fraca')
    .map(dim => ({
      dimensao: dim,
      de: 'Fraca',
      para: 'Forte',
      comoProduto: dim === 'Presença digital' || dim === 'Inovação' ? 'DR-O (Operacional)' : dim === 'Força da marca' ? 'DR-T (Tático)' : 'DR-O (Operacional)',
    }))

  return {
    nichoAnalise: { segmento, benchmarkDigital, oportunidadesMercado: oportunidades },
    projecaoDestrava: { cenarios },
    comparativoCompetitivo: { leadDimensoes: leadDims, benchmarkSegmento, gapsParaResolver },
  }
}

// =============================================
// Playbook BDR
// =============================================

export function generatePlaybookBDR(lead: Partial<Lead>, travas: TravaDetectada[], decisorName?: string): PlaybookBDR {
  const empresa = lead.companyName || 'a empresa'
  const segmento = lead.segment || 'seu segmento'
  const revenue = lead.monthlyRevenue || 0
  const revenueStr = revenue > 0 ? `R$ ${Math.round(revenue / 1000)}k/mês` : ''
  const trava = travas[0] || { nome: 'Aquisição', codigo: 'T2', impactoEstimado: 'R$ 10k–25k/mês' }
  // Prioridade: nome passado pelo componente (contacts) > partners JSON > fallback
  const decisor = extractDecisionMaker(lead.partners)
  const rawName = decisorName || decisor?.nome || ''
  const decisorNome = rawName.split(' ')[0] || 'responsável'

  const drProduto = lead.tier === 'Medium=' ? { nome: 'DR-E', faixa: 'R$ 350.000/ano', justificativa: `${empresa} opera no tier ${lead.tier} com estrutura para estratégia de longo prazo.` }
    : lead.tier === 'Medium-' ? { nome: 'DR-T', faixa: 'R$ 150.000/ano', justificativa: `${empresa} tem porte para implementação tática com time dedicado.` }
    : lead.tier === 'Small' ? { nome: 'DR-O', faixa: 'R$ 50.000/ano', justificativa: `${empresa} precisa de operação contínua para destravar receita.` }
    : { nome: 'DR-X', faixa: 'R$ 4.000 (45 dias)', justificativa: `Diagnóstico rápido para ${empresa} identificar as travas prioritárias antes de investir em operação.` }

  return {
    contexto: `${empresa} atua no segmento de ${segmento}${revenueStr ? ` com faturamento estimado de ${revenueStr}` : ''}. Trava principal identificada: ${trava.codigo} ${trava.nome}. ${travas.length} trava${travas.length > 1 ? 's' : ''} detectada${travas.length > 1 ? 's' : ''} no total.`,
    travaPrincipal: `${trava.codigo} — ${trava.nome}`,
    canais: {
      whatsapp: {
        abertura: `Oi ${decisorNome}, tudo bem? Sou da V4 Company, maior consultoria de marketing do Brasil. Vi que a ${empresa} atua com ${segmento} e identifiquei uma oportunidade de destravar receita no seu negócio. Posso te explicar em 2 min?`,
        followUp: `${decisorNome}, passando aqui novamente. Analisei empresas do segmento de ${segmento} e identifiquei que a maioria perde ${trava.impactoEstimado} por não resolver a trava de ${trava.nome.toLowerCase()}. Vale 15min do seu tempo para eu mostrar como resolver isso?`,
        objecoes: {
          'Não preciso disso': `Entendo, ${decisorNome}. Mas nossos dados mostram que empresas de ${segmento} que não resolvem a trava de ${trava.nome.toLowerCase()} perdem em média ${trava.impactoEstimado}. Posso te mostrar o comparativo em 15min — sem compromisso.`,
          'Não tenho tempo': `Total, sei como é a correria. Por isso o diagnóstico leva apenas 45 dias e exige no máximo 2h/semana do seu lado. Nós executamos 80%. Que tal uma call de 15min essa semana para eu explicar o processo?`,
          'Já tenho agência': `Ótimo, isso mostra que vocês já investem em crescimento. A diferença é que nós focamos em RECEITA, não em métricas de vaidade. Inclusive, podemos complementar o trabalho da sua agência. Posso mostrar como?`,
        },
        cta: `${decisorNome}, posso agendar 20 minutos na sua agenda essa semana? Vou te mostrar exatamente quanto a ${empresa} está deixando na mesa e como resolver em 90 dias. Qual melhor dia — terça ou quinta?`,
      },
      linkedin: {
        conexao: `${decisorNome}, vi que você lidera a ${empresa} no segmento de ${segmento}. Estou mapeando oportunidades de crescimento no setor e achei seu perfil relevante. Aceita conectar?`,
        inmail: `${decisorNome}, sou consultor de receita na V4 Company. Analisamos mais de 50 empresas de ${segmento} e identificamos que a principal trava de crescimento no setor é ${trava.nome.toLowerCase()}. Preparei um diagnóstico gratuito para a ${empresa} — posso compartilhar em uma call de 15min?`,
        comentario: `Excelente ponto! Na V4 Company vemos isso constantemente no segmento de ${segmento}. Empresas que estruturam o funil de receita conseguem resolver essa trava rapidamente. Se quiser trocar ideias sobre como aplicar isso na ${empresa}, fico à disposição!`,
      },
      ligacao: {
        abertura: `Oi ${decisorNome}, tudo bem? Meu nome é [SEU NOME], sou consultor de receita na V4 Company — a maior consultoria de marketing do Brasil. Estou ligando porque analisamos empresas do segmento de ${segmento} e identifiquei uma oportunidade específica para a ${empresa}. Posso tomar 2 minutos do seu tempo?`,
        qualificacao: [
          `Hoje a ${empresa} investe quanto em marketing e aquisição de clientes por mês?`,
          `Qual o principal desafio para crescer — é trazer mais clientes, aumentar o ticket ou reter os atuais?`,
          `Se eu te mostrasse uma forma de gerar mais ${Math.round((revenue || 200000) * 0.2 / 1000)}k/mês em 90 dias, isso seria relevante para vocês?`,
        ],
        gatilho: `${decisorNome}, nossos dados mostram que empresas de ${segmento} com perfil similar ao da ${empresa} perdem em média ${trava.impactoEstimado} por não resolver a trava de ${trava.nome.toLowerCase()}. Em 6 meses, isso soma mais de R$ ${Math.round((revenue || 200000) * 0.15 * 6 / 1000)}k. Esse é o custo de não agir.`,
        objecoes: {
          'Manda por e-mail': `Claro, posso mandar. Mas nosso material é personalizado para a ${empresa} — para montar ele preciso de 3 informações rápidas que levam 2 minutos. Posso fazer agora?`,
          'Não é o momento': `Entendo. Mas cada mês custa ${trava.impactoEstimado} em receita perdida. Que tal agendarmos para a semana que vem? Assim você tem tempo de se organizar.`,
          'Quanto custa?': `O diagnóstico ${lead.tier === 'Micro+' ? 'DR-X custa R$ 4.000 em 45 dias' : 'depende do porte — para a ' + empresa + ' seria a partir de R$ 50k/ano'}. Mas antes de falar de investimento, preciso entender se faz sentido para a ${empresa}. Posso te mostrar o ROI projetado em 15min?`,
          'Já tentei e não deu certo': `Exatamente por isso existimos. 87% dos nossos clientes já tinham tentado com agências tradicionais. A diferença é que focamos em RECEITA, não em cliques. Posso te mostrar um caso de sucesso do segmento de ${segmento}?`,
          'Preciso pensar': `Total, ${decisorNome}. Mas para pensar com dados, posso te mandar o diagnóstico gratuito da ${empresa} mostrando exatamente onde está a trava? Sem compromisso — só para você ter clareza na decisão.`,
        },
        fechamento: `${decisorNome}, baseado no que conversamos, faz total sentido uma reunião de 20 minutos para eu apresentar o diagnóstico completo da ${empresa}. Tenho disponibilidade terça às 10h ou quinta às 14h — qual funciona melhor para você?`,
      },
    },
    produtoRecomendado: drProduto,
  }
}

// =============================================
// MAIN EXPORT
// =============================================

export function generateStrategicAnalysis(
  lead: Partial<Lead>,
  realCompetitors?: Array<{ name: string; rating: number; reviews: number; website?: string; category?: string }>,
): StrategicAnalysis {
  return {
    hypotheticalTrap: detectTrap(lead),
    discoveryQuestions: JSON.stringify(generateDiscoveryQuestions(lead)),
    eligibilityChecklist: JSON.stringify(generateEligibilityChecklist(lead)),
    meetingPrep: JSON.stringify(generateMeetingPrep(lead)),
    salesArguments: JSON.stringify(generateSalesArguments(lead)),
    vulnerabilities: JSON.stringify(generateVulnerabilities(lead)),
    competitiveAnalysis: generateCompetitiveAnalysis(lead, realCompetitors),
    projectionData: generateProjectionData(lead),
    productPortfolio: generateProductPortfolio(lead),
  }
}

// Exported for fallback use in CompanyPage
export { generateDiscoveryQuestions, generateEligibilityChecklist }
