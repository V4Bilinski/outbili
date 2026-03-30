export interface Lead {
  id: string
  companyName: string
  tradeName?: string
  cnpj?: string
  segment: string
  tier: string
  monthlyRevenue?: number
  status: string
  score: number
  temperature: 'Quente' | 'Morno' | 'Frio'
  spicedS: number
  spicedP: number
  spicedI: number
  spicedC: number
  spicedD: number
  spicedNotes?: string
  hypotheticalTrap?: string
  website?: string
  instagram?: string
  linkedin?: string
  facebook?: string
  address?: string
  city?: string
  state?: string
  employees?: number
  yearsInMarket?: number
  businessSummary?: string
  marketContext?: string
  productPortfolio?: string
  techStack?: string
  projectionData?: string
  vulnerabilities?: string
  competitiveAnalysis?: string
  salesArguments?: string
  meetingPrep?: string
  discoveryQuestions?: string
  eligibilityChecklist?: string
  sourceHtmlReport?: string
  enrichmentStatus?: 'none' | 'basic' | 'pending' | 'complete'
  // --- Presença Digital (estruturado) ---
  googleRating?: number
  googleReviewsCount?: number
  instagramFollowers?: number
  instagramIsVerified?: boolean
  instagramIsBusiness?: boolean
  instagramCategory?: string
  instagramBio?: string
  linkedinEmployeeCount?: number
  // --- Dados Receita Federal (estruturado) ---
  taxRegime?: string              // 'simples' | 'mei' | 'lucro_presumido' | 'lucro_real' | 'nao_optante'
  capitalSocial?: number
  legalNature?: string
  registrationStatus?: string     // 'Ativa' | 'Baixada' | 'Suspensa' etc.
  foundingDate?: string           // ISO date
  cnaePrimary?: string            // código + descrição
  cnaeSecondary?: string          // JSON array
  partners?: string               // JSON array: [{nome, qualificacao}]
  rfEmail?: string                // Email cadastrado na Receita Federal
  rfPhone?: string                // Telefone cadastrado na RF
  // --- Geolocalização ---
  latitude?: number
  longitude?: number
  // --- INPI (Marcas / Propriedade Industrial) ---
  inpiTrademarks?: string        // JSON: [{marca, numero, status, classe, dataDeposito}]
  inpiTrademarkCount?: number    // Quantidade de marcas registradas
  inpiHasRegisteredTrademark?: boolean  // Tem marca registrada?
  // --- Domínio ---
  domainActive?: boolean
  domainExpiry?: string
  // --- Fonte de dados ---
  enrichmentSources?: string  // JSON: quais fontes retornaram dados
  enrichmentLog?: string      // JSON: log de cada etapa
  createdAt?: string
  updatedAt?: string
}

export interface Contact {
  id: string
  leadId: string
  name: string
  role?: string
  contactType: 'decisor' | 'stakeholder' | 'influenciador'
  whatsapp: string
  email?: string
  bilinskizapContactId?: string
  createdAt?: string
}

export interface Campaign {
  id: string
  name: string
  type: 'cadencia_outbound' | 'follow_up' | 'reengajamento'
  status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Concluída' | 'Cancelada'
  segment?: string
  steps?: string
  totalLeads?: number
  messagesSent?: number
  delivered?: number
  read?: number
  responses?: number
  leadIds?: string[]
  createdAt?: string
}

export interface Message {
  id: string
  campaignId: string
  contactId: string
  leadId?: string
  stepNumber: number
  content: string
  status: 'Pendente' | 'Enviado' | 'Entregue' | 'Lido' | 'Respondeu' | 'Falhou'
  bilinskizapMessageId?: string
  scheduledAt?: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  errorMessage?: string
  createdAt?: string
}

export interface Activity {
  id: string
  leadId: string
  contactId?: string
  type: 'nota' | 'whatsapp_enviado' | 'whatsapp_recebido' | 'reunião' | 'proposta' | 'status_change'
  description: string
  createdBy?: string
  createdAt?: string
}

export interface Segment {
  id: string
  name: string
  slug: string
  dayOfWeek: string
  subSegments?: string
  isActive: boolean
  color?: string
}

export interface ProjectionScenario {
  label: string
  receitaIncrementalMes: number
  custoOperacional: number
  investimentoMarketing: number
  resultadoMensal: number
  resultadoAnual: number
  margemLiquida: number
}

export interface Vulnerability {
  titulo: string
  impacto: 'ALTO' | 'MEDIO' | 'BAIXO'
  descricao: string
  impactoFinanceiro: string
}

export interface Competitor {
  nome: string
  dimensoes: Record<string, 'Fraca' | 'Média' | 'Forte'>
}

export interface SalesArgument {
  eixo: string
  argumento: string
  objecao: string
  resposta: string
  impactoROI: string
}

export interface MeetingAgendaItem {
  minutos: string
  objetivo: string
  script: string
}

export interface MeetingPrep {
  agenda: MeetingAgendaItem[]
  objecoes: { objecao: string; resposta: string }[]
  checklist: string[]
}

export interface DashboardStats {
  leadsToday: number
  hotActive: number
  campaignsActive: number
  meetingsToday: number
}

export interface NextAction {
  leadId: string
  companyName: string
  contactName?: string
  temperature: 'Quente' | 'Morno' | 'Frio'
  score: number
  action: string
  actionType: 'whatsapp' | 'view' | 'import' | 'meeting'
  status: string
}
