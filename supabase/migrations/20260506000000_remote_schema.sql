


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "airtable_fdw";


ALTER SCHEMA "airtable_fdw" OWNER TO "postgres";


COMMENT ON SCHEMA "airtable_fdw" IS 'Foreign tables Airtable. Migradas (Partners, Leads, etc.) sao DROPADAS apos cutover (story 021). Permanentes (inbox, conversations, message_templates) ficam como bridge cross-system.';



CREATE SCHEMA IF NOT EXISTS "app";


ALTER SCHEMA "app" OWNER TO "postgres";


COMMENT ON SCHEMA "app" IS 'Negocio (CRM, pipeline, enrichment). Tabelas migradas do Airtable + tabelas novas (enrichment_jobs, audit cross-system).';



CREATE SCHEMA IF NOT EXISTS "audit";


ALTER SCHEMA "audit" OWNER TO "postgres";


COMMENT ON SCHEMA "audit" IS 'Trilha imutavel de operacoes (audit_log centralizado). Apenas INSERT permitido via triggers, SELECT restrito a admin.';



CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "app"."activity_type" AS ENUM (
    'nota',
    'whatsapp_enviado',
    'whatsapp_recebido',
    'reunião',
    'proposta',
    'status_change'
);


ALTER TYPE "app"."activity_type" OWNER TO "postgres";


CREATE TYPE "app"."apify_status" AS ENUM (
    'pending',
    'in_progress',
    'complete',
    'failed',
    'partial',
    'budget_exceeded'
);


ALTER TYPE "app"."apify_status" OWNER TO "postgres";


CREATE TYPE "app"."bridge_direction" AS ENUM (
    'supabase_to_airtable',
    'airtable_to_supabase'
);


ALTER TYPE "app"."bridge_direction" OWNER TO "postgres";


CREATE TYPE "app"."campaign_status" AS ENUM (
    'Rascunho',
    'Ativa',
    'Pausada',
    'Concluída',
    'Cancelada'
);


ALTER TYPE "app"."campaign_status" OWNER TO "postgres";


CREATE TYPE "app"."campaign_type" AS ENUM (
    'cadencia_outbound',
    'follow_up',
    'reengajamento'
);


ALTER TYPE "app"."campaign_type" OWNER TO "postgres";


CREATE TYPE "app"."contact_source" AS ENUM (
    'cnpja',
    'assertiva',
    'manual',
    'pesca',
    'apify'
);


ALTER TYPE "app"."contact_source" OWNER TO "postgres";


CREATE TYPE "app"."contact_type" AS ENUM (
    'decisor',
    'stakeholder',
    'influenciador'
);


ALTER TYPE "app"."contact_type" OWNER TO "postgres";


CREATE TYPE "app"."digital_maturity" AS ENUM (
    'forte',
    'media',
    'fraca',
    'inexistente'
);


ALTER TYPE "app"."digital_maturity" OWNER TO "postgres";


CREATE TYPE "app"."enrichment_job_status" AS ENUM (
    'queued',
    'processing',
    'done',
    'failed',
    'retrying'
);


ALTER TYPE "app"."enrichment_job_status" OWNER TO "postgres";


CREATE TYPE "app"."enrichment_log_source" AS ENUM (
    'cnpja',
    'cnpja_n8n',
    'assertiva',
    'assertiva_decisores',
    'apify_instagram',
    'apify_linkedin',
    'apify_google_maps',
    'apify_seo',
    'apify_website',
    'apify_inpi',
    'vibeprospecting'
);


ALTER TYPE "app"."enrichment_log_source" OWNER TO "postgres";


CREATE TYPE "app"."enrichment_log_status" AS ENUM (
    'done',
    'error',
    'skipped'
);


ALTER TYPE "app"."enrichment_log_status" OWNER TO "postgres";


CREATE TYPE "app"."enrichment_priority" AS ENUM (
    'realtime',
    'high',
    'normal'
);


ALTER TYPE "app"."enrichment_priority" OWNER TO "postgres";


CREATE TYPE "app"."evidence_level" AS ENUM (
    'ouro',
    'prata',
    'bronze',
    'empresa',
    'empresa_nao_validado'
);


ALTER TYPE "app"."evidence_level" OWNER TO "postgres";


CREATE TYPE "app"."lead_elo" AS ENUM (
    '1',
    '2',
    '3',
    '4',
    '5',
    '6A',
    '6B',
    '6C',
    '6D',
    '6.5',
    '7',
    'cron-reenrichment'
);


ALTER TYPE "app"."lead_elo" OWNER TO "postgres";


CREATE TYPE "app"."lead_status" AS ENUM (
    'Novo',
    'Qualificado',
    'Contactado',
    'Respondeu',
    'Reunião',
    'Proposta',
    'Fechado',
    'Perdido',
    'Pesquisado',
    'Excluir'
);


ALTER TYPE "app"."lead_status" OWNER TO "postgres";


CREATE TYPE "app"."lead_temperatura" AS ENUM (
    'Quente',
    'Morno',
    'Frio'
);


ALTER TYPE "app"."lead_temperatura" OWNER TO "postgres";


CREATE TYPE "app"."migration_status" AS ENUM (
    'pending',
    'in_progress',
    'done',
    'failed'
);


ALTER TYPE "app"."migration_status" OWNER TO "postgres";


CREATE TYPE "app"."partner_person_type" AS ENUM (
    'NATURAL',
    'LEGAL',
    'FOREIGN'
);


ALTER TYPE "app"."partner_person_type" OWNER TO "postgres";


CREATE TYPE "app"."phone_owner" AS ENUM (
    'decisor',
    'stakeholder',
    'empresa'
);


ALTER TYPE "app"."phone_owner" OWNER TO "postgres";


CREATE TYPE "app"."phone_source" AS ENUM (
    'cpf_decisor',
    'cpf_stakeholder',
    'cnpj_empresa',
    'website',
    'manual'
);


ALTER TYPE "app"."phone_source" OWNER TO "postgres";


CREATE TYPE "app"."phone_type" AS ENUM (
    'MOBILE',
    'LANDLINE'
);


ALTER TYPE "app"."phone_type" OWNER TO "postgres";


