# ESPECIFICACAO DE TEMPLATE

## Identificacao: {{template_name}}
## Categoria: {{category}}
## Idioma: {{language_code}}
## Data: {{date}}

---

## Caso de Uso

**Objetivo:**
{{use_case_objective}}

**Contexto de Envio:**
{{sending_context}}

**Publico-alvo:**
{{target_audience}}

---

## Header

| Campo | Valor |
|-------|-------|
| Tipo | {{header_type}} (NONE / TEXT / IMAGE / VIDEO / DOCUMENT) |
| Conteudo | {{header_content}} |
| Formato | {{header_format}} (se midia) |
| Tamanho Max | {{header_size_limit}} |

---

## Body

**Texto:**
```
{{body_text}}
```

**Caracteres:** {{body_char_count}} / 1024

**Variaveis:**

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| {{1}} | {{var_1_description}} | {{var_1_example}} |
| {{2}} | {{var_2_description}} | {{var_2_example}} |
| {{3}} | {{var_3_description}} | {{var_3_example}} |

---

## Footer

| Campo | Valor |
|-------|-------|
| Texto | {{footer_text}} |
| Caracteres | {{footer_char_count}} / 60 |

---

## Botoes

| # | Tipo | Texto | Valor |
|---|------|-------|-------|
| 1 | {{button_1_type}} | {{button_1_text}} | {{button_1_value}} |
| 2 | {{button_2_type}} | {{button_2_text}} | {{button_2_value}} |
| 3 | {{button_3_type}} | {{button_3_text}} | {{button_3_value}} |

**Tipos disponiveis:** QUICK_REPLY / URL / PHONE_NUMBER / COPY_CODE

---

## Mapeamento de Variaveis

| Variavel | Origem no Sistema | Formato | Validacao |
|----------|-------------------|---------|-----------|
| {{1}} | {{var_1_source}} | {{var_1_format}} | {{var_1_validation}} |
| {{2}} | {{var_2_source}} | {{var_2_format}} | {{var_2_validation}} |

---

## Compliance

| Check | Status | Notas |
|-------|--------|-------|
| Categoria correta | {{category_check}} | {{category_notes}} |
| Conteudo permitido | {{content_check}} | {{content_notes}} |
| Opt-out (se MARKETING) | {{optout_check}} | {{optout_notes}} |
| Dados sensiveis ausentes | {{sensitive_check}} | {{sensitive_notes}} |
| URLs em botoes | {{url_check}} | {{url_notes}} |

---

## Timeline de Aprovacao

| Etapa | Estimativa | Status |
|-------|-----------|--------|
| Criacao | {{creation_date}} | {{creation_status}} |
| Revisao de compliance | {{compliance_date}} | {{compliance_status}} |
| Submissao via API | {{submission_date}} | {{submission_status}} |
| Aprovacao Meta | 24-48h apos submissao | {{approval_status}} |
| Deploy em producao | {{deploy_date}} | {{deploy_status}} |

---

## Payload JSON (Referencia)

```json
{
  "name": "{{template_name}}",
  "language": "{{language_code}}",
  "category": "{{category}}",
  "components": [
    {{components_json}}
  ]
}
```

---

## Proximos Passos
1. {{next_step_1}}
2. {{next_step_2}}
3. {{next_step_3}}
