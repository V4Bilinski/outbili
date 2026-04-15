# PLANO DE CAMPANHA WHATSAPP

## Campanha: {{campaign_name}}
## Responsavel: {{campaign_owner}}
## Data: {{date}}

---

## Objetivo

**Tipo:** {{objective_type}} (AQUISICAO / REENGAJAMENTO / RETENCAO / CONVERSAO / INFORMATIVO)

**Descricao:**
{{objective_description}}

**Meta Principal:**
{{primary_goal}}

---

## Publico-Alvo

### Perfil Geral
{{audience_profile}}

### Criterios de Segmentacao

| Segmento | Criterio | Tamanho Estimado | Template |
|----------|----------|------------------|----------|
| {{segment_1_name}} | {{segment_1_criteria}} | {{segment_1_size}} | {{segment_1_template}} |
| {{segment_2_name}} | {{segment_2_criteria}} | {{segment_2_size}} | {{segment_2_template}} |
| {{segment_3_name}} | {{segment_3_criteria}} | {{segment_3_size}} | {{segment_3_template}} |

### Exclusoes
- {{exclusion_1}}
- {{exclusion_2}}
- {{exclusion_3}}

---

## Templates Selecionados

| Template | Categoria | Status | Uso |
|----------|-----------|--------|-----|
| {{template_1_name}} | {{template_1_category}} | {{template_1_status}} | {{template_1_use}} |
| {{template_2_name}} | {{template_2_category}} | {{template_2_status}} | {{template_2_use}} |

---

## Sequencia de Mensagens

| Dia | Horario | Template | Segmento | Condicao |
|-----|---------|----------|----------|----------|
| {{day_1}} | {{time_1}} | {{msg_1_template}} | {{msg_1_segment}} | {{msg_1_condition}} |
| {{day_2}} | {{time_2}} | {{msg_2_template}} | {{msg_2_segment}} | {{msg_2_condition}} |
| {{day_3}} | {{time_3}} | {{msg_3_template}} | {{msg_3_segment}} | {{msg_3_condition}} |

### Fusos Horarios Brasil

| Regiao | Fuso | Horario de Envio |
|--------|------|------------------|
| Brasilia (SP, RJ, MG, etc.) | UTC-3 | {{tz_brasilia}} |
| Manaus (AM) | UTC-4 | {{tz_manaus}} |
| Fernando de Noronha | UTC-2 | {{tz_noronha}} |
| Acre | UTC-5 | {{tz_acre}} |

**Janela recomendada:** 09:00 - 20:00 horario local (evitar antes das 8h e apos 21h)

---

## Orcamento Estimado

| Item | Quantidade | Custo Unitario (BRL) | Total (BRL) |
|------|-----------|---------------------|-------------|
| Mensagens MARKETING | {{mkt_qty}} | {{mkt_unit_cost}} | {{mkt_total}} |
| Mensagens UTILITY | {{util_qty}} | {{util_unit_cost}} | {{util_total}} |
| Mensagens AUTHENTICATION | {{auth_qty}} | {{auth_unit_cost}} | {{auth_total}} |
| **Total Estimado** | | | **{{budget_total}}** |

---

## Metricas de Sucesso

| Metrica | Meta | Aceitavel | Critico |
|---------|------|-----------|---------|
| Taxa de entrega | {{delivery_target}} | {{delivery_ok}} | {{delivery_critical}} |
| Taxa de leitura | {{read_target}} | {{read_ok}} | {{read_critical}} |
| Taxa de resposta | {{response_target}} | {{response_ok}} | {{response_critical}} |
| Taxa de conversao | {{conversion_target}} | {{conversion_ok}} | {{conversion_critical}} |
| Quality score | {{quality_target}} | {{quality_ok}} | {{quality_critical}} |

---

## Quality Score

### Metas de Protecao

| Indicador | Limite | Acao se Exceder |
|-----------|--------|-----------------|
| Taxa de bloqueio | < 2% | Pausar campanha, revisar segmentacao |
| Taxa de report | < 1% | Pausar campanha, revisar conteudo |
| Quality score | >= Verde | Manter |
| Quality score | Amarelo | Reduzir volume 50%, investigar |
| Quality score | Vermelho | PARAR imediatamente |

---

## Compliance Sign-off

| Check | Status | Responsavel |
|-------|--------|-------------|
| Opt-in verificado para todos os contatos | {{optin_status}} | @compliance-guardian |
| Templates aprovados pela Meta | {{template_status}} | @template-strategist |
| LGPD compliance validada | {{lgpd_status}} | @compliance-guardian |
| Mecanismo de opt-out ativo | {{optout_status}} | @compliance-guardian |
| Horarios de envio adequados | {{schedule_status}} | @campaign-optimizer |

---

## Proximos Passos
1. {{next_step_1}}
2. {{next_step_2}}
3. {{next_step_3}}