CREATE TYPE "app"."pipeline_event_source" AS ENUM (
    'cnpja',
    'assertiva',
    'apify',
    'firecrawl',
    'anthropic',
    'manual',
    'cron'
);


ALTER TYPE "app"."pipeline_event_source" OWNER TO "postgres";


CREATE TYPE "app"."pipeline_event_status" AS ENUM (
    'start',
    'success',
    'failed',
    'skipped',
    'retry'
);


ALTER TYPE "app"."pipeline_event_status" OWNER TO "postgres";


CREATE TYPE "app"."recommended_product" AS ENUM (
    'DR-X',
    'DR-E',
    'DR-T'
);


ALTER TYPE "app"."recommended_product" OWNER TO "postgres";


CREATE TYPE "app"."segment_day_of_week" AS ENUM (
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta'
);


ALTER TYPE "app"."segment_day_of_week" OWNER TO "postgres";


CREATE TYPE "app"."social_media_source" AS ENUM (
    'assertiva',
    'firecrawl',
    'mixed',
    'manual'
);


ALTER TYPE "app"."social_media_source" OWNER TO "postgres";


CREATE TYPE "app"."strategic_analysis_status" AS ENUM (
    'pending',
    'in_progress',
    'complete',
    'failed'
);


ALTER TYPE "app"."strategic_analysis_status" OWNER TO "postgres";


CREATE TYPE "app"."trademark_status" AS ENUM (
    'deferido',
    'indeferido',
    'arquivado',
    'vigente',
    'registrado',
    'publicado',
    'em andamento'
);


ALTER TYPE "app"."trademark_status" OWNER TO "postgres";


CREATE TYPE "app"."user_role" AS ENUM (
    'admin',
    'sdr',
    'closer',
    'viewer'
);


ALTER TYPE "app"."user_role" OWNER TO "postgres";


CREATE TYPE "app"."website_source" AS ENUM (
    'apify_google_search',
    'apify_website_footer',
    'firecrawl',
    'assertiva',
    'manual'
);


ALTER TYPE "app"."website_source" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."denormalize_preferred_phone"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  best_phone text;
  target_lead_id uuid;
begin
  target_lead_id := coalesce(new.lead_id, old.lead_id);

  select e164 into best_phone
  from app.lead_phones
  where lead_id = target_lead_id and e164 is not null
  order by
    (validated = true) desc,
    (owner = 'decisor') desc,
    (type = 'MOBILE') desc,
    created_at asc
  limit 1;

  update app.leads
  set preferred_phone_e164 = best_phone,
      updated_at = now()
  where id = target_lead_id;

  return null;
end;
$$;


ALTER FUNCTION "app"."denormalize_preferred_phone"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."normalize_contact_whatsapp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.whatsapp is not null then
    new.whatsapp_e164 := app.normalize_phone_e164(new.whatsapp);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "app"."normalize_contact_whatsapp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."normalize_lead_phone"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.raw is not null and (new.e164 is null or new.e164 = '') then
    new.e164 := app.normalize_phone_e164(new.raw);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "app"."normalize_lead_phone"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."normalize_phone_e164"("raw" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
declare
  digits text;
begin
  if raw is null or raw = '' then return null; end if;
  digits := regexp_replace(raw, '[^0-9]', '', 'g');
  if length(digits) < 10 then return null; end if;
  if length(digits) = 13 and substring(digits, 1, 2) = '55' then
    return '+' || digits;
  end if;
  if length(digits) = 11 then return '+55' || digits; end if;
  if length(digits) = 10 then return '+55' || digits; end if;
  return '+' || digits;
end;
$$;


ALTER FUNCTION "app"."normalize_phone_e164"("raw" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "app"."normalize_phone_e164"("raw" "text") IS 'Normaliza telefone BR para formato E.164. Usado para bridge cross-system com Airtable Inbox (matching por phone). Fonte unica de normalizacao reutilizada por frontend e workers.';



CREATE OR REPLACE FUNCTION "app"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "app"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  claims jsonb;
  user_role text;
  user_team_id text;
  user_org_id text;
  user_full_name text;
begin
  -- Le metadata do user em app.profiles
  select
    p.role::text,
    p.team_id::text,
    p.org_id::text,
    p.full_name
  into
    user_role,
    user_team_id,
    user_org_id,
    user_full_name
  from app.profiles p
  where p.user_id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  -- Injeta no app_metadata (sobrescreve se existir)
  if user_role is not null then
    claims := jsonb_set(claims, '{app_metadata}', coalesce(claims -> 'app_metadata', '{}'::jsonb));
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));

    if user_team_id is not null then
      claims := jsonb_set(claims, '{app_metadata,team_id}', to_jsonb(user_team_id));
    end if;

    if user_org_id is not null then
      claims := jsonb_set(claims, '{app_metadata,org_id}', to_jsonb(user_org_id));
    end if;

    if user_full_name is not null then
      claims := jsonb_set(claims, '{app_metadata,full_name}', to_jsonb(user_full_name));
    end if;
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") IS 'Custom JWT hook do Supabase Auth: injeta role/team_id/org_id/full_name em app_metadata. Habilitar manualmente em Dashboard -> Authentication -> Hooks. Story 006.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  default_role app.user_role := 'viewer';
  user_full_name text;
