/**
 * DEPRECATED no cutover Airtable -> Supabase (W3/W4). NAO EXECUTAR.
 *
 * Este script recalculava SPICED gravando no AIRTABLE, que nao e mais a fonte de dados
 * (migrada para Supabase). Todo o codigo Airtable foi removido em ADMIN-ENRICH-01 (F4)
 * para eliminar o residuo da API REST do Airtable e o risco de gravar em base morta.
 *
 * Equivalente atual: painel Admin > aba "Enriquecimento" > "Recalcular SPICED v2 em massa"
 * (useSpicedRecalc -> leadService, 100% Supabase). A logica SPICED canonica vive em
 * src/services/enrichmentService.ts (calculateSpicedDimensions).
 */
console.error(
  'recalc-spiced.mjs: DEPRECATED desde o cutover Supabase (W3/W4). Nao ha mais base Airtable. ' +
  'Use o painel Admin > Enriquecimento > "Recalcular SPICED v2 em massa".',
)
process.exit(1)
