# Airtable: Formulas, Rollups e Views

Campos computados e views que devem ser criados manualmente na interface do Airtable
(a API MCP nao suporta criacao de formulas/rollups).

Base ID: `appKh4qQ5JN94dQHv`

---

## Formulas (Tabela Leads)

### spicedTotal
- **Tipo:** Formula (number, 2 casas)
- **Formula:** `(spicedS * 0.25 + spicedP * 0.25 + spicedI * 0.20 + spicedC * 0.15 + spicedD * 0.15)`
- **Uso:** Score SPICED total calculado automaticamente

### displayName
- **Tipo:** Formula (text)
- **Formula:** `IF(tradeName, tradeName, companyName)`
- **Uso:** Nome de exibicao (fantasia se existir, senao razao social)

### isHot
- **Tipo:** Formula (checkbox)
- **Formula:** `IF(temperatura = "Quente", TRUE(), FALSE())`
- **Uso:** Flag booleana para filtros rapidos

### daysSinceCreation
- **Tipo:** Formula (number)
- **Formula:** `DATETIME_DIFF(NOW(), CREATED_TIME(), 'days')`
- **Uso:** Dias desde a criacao do lead

### hasWhatsApp
- **Tipo:** Formula (checkbox)
- **Formula:** `IF(LEN(rfPhone & "") > 0, TRUE(), FALSE())`
- **Uso:** Lead tem telefone cadastrado

---

## Rollups (Tabela Leads)

### contactCount
- **Tipo:** Rollup
- **Campo linked:** Contacts (fldnZlX11hgBEfC1R)
- **Agregacao:** COUNTA(values)
- **Uso:** Quantidade de contatos vinculados

### partnerCount
- **Tipo:** Rollup
- **Campo linked:** Socios (fldTwRjyo9O6jiDko)
- **Agregacao:** COUNTA(values)
- **Uso:** Quantidade de socios

### enrichmentStepCount
- **Tipo:** Rollup
- **Campo linked:** LogEnriquecimento (fldsu0CFSwa2UZBgq)
- **Agregacao:** COUNTA(values)
- **Uso:** Quantidade de etapas de enriquecimento executadas

---

## Lookups (Tabela Contacts)

### companyName
- **Tipo:** Lookup
- **Campo linked:** Lead (fldTOTIfGn70ozcqm)
- **Campo source:** companyName
- **Uso:** Nome da empresa no registro do contato

### leadTemperature
- **Tipo:** Lookup
- **Campo linked:** Lead (fldTOTIfGn70ozcqm)
- **Campo source:** temperatura
- **Uso:** Temperatura do lead no registro do contato

---

## Views (criar na interface do Airtable)

### Tabela Leads

| View | Filtro | Ordenacao | Uso |
|------|--------|-----------|-----|
| Hot Leads | temperatura = "Quente" | score DESC | Dashboard |
| Pending Enrichment | enrichmentStatus != "complete" | CREATED_TIME DESC | Fila de enriquecimento |
| By Segment | Group by: segment | companyName ASC | Analise por segmento |
| High Score | score >= 4 | score DESC | Leads prioritarios |
| Simples Nacional | simplesOptant = true | companyName ASC | Empresas optantes |
| Matrizes | isHeadquarters = true | companyName ASC | Apenas matrizes |

### Tabela Contacts

| View | Filtro | Uso |
|------|--------|-----|
| With WhatsApp | whatsapp nao vazio | Targeting campanhas |
| WhatsApp Confirmed | whatsappConfirmed = true | Contatos validados |
| Decisors Only | contactType = "decisor" | Lista outreach |
| By Source | Group by: source | Analise de fontes |

### Tabela Campaigns

| View | Filtro | Uso |
|------|--------|-----|
| Active | status = "Ativa" | Campanhas ativas |

### Tabela EnrichmentLog

| View | Filtro | Uso |
|------|--------|-----|
| Errors | status = "error" | Monitoramento de falhas |
| By Source | Group by: source | Analise de cobertura |