begin
  -- Tenta extrair full_name do raw_user_meta_data
  user_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  -- Promove para admin apenas o email institucional
  -- (Mantem retrocompatibilidade com authService.ts:42 do legacy)
  if new.email = 'luizhenrique.benicio@v4company.com' then
    default_role := 'admin';
  end if;

  insert into app.profiles (
    user_id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email::citext,
    user_full_name,
    default_role,
    false,  -- inativo ate user completar password reset (story 016)
    now(),
    now()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(app.profiles.full_name, excluded.full_name),
        updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger AFTER INSERT em auth.users: cria automaticamente app.profiles com role default viewer (admin para email institucional V4). Story 006 do epic EPIC-airtable-to-supabase-migration.';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.email != old.email then
    update app.profiles
    set email = new.email::citext,
        updated_at = now()
    where user_id = new.id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_profile_email"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "airtable_wrapper" HANDLER "extensions"."airtable_fdw_handler" VALIDATOR "extensions"."airtable_fdw_validator";




COMMENT ON FOREIGN DATA WRAPPER "airtable_wrapper" IS 'Wrapper FDW oficial Supabase para Airtable. Story 001 do epic EPIC-airtable-to-supabase-migration. Server criado dinamicamente em scripts/setup-vault.sh.';



CREATE SERVER "airtable_server" FOREIGN DATA WRAPPER "airtable_wrapper" OPTIONS (
    "api_key_id" 'a178fe7f-1ac7-462d-bfd9-2c335df95a84'
);


ALTER SERVER "airtable_server" OWNER TO "postgres";


COMMENT ON SERVER "airtable_server" IS 'Server Airtable do outbili-spo. PAT em vault.secrets where name=airtable_pat. Recriado por scripts/setup-vault.sh quando rotation do PAT acontece. Documentado em docs/migration/01-runbook.md.';



CREATE FOREIGN TABLE "airtable_fdw"."activities" (
    "airtable_id" "text",
    "leadId" "text",
    "contactId" "text",
    "type" "text",
    "description" "text",
    "createdBy" "text",
    "LeadActivity" "text",
    "ContactActivity" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblFfkXxgxdOhqy9l'
);


ALTER FOREIGN TABLE "airtable_fdw"."activities" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."activities" IS 'EM ESCOPO MIGRACAO: Activities no Airtable. Story 003. 7 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."activity_log" (
    "airtable_id" "text",
    "action" "text",
    "userId" "text",
    "userEmail" "text",
    "userName" "text",
    "page" "text",
    "details" "text",
    "ipAddress" "text",
    "timestamp" "text",
    "User" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblNRKYA3XBRI1c4W'
);


ALTER FOREIGN TABLE "airtable_fdw"."activity_log" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."activity_log" IS 'EM ESCOPO MIGRACAO: ActivityLog no Airtable. Story 003. 9 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."campaigns" (
    "airtable_id" "text",
    "name" "text",
    "type" "text",
    "status" "text",
    "segment" "text",
    "steps" "text",
    "totalLeads" "text",
    "messagesSent" "text",
    "delivered" "text",
    "read" "text",
    "responses" "text",
    "Messages" "text",
    "LeadLinks" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblWn2UjabQkdbNIl'
);


ALTER FOREIGN TABLE "airtable_fdw"."campaigns" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."campaigns" IS 'EM ESCOPO MIGRACAO: Campaigns no Airtable. Story 003. 12 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."contacts" (
    "airtable_id" "text",
    "name" "text",
    "role" "text",
    "contactType" "text",
    "whatsapp" "text",
    "email" "text",
    "leadId" "text",
    "bilinskizapContactId" "text",
    "cpf" "text",
    "whatsappConfirmed" "text",
    "phoneIsHot" "text",
    "source" "text",
    "Lead" "text",
    "Activities" "text",
    "Messages" "text",
    "linkedinUrl" "text",
    "phone" "text",
    "personalNotes" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblPmpyaqQpZlxFo5'
);


ALTER FOREIGN TABLE "airtable_fdw"."contacts" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."contacts" IS 'EM ESCOPO MIGRACAO: Contacts no Airtable. Story 003. 17 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."enrichment_log" (
    "airtable_id" "text",
    "detail" "text",
    "source" "text",
    "status" "text",
    "timestamp" "text",
    "Lead" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tbl4C9ttN9oSVUwaM'
);


ALTER FOREIGN TABLE "airtable_fdw"."enrichment_log" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."enrichment_log" IS 'EM ESCOPO MIGRACAO: EnrichmentLog no Airtable. Story 003. 5 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."leads" (
    "airtable_id" "text",
    "companyName" "text",
    "tradeName" "text",
    "cnpj" "text",
    "segment" "text",
    "tier" "text",
    "monthlyRevenue" "text",
    "status" "text",
    "score" "text",
    "temperatura" "text",
    "spicedS" "text",
    "spicedP" "text",
    "spicedI" "text",
    "spicedC" "text",
    "spicedD" "text",
    "spicedNotes" "text",
    "hypotheticalTrap" "text",
    "website" "text",
    "instagram" "text",
    "linkedin" "text",
    "facebook" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "employees" "text",
    "yearsInMarket" "text",
    "businessSummary" "text",
    "marketContext" "text",
    "productPortfolio" "text",
    "techStack" "text",
    "projectionData" "text",
    "vulnerabilities" "text",
    "competitiveAnalysis" "text",
    "salesArguments" "text",
    "meetingPrep" "text",
    "discoveryQuestions" "text",
    "eligibilityChecklist" "text",
    "sourceHtmlReport" "text",
    "enrichmentStatus" "text",
    "rfPhone" "text",
    "rfEmail" "text",
    "partners" "text",
    "capitalSocial" "text",
    "legalNature" "text",
    "registrationStatus" "text",
    "foundingDate" "text",
    "cnaePrimary" "text",
    "taxRegime" "text",
    "cnaeSecondary" "text",
    "enrichmentSources" "text",
    "enrichmentLog" "text",
    "googleRating" "text",
    "googleReviewsCount" "text",
    "instagramFollowers" "text",
    "instagramIsVerified" "text",
    "instagramIsBusiness" "text",
    "instagramCategory" "text",
    "instagramBio" "text",
    "linkedinEmployeeCount" "text",
    "latitude" "text",
    "longitude" "text",
    "domainActive" "text",
    "domainExpiry" "text",
    "inpiTrademarks" "text",
    "inpiTrademarkCount" "text",
    "inpiHasRegisteredTrademark" "text",
    "zipCode" "text",
    "district" "text",
    "municipalityCode" "text",
    "phoneType" "text",
    "simplesOptant" "text",
    "simplesSince" "text",
    "isHeadquarters" "text",
    "cnpjaLastUpdate" "text",
    "statusDate" "text",
    "emailDomain" "text",
    "Contacts" "text",
    "Activities" "text",
    "Messages" "text",
    "Campaigns" "text",
    "Socios" "text",
    "Trademarks" "text",
    "LogEnriquecimento" "text",
    "assertivaPhoneValidated" "text",
    "assertivaWhatsappFlag" "text",
    "assertivaEmailValidated" "text",
    "assertivaCpfDecisor" "text",
    "assertivaIncomeEstimate" "text",
    "assertivaCreditScore" "text",
    "assertivaSocialMedia" "text",
    "tiktok" "text",
    "socialMediaExtractedAt" "text",
    "socialMediaSource" "text",
    "evidenceLevel" "text",
    "phoneOwner" "text",
    "phoneOwnerName" "text",
    "phoneSource" "text",
    "whatsappValidated" "text",
    "whatsappCheckedAt" "text",
    "websiteCanonical" "text",
    "websiteSource" "text",
    "websiteContentSummary" "text",
    "websiteEmails" "text",
    "websitePhones" "text",
    "instagramEngagementRate" "text",
    "instagramLastPost" "text",
    "digitalMaturity" "text",
    "linkedinIndustry" "text",
    "linkedinHeadquarters" "text",
    "apifyStatus" "text",
    "apifyEnrichedAt" "text",
    "pain" "text",
    "wtpMin" "text",
    "wtpMax" "text",
    "recommendedProduct" "text",
    "strategicAnalysisStatus" "text",
    "PipelineEvents" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tbl95vm8YGdJHGeWa'
);


