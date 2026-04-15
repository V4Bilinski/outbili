# AUDITORIA DE INTEGRACAO WHATSAPP

## Empresa: {{company_name}}
## WABA ID: {{waba_id}}
## Data da Auditoria: {{date}}
## Auditor: {{auditor}}

---

## Configuracao da Conta

| Item | Valor | Status |
|------|-------|--------|
| Business ID | {{business_id}} | {{business_status}} |
| WABA ID | {{waba_id}} | {{waba_status}} |
| Phone Number ID | {{phone_number_id}} | {{phone_status}} |
| Display Name | {{display_name}} | {{display_status}} |
| Business Verification | {{biz_verification}} | {{biz_verification_status}} |
| Tier Atual | {{current_tier}} | {{tier_status}} |
| Quality Score | {{quality_score}} | {{quality_status}} |
| Versao da API | {{api_version}} | {{api_version_status}} |

---

## Status do Webhook

| Item | Valor | Status |
|------|-------|--------|
| URL | {{webhook_url}} | {{webhook_url_status}} |
| Verify Token | Configurado | {{verify_token_status}} |
| HMAC SHA256 | {{hmac_status}} | {{hmac_check}} |
| Deduplicacao | {{dedup_method}} | {{dedup_status}} |
| Tempo de Resposta | {{webhook_response_time}} | {{response_time_status}} |
| Uptime (30d) | {{webhook_uptime}} | {{uptime_status}} |
| Campos Subscritos | {{subscribed_fields}} | {{fields_status}} |

---

## Gestao de Credenciais

| Item | Valor | Status |
|------|-------|--------|
| Armazenamento | {{credential_storage}} | {{storage_status}} |
| Tipo de Token | {{token_type}} (System User / Personal) | {{token_type_status}} |
| Permissoes | {{token_permissions}} | {{permissions_status}} |
| Ultima Rotacao | {{last_rotation}} | {{rotation_status}} |
| Proxima Rotacao | {{next_rotation}} | {{next_rotation_status}} |

**Recomendado:** Credenciais no Supabase settings, System User token, rotacao trimestral.

---

## Cobertura de Error Handling

| Faixa de Erro | Descricao | Implementado | Acao |
|---------------|-----------|--------------|------|
| 131xxx | Falhas de envio | {{err_131_status}} | {{err_131_action}} |
| 132xxx | Erros de template | {{err_132_status}} | {{err_132_action}} |
| 133xxx | Erros de conta/telefone | {{err_133_status}} | {{err_133_action}} |
| 368 | Bloqueio temporario | {{err_368_status}} | {{err_368_action}} |
| Rate limit (429) | Limite excedido | {{err_429_status}} | {{err_429_action}} |
| Timeout | Sem resposta | {{err_timeout_status}} | {{err_timeout_action}} |

**Cobertura total:** {{error_coverage_pct}}%

---

## Utilizacao de Rate Limit

| Metrica | Valor | Limite (Tier {{current_tier}}) | Utilizacao |
|---------|-------|-------------------------------|------------|
| Mensagens/segundo | {{msgs_per_second}} | {{tier_limit_per_second}} | {{utilization_pct}}% |
| Mensagens/dia | {{msgs_per_day}} | {{tier_limit_per_day}} | {{daily_utilization_pct}}% |
| Throttle configurado | {{throttle_type}} | AIMD recomendado | {{throttle_status}} |

---

## Historico de Quality Score

| Periodo | Score | Status | Evento |
|---------|-------|--------|--------|
| {{period_1}} | {{score_1}} | {{status_1}} | {{event_1}} |
| {{period_2}} | {{score_2}} | {{status_2}} | {{event_2}} |
| {{period_3}} | {{score_3}} | {{status_3}} | {{event_3}} |
| {{period_4}} | {{score_4}} | {{status_4}} | {{event_4}} |

---

## Portfolio de Templates

### Resumo

| Categoria | Total | Aprovados | Rejeitados | Pausados |
|-----------|-------|-----------|------------|----------|
| MARKETING | {{mkt_total}} | {{mkt_approved}} | {{mkt_rejected}} | {{mkt_paused}} |
| UTILITY | {{util_total}} | {{util_approved}} | {{util_rejected}} | {{util_paused}} |
| AUTHENTICATION | {{auth_total}} | {{auth_approved}} | {{auth_rejected}} | {{auth_paused}} |

### Templates com Problemas

| Template | Problema | Acao Recomendada |
|----------|----------|------------------|
| {{problem_template_1}} | {{problem_1}} | {{action_1}} |
| {{problem_template_2}} | {{problem_2}} | {{action_2}} |

---

## Status de Compliance

| Item | Status | Ultima Verificacao |
|------|--------|-------------------|
| Politica de privacidade | {{privacy_status}} | {{privacy_date}} |
| Opt-in implementado | {{optin_status}} | {{optin_date}} |
| Opt-out implementado | {{optout_status}} | {{optout_date}} |
| LGPD compliance | {{lgpd_status}} | {{lgpd_date}} |
| Provas de consentimento | {{consent_status}} | {{consent_date}} |

---

## Metricas de Performance (Ultimos 30 dias)

| Metrica | Valor | Benchmark | Status |
|---------|-------|-----------|--------|
| Taxa de entrega | {{delivery_rate}} | > 95% | {{delivery_status}} |
| Taxa de leitura | {{read_rate}} | > 60% | {{read_status}} |
| Taxa de resposta | {{response_rate}} | > 10% | {{response_status}} |
| Tempo medio de entrega | {{avg_delivery_time}} | < 5s | {{delivery_time_status}} |
| Taxa de erro | {{error_rate}} | < 2% | {{error_rate_status}} |

---

## Recomendacoes

### Criticas (Acao Imediata)
1. {{critical_1}}
2. {{critical_2}}

### Importantes (Proximo Sprint)
1. {{important_1}}
2. {{important_2}}

### Melhorias (Backlog)
1. {{improvement_1}}
2. {{improvement_2}}

---

## Proxima Auditoria
- **Data:** {{next_audit_date}}
- **Foco:** {{next_audit_focus}}
