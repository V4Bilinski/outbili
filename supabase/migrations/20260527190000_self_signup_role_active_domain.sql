-- Self-signup com escolha de cargo + ativacao automatica + gate de dominio.
-- Demanda do operador (2026-05-27): o novo usuario deve entrar JA qualificado (ativo)
-- e associado ao cargo escolhido no cadastro. Substitui o fluxo anterior, em que todo
-- signup caia em role='viewer' + is_active=false, dependendo de ativacao manual do admin.
--
-- Regras:
--   1. Gate de dominio: apenas e-mails @v4company.com podem se cadastrar (defense-in-depth;
--      o front tambem valida). E-mail fora do dominio faz rollback do signup (excecao).
--   2. Cargo: lido de raw_user_meta_data.requested_role. Aceita apenas sdr|closer|viewer.
--      'admin' NUNCA e' auto-atribuido via signup. Promocao a admin so via app.admin_update_user.
--   3. Ativacao: is_active = true (qualifica na hora).
--   4. on conflict (re-signup do mesmo user): nao rebaixa role nem desativa (anti-downgrade).
--   5. Bootstrap: e-mail institucional luizhenrique.benicio@v4company.com continua admin.
--
-- NOTA (estruturar depois): sem verificacao de posse do e-mail (enable_confirmations=false),
-- o gate de dominio por si so e' burlavel digitando e-mail @v4company.com de terceiro.
-- Endurecer via Auth Hook before_user_created + confirmacao de e-mail numa proxima iteracao.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  user_full_name text;
  raw_role text;
  v_role app.user_role := 'viewer';
begin
  -- (1) Gate de dominio
  if new.email not ilike '%@v4company.com' then
    raise exception 'Cadastro permitido apenas para e-mails @v4company.com';
  end if;

  user_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  -- (2) Cargo escolhido no cadastro (admin jamais via signup)
  raw_role := new.raw_user_meta_data ->> 'requested_role';
  if raw_role in ('sdr', 'closer', 'viewer') then
    v_role := raw_role::app.user_role;
  else
    v_role := 'viewer';
  end if;

  -- (5) Bootstrap admin institucional
  if new.email = 'luizhenrique.benicio@v4company.com' then
    v_role := 'admin';
  end if;

  -- (3) Insere o profile JA ativo, no cargo associado
  insert into app.profiles (
    user_id, email, full_name, role, is_active, created_at, updated_at
  ) values (
    new.id, new.email::public.citext, user_full_name, v_role, true, now(), now()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(app.profiles.full_name, excluded.full_name),
        -- (4) anti-downgrade: reativa, mas nao rebaixa role existente
        is_active = true,
        updated_at = now();

  return new;
end;
$function$;

comment on function public.handle_new_user() is
  'Trigger AFTER INSERT em auth.users: cria app.profiles JA ativo, com cargo escolhido no signup (sdr/closer/viewer; admin so via promocao) e gate de dominio @v4company.com. Operador 2026-05-27.';