ALTER FOREIGN TABLE "airtable_fdw"."leads" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."leads" IS 'EM ESCOPO MIGRACAO: Leads no Airtable. Story 003. 116 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."messages" (
    "airtable_id" "text",
    "campaignId" "text",
    "contactId" "text",
    "leadId" "text",
    "stepNumber" "text",
    "content" "text",
    "status" "text",
    "bilinskizapMessageId" "text",
    "scheduledAt" "text",
    "sentAt" "text",
    "deliveredAt" "text",
    "readAt" "text",
    "errorMessage" "text",
    "Campaign" "text",
    "Contact" "text",
    "LeadLink" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblmZ4OdDZKArkvjS'
);


ALTER FOREIGN TABLE "airtable_fdw"."messages" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."messages" IS 'BRIDGE PERMANENTE: Messages no Airtable. Story 003. 15 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."partners" (
    "airtable_id" "text",
    "name" "text",
    "qualification" "text",
    "since" "text",
    "ageRange" "text",
    "personType" "text",
    "cpf" "text",
    "Lead" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblJiia6mqARxwEfm'
);


ALTER FOREIGN TABLE "airtable_fdw"."partners" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."partners" IS 'EM ESCOPO MIGRACAO: Partners no Airtable. Story 003. 7 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."pipeline_events" (
    "airtable_id" "text",
    "eventName" "text",
    "elo" "text",
    "status" "text",
    "source" "text",
    "durationMs" "text",
    "timestamp" "text",
    "errorMessage" "text",
    "metadata" "text",
    "Lead" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tbl5ZQad6qceZr5jn'
);


ALTER FOREIGN TABLE "airtable_fdw"."pipeline_events" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."pipeline_events" IS 'EM ESCOPO MIGRACAO: PipelineEvents no Airtable. Story 003. 9 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."segments" (
    "airtable_id" "text",
    "name" "text",
    "slug" "text",
    "dayOfWeek" "text",
    "subSegments" "text",
    "isActive" "text",
    "color" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblHilXTilUFBIZl3'
);


ALTER FOREIGN TABLE "airtable_fdw"."segments" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."segments" IS 'EM ESCOPO MIGRACAO: Segments no Airtable. Story 003. 6 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."trademarks" (
    "airtable_id" "text",
    "marca" "text",
    "numero" "text",
    "status" "text",
    "classe" "text",
    "Lead" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tbl6jrWwOPh9qmVap'
);


ALTER FOREIGN TABLE "airtable_fdw"."trademarks" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."trademarks" IS 'EM ESCOPO MIGRACAO: Trademarks no Airtable. Story 003. 5 campos.';



CREATE FOREIGN TABLE "airtable_fdw"."users" (
    "airtable_id" "text",
    "email" "text",
    "passwordHash" "text",
    "fullName" "text",
    "role" "text",
    "isActive" "text",
    "lastLoginAt" "text",
    "avatarUrl" "text",
    "createdAt" "text",
    "ActivityLog" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appKh4qQ5JN94dQHv',
    "rowid_column" 'airtable_id',
    "table_id" 'tblgGkAOQyt3lNUp6'
);


ALTER FOREIGN TABLE "airtable_fdw"."users" OWNER TO "postgres";


COMMENT ON FOREIGN TABLE "airtable_fdw"."users" IS 'EM ESCOPO MIGRACAO: Users no Airtable. Story 003. 9 campos.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "app"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "lead_id" "uuid",
    "contact_id" "uuid",
    "airtable_record_id" "text",
    "type" "app"."activity_type" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."airtable_bridge_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "direction" "app"."bridge_direction" NOT NULL,
    "operation" "text" NOT NULL,
    "supabase_id" "text",
    "airtable_record_id" "text",
    "payload" "jsonb",
    "status" "text",
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."airtable_bridge_log" OWNER TO "postgres";


COMMENT ON TABLE "app"."airtable_bridge_log" IS 'Log de operacoes cross-system entre Supabase e Airtable (Inbox WhatsApp). Util para debug. Purgada apos 30 dias via pg_cron.';



CREATE TABLE IF NOT EXISTS "app"."campaign_targets" (
    "campaign_id" "uuid" NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "status" "text",
    "dispatched_at" timestamp with time zone,
    "message_airtable_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."campaign_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "type" "app"."campaign_type",
    "status" "app"."campaign_status" DEFAULT 'Rascunho'::"app"."campaign_status",
    "segment" "text",
    "steps" "text",
    "total_leads" integer,
    "messages_sent" integer DEFAULT 0 NOT NULL,
    "delivered" integer DEFAULT 0 NOT NULL,
    "read" integer DEFAULT 0 NOT NULL,
    "responses" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "scheduled_at" timestamp with time zone,
    "executed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "lead_id" "uuid",
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "role" "text",
    "contact_type" "app"."contact_type",
    "whatsapp" "text",
    "whatsapp_e164" "text",
    "whatsapp_confirmed" boolean,
    "phone" "text",
    "email" "public"."citext",
    "cpf_encrypted" "bytea",
    "phone_is_hot" boolean,
    "source" "app"."contact_source",
    "bilinskizap_contact_id" "text",
    "linkedin_url" "text",
    "personal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "app"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."enrichment_costs" (
    "date" "date" NOT NULL,
    "source" "app"."enrichment_log_source" NOT NULL,
    "total_cost_usd" numeric(10,4) DEFAULT 0 NOT NULL,
    "total_credits" integer DEFAULT 0 NOT NULL,
    "requests_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "app"."enrichment_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."enrichment_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "priority" "app"."enrichment_priority" DEFAULT 'normal'::"app"."enrichment_priority" NOT NULL,
    "status" "app"."enrichment_job_status" DEFAULT 'queued'::"app"."enrichment_job_status" NOT NULL,
    "requested_by" "uuid",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "attempts" integer DEFAULT 0 NOT NULL,
    "error" "text",
    "metadata" "jsonb"
);


