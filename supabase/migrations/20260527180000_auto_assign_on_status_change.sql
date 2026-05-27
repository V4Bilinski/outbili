-- Auto-atribuicao ao mover no pipeline: quando o usuario muda o STATUS de um lead que
-- NAO tem dono (pool), ele vira o responsavel automaticamente. Trigger BEFORE UPDATE cobre
-- todos os caminhos (kanban, ficha/stepper, qualquer mudanca de status) sem tocar no front.
-- So age com sessao autenticada (auth.uid); updates via service_role (enrich) nao mudam status.

create or replace function app.set_lead_owner_on_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status
     and new.assigned_to is null
     and auth.uid() is not null then
    new.assigned_to := app.current_profile_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_lead_owner_on_status on app.leads;
create trigger trg_set_lead_owner_on_status
  before update on app.leads
  for each row execute function app.set_lead_owner_on_status_change();
