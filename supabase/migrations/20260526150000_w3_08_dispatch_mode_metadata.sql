-- W3-08 — dispatch repassa `mode` (de job.metadata) para a Edge Function.
-- Permite enfileirar jobs em modo 'presence' (só consulta CNPJ + presença digital,
-- sem a cascata de sócios) via metadata={"mode":"presence"}. Default 'full'.

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
  c_budget_high constant int := 8;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_bearer from vault.decrypted_secrets where name = 'edge_bearer_anon';
  if v_url is null or v_bearer is null then
    raise warning 'W3-08 dispatch: secrets do Vault ausentes';
    return 0;
  end if;

  for v_job in
    with cand as (
      select j.id, j.lead_id, l.cnpj, j.priority, j.metadata,
             row_number() over (partition by j.priority order by j.requested_at) as rn
      from app.enrichment_jobs j
      join app.leads l on l.id = j.lead_id
      where j.status in ('queued', 'retrying') and l.deleted_at is null and l.cnpj is not null
    ),
    picked as (
      select id, lead_id, cnpj, metadata from cand
      where priority = 'realtime'
         or (priority = 'high' and rn <= c_budget_high)
         or (p_enabled_normal and priority = 'normal' and rn <= greatest(p_budget_normal, 0))
    ),
    upd as (
      update app.enrichment_jobs j
         set status = 'processing', started_at = now(), attempts = attempts + 1
        from picked
       where j.id = picked.id and j.status in ('queued', 'retrying')
      returning j.id, picked.lead_id, picked.cnpj, picked.metadata
    )
    select id, lead_id, cnpj, metadata from upd
  loop
    perform net.http_post(
      url := v_url || '/functions/v1/assertiva-enrich',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_bearer),
      body := jsonb_build_object(
        'cnpj', regexp_replace(v_job.cnpj, '\D', '', 'g'),
        'leadId', v_job.lead_id,
        'jobId', v_job.id,
        'mode', coalesce(v_job.metadata->>'mode', 'full')
      ),
      timeout_milliseconds := 150000
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function app.dispatch_enrichment_jobs(int, boolean) from public, anon, authenticated;
