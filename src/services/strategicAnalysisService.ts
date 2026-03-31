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
  const highRevenue = (lead.monthlyRevenue || 0) >= 200000
  const lowEmployees = (lead.employees || 0) < 10
  const segment = (lead.segment || '').toLowerCase()

  if (noDigital) return `T1 - Aquisicao de clientes: ${lead.companyName} sem presenca digital estruturada`
  if (lowRating && fewReviews) return `T2 - Conversao de vendas: ${lead.companyName} com rating ${lead.googleRating || 'N/A'}/5 e apenas ${lead.googleReviewsCount || 0} avaliacoes`
  if (hasInstagram && lowFollowers) return `T6 - Posicionamento de marca: ${lead.companyName} com apenas ${lead.instagramFollowers || 0} seguidores`
  if (highRevenue && lowEmployees) return `T7 - Escalabilidade: ${lead.companyName} fatura alto mas equipe enxuta (${lead.employees || '?'} func.)`
  if (!hasWebsite && hasInstagram) return `T8 - Dependencia de canal: ${lead.companyName} depende exclusivamente do Instagram`
  if (!lead.inpiHasRegisteredTrademark && highRevenue) return `T5 - Margem operacional: ${lead.companyName} sem marca registrada no INPI`
  if (segment.includes('odonto') || segment.includes('estetic') || segment.includes('saude'))
    return `T4 - Recorrencia: ${lead.companyName} no segmento ${lead.segment} precisa de estrategia de retencao`
  return `T1 - Aquisicao de clientes: ${lead.companyName} precisa de estrategia de geracao de demanda`
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
    questions.push(`Com faturamento estimado de R$ ${Math.round(revenue / 1000)}k/mes, qual porcentagem ${name} investe atualmente em marketing e aquisicao de clientes?`)
  } else {
    questions.push(`Qual e o investimento mensal atual de ${name} em marketing e aquisicao de novos clientes?`)
  }

  // Digital presence-based
  if (!hasWebsite) {
    questions.push(`${name} nao possui website proprio. Como os clientes encontram voces hoje? A maioria vem por indicacao, redes sociais ou outra fonte?`)
  } else if (rating > 0 && rating < 4.0) {
    questions.push(`${name} tem nota ${rating}/5 no Google com ${reviews} avaliacoes. Voces tem alguma estrategia para melhorar a reputacao online e responder avaliacoes negativas?`)
  } else if (rating >= 4.5) {
    questions.push(`${name} tem excelente nota ${rating}/5 no Google. Como voces aproveitam essa reputacao para converter mais clientes que pesquisam online?`)
  }

  // Social media-based
  if (followers > 0 && followers < 1000) {
    questions.push(`Com ${followers} seguidores no Instagram, qual e a taxa de conversao atual de seguidores em clientes reais? Voces medem isso?`)
  } else if (followers >= 5000) {
    questions.push(`Com ${followers.toLocaleString('pt-BR')} seguidores, qual porcentagem do faturamento de ${name} vem diretamente do Instagram?`)
  } else if (!lead.instagram) {
    questions.push(`${name} nao tem perfil no Instagram. Como voces se posicionam frente a concorrentes que estao ativos nas redes sociais?`)
  }

  // Segment-specific
  if (segment.includes('odonto') || segment.includes('dental')) {
    questions.push(`Quantos pacientes novos ${name} recebe por mes? E qual a taxa de retorno para manutencao sem precisar ligar?`)
  } else if (segment.includes('estetic') || segment.includes('beleza')) {
    questions.push(`Qual procedimento tem a maior margem em ${name}? E qual a recorrencia media dos clientes?`)
  } else if (segment.includes('pet') || segment.includes('animal')) {
    questions.push(`Qual o ticket medio por cliente em ${name}? E quantos voltam mensalmente para banho/tosa ou racao?`)
  } else if (segment.includes('varejo') || segment.includes('comercio')) {
    questions.push(`Se um concorrente abrisse ao lado oferecendo 20% de desconto, como ${name} protegeria sua base de clientes?`)
  } else {
    questions.push(`Qual e o maior desafio de ${name} hoje para crescer: atrair novos clientes, reter os atuais, ou aumentar o ticket medio?`)
  }

  // Team/scale-based
  if (employees > 0 && employees < 10) {
    questions.push(`Com uma equipe de ${employees} pessoas, quais processos de ${name} voce gostaria de automatizar para liberar tempo para crescer?`)
  } else if (employees >= 20) {
    questions.push(`Com ${employees} funcionarios, como ${name} mede a produtividade da equipe e identifica gargalos operacionais?`)
  } else {
    questions.push(`Se voce pudesse resolver apenas um problema de ${name} nos proximos 90 dias, qual seria e por que?`)
  }

  return questions.slice(0, 5)
}