ALTER TABLE "app"."enrichment_jobs" OWNER TO "postgres";


COMMENT ON TABLE "app"."enrichment_jobs" IS 'Fila event-driven para re-enriquecimento INSTANTANEO (substitui cron-reenrichment diario). Worker enrichment-runner subscribe via Realtime e processa em <5s. pg_cron sweeper de 60s adiciona stale leads como safety net.';



COMMENT ON COLUMN "app"."enrichment_jobs"."priority" IS 'realtime: SDR clicou re-enriquecer (UI). high: novo lead criado. normal: sweeper detectou staleness.';



CREATE TABLE IF NOT EXISTS "app"."enrichment_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "airtable_record_id" "text",
    "source" "app"."enrichment_log_source" NOT NULL,
    "status" "app"."enrichment_log_status" NOT NULL,
    "detail" "text",
    "cost_usd" numeric(8,4),
    "credits_used" integer,
    "result" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone
);


ALTER TABLE "app"."enrichment_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."lead_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "email" "public"."citext" NOT NULL,
    "source" "text",
    "validated" boolean,
    "validated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."lead_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "airtable_record_id" "text",
    "cnpj" "text",
    "company_name" "text" NOT NULL,
    "trade_name" "text",
    "segment" "text",
    "segment_id" "uuid",
    "tier" "text",
    "status" "app"."lead_status" DEFAULT 'Novo'::"app"."lead_status",
    "elo" "app"."lead_elo",
    "temperatura" "app"."lead_temperatura",
    "score" numeric(5,2),
    "spiced_s" integer,
    "spiced_p" integer,
    "spiced_i" integer,
    "spiced_c" integer,
    "spiced_d" integer,
    "spiced_notes" "text",
    "hypothetical_trap" "text",
    "website" "text",
    "website_canonical" "text",
    "website_source" "app"."website_source",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "district" "text",
    "municipality_code" integer,
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "monthly_revenue" numeric(14,2),
    "capital_social" numeric(14,2),
    "legal_nature" "text",
    "registration_status" "text",
    "founding_date" "date",
    "cnae_primary" "text",
    "cnae_secondary" "text",
    "tax_regime" "text",
    "is_headquarters" boolean,
    "status_date" "date",
    "cnpja_last_update" timestamp with time zone,
    "email_domain" "text",
    "rf_phone" "text",
    "rf_email" "public"."citext",
    "employees" integer,
    "years_in_market" integer,
    "business_summary" "text",
    "market_context" "text",
    "product_portfolio" "text",
    "tech_stack" "text",
    "projection_data" "text",
    "vulnerabilities" "text",
    "competitive_analysis" "text",
    "sales_arguments" "text",
    "meeting_prep" "text",
    "discovery_questions" "text",
    "eligibility_checklist" "text",
    "source_html_report" "text",
    "enrichment_status" "text",
    "enrichment_sources" "text",
    "enrichment_log" "text",
    "google_rating" numeric(2,1),
    "google_reviews_count" integer,
    "apify_status" "app"."apify_status",
    "apify_enriched_at" timestamp with time zone,
    "domain_active" boolean,
    "domain_expiry" "text",
    "inpi_trademarks" "text",
    "inpi_trademark_count" integer,
    "inpi_has_registered_trademark" boolean,
    "phone_type" "app"."phone_type",
    "phone_owner" "app"."phone_owner",
    "phone_owner_name" "text",
    "phone_source" "app"."phone_source",
    "evidence_level" "app"."evidence_level",
    "whatsapp_validated" boolean,
    "whatsapp_checked_at" timestamp with time zone,
    "social_media_source" "app"."social_media_source",
    "social_media_extracted_at" timestamp with time zone,
    "digital_maturity" "app"."digital_maturity",
    "pain" "text",
    "wtp_min" integer,
    "wtp_max" integer,
    "recommended_product" "app"."recommended_product",
    "strategic_analysis_status" "app"."strategic_analysis_status",
    "assertiva_phone_validated" "text",
    "assertiva_whatsapp_flag" boolean,
    "assertiva_email_validated" "public"."citext",
    "assertiva_cpf_decisor_encrypted" "bytea",
    "assertiva_income_estimate" integer,
    "assertiva_credit_score" integer,
    "assertiva_social_media" "text",
    "preferred_phone_e164" "text",
    "simples_optant" boolean,
    "simples_since" "date",
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "leads_spiced_c_check" CHECK ((("spiced_c" >= 0) AND ("spiced_c" <= 5))),
    CONSTRAINT "leads_spiced_d_check" CHECK ((("spiced_d" >= 0) AND ("spiced_d" <= 5))),
    CONSTRAINT "leads_spiced_i_check" CHECK ((("spiced_i" >= 0) AND ("spiced_i" <= 5))),
    CONSTRAINT "leads_spiced_p_check" CHECK ((("spiced_p" >= 0) AND ("spiced_p" <= 5))),
    CONSTRAINT "leads_spiced_s_check" CHECK ((("spiced_s" >= 0) AND ("spiced_s" <= 5))),
    CONSTRAINT "leads_tier_check" CHECK (("tier" = ANY (ARRAY['Micro+'::"text", 'Small'::"text", 'Medium-'::"text", 'Medium='::"text", 'Medium (=)'::"text", 'Medium (-)'::"text"])))
);


ALTER TABLE "app"."leads" OWNER TO "postgres";


