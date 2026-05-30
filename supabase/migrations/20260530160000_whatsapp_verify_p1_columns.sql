-- Pilar 1 (WHATSAPP-VERIFY-01): validação REAL de WhatsApp do decisor/sócio.
-- Colunas de comprovação AO VIVO (ator Apify vtrdev/whatsapp-number-validator),
-- separadas das flags inferidas da Assertiva (whatsapp_pessoal/whatsapp_confirmado).
-- A flag diz "a Assertiva acha que tem WhatsApp"; estas colunas dizem "checamos e EXISTE".

alter table app.socio_telefones
  add column if not exists whatsapp_verified boolean,
  add column if not exists whatsapp_verified_at timestamptz,
  add column if not exists whatsapp_jid text,
  add column if not exists whatsapp_verify_source text;

alter table app.lead_phones
  add column if not exists whatsapp_verified boolean,
  add column if not exists whatsapp_verified_at timestamptz,
  add column if not exists whatsapp_jid text,
  add column if not exists whatsapp_verify_source text;

comment on column app.socio_telefones.whatsapp_verified is 'Pilar 1: true/false comprovado AO VIVO (ator Apify vtrdev). NULL = nunca verificado. Diferente de whatsapp_pessoal (flag inferida Assertiva).';
comment on column app.lead_phones.whatsapp_verified is 'Pilar 1: true/false comprovado AO VIVO (ator Apify vtrdev). NULL = nunca verificado.';
