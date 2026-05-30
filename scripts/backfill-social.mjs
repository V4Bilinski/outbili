/**
 * DEPRECATED no cutover Airtable -> Supabase (W3/W4). NAO EXECUTAR.
 *
 * Este script fazia backfill de redes sociais (Assertiva + Firecrawl) gravando no
 * AIRTABLE, que nao e mais a fonte de dados (migrada para Supabase). Todo o codigo
 * Airtable foi removido em ADMIN-ENRICH-01 (F4) para eliminar o residuo
 * da API REST do Airtable e qualquer risco de gravar em base morta.
 *
 * Equivalente atual: Edge Function `social-enrich`, enfileirada via app.enrichment_jobs.
 * Acione re-enriquecimento de um lead na UI (requestEnrichment) ou em lote pela PESCA
 * (enqueueEnrichmentBatch) — a cadeia do worker inclui a etapa de redes sociais.
 * Ver: .claude/rules/social-media-enrichment.md.
 */
console.error(
  'backfill-social.mjs: DEPRECATED desde o cutover Supabase (W3/W4). Nao ha mais base Airtable. ' +
  'Use a Edge Function social-enrich via fila enrichment_jobs (requestEnrichment / enqueueEnrichmentBatch).',
)
process.exit(1)
