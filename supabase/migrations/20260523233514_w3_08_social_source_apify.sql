-- Adiciona 'apify' ao enum de fonte de redes sociais (Camada 2 Fase 1).
-- Permite que a Edge Function social-enrich popule app.lead_social (painel
-- Presença Digital) com fonte rastreável = apify.
ALTER TYPE "app"."social_media_source" ADD VALUE IF NOT EXISTS 'apify';
