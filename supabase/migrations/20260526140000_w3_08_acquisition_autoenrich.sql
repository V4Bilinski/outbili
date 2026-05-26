-- W3-08 — Auto-enriquecimento na aquisição (PESCA massa + cadastro manual)
-- Story: docs/stories/W3-08.deep-enrichment-job-queue.story.md (extensão)
--
-- Conecta os fluxos de aquisição ao job queue de deep-enrichment:
--   - cadastro manual -> request_enrichment(lead, 'realtime')  [instantâneo assíncrono]
--   - PESCA (massa)    -> enqueue_enrichment_batch(leads[], 'high')  [lote priorizado]
-- Ajustes: dispatcher com teto 'high' anti-saturação Assertiva; worker a cada 30s.

-- ---------------------------------------------------------------------------
-- 0. helper: retorna a maior prioridade (realtime > high > normal)
-- ---------------------------------------------------------------------------
create or replace function app.greatest_priority(a app.enrichment_priority, b app.enrichment_priority)
returns app.enrichment_priority
language sql
immutable
set search_path = ''
as $$
  select case
    when 'realtime' in (a, b) then 'realtime'::app.enrichment_priority
    when 'high' in (a, b) then 'high'::app.enrichment_priority
    else 'normal'::app.enrichment_priority
  end;
$$;

-- ---------------------------------------------------------------------------
-- 1. request_enrichment: agora aceita prioridade (default realtime p/ compat).
--    Substitui a versão de 1 argumento (TabSocios chama sem p_priority -> realtime).
-- ---------------------------------------------------------------------------
drop function if exists app.request_enrichment(uuid);

create or replace function app.request_enrichment(
  p_lead_id uuid,
  p_priority app.enrichment_priority default 'realtime'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_id uuid;
  v_uid uuid := auth.uid();
  v_profile_id uuid;
begin
  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  if not exists (
    select 1 from app.leads l where l.id = p_lead_id and l.deleted_at is null
  ) then
    raise exception 'lead inexistente ou removido: %', p_lead_id;
  end if;

  select id into v_profile_id from app.profiles where user_id = v_uid;

  -- eleva job pendente (queued/retrying) à prioridade pedida (nunca rebaixa realtime)
  update app.enrichment_jobs
     set priority = app.greatest_priority(priority, p_priority),
         requested_by = coalesce(requested_by, v_profile_id),
         requested_at = now()
   where lead_id = p_lead_id
     and status in ('queued', 'retrying')
   returning id into v_job_id;

  if v_job_id is null then
    select id into v_job_id
      from app.enrichment_jobs
     where lead_id = p_lead_id and status = 'processing'
     order by requested_at desc
     limit 1;
  end if;

  if v_job_id is null then
    insert into app.enrichment_jobs (lead_id, priority, status, requested_by)
    values (p_lead_id, p_priority, 'queued', v_profile_id)
    returning id into v_job_id;
  end if;

  return v_job_id;
end;
$$;

revoke execute on function app.request_enrichment(uuid, app.enrichment_priority) from public, anon;
grant execute on function app.request_enrichment(uuid, app.enrichment_priority) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. enqueue_enrichment_batch: enfileira deep-enrichment p/ vários leads (PESCA).
--    Eleva jobs ativos existentes; cria jobs para os novos. ON CONFLICT DO NOTHING
--    cobre a constraint enrichment_jobs_active_uniq (idempotente em concorrência).
-- ---------------------------------------------------------------------------
-- Aceita refs em text[] (UUID ou airtable_record_id 'rec...'): leads novos do
-- PESCA/manual expõem id no formato 'rec...'. Resolve ambos internamente.
create or replace function app.enqueue_enrichment_batch(
  p_lead_refs text[],
  p_priority app.enrichment_priority default 'high'
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile_id uuid;
  v_inserted int;
begin
  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  select id into v_profile_id from app.profiles where user_id = v_uid;

  -- eleva prioridade dos jobs pendentes já existentes desses leads
  update app.enrichment_jobs j
     set priority = app.greatest_priority(j.priority, p_priority),
         requested_by = coalesce(j.requested_by, v_profile_id)
    from app.leads l
   where j.lead_id = l.id
     and j.status in ('queued', 'retrying')
     and (l.id::text = any(p_lead_refs) or l.airtable_record_id = any(p_lead_refs));

  -- cria jobs para os leads sem job ativo (com CNPJ; sem CNPJ o worker ignora)
  insert into app.enrichment_jobs (lead_id, priority, status, requested_by)
  select l.id, p_priority, 'queued', v_profile_id
  from app.leads l
  where (l.id::text = any(p_lead_refs) or l.airtable_record_id = any(p_lead_refs))
    and l.deleted_at is null and l.cnpj is not null
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke execute on function app.enqueue_enrichment_batch(text[], app.enrichment_priority) from public, anon;
grant execute on function app.enqueue_enrichment_batch(text[], app.enrichment_priority) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. dispatch_enrichment_jobs: teto 'high' anti-saturação Assertiva.
--    realtime: SEMPRE (cliques, raros). high: até HIGH_BUDGET/ciclo. normal: budget.
-- ---------------------------------------------------------------------------
create or replace function app.dispatch_enrichment_jobs(
  p_budget_normal int default 3,
  p_enabled_normal boolean default true
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_bearer text;
  v_job record;
  v_count int := 0;
  c_budget_high constant int := 8;   -- teto de 'high' por ciclo (PESCA em lote)
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_bearer from vault.decrypted_secrets where name = 'edge_bearer_anon';

  if v_url is null or v_bearer is null then
    raise warning 'W3-08 dispatch: secrets do Vault ausentes (project_url / edge_bearer_anon)';
    return 0;
  end if;

  for v_job in
    with cand as (
      select j.id, j.lead_id, l.cnpj, j.priority,
             row_number() over (partition by j.priority order by j.requested_at) as rn
      from app.enrichment_jobs j
      join app.leads l on l.id = j.lead_id
      where j.status in ('queued', 'retrying')
        and l.deleted_at is null
        and l.cnpj is not null
    ),
    picked as (
      select id, lead_id, cnpj
      from cand
      where priority = 'realtime'
         or (priority = 'high' and rn <= c_budget_high)
         or (p_enabled_normal and priority = 'normal' and rn <= greatest(p_budget_normal, 0))
    ),
    upd as (
      update app.enrichment_jobs j
         set status = 'processing', started_at = now(), attempts = attempts + 1
        from picked
       where j.id = picked.id
         and j.status in ('queued', 'retrying')
      returning j.id, picked.lead_id, picked.cnpj
    )
    select id, lead_id, cnpj from upd
  loop
    perform net.http_post(
      url := v_url || '/functions/v1/assertiva-enrich',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_bearer
      ),
      body := jsonb_build_object(
        'cnpj', regexp_replace(v_job.cnpj, '\D', '', 'g'),
        'leadId', v_job.lead_id,
        'jobId', v_job.id
      ),
      timeout_milliseconds := 150000
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function app.dispatch_enrichment_jobs(int, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. worker a cada 30s (reduz a latência percebida do realtime do cadastro manual)
-- ---------------------------------------------------------------------------
select cron.schedule('enrichment-jobs-worker', '30 seconds', $$select app.dispatch_enrichment_jobs(3, true)$$);