// --- Eligibility Checklist ---
function generateEligibilityChecklist(lead: Partial<Lead>): Array<{ label: string; value: boolean }> {
  const revenue = lead.monthlyRevenue || 0
  const score = lead.score || 0
  const hasContact = !!(lead.rfPhone || lead.rfEmail)

  return [
    { label: `Faturamento acima de R$50k/mes`, value: revenue >= 50000 || revenue === 0 },
    { label: `Decisor identificado com contato`, value: hasContact },
    { label: `Empresa ativa na Receita Federal`, value: lead.registrationStatus === 'ATIVA' || !lead.registrationStatus },
    { label: `Score SPICED >= 2.5`, value: score >= 2.5 || score === 0 },
    { label: `Segmento compativel com ICP`, value: !!lead.segment },
    { label: `Presenca digital mapeada`, value: !!(lead.website || lead.instagram || lead.linkedin) },
    { label: `Localizacao identificada`, value: !!(lead.city && lead.state) },
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
      { minutos: '0-5', objetivo: 'Rapport e contexto', script: `Cumprimentar ${decisor}. Mencionar que analisamos ${name} e identificamos oportunidades especificas para ${segment}.` },
      { minutos: '5-15', objetivo: 'Diagnostico atual', script: `Perguntar sobre desafios atuais.${rating > 0 ? ` Mencionar nota ${rating}/5 no Google (${reviews} avaliacoes) como ponto de partida.` : ''}${followers > 0 ? ` Comentar sobre os ${followers} seguidores no Instagram.` : ''}` },
      { minutos: '15-25', objetivo: 'Dores e impacto', script: `Aprofundar nas dores identificadas. Quantificar: "Se ${name} conseguisse X, qual seria o impacto no faturamento${revenue > 0 ? ` de R$ ${Math.round(revenue / 1000)}k/mes` : ''}?"` },
      { minutos: '25-35', objetivo: 'Solucao e diferencial', script: `Apresentar como a V4 resolve essas dores especificamente para ${segment}. Mostrar cases similares.` },
      { minutos: '35-45', objetivo: 'Proximos passos', script: `Proposta de parceria. Definir timeline e expectativas. Agendar follow-up com ${decisor}.` },
    ],
    objecoes: [
      { objecao: 'Ja trabalhamos com uma agencia', resposta: `Entendo. A questao nao e trocar, mas complementar. Analisando ${name}, vimos gaps especificos${!lead.website ? ' como falta de website' : rating < 4 ? ` como nota ${rating}/5 no Google` : ''} que talvez nao estejam sendo enderecos.` },
      { objecao: 'Esta caro / Nao tenho orcamento', resposta: `${revenue > 0 ? `Com faturamento de R$ ${Math.round(revenue / 1000)}k/mes, o investimento se paga em X meses.` : 'O investimento se paga quando medimos o retorno por cliente adquirido.'} A pergunta e: quanto custa NAO investir?` },
      { objecao: 'Preciso pensar / Vou avaliar', resposta: `Claro, ${decisor}. Enquanto avalia, posso enviar uma projecao personalizada de ${name} mostrando o ROI esperado em 90 dias?` },
    ],
    checklist: [
      `Revisar dados de ${name} no Outbili antes da reuniao`,
      `Preparar proposta personalizada para ${segment}`,
      partners.length > 0 ? `Verificar perfil LinkedIn de ${decisor}` : 'Identificar decisor no LinkedIn',
      `Separar cases de sucesso do segmento ${segment}`,
      `Testar link de reuniao e gravar se possivel`,
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
      eixo: 'Presenca Digital',
      argumento: !hasWebsite
        ? `${name} nao tem website. 87% dos consumidores pesquisam online antes de comprar.`
        : `${name} tem nota ${rating}/5 com ${reviews} avaliacoes. Empresas com 4.5+ convertem 35% mais.`,
      objecao: 'Nossos clientes vem por indicacao',
      resposta: 'Indicacao e otimo, mas limitado. Um cliente indicado tambem pesquisa online. Se encontrar rating baixo ou nada, a indicacao perde forca.',
      impactoROI: revenue > 0 ? `Potencial de +${Math.round(revenue * 0.15 / 1000)}k/mes com presenca digital estruturada` : 'Aumento estimado de 15-25% em novos clientes',
    })
  }

  if (followers < 1000 || !lead.instagram) {
    args.push({
      eixo: 'Redes Sociais',
      argumento: !lead.instagram
        ? `${name} sem Instagram. Concorrentes do segmento tem media de 2-5k seguidores.`
        : `${name} com ${followers} seguidores. Para o segmento, o benchmark e 3-5x mais.`,
      objecao: 'Redes sociais nao trazem clientes',
      resposta: 'Instagram e o novo cartao de visita. 70% das pessoas checam o perfil antes de visitar. Sem presenca = perda de confianca.',
      impactoROI: 'Aumento de 20-40% na visibilidade local em 90 dias',
    })
  }

  args.push({
    eixo: 'Aquisicao de Clientes',
    argumento: `${name} pode estar perdendo clientes para concorrentes mais vissiveis online no segmento ${lead.segment || 'local'}.`,
    objecao: 'Ja tentamos marketing digital e nao funcionou',
    resposta: 'A maioria falha por falta de estrategia integrada. Anuncios isolados nao funcionam. Precisa de funil: atrair > converter > reter.',
    impactoROI: revenue > 0 ? `ROI estimado de 3-5x sobre investimento em ${lead.segment}` : 'ROI medio de 3-5x no segmento',
  })

  args.push({
    eixo: 'Retencao e Recorrencia',
    argumento: `Adquirir um novo cliente custa 5-7x mais que reter um existente. ${name} tem estrategia de reativacao?`,
    objecao: 'Nossos clientes ja sao fieis',
    resposta: `Otimo! Mas sem sistema de CRM e comunicacao, fidelidade depende de memoria. WhatsApp automatizado pode aumentar retorno em 30%.`,
    impactoROI: 'Aumento de 25-35% na taxa de retorno de clientes',
  })

  return args.slice(0, 4)
}

