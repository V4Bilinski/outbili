#!/usr/bin/env python3
"""
DEPRECATED no cutover Airtable -> Supabase (W3/W4). NAO EXECUTAR.

Este script enriquecia leads (SPICED, travas, discovery questions) gravando na API REST
do Airtable, que nao e mais a fonte de dados (migrada para Supabase). Todo o codigo
Airtable e o Base ID hardcoded foram removidos em ADMIN-ENRICH-01 (F4) para eliminar o
residuo e o risco de gravar em base morta.

Equivalente atual (100% Supabase):
  - Painel Admin > aba "Enriquecimento" > "Re-enriquecer dados faltantes"
    (useReEnrichment -> reEnrichLead).
  - Worker server-side W3-08: Edge Function assertiva-enrich via fila app.enrichment_jobs.
"""
import sys

print(
    "enrich-leads.py: DEPRECATED desde o cutover Supabase (W3/W4). Nao ha mais base "
    "Airtable para gravar. Use o painel Admin > Enriquecimento ou o worker W3-08.",
    file=sys.stderr,
)
sys.exit(1)