COMMENT ON TABLE "app"."leads" IS 'Tabela nucleo do CRM. Decompoe os 116 campos do Airtable Leads em core (esta tabela ~80 campos) + lead_phones + lead_emails + lead_social + lead_partners + lead_trademarks. CPFs criptografados com pgsodium. preferred_phone_e164 eh denormalizada via trigger sobre lead_phones para acelerar bridge com Airtable Inbox.';



COMMENT ON COLUMN "app"."leads"."assertiva_cpf_decisor_encrypted" IS 'CPF do decisor criptografado via pgsodium. Acesso plaintext apenas via funcao SECURITY DEFINER read_pii(lead_id) que loga em audit_log.';



COMMENT ON COLUMN "app"."leads"."preferred_phone_e164" IS 'Phone E.164 denormalizado da melhor opcao em lead_phones (validado > decisor > mobile). Atualizado por trigger denormalize_preferred_phone. Usado para bridge cross-system com Airtable Inbox.';



CREATE OR REPLACE VIEW "app"."lead_inbox_view" AS
 SELECT "l"."id" AS "lead_id",
    "l"."org_id",
    "l"."airtable_record_id" AS "lead_airtable_id",
    "l"."cnpj",
    "l"."company_name",
    "l"."trade_name",
    "l"."preferred_phone_e164",
    "l"."elo",
    "l"."temperatura",
    "l"."status" AS "lead_status",
    "l"."score",
    "l"."recommended_product",
    "l"."evidence_level",
    "l"."assigned_to",
    "l"."created_at" AS "lead_created_at",
    "l"."updated_at" AS "lead_updated_at",
    "m"."airtable_id" AS "inbox_thread_id",
    "m"."status" AS "message_status",
    "m"."content" AS "last_message_preview",
    "m"."sentAt" AS "last_sent_at",
    "m"."deliveredAt" AS "last_delivered_at",
    "m"."readAt" AS "last_read_at",
    ("m"."airtable_id" IS NOT NULL) AS "has_inbox_thread",
    ("m"."status" = 'Respondeu'::"text") AS "has_response"
   FROM ("app"."leads" "l"
     LEFT JOIN "airtable_fdw"."messages" "m" ON (("m"."leadId" = "l"."airtable_record_id")))
  WHERE ("l"."deleted_at" IS NULL);


ALTER VIEW "app"."lead_inbox_view" OWNER TO "postgres";


COMMENT ON VIEW "app"."lead_inbox_view" IS 'Bridge cross-system entre app.leads (Supabase) e Airtable Messages (FDW). Story 004 do epic EPIC-airtable-to-supabase-migration.';



CREATE TABLE IF NOT EXISTS "app"."lead_partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "qualification" "text",
    "since" "date",
    "age_range" "text",
    "person_type" "app"."partner_person_type",
    "cpf_encrypted" "bytea",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."lead_partners" OWNER TO "postgres";


COMMENT ON TABLE "app"."lead_partners" IS 'QSA da empresa (socios CNPJa). Era "Partners" na Airtable. CPF criptografado via pgsodium. 1:1 ou 1:N com leads dependendo do CNPJa.';



CREATE TABLE IF NOT EXISTS "app"."lead_phones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "e164" "text" NOT NULL,
    "raw" "text",
    "type" "app"."phone_type",
    "source" "app"."phone_source",
    "owner" "app"."phone_owner",
    "owner_name" "text",
    "is_whatsapp" boolean,
    "is_hotphone" boolean,
    "validated" boolean,
    "validated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."lead_phones" OWNER TO "postgres";


COMMENT ON TABLE "app"."lead_phones" IS 'Telefones por lead (1:N). Cada row eh uma origem (RF, Assertiva, website, manual). Trigger denormalize_phone atualiza app.leads.preferred_phone_e164 = melhor phone (validado, decisor, mobile preferido).';



CREATE TABLE IF NOT EXISTS "app"."lead_social" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "url" "text",
    "handle" "text",
    "followers" integer,
    "is_verified" boolean,
    "is_business" boolean,
    "category" "text",
    "bio" "text",
    "engagement_rate" numeric(7,4),
    "last_post_at" "date",
    "industry" "text",
    "headquarters" "text",
    "employee_count" integer,
    "source" "app"."social_media_source",
    "extracted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lead_social_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'linkedin'::"text", 'tiktok'::"text", 'facebook'::"text"])))
);


ALTER TABLE "app"."lead_social" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."lead_trademarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "airtable_record_id" "text",
    "marca" "text" NOT NULL,
    "numero" "text",
    "status" "app"."trademark_status",
    "classe" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."lead_trademarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."migration_state" (
    "table_name" "text" NOT NULL,
    "airtable_records_total" integer,
    "supabase_records_inserted" integer,
    "last_synced_at" timestamp with time zone,
    "status" "app"."migration_status" DEFAULT 'pending'::"app"."migration_status" NOT NULL,
    "errors" "jsonb",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone
);


ALTER TABLE "app"."migration_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."pipeline_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "lead_id" "uuid",
    "airtable_record_id" "text",
    "event_name" "text",
    "elo" "app"."lead_elo" NOT NULL,
    "status" "app"."pipeline_event_status" NOT NULL,
    "source" "app"."pipeline_event_source" NOT NULL,
    "duration_ms" integer,
    "error_message" "text",
    "metadata" "jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."pipeline_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "airtable_record_id" "text",
    "email" "public"."citext" NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "role" "app"."user_role" DEFAULT 'viewer'::"app"."user_role" NOT NULL,
    "team_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "app"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "app"."profiles" IS 'Perfil 1:1 com auth.users. Campos role/team injetados em JWT via custom_access_token_hook. Migracao: hashes SHA-256 do Airtable NAO sao importados; force password reset via generateLink(recovery).';



CREATE TABLE IF NOT EXISTS "app"."sales_reps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "profile_id" "uuid",
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "role" "text",
    "tier" "text",
    "quota_monthly" numeric(12,2),
    "email" "public"."citext",
    "phone" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."sales_reps" OWNER TO "postgres";


COMMENT ON TABLE "app"."sales_reps" IS 'Time comercial (SDR, BDR, Closer). Ortogonal a profiles - alguns profiles tambem tem sales_reps row para dados de quota e atribuicao. Tabela vazia inicialmente, sera populada manualmente ou via Airtable se houver dados.';



