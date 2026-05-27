-- Admin gerencia usuarios (editar perfil + ativar/desativar).
-- BUG corrigido: a RLS de app.profiles so permite UPDATE do proprio profile
-- (user_id = auth.uid()), entao o admin nao conseguia editar/desativar outros
-- (update nao afetava linha -> "Usuario nao encontrado"). RPC SECURITY DEFINER
-- valida que o caller e' admin e atualiza qualquer profile, bypassando o RLS.

create or replace function app.admin_update_user(
  p_target_user_id uuid,
  p_full_name text default null,
  p_role text default null,
  p_is_active boolean default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_caller_role text;
begin
  if auth.uid() is null then raise exception 'nao autenticado'; end if;
  select role into v_caller_role from app.profiles where user_id = auth.uid() and deleted_at is null;
  if v_caller_role is distinct from 'admin' then
    raise exception 'apenas administradores podem gerenciar usuarios';
  end if;
  if p_role is not null and p_role not in ('admin','sdr','closer','viewer','user') then
    raise exception 'papel invalido: %', p_role;
  end if;

  -- aceita user_id (auth) OU profiles.id como alvo (compat com o front)
  update app.profiles set
    full_name = coalesce(p_full_name, full_name),
    role = coalesce(p_role, role),
    is_active = coalesce(p_is_active, is_active),
    updated_at = now()
  where (user_id = p_target_user_id or id = p_target_user_id) and deleted_at is null;
  if not found then raise exception 'usuario nao encontrado: %', p_target_user_id; end if;

  insert into audit.user_activity (user_id, action, details, metadata, occurred_at)
  values (auth.uid(), 'user_updated',
          format('Atualizou usuario %s', p_target_user_id),
          jsonb_build_object('target', p_target_user_id, 'full_name', p_full_name, 'role', p_role, 'is_active', p_is_active),
          now());
end $$;

grant execute on function app.admin_update_user(uuid, text, text, boolean) to authenticated;
