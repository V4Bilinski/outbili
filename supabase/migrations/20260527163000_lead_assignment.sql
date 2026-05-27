-- FASE 1 — Atribuicao de leads (auto na criacao + redistribuicao admin) [sistema multi-usuario]
-- Modelo aprovado pelo operador (2026-05-27): POOL compartilhado (visibilidade total via RLS
-- existente USING(true)); assigned_to organiza o FOCO (aba "Meus leads"), nao esconde.
-- Atribuicao: auto na criacao (dono = criador) + admin redistribui.

-- Helper: profile.id do usuario autenticado. assigned_to/created_by referenciam profiles.id
-- (NAO auth.uid, que e' profiles.user_id).
create or replace function app.current_profile_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from app.profiles where user_id = auth.uid() and deleted_at is null limit 1;
$$;
grant execute on function app.current_profile_id() to authenticated;

-- Auto-assign: todo lead novo nasce com dono = quem o criou. PESCA (pescaService) e cadastro
-- manual (SearchPage) passam pelo MESMO createLead via cliente authenticated -> auth.uid disponivel.
-- Inserts sem sessao (service_role/ETL) deixam assigned_to nulo = pool nao atribuido (admin distribui).
-- Nao sobrescreve assigned_to ja informado explicitamente.
create or replace function app.set_lead_owner_on_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is null then
    new.assigned_to := app.current_profile_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_lead_owner on app.leads;
create trigger trg_set_lead_owner
  before insert on app.leads
  for each row execute function app.set_lead_owner_on_insert();

-- (Re)atribuicao com autorizacao + registro no historico (audit.user_activity, action livre).
-- admin reatribui qualquer lead; SDR so (re)atribui lead sem dono ou ja seu (self-claim/handoff).
-- p_profile_id NULL = devolver ao pool (desatribuir).
create or replace function app.assign_lead(p_lead_id uuid, p_profile_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_caller_profile uuid;
  v_caller_role text;
  v_caller_email text;
  v_caller_name text;
  v_old_profile uuid;
  v_old_name text;
  v_new_name text;
begin
  if v_uid is null then raise exception 'nao autenticado'; end if;
  select id, role, email, full_name
    into v_caller_profile, v_caller_role, v_caller_email, v_caller_name
    from app.profiles where user_id = v_uid and deleted_at is null;
  if v_caller_profile is null then raise exception 'perfil do chamador nao encontrado'; end if;

  select assigned_to into v_old_profile from app.leads where id = p_lead_id and deleted_at is null;
  if not found then raise exception 'lead inexistente ou removido: %', p_lead_id; end if;

  if v_caller_role <> 'admin' and v_old_profile is not null and v_old_profile <> v_caller_profile then
    raise exception 'sem permissao para reatribuir lead de outro usuario';
  end if;

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
