-- Handoff livre de leads (2026-06-22): qualquer usuario autenticado pode reatribuir
-- QUALQUER lead (pegar para si, delegar a outro ou devolver ao pool), nao apenas admin
-- ou o dono atual. Decisao do operador: leads sao pool compartilhado; a reatribuicao
-- fica auditada em audit.user_activity (quem moveu de quem para quem).
-- Relaxa a regra anterior (app.assign_lead em 20260527163000_lead_assignment.sql), que
-- bloqueava nao-admin de mexer em lead de outro usuario.
create or replace function app.assign_lead(p_lead_id uuid, p_profile_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_caller_profile uuid;
  v_caller_email text;
  v_caller_name text;
  v_old_profile uuid;
  v_old_name text;
  v_new_name text;
begin
  if v_uid is null then raise exception 'nao autenticado'; end if;
  select id, email, full_name
    into v_caller_profile, v_caller_email, v_caller_name
    from app.profiles where user_id = v_uid and deleted_at is null;
  if v_caller_profile is null then raise exception 'perfil do chamador nao encontrado'; end if;

  select assigned_to into v_old_profile from app.leads where id = p_lead_id and deleted_at is null;
  if not found then raise exception 'lead inexistente ou removido: %', p_lead_id; end if;

  -- Sem gate de propriedade: qualquer usuario autenticado pode reatribuir qualquer lead
  -- (pegar para si / delegar a outro / devolver ao pool). Rastreado no audit abaixo.

  if p_profile_id is not null
     and not exists (select 1 from app.profiles where id = p_profile_id and deleted_at is null) then
    raise exception 'perfil destino invalido: %', p_profile_id;
  end if;

  update app.leads set assigned_to = p_profile_id, updated_at = now() where id = p_lead_id;

  select full_name into v_old_name from app.profiles where id = v_old_profile;
  select full_name into v_new_name from app.profiles where id = p_profile_id;

  insert into audit.user_activity (user_id, user_email, user_name, action, details, metadata, occurred_at)
  values (v_uid, v_caller_email, v_caller_name, 'lead_assigned',
          format('Responsavel: %s -> %s', coalesce(v_old_name,'(sem dono)'), coalesce(v_new_name,'(sem dono)')),
          jsonb_build_object('lead_id', p_lead_id, 'from_profile', v_old_profile, 'to_profile', p_profile_id),
          now());
end;
$$;
grant execute on function app.assign_lead(uuid, uuid) to authenticated;