CREATE TABLE IF NOT EXISTS "app"."segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "slug" "text",
    "day_of_week" "app"."segment_day_of_week",
    "sub_segments" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."segments" OWNER TO "postgres";


COMMENT ON TABLE "app"."segments" IS 'Segmentos verticais (ex: estetica, odonto, fitness). Day of week para rotation de targeting.';



CREATE TABLE IF NOT EXISTS "app"."team_members" (
    "team_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."teams" OWNER TO "postgres";


COMMENT ON TABLE "app"."teams" IS 'Times comerciais (ex: Time A, Time B). Usado para particionar leads por team_id.';



CREATE TABLE IF NOT EXISTS "audit"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_user_id" "uuid",
    "actor_role" "text",
    "actor_email" "text",
    "action" "text" NOT NULL,
    "resource_schema" "text",
    "resource_table" "text",
    "resource_id" "text",
    "before" "jsonb",
    "after" "jsonb",
    "ip" "inet",
    "user_agent" "text",
    "request_id" "text",
    "airtable_record_id" "text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '5 years'::interval)
);


ALTER TABLE "audit"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "audit"."audit_log" IS 'Trilha imutavel de operacoes. INSERT-only via triggers ou logger. SELECT restrito a admin. Retencao 5 anos via pg_cron purge job. LGPD compliant.';



ALTER TABLE ONLY "app"."activities"
    ADD CONSTRAINT "activities_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."airtable_bridge_log"
    ADD CONSTRAINT "airtable_bridge_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_pkey" PRIMARY KEY ("campaign_id", "lead_id");



ALTER TABLE ONLY "app"."campaigns"
    ADD CONSTRAINT "campaigns_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."contacts"
    ADD CONSTRAINT "contacts_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."enrichment_costs"
    ADD CONSTRAINT "enrichment_costs_pkey" PRIMARY KEY ("date", "source");



ALTER TABLE ONLY "app"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."enrichment_runs"
    ADD CONSTRAINT "enrichment_runs_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."enrichment_runs"
    ADD CONSTRAINT "enrichment_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."lead_emails"
    ADD CONSTRAINT "lead_emails_lead_id_email_key" UNIQUE ("lead_id", "email");



ALTER TABLE ONLY "app"."lead_emails"
    ADD CONSTRAINT "lead_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."lead_partners"
    ADD CONSTRAINT "lead_partners_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."lead_partners"
    ADD CONSTRAINT "lead_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."lead_phones"
    ADD CONSTRAINT "lead_phones_lead_id_e164_key" UNIQUE ("lead_id", "e164");



ALTER TABLE ONLY "app"."lead_phones"
    ADD CONSTRAINT "lead_phones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."lead_social"
    ADD CONSTRAINT "lead_social_lead_id_platform_key" UNIQUE ("lead_id", "platform");



ALTER TABLE ONLY "app"."lead_social"
    ADD CONSTRAINT "lead_social_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."lead_trademarks"
    ADD CONSTRAINT "lead_trademarks_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."lead_trademarks"
    ADD CONSTRAINT "lead_trademarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."leads"
    ADD CONSTRAINT "leads_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."migration_state"
    ADD CONSTRAINT "migration_state_pkey" PRIMARY KEY ("table_name");



ALTER TABLE ONLY "app"."pipeline_events"
    ADD CONSTRAINT "pipeline_events_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."pipeline_events"
    ADD CONSTRAINT "pipeline_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "app"."sales_reps"
    ADD CONSTRAINT "sales_reps_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."sales_reps"
    ADD CONSTRAINT "sales_reps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."sales_reps"
    ADD CONSTRAINT "sales_reps_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "app"."segments"
    ADD CONSTRAINT "segments_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "app"."segments"
    ADD CONSTRAINT "segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."segments"
    ADD CONSTRAINT "segments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "app"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "profile_id");



ALTER TABLE ONLY "app"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "audit"."audit_log"
    ADD CONSTRAINT "audit_log_airtable_record_id_uq" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "audit"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "activities_contact" ON "app"."activities" USING "btree" ("contact_id") WHERE ("contact_id" IS NOT NULL);



CREATE INDEX "activities_lead" ON "app"."activities" USING "btree" ("lead_id", "occurred_at" DESC);



CREATE INDEX "campaign_targets_lead" ON "app"."campaign_targets" USING "btree" ("lead_id");



CREATE INDEX "contacts_created_at" ON "app"."contacts" USING "btree" ("created_at" DESC);



CREATE INDEX "contacts_lead" ON "app"."contacts" USING "btree" ("lead_id") WHERE ("lead_id" IS NOT NULL);



CREATE INDEX "contacts_name_trgm" ON "app"."contacts" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "contacts_whatsapp" ON "app"."contacts" USING "btree" ("whatsapp_e164") WHERE ("whatsapp_e164" IS NOT NULL);



CREATE UNIQUE INDEX "enrichment_jobs_active_uniq" ON "app"."enrichment_jobs" USING "btree" ("lead_id") WHERE ("status" = ANY (ARRAY['queued'::"app"."enrichment_job_status", 'processing'::"app"."enrichment_job_status"]));



CREATE INDEX "enrichment_jobs_status_priority" ON "app"."enrichment_jobs" USING "btree" ("status", "priority", "requested_at");



CREATE INDEX "enrichment_runs_lead" ON "app"."enrichment_runs" USING "btree" ("lead_id", "started_at" DESC);



CREATE INDEX "enrichment_runs_source" ON "app"."enrichment_runs" USING "btree" ("source", "started_at" DESC);



CREATE INDEX "lead_emails_lead" ON "app"."lead_emails" USING "btree" ("lead_id");



CREATE INDEX "lead_phones_created_at" ON "app"."lead_phones" USING "btree" ("created_at" DESC);



CREATE INDEX "lead_phones_e164" ON "app"."lead_phones" USING "btree" ("e164");



CREATE INDEX "lead_phones_lead" ON "app"."lead_phones" USING "btree" ("lead_id");



CREATE INDEX "lead_social_lead" ON "app"."lead_social" USING "btree" ("lead_id");



