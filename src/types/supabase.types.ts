// Tipos do Supabase para o OUTBILI.
// Database type permissivo (any por row) — a seguranca de tipo vive nas interfaces
// de dominio em src/types/index.ts (Lead, Contact, Partner, Activity, etc.).
// Quando o Supabase CLI for usado para gerar tipos estritos, este arquivo eh substituido.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Generic<R = any> = { Row: R; Insert: Partial<R>; Update: Partial<R> }

export type Database = {
  app: {
    Tables: {
      leads: Generic
      lead_phones: Generic
      lead_emails: Generic
      lead_social: Generic
      lead_partners: Generic
      lead_trademarks: Generic
      contacts: Generic
      activities: Generic
      enrichment_runs: Generic
      enrichment_jobs: Generic
      enrichment_costs: Generic
      pipeline_events: Generic
      campaigns: Generic
      campaign_targets: Generic
      profiles: Generic
      teams: Generic
      team_members: Generic
      sales_reps: Generic
      segments: Generic
      migration_state: Generic
      airtable_bridge_log: Generic
    }
    Views: Record<string, never>
    Functions: Record<string, any>
    Enums: {
      lead_status: 'Novo' | 'Qualificado' | 'Contactado' | 'Respondeu' | 'Reunião' | 'Proposta' | 'Fechado' | 'Perdido' | 'Pesquisado' | 'Excluir'
      lead_temperatura: 'Quente' | 'Morno' | 'Frio'
      lead_elo: '1' | '2' | '3' | '4' | '5' | '6A' | '6B' | '6C' | '6D' | '6.5' | '7' | 'cron-reenrichment'
      contact_type: 'decisor' | 'stakeholder' | 'influenciador'
      contact_source: 'cnpja' | 'assertiva' | 'manual' | 'pesca' | 'apify'
      phone_type: 'MOBILE' | 'LANDLINE'
      phone_source: 'cpf_decisor' | 'cpf_stakeholder' | 'cnpj_empresa' | 'website' | 'manual'
      phone_owner: 'decisor' | 'stakeholder' | 'empresa'
      user_role: 'admin' | 'sdr' | 'closer' | 'viewer'
      activity_type: 'nota' | 'whatsapp_enviado' | 'whatsapp_recebido' | 'reunião' | 'proposta' | 'status_change'
      apify_status: 'pending' | 'in_progress' | 'complete' | 'failed' | 'partial' | 'budget_exceeded'
      social_media_source: 'assertiva' | 'firecrawl' | 'mixed' | 'manual'
      partner_person_type: 'NATURAL' | 'LEGAL' | 'FOREIGN'
      website_source: 'apify_google_search' | 'apify_website_footer' | 'firecrawl' | 'assertiva' | 'manual'
      enrichment_priority: 'realtime' | 'high' | 'normal'
      enrichment_job_status: 'queued' | 'processing' | 'done' | 'failed' | 'retrying'
      enrichment_log_source: 'cnpja' | 'cnpja_n8n' | 'assertiva' | 'assertiva_decisores' | 'apify_instagram' | 'apify_linkedin' | 'apify_google_maps' | 'apify_seo' | 'apify_website' | 'apify_inpi' | 'vibeprospecting'
      enrichment_log_status: 'done' | 'error' | 'skipped'
      pipeline_event_status: 'start' | 'success' | 'failed' | 'skipped' | 'retry'
      pipeline_event_source: 'cnpja' | 'assertiva' | 'apify' | 'firecrawl' | 'anthropic' | 'manual' | 'cron'
      recommended_product: 'DR-X' | 'DR-E' | 'DR-T'
      strategic_analysis_status: 'pending' | 'in_progress' | 'complete' | 'failed'
      evidence_level: 'ouro' | 'prata' | 'bronze' | 'empresa' | 'empresa_nao_validado'
      digital_maturity: 'forte' | 'media' | 'fraca' | 'inexistente'
      campaign_status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Concluída' | 'Cancelada'
      campaign_type: 'cadencia_outbound' | 'follow_up' | 'reengajamento'
      segment_day_of_week: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'
      trademark_status: 'deferido' | 'indeferido' | 'arquivado' | 'vigente' | 'registrado' | 'publicado' | 'em andamento'
      migration_status: 'pending' | 'in_progress' | 'done' | 'failed'
    }
  }
  audit: {
    Tables: {
      audit_log: Generic
    }
    Views: Record<string, never>
    Functions: Record<string, any>
    Enums: Record<string, never>
  }
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, any>
    Enums: Record<string, never>
  }
}
