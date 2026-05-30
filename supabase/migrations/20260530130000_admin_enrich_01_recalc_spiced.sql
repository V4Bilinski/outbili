-- ADMIN-ENRICH-01 (B): funcao SQL canonica de recalculo SPICED por lead.
-- Espelha FIELMENTE src/services/enrichmentService.ts calculateSpicedDimensions +
-- src/lib/utils.ts calculateSpicedScore/getTemperatureFromScore (o recalc em massa do
-- front). A Edge `assertiva-enrich` (modo cadastral) chama esta funcao apos gravar os
-- dados novos, deixando score/temperatura contextualizados sem intervencao manual.
-- NOTA DE MANUTENCAO: se a formula SPICED mudar no front, atualizar esta funcao tambem.

create or replace function app.recalc_lead_spiced(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  l app.leads%rowtype;
  v_years numeric;
  v_email_domain text;
  v_is_generic boolean;
  v_has_ig boolean;
  v_has_li boolean;
  s int := 1; p int := 1; i int := 1; c int := 1; d int := 1;
  v_rev numeric; v_renda numeric; v_score numeric; v_temp app.lead_temperatura;
begin
  select * into l from app.leads where id = p_lead_id;
  if not found then return; end if;

  v_years := coalesce(
    l.years_in_market::numeric,
    case when l.founding_date is not null then floor((current_date - l.founding_date) / 365.25) else null end
  );

  v_has_ig := exists (select 1 from app.lead_social where lead_id = l.id and platform = 'instagram');
  v_has_li := exists (select 1 from app.lead_social where lead_id = l.id and platform = 'linkedin');

  v_email_domain := coalesce(nullif(l.email_domain, ''), split_part(coalesce(l.rf_email, ''), '@', 2));
  v_is_generic := v_email_domain ~* '(gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\.)';

  -- S (Situacao)
  if l.employees is not null and l.employees > 5 then s := s + 1; end if;
  if l.employees is not null and l.employees > 20 then s := s + 1; end if;
  if v_years is not null and v_years > 3 then s := s + 1; end if;
  if l.city is not null and l.city <> '' and l.state is not null and l.state <> '' then s := s + 1; end if;
  if l.capital_social is not null and l.capital_social >= 100000 then s := s + 1; end if;
  if coalesce(l.is_headquarters, false) then s := s + 1; end if;

  -- P (Dor)
  if l.website is null or l.website = '' then p := p + 1; end if;
  if not v_has_ig then p := p + 1; end if;
  if v_is_generic or v_email_domain = '' then p := p + 1; end if;
  if l.phone_type = 'LANDLINE' or (coalesce(l.assertiva_whatsapp_flag, false) = false and l.rf_phone is not null and l.rf_phone <> '') then p := p + 1; end if;
  if l.capital_social is not null and l.capital_social < 50000 and v_years is not null and v_years > 5 then p := p + 1; end if;
  if coalesce(l.simples_optant, false) and l.employees is not null and l.employees > 10 then p := p + 1; end if;

  -- I (Impacto)
  v_rev := coalesce(l.monthly_revenue, 0);
  v_renda := coalesce(l.assertiva_income_estimate, 0);
  if v_rev > 0 then
    if v_rev >= 100000 then i := i + 1; end if;
    if v_rev >= 200000 then i := i + 1; end if;
    if v_rev >= 500000 then i := i + 1; end if;
  elsif v_renda > 0 then
    if v_renda >= 10000 then i := i + 1; end if;
    if v_renda >= 30000 then i := i + 1; end if;
    if v_renda >= 100000 then i := i + 1; end if;
  elsif l.capital_social is not null then
    if l.capital_social >= 50000 then i := i + 1; end if;
    if l.capital_social >= 200000 then i := i + 1; end if;
    if l.capital_social >= 500000 then i := i + 1; end if;
  end if;
  if l.tax_regime in ('lucro_presumido', 'lucro_real') then i := i + 1; end if;
  if l.employees is not null and l.employees > 50 then i := i + 1; end if;

  -- C (Evento Critico)
  if v_years is not null and v_years < 2 then c := c + 2; end if;
  if coalesce(l.assertiva_whatsapp_flag, false) then c := c + 1; end if;
  if l.status_date is not null and l.status_date > (current_date - 180) then c := c + 1; end if;
  if l.registration_status = 'Ativa' and v_years is not null and v_years < 1 then c := c + 1; end if;

  -- D (Decisao) — partners espelha o recalc em massa do front (rowToLead nao traz partners)
  if l.cnpj is not null and l.cnpj <> '' then d := d + 1; end if;
  if (l.rf_email is not null and l.rf_email <> '') or (l.assertiva_email_validated is not null and l.assertiva_email_validated <> '') then d := d + 1; end if;
  if coalesce(l.assertiva_whatsapp_flag, false) then d := d + 1; end if;
  if v_has_li or (l.website is not null and l.website <> '') then d := d + 1; end if;

  -- cap 1..5
  s := least(5, greatest(1, s));
  p := least(5, greatest(1, p));
  i := least(5, greatest(1, i));
  c := least(5, greatest(1, c));
  d := least(5, greatest(1, d));

  v_score := round((s * 0.25 + p * 0.25 + i * 0.20 + c * 0.15 + d * 0.15) * 10) / 10;
  v_temp := (case when v_score >= 3.7 then 'Quente' when v_score >= 2.5 then 'Morno' else 'Frio' end)::app.lead_temperatura;

  update app.leads set
    spiced_s = s, spiced_p = p, spiced_i = i, spiced_c = c, spiced_d = d,
    score = v_score, temperatura = v_temp
  where id = p_lead_id;
end;
$function$;

grant execute on function app.recalc_lead_spiced(uuid) to authenticated, service_role;

-- DDL dispara o event trigger pgrst_ddl_watch -> reload do schema cache do PostgREST,
-- para a RPC `recalc_lead_spiced` ficar visivel imediatamente (a Edge a chama via rpc).
comment on function app.recalc_lead_spiced(uuid) is 'ADMIN-ENRICH-01 (B): recalc SPICED por lead, espelha calculateSpicedDimensions do front. Chamada pela Edge assertiva-enrich (modo cadastral).';
