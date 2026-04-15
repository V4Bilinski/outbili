# Diagnóstico de Travas — {{NOME_CLIENTE}}

**Data do diagnóstico:** {{DATA}}
**Agente responsável:** {{AGENTE}}
**Produto DR recomendado:** {{PRODUTO_DR}}
**Score de confiança:** {{Alto | Médio | Baixo}}

---

## Contexto do Negócio

| Campo | Valor |
|-------|-------|
| Empresa | {{NOME_EMPRESA}} |
| Segmento | {{SEGMENTO}} |
| Faturamento mensal atual | R$ {{FATURAMENTO_ATUAL}} |
| Meta de faturamento (90 dias) | R$ {{META_FATURAMENTO}} |
| Principal canal de aquisição | {{CANAL_AQUISICAO}} |
| Ticket médio | R$ {{TICKET_MEDIO}} |

---

## Tabela de Travas T1–T8

| ID | Trava | Status | Evidências | Impacto (R$/mês) | Recomendação |
|----|-------|--------|------------|------------------|--------------|
| T1 | Posicionamento e Proposta de Valor | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T1}} | R$ {{IMPACTO_T1}} | {{RECOMENDACAO_T1}} |
| T2 | Tráfego e Aquisição | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T2}} | R$ {{IMPACTO_T2}} | {{RECOMENDACAO_T2}} |
| T3 | Engajamento e Nutrição | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T3}} | R$ {{IMPACTO_T3}} | {{RECOMENDACAO_T3}} |
| T4 | Conversão e Fechamento | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T4}} | R$ {{IMPACTO_T4}} | {{RECOMENDACAO_T4}} |
| T5 | Oferta e Precificação | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T5}} | R$ {{IMPACTO_T5}} | {{RECOMENDACAO_T5}} |
| T6 | Processo Comercial | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T6}} | R$ {{IMPACTO_T6}} | {{RECOMENDACAO_T6}} |
| T7 | Time e Execução | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T7}} | R$ {{IMPACTO_T7}} | {{RECOMENDACAO_T7}} |
| T8 | Retenção e LTV | {{Ativa / Inativa / N/A}} | {{EVIDENCIAS_T8}} | R$ {{IMPACTO_T8}} | {{RECOMENDACAO_T8}} |

---

## Gargalo Principal (TOC)

**Trava Gargalo:** T{{ID}} — {{NOME_TRAVA}}

**Descrição do gargalo:**
> {{DESCRICAO_GARGALO}}

**Causa raiz identificada:**
> {{CAUSA_RAIZ}}

**Relação de causalidade (trava → perda de receita):**
> {{CADEIA_CAUSALIDADE}}

**Impacto financeiro estimado:** R$ {{IMPACTO_TOTAL}}/mês

---

## Travas Secundárias

| Prioridade | Trava | Impacto | Dependência |
|-----------|-------|---------|-------------|
| 1 | T{{ID}} — {{NOME}} | R$ {{IMPACTO}}/mês | {{DEPENDENCIA}} |
| 2 | T{{ID}} — {{NOME}} | R$ {{IMPACTO}}/mês | {{DEPENDENCIA}} |
| 3 | T{{ID}} — {{NOME}} | R$ {{IMPACTO}}/mês | {{DEPENDENCIA}} |

---

## Dados Coletados

### Tráfego
- Sessões/mês: {{SESSOES}}
- CAC médio: R$ {{CAC}}
- Principais fontes: {{FONTES}}

### Engajamento
- Taxa de abertura e-mail: {{TAXA_ABERTURA}}%
- CTR médio: {{CTR}}%
- NPS: {{NPS}} (se disponível)

### Conversão
- Taxa de conversão funil completo: {{TAXA_CONVERSAO}}%
- Principal ponto de abandono: {{PONTO_ABANDONO}}

### Retenção
- Churn mensal: {{CHURN}}%
- LTV médio: R$ {{LTV}}

---

## Recomendação Final

**Produto recomendado:** {{PRODUTO_DR}} — {{NOME_PRODUTO}}

**Justificativa:**
> {{JUSTIFICATIVA_PRODUTO}}

**Próximo passo:**
> {{PROXIMO_PASSO}}

---

*Diagnóstico gerado pela Fábrica de Receita | Squad Growth V4*
