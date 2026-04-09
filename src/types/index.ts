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
  enrichmentStatus?: 'none' | 'cnpja' | 'cnpja_n8n' | 'assertiva' | 'complete'
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
  taxRegime?: 'simples' | 'mei' | 'lucro_presumido' | 'lucro_real' | 'nao_optante'
  capitalSocial?: number
  legalNature?: string
  registrationStatus?: 'Ativa' | 'Baixada' | 'Suspensa' | 'Inapta' | 'Nula'
  foundingDate?: string           // ISO date (campo date no Airtable)
  cnaePrimary?: string
  cnaeSecondary?: string          // texto separado por \n
  partners?: string               // JSON array: [{nome, qualificacao}] — migra para tabela Partners
  rfEmail?: string
  rfPhone?: string
  // --- CNPJá (novos campos) ---
  zipCode?: string
  district?: string
  municipalityCode?: number
  phoneType?: 'MOBILE' | 'LANDLINE'
  simplesOptant?: boolean
  simplesSince?: string           // ISO date
  isHeadquarters?: boolean
  cnpjaLastUpdate?: string        // ISO datetime
  statusDate?: string             // ISO date
  emailDomain?: string
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
  cpf?: string
  whatsappConfirmed?: boolean
  phoneIsHot?: boolean
  source?: 'cnpja' | 'assertiva' | 'manual' | 'pesca' | 'apify'
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
  website?: string
  rating?: number
  reviews?: number
  category?: string
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

// --- PESCA (busca em massa via APIs publicas) ---

export interface PescaFilters {
  segments: string[]
  states: string[]
  revenueMin: number
  revenueMax: number
  excludeMei: boolean
}

export interface PescaLead {
  companyName: string
  tradeName?: string
  cnpj: string
  segment?: string
  state?: string
  city?: string
  address?: string
  decisorName?: string
  decisorRole?: string
  whatsapp?: string
  phone?: string
  capitalSocial?: number
  porte?: string
  cnaePrimary?: string
  foundingDate?: string
  email?: string
  source: 'pesca'
}

export interface PescaProgress {
  found: number
  enriched: number
  deduped: number
  saved: number
  total: number
}

export type PescaPhase = 'idle' | 'searching' | 'enriching' | 'deduplicating' | 'saving' | 'done' | 'error'

// --- Novas Tabelas (decomposicao JSON) ---

export interface Partner {
  id: string
  name: string
  qualification?: string
  since?: string
  ageRange?: string
  personType?: 'NATURAL' | 'LEGAL' | 'FOREIGN'
  cpf?: string
  leadId?: string
  createdAt?: string
}

export interface Trademark {
  id: string
  marca: string
  numero?: string
  status?: string
  classe?: string
  leadId?: string
  createdAt?: string
}

export interface EnrichmentLogEntry {
  id: string
  detail: string
  source: string
  status: 'done' | 'error' | 'skipped'
  timestamp?: string
  leadId?: string
  createdAt?: string
}

// --- CNPJá API Types ---

export interface CnpjaOffice {
  updated: string
  taxId: string
  alias?: string
  founded: string
  head: boolean
  statusDate: string
  status: { id: number; text: string }
  address: {
    municipality: number
    street: string
    number: string
    district: string
    city: string
    state: string
    details?: string
    zip: string
    country: { id: number; name: string }
  }
  mainActivity: { id: number; text: string }
  sideActivities: Array<{ id: number; text: string }>
  phones: Array<{ type: 'MOBILE' | 'LANDLINE'; area: string; number: string }>
  emails: Array<{ ownership: string; address: string; domain: string }>
  registrations: Array<{
    number: string
    state: string
    enabled: boolean
    statusDate: string
    status: { id: number; text: string }
    type: { id: number; text: string }
  }>
  company: {
    id: number
    name: string
    equity: number
    nature: { id: number; text: string }
    size: { id: number; acronym: string; text: string }
    simples: { optant: boolean; since: string | null }
    simei: { optant: boolean; since: string | null }
    members: Array<{
      since: string
      person: {
        id: string
        type: 'NATURAL' | 'LEGAL' | 'FOREIGN'
        name: string
        taxId: string
        age: string
        country?: { id: number; name: string }
      }
      role: { id: number; text: string }
    }>
  }
}

export interface CnpjaSearchParams {
  'mainActivity.id'?: number
  'address.state'?: string
  'address.city'?: string
  'company.size.id'?: number
  'status.id'?: number
  page?: number
  limit?: number
}

// --- Assertiva API Types ---

export interface AssertivaToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface AssertivaPhone {
  numero: string
  tipo: 'celular' | 'fixo'
  operadora?: string
  whatsapp?: boolean
  hotphone?: boolean
  plus?: boolean
}

export interface AssertivaDecisionMaker {
  nome: string
  cpf?: string
  cargo?: string
  telefones: AssertivaPhone[]
  emails: Array<{ endereco: string }>
}

export interface AssertivaCompanyResult {
  razaoSocial?: string
  nomeFantasia?: string
  cnpj: string
  telefones: AssertivaPhone[]
  emails: Array<{ endereco: string }>
  socios: Array<{ nome: string; cpf?: string; qualificacao?: string }>
}