// --- Vulnerabilities ---
function generateVulnerabilities(lead: Partial<Lead>): Array<{ titulo: string; impacto: 'ALTO' | 'MEDIO' | 'BAIXO'; descricao: string; impactoFinanceiro: string }> {
  const vulns = []
  const revenue = lead.monthlyRevenue || 0

  if (!lead.website) {
    vulns.push({ titulo: 'Ausencia de website', impacto: 'ALTO' as const, descricao: `${lead.companyName} nao possui website proprio. Clientes que pesquisam online nao encontram a empresa, perdendo para concorrentes com presenca digital.`, impactoFinanceiro: revenue > 0 ? `Perda estimada de ${Math.round(revenue * 0.20 / 1000)}k/mes em clientes que pesquisam online` : 'Perda significativa de clientes que pesquisam online' })
  }

  if ((lead.googleRating || 0) < 4.0 && (lead.googleRating || 0) > 0) {
    vulns.push({ titulo: `Rating Google abaixo da media (${lead.googleRating}/5)`, impacto: 'ALTO' as const, descricao: `Com nota ${lead.googleRating}/5 e ${lead.googleReviewsCount || 0} avaliacoes, ${lead.companyName} perde credibilidade frente a concorrentes com 4.5+.`, impactoFinanceiro: 'Reducao de 20-35% na conversao de clientes que pesquisam no Google' })
  }

  if (!lead.instagram) {
    vulns.push({ titulo: 'Sem presenca no Instagram', impacto: 'MEDIO' as const, descricao: `${lead.companyName} nao tem perfil no Instagram. No segmento ${lead.segment || 'local'}, redes sociais sao o principal canal de descoberta.`, impactoFinanceiro: 'Invisibilidade para 70% do publico que usa Instagram para descobrir negocios locais' })
  } else if ((lead.instagramFollowers || 0) < 500) {
    vulns.push({ titulo: `Poucos seguidores (${lead.instagramFollowers})`, impacto: 'MEDIO' as const, descricao: `${lead.companyName} tem apenas ${lead.instagramFollowers} seguidores. Benchmark do segmento ${lead.segment || ''}: 2.000-5.000.`, impactoFinanceiro: 'Alcance organico limitado, dependencia de anuncios pagos' })
  }

  if (!lead.inpiHasRegisteredTrademark) {
    vulns.push({ titulo: 'Marca nao registrada no INPI', impacto: 'MEDIO' as const, descricao: `${lead.companyName} nao possui marca registrada. Risco de perda do nome comercial se concorrente registrar primeiro.`, impactoFinanceiro: 'Risco juridico e de rebrand forcado (custo medio R$ 30-80k)' })
  }

  if ((lead.domainActive === false)) {
    vulns.push({ titulo: 'Dominio .br inativo ou expirado', impacto: 'ALTO' as const, descricao: `O dominio de ${lead.companyName} esta inativo ou expirado. Emails corporativos e website podem estar fora do ar.`, impactoFinanceiro: 'Perda total de presenca web e emails corporativos' })
  }

  if ((lead.googleReviewsCount || 0) < 10 && (lead.googleReviewsCount || 0) > 0) {
    vulns.push({ titulo: `Poucas avaliacoes (${lead.googleReviewsCount})`, impacto: 'BAIXO' as const, descricao: `${lead.companyName} tem apenas ${lead.googleReviewsCount} avaliacoes no Google. Negocios com 50+ avaliacoes convertem significativamente mais.`, impactoFinanceiro: 'Perda de confianca vs concorrentes com mais social proof' })
  }

  if (vulns.length === 0) {
    vulns.push({ titulo: 'Oportunidade de crescimento digital', impacto: 'MEDIO' as const, descricao: `${lead.companyName} tem base solida mas pode expandir presenca digital para acelerar crescimento.`, impactoFinanceiro: 'Potencial de 20-40% de crescimento com estrategia digital integrada' })
  }

  return vulns.slice(0, 6)
}

// --- Competitive Analysis ---
function generateCompetitiveAnalysis(
  lead: Partial<Lead>,
  realCompetitors?: Array<{ name: string; rating: number; reviews: number; website?: string; category?: string }>,
): string {
  const segment = lead.segment || 'Varejo'
  const city = lead.city || 'regiao'

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
          nome: `Lider ${segment} (${city})`,
          dimensoes: Object.fromEntries(COMPETITIVE_DIMENSIONS.map((d) => {
            if (d === 'Presença digital' || d === 'Força da marca') return [d, 'Forte' as DimensionLevel]
            if (d === 'Atendimento' || d === 'Inovação') return [d, 'Fraca' as DimensionLevel]
            return [d, 'Média' as DimensionLevel]
          })) as Record<string, DimensionLevel>,
        },
        {
          nome: `Referencia regional (${segment})`,
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

  const items = [`Atividade principal: ${cnae || segment || 'Nao identificado'}`]
  if (secondary.length > 0) {
    items.push(`Atividades secundarias: ${secondary.slice(0, 3).join('; ')}`)
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
