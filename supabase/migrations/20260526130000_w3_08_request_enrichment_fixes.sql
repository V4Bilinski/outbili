-- W3-08 — Correções de app.request_enrichment (descobertas na validação E2E 2026-05-26)
--
-- 1. FK requested_by referencia app.profiles(id), NÃO auth.uid() (= profiles.user_id).
--    A versão original setava requested_by = auth.uid() -> violava a FK em toda
--    chamada real (23503 -> PostgREST 409). O smoke não pegou porque inseria via
--    SQL sem requested_by; o E2E do front expôs.
-- 2. Guard de job em 'processing': se já há job em andamento, retorna o existente
--    (idempotente), em vez de tentar INSERT e violar enrichment_jobs_active_uniq.

create or replace function app.request_enrichment(p_lead_id uuid)
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

  -- requested_by -> app.profiles(id); resolve a partir do auth.uid() (profiles.user_id)
  select id into v_profile_id from app.profiles where user_id = v_uid;

  -- eleva job pendente (queued/retrying) a realtime
  update app.enrichment_jobs
     set priority = 'realtime', requested_by = v_profile_id, requested_at = now()
   where lead_id = p_lead_id
     and status in ('queued', 'retrying')
   returning id into v_job_id;

  -- já em processamento? retorna o existente (idempotente; constraint impede 2 ativos)
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
    values (p_lead_id, 'realtime', 'queued', v_profile_id)
    returning id into v_job_id;
  end if;

  return v_job_id;
end;
$$;

revoke execute on function app.request_enrichment(uuid) from public, anon;
grant execute on function app.request_enrichment(uuid) to authenticated;
