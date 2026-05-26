-- W3-08 — presença digital unificada: permitir 'google' (Google Meu Negócio) +
-- 'youtube'/'twitter' em app.lead_social.platform (antes só ig/li/tiktok/fb).
-- O social-enrich unificado grava a presença no GMB como lead_social platform='google'.

alter table app.lead_social drop constraint if exists lead_social_platform_check;
alter table app.lead_social add constraint lead_social_platform_check
  check (platform in ('instagram','linkedin','tiktok','facebook','google','youtube','twitter'));
