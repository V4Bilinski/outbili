-- FIX app.admin_update_user (2 bugs no gerenciar usuarios do admin):
--  1) "COALESCE types text and app.user_role cannot be matched": role e' enum app.user_role;
--     o coalesce misturava text (p_role) com enum -> falhava em TODA chamada (ate desativar).
--     Solucao: cast p_role::app.user_role + validacao alinhada ao enum (admin/sdr/closer/viewer).
--  2) audit.user_activity.user_email/user_name sao NOT NULL e nao estavam sendo preenchidos.
--     Solucao: buscar email/nome do caller e gravar (coalesce '' por seguranca).

create or replace function app.admin_update_user(
  p_target_user_id uuid,
  p_full_name text default null,
  p_role text default null,
  p_is_active boolean default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_caller_role text;
  v_caller_email text;
  v_caller_name text;
begin
  if auth.uid() is null then raise exception 'nao autenticado'; end if;
  select role::text, email, full_name into v_caller_role, v_caller_email, v_caller_name
    from app.profiles where user_id = auth.uid() and deleted_at is null;
  if v_caller_role is distinct from 'admin' then
    raise exception 'apenas administradores podem gerenciar usuarios';
  end if;
  if p_role is not null and p_role not in ('admin','sdr','closer','viewer') then
    raise exception 'papel invalido: %', p_role;
  end if;

  update app.profiles set
    full_name = coalesce(p_full_name, full_name),
    role = coalesce(p_role::app.user_role, role),
    is_active = coalesce(p_is_active, is_active),
    updated_at = now()
  where (user_id = p_target_user_id or id = p_target_user_id) and deleted_at is null;
  if not found then raise exception 'usuario nao encontrado: %', p_target_user_id; end if;

  insert into audit.user_activity (user_id, user_email, user_name, action, details, metadata, occurred_at)
  values (auth.uid(), coalesce(v_caller_email,''), coalesce(v_caller_name,''), 'user_updated',
          format('Atualizou usuario %s', p_target_user_id),
          jsonb_build_object('target', p_target_user_id, 'full_name', p_full_name, 'role', p_role, 'is_active', p_is_active),
          now());
end $$;

grant execute on function app.admin_update_user(uuid, text, text, boolean) to authenticated;
