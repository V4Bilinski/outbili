-- W3-08 — coluna Google Meu Negócio no lead (presença digital).
-- Fonte: Assertiva resposta.dadosCadastrais.temGoogleMeuNegocio (extraída pela
-- Edge Function assertiva-enrich, persistida por persistirPresencaDigital).
-- Flag sim/não atribuído a todos os leads no re-enriquecimento.

alter table app.leads add column if not exists tem_google_meu_negocio boolean;

comment on column app.leads.tem_google_meu_negocio is
  'Flag Google Meu Negócio (presença no Google Maps). Fonte: Assertiva (W3-08 presença digital).';
