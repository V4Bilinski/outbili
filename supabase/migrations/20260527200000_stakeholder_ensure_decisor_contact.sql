-- Saneamento de stakeholder (2026-05-27): garante que todo lead com >=1 contato tenha
-- exatamente um marcado como 'decisor'. Promove o melhor candidato existente onde nao ha
-- nenhum decisor (prioriza whatsapp > email > mais antigo). Idempotente: re-rodar = no-op.
-- Cobre o estado atual e qualquer lead futuro que caia sem decisor marcado.
-- Aplicada via MCP apply_migration; este arquivo versiona a migracao no repo.
with leads_sem_decisor as (
  select l.id as lead_id
  from app.leads l
  where not exists (select 1 from app.contacts c where c.lead_id = l.id and c.contact_type = 'decisor')
    and exists (select 1 from app.contacts c where c.lead_id = l.id)
),
melhor as (
  select distinct on (c.lead_id) c.id, c.lead_id
  from app.contacts c
  join leads_sem_decisor d on d.lead_id = c.lead_id
  order by c.lead_id,
    (nullif(c.whatsapp,'') is not null) desc,
    (nullif(c.email,'') is not null) desc,
    c.created_at asc nulls last
)
update app.contacts c
set contact_type = 'decisor'
from melhor m
where c.id = m.id;
