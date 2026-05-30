-- ADMIN-ENRICH-01 (F3B): permite enfileirar jobs de enriquecimento com um `mode`
-- explicito gravado em enrichment_jobs.metadata. O dispatch ja roteia por
-- metadata->>'mode' (mode='cadastral' -> assertiva-enrich modo cadastral leve).
--
-- Compat: assinatura antiga (2 args) e DROPADA e recriada com p_mode opcional
-- (default 'full'). Callers existentes (PESCA via enqueueEnrichmentBatch sem mode)
-- continuam funcionando: p_mode='full' => metadata vazio => modo full (comportamento atual).

drop function if exists app.enqueue_enrichment_batch(text[], app.enrichment_priority);

create or replace function app.enqueue_enrichment_batch(
  p_lead_refs text[],
  p_priority app.enrichment_priority default 'high'::app.enrichment_priority,
  p_mode text default 'full'
) returns integer
  language plpgsql
  security definer
  set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile_id uuid;
  v_inserted int;
  v_is_full boolean := (p_mode is null or p_mode = 'full');
  v_metadata jsonb := case when v_is_full then '{}'::jsonb else jsonb_build_object('mode', p_mode) end;
begin
  if v_uid is null then raise exception 'nao autenticado'; end if;
  select id into v_profile_id from app.profiles where user_id = v_uid;

  -- eleva prioridade dos jobs pendentes ja existentes (resolve uuid ou rec);
  -- so sobrescreve metadata quando um mode explicito (nao-full) foi pedido.
  update app.enrichment_jobs j
     set priority = app.greatest_priority(j.priority, p_priority),
         requested_by = coalesce(j.requested_by, v_profile_id),
         metadata = case when v_is_full then j.metadata else v_metadata end
    from app.leads l
   where j.lead_id = l.id
     and j.status in ('queued', 'retrying')
     and (l.id::text = any(p_lead_refs) or l.airtable_record_id = any(p_lead_refs));

  -- cria jobs para leads sem job ativo (com CNPJ), carimbando o metadata.mode
  insert into app.enrichment_jobs (lead_id, priority, status, requested_by, metadata)
  select l.id, p_priority, 'queued', v_profile_id, v_metadata
  from app.leads l
  where (l.id::text = any(p_lead_refs) or l.airtable_record_id = any(p_lead_refs))
    and l.deleted_at is null
    and l.cnpj is not null
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;

grant execute on function app.enqueue_enrichment_batch(text[], app.enrichment_priority, text) to authenticated;