CREATE INDEX "leads_active" ON "app"."leads" USING "btree" ("org_id", "updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_assigned" ON "app"."leads" USING "btree" ("assigned_to", "updated_at" DESC);



CREATE UNIQUE INDEX "leads_cnpj_uniq" ON "app"."leads" USING "btree" ("cnpj") WHERE ("cnpj" IS NOT NULL);



CREATE INDEX "leads_company_trgm" ON "app"."leads" USING "gin" ("company_name" "public"."gin_trgm_ops");



CREATE INDEX "leads_created_at" ON "app"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "leads_org_elo" ON "app"."leads" USING "btree" ("org_id", "elo", "updated_at" DESC);



CREATE INDEX "leads_org_temp_score" ON "app"."leads" USING "btree" ("org_id", "temperatura", "score" DESC NULLS LAST);



CREATE INDEX "leads_phone_e164" ON "app"."leads" USING "btree" ("preferred_phone_e164") WHERE ("preferred_phone_e164" IS NOT NULL);



CREATE INDEX "leads_segment" ON "app"."leads" USING "btree" ("segment_id") WHERE ("segment_id" IS NOT NULL);



CREATE INDEX "leads_trade_trgm" ON "app"."leads" USING "gin" ("trade_name" "public"."gin_trgm_ops") WHERE ("trade_name" IS NOT NULL);



CREATE INDEX "pipeline_events_brin" ON "app"."pipeline_events" USING "brin" ("occurred_at");



CREATE INDEX "pipeline_events_elo_status" ON "app"."pipeline_events" USING "btree" ("elo", "status", "occurred_at" DESC);



CREATE INDEX "pipeline_events_lead" ON "app"."pipeline_events" USING "btree" ("lead_id", "occurred_at" DESC);



CREATE INDEX "profiles_team" ON "app"."profiles" USING "btree" ("team_id") WHERE ("team_id" IS NOT NULL);



CREATE INDEX "audit_actor" ON "audit"."audit_log" USING "btree" ("actor_user_id", "occurred_at" DESC);



CREATE INDEX "audit_brin" ON "audit"."audit_log" USING "brin" ("occurred_at");



CREATE INDEX "audit_resource" ON "audit"."audit_log" USING "btree" ("resource_table", "resource_id", "occurred_at" DESC);



CREATE OR REPLACE TRIGGER "trg_campaigns_updated_at" BEFORE UPDATE ON "app"."campaigns" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_contacts_normalize_whatsapp" BEFORE INSERT OR UPDATE ON "app"."contacts" FOR EACH ROW EXECUTE FUNCTION "app"."normalize_contact_whatsapp"();



CREATE OR REPLACE TRIGGER "trg_contacts_updated_at" BEFORE UPDATE ON "app"."contacts" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_lead_partners_updated_at" BEFORE UPDATE ON "app"."lead_partners" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_lead_phones_denormalize" AFTER INSERT OR DELETE OR UPDATE ON "app"."lead_phones" FOR EACH ROW EXECUTE FUNCTION "app"."denormalize_preferred_phone"();



CREATE OR REPLACE TRIGGER "trg_lead_phones_normalize" BEFORE INSERT OR UPDATE ON "app"."lead_phones" FOR EACH ROW EXECUTE FUNCTION "app"."normalize_lead_phone"();



CREATE OR REPLACE TRIGGER "trg_leads_updated_at" BEFORE UPDATE ON "app"."leads" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "app"."profiles" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sales_reps_updated_at" BEFORE UPDATE ON "app"."sales_reps" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_segments_updated_at" BEFORE UPDATE ON "app"."segments" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_teams_updated_at" BEFORE UPDATE ON "app"."teams" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();



ALTER TABLE ONLY "app"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "app"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."activities"
    ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."activities"
    ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "app"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "app"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."campaign_targets"
    ADD CONSTRAINT "campaign_targets_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."contacts"
    ADD CONSTRAINT "contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."enrichment_jobs"
    ADD CONSTRAINT "enrichment_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."enrichment_runs"
    ADD CONSTRAINT "enrichment_runs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."lead_emails"
    ADD CONSTRAINT "lead_emails_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."lead_partners"
    ADD CONSTRAINT "lead_partners_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."lead_phones"
    ADD CONSTRAINT "lead_phones_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."lead_social"
    ADD CONSTRAINT "lead_social_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."lead_trademarks"
    ADD CONSTRAINT "lead_trademarks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."leads"
    ADD CONSTRAINT "leads_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "app"."segments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."pipeline_events"
    ADD CONSTRAINT "pipeline_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "app"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."sales_reps"
    ADD CONSTRAINT "sales_reps_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."team_members"
    ADD CONSTRAINT "team_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "app"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "app"."teams"("id") ON DELETE CASCADE;



ALTER TABLE "app"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin reads bridge log" ON "app"."airtable_bridge_log" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() ->> 'app_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "app"."airtable_bridge_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated select all" ON "app"."activities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."campaign_targets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."campaigns" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."contacts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."enrichment_costs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."enrichment_jobs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."enrichment_runs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."lead_emails" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."lead_partners" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."lead_phones" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."lead_social" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."lead_trademarks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."leads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."migration_state" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."pipeline_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."sales_reps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."segments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."team_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated select all" ON "app"."teams" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated write" ON "app"."activities" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."campaign_targets" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."campaigns" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."contacts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."lead_emails" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."lead_partners" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."lead_phones" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."lead_social" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."lead_trademarks" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."leads" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated write" ON "app"."segments" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "app"."campaign_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."enrichment_costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."enrichment_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."enrichment_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."lead_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."lead_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."lead_phones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."lead_social" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."lead_trademarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."migration_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."pipeline_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."sales_reps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."segments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user updates own profile" ON "app"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "admin reads audit" ON "audit"."audit_log" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() ->> 'app_metadata'::"text"))::"jsonb" ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "audit"."audit_log" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";













































































































































































































































































































































GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";



GRANT SELECT ON TABLE "app"."lead_inbox_view" TO "authenticated";
GRANT SELECT ON TABLE "app"."lead_inbox_view" TO "service_role";



GRANT SELECT ON TABLE "app"."profiles" TO "supabase_auth_admin";

































ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































