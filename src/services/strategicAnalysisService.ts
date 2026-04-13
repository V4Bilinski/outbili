import type { Lead } from '../types'
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
