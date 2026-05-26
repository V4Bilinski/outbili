-- W3-08 — Deep Enrichment Job Queue: funções do worker
-- Story: docs/stories/W3-08.deep-enrichment-job-queue.story.md
--
-- A fila app.enrichment_jobs e o sweeper já existiam (W1/W2); faltava o consumidor.
-- Esta migration cria:
--   1. request_enrichment        — front (realtime) enfileira/eleva job  [authenticated]
--   2. finish_enrichment_job     — edge fecha o job + registra run        [service_role]
--   3. dispatch_enrichment_jobs  — worker: puxa jobs e dispara a edge     [cron]
--   4. reap_stuck_enrichment_jobs— resiliência: jobs processing presos    [cron]
-- Os crons e os secrets do Vault são criados em migration separada (após deploy da edge).

-- ---------------------------------------------------------------------------
-- 1. request_enrichment(p_lead_id) — caminho realtime do clique do SDR
-- Idempotente: eleva job ativo (queued/retrying) a realtime, ou cria um novo.
-- ---------------------------------------------------------------------------
create or replace function app.request_enrichment(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'nao autenticado';
  end if;

  if not exists (
    select 1 from app.leads l where l.id = p_lead_id and l.deleted_at is null
  ) then
    raise exception 'lead inexistente ou removido: %', p_lead_id;
  end if;

  -- eleva job pendente existente (queued/retrying) a realtime
  update app.enrichment_jobs
     set priority = 'realtime', requested_by = v_uid, requested_at = now()
   where lead_id = p_lead_id
     and status in ('queued', 'retrying')
   returning id into v_job_id;

  -- já existe job em processamento? retorna ele (idempotente; a constraint
  -- enrichment_jobs_active_uniq impede 2 jobs ativos por lead)
  if v_job_id is null then
    select id into v_job_id
      from app.enrichment_jobs
     where lead_id = p_lead_id and status = 'processing'
     order by requested_at desc
     limit 1;
  end if;

  -- nenhum job ativo -> cria um novo realtime
  if v_job_id is null then
    insert into app.enrichment_jobs (lead_id, priority, status, requested_by)
    values (p_lead_id, 'realtime', 'queued', v_uid)
    returning id into v_job_id;
  end if;

  return v_job_id;
end;
$$;

revoke execute on function app.request_enrichment(uuid) from public, anon;
grant execute on function app.request_enrichment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. finish_enrichment_job — edge fecha o job + registra run
-- Centraliza a lógica de retry no banco. Registra SEMPRE enrichment_runs
-- (impede o sweeper de re-enfileirar o lead por 7 dias).
-- ---------------------------------------------------------------------------
create or replace function app.finish_enrichment_job(
  p_lead_id uuid,
  p_job_id uuid,
  p_ok boolean,
  p_error text,
  p_result jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.enrichment_runs (lead_id, source, status, detail, result, finished_at)
  values (
    p_lead_id,
    'assertiva_decisores',
    case when p_ok then 'done'::app.enrichment_log_status else 'error'::app.enrichment_log_status end,
    left(coalesce(p_error, ''), 2000),
    p_result,
    now()
  );

  if p_job_id is not null then
    update app.enrichment_jobs
       set status = case
                      when p_ok then 'done'::app.enrichment_job_status
                      when attempts < 3 then 'retrying'::app.enrichment_job_status
                      else 'failed'::app.enrichment_job_status
                    end,
           finished_at = now(),
           error = left(coalesce(p_error, ''), 2000)
     where id = p_job_id;
  end if;
end;
$$;

revoke execute on function app.finish_enrichment_job(uuid, uuid, boolean, text, jsonb) from public, anon, authenticated;
grant execute on function app.finish_enrichment_job(uuid, uuid, boolean, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 3. dispatch_enrichment_jobs — worker cron
-- realtime/high: SEMPRE processados. normal: só se habilitado e dentro do budget.
-- Marca processing atomicamente (UPDATE ... RETURNING via CTE) e dispara a edge
-- por pg_net (fire-and-forget; a edge fecha o job ao terminar). Autentica com a
-- anon key do Vault (JWT válido p/ verify_jwt; a edge usa service_role interno).
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
             row_number() over (
               partition by (j.priority = 'normal')
               order by case j.priority
                          when 'realtime' then 0
                          when 'high' then 1
                          else 2
                        end,
                        j.requested_at
             ) as rn
      from app.enrichment_jobs j
      join app.leads l on l.id = j.lead_id
      where j.status in ('queued', 'retrying')
        and l.deleted_at is null
        and l.cnpj is not null
    ),
    picked as (
      select id, lead_id, cnpj
      from cand
      where priority in ('realtime', 'high')
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
-- 4. reap_stuck_enrichment_jobs — jobs 'processing' presos (edge morta)
-- ---------------------------------------------------------------------------
create or replace function app.reap_stuck_enrichment_jobs(p_max_minutes int default 4)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update app.enrichment_jobs
     set status = case when attempts < 3
                       then 'retrying'::app.enrichment_job_status
                       else 'failed'::app.enrichment_job_status
                  end,
         error = left(coalesce(error, '') || ' [reaper: stuck > ' || p_max_minutes || 'min]', 2000),
         finished_at = case when attempts >= 3 then now() else finished_at end
   where status = 'processing'
     and started_at < now() - make_interval(mins => p_max_minutes);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function app.reap_stuck_enrichment_jobs(int) from public, anon, authenticated;
