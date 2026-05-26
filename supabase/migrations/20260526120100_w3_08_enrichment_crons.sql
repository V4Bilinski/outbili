-- W3-08 — Deep Enrichment Job Queue: crons do worker + reaper
-- Aplicar SOMENTE após o deploy da edge assertiva-enrich dual-mode (v14+) e
-- após os secrets do Vault (project_url, edge_bearer_anon) estarem configurados.
--
-- Política de custo (operador 2026-05-26): "drenar devagar".
--   worker: realtime/high SEMPRE + normal budget 3/ciclo (≈ drena 746 em ~4h)
--   kill-switch: trocar para dispatch_enrichment_jobs(0, false) pausa a drenagem
--                de 'normal' mantendo o realtime, sem derrubar o cron.

select cron.schedule(
  'enrichment-jobs-worker',
  '*/1 * * * *',
  $$select app.dispatch_enrichment_jobs(3, true)$$
);

select cron.schedule(
  'enrichment-jobs-reaper',
  '*/5 * * * *',
  $$select app.reap_stuck_enrichment_jobs(4)$$
);
