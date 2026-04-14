# Airtable: Formulas, Rollups, Views e Schema

Campos computados e views que devem ser criados manualmente na interface do Airtable
(a API MCP nao suporta criação de formulas/rollups).

Base ID: `appKh4qQ5JN94dQHv`
**Total de tabelas:** 10

| # | Tabela | Descrição |
|---|--------|-----------|
| 1 | Leads | Empresas prospectadas — dados cadastrais, SPICED, enrichment |
| 2 | Contacts | Decisores e stakeholders vinculados a leads |
| 3 | Campaigns | Campanhas WhatsApp via BilinskiZap |
| 4 | Activities | Atividades de vendas (ligacoes, emails, reunioes) |
| 5 | Messages | Mensagens WhatsApp trocadas |
| 6 | Segments | Segmentos de mercado (CNAE) |
| 7 | Users | Usuarios do sistema (auth, roles) |
| 8 | ActivityLog | Audit trail de acoes no sistema |
| 9 | Partners | Socios (QSA) extraidos do CNPJa |
| 10 | Trademarks | Marcas registradas (INPI) |
| 11 | EnrichmentLog | Log de etapas de enriquecimento |

---

## Formulas (Tabela Leads)

### spicedTotal
- **Tipo:** Formula (number, 2 casas)
- **Formula:** `(spicedS * 0.25 + spicedP * 0.25 + spicedI * 0.20 + spicedC * 0.15 + spicedD * 0.15)`
- **Uso:** Score SPICED total calculado automaticamente

### displayName
- **Tipo:** Formula (text)
- **Formula:** `IF(tradeName, tradeName, companyName)`
- **Uso:** Nome de exibição (fantasia se existir, senao razao social)

### isHot
- **Tipo:** Formula (checkbox)
- **Formula:** `IF(temperatura = "Quente", TRUE(), FALSE())`
- **Uso:** Flag booleana para filtros rapidos

### daysSinceCreation
- **Tipo:** Formula (number)
- **Formula:** `DATETIME_DIFF(NOW(), CREATED_TIME(), 'days')`
- **Uso:** Dias desde a criação do lead

### hasWhatsApp
- **Tipo:** Formula (checkbox)
- **Formula:** `IF(LEN(rfPhone & "") > 0, TRUE(), FALSE())`
- **Uso:** Lead tem telefone cadastrado (rfPhone salva whatsapp || phone, preferencia celular)

---

## Rollups (Tabela Leads)

### contactCount
- **Tipo:** Rollup
- **Campo linked:** Contacts (fldnZlX11hgBEfC1R)
- **Agregação:** COUNTA(values)
- **Uso:** Quantidade de contatos vinculados

### partnerCount
- **Tipo:** Rollup
- **Campo linked:** Socios (fldTwRjyo9O6jiDko)
- **Agregação:** COUNTA(values)
- **Uso:** Quantidade de socios

### enrichmentStepCount
- **Tipo:** Rollup
- **Campo linked:** LogEnriquecimento (fldsu0CFSwa2UZBgq)
- **Agregação:** COUNTA(values)
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
| By Segment | Group by: segment | companyName ASC | Análise por segmento |
| High Score | score >= 4 | score DESC | Leads prioritarios |
| Simples Nacional | simplesOptant = true | companyName ASC | Empresas optantes |
| Matrizes | isHeadquarters = true | companyName ASC | Apenas matrizes |

### Tabela Contacts

| View | Filtro | Uso |
|------|--------|-----|
| With WhatsApp | whatsapp nao vazio | Targeting campanhas |
| WhatsApp Confirmed | whatsappConfirmed = true | Contatos validados |
| Decisors Only | contactType = "decisor" | Lista outreach |
| By Source | Group by: source | Análise de fontes |

### Tabela Campaigns

| View | Filtro | Uso |
|------|--------|-----|
| Active | status = "Ativa" | Campanhas ativas |

### Tabela EnrichmentLog

| View | Filtro | Uso |
|------|--------|-----|
| Errors | status = "error" | Monitoramento de falhas |
| By Source | Group by: source | Análise de cobertura |

### Tabela Users

| View | Filtro | Uso |
|------|--------|-----|
| Active Users | status = "active" | Usuarios ativos |
| By Role | Group by: role | Gestão de permissoes |

### Tabela ActivityLog

| View | Filtro | Uso |
|------|--------|-----|
| Recent | — | CREATED_TIME DESC | Ultimas acoes |
| By User | Group by: userId | Atividade por usuario |

### Tabela Partners

| View | Filtro | Uso |
|------|--------|-----|
| Administradores | role contains "Administrador" | Decisores |

---

## Known Field Restrictions (prevenção de erros 422)

**CRÍTICO:** Campos que NÃO existem em determinadas tabelas. Tentar salvar nesses campos causa erro 422 silencioso no Airtable.

### Tabela Contacts — campos que NAO existem

| Campo inexistente | O que usar no lugar | Notas |
|-------------------|---------------------|-------|
| `phone` | `whatsapp` | A tabela usa `whatsapp` para numero de telefone |
| `assertivaPhoneValidated` | `whatsappConfirmed` (checkbox) | Flag de telefone validado |
| `assertivaWhatsappValidated` | `whatsappConfirmed` (checkbox) | Mesmo campo que phone validated |

### Tabela Contacts — campos que EXISTEM

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `whatsapp` | Single line text | Numero de telefone/WhatsApp |
| `whatsappConfirmed` | Checkbox | WhatsApp confirmado pela Assertiva |
| `phoneIsHot` | Checkbox | Telefone validado e ativo |
| `source` | Single select | Fonte do contato (cnpja, assertiva, manual) |
| `email` | Email | Email do contato |
| `name` | Single line text | Nome do contato |
| `role` | Single line text | Cargo |
| `contactType` | Single select | Tipo (decisor, stakeholder, influenciador) |

### Tabela Leads — notas de schema

| Campo | Tipo real | Notas |
|-------|----------|-------|
| `enrichmentStatus` | Single line text | NÃO é singleSelect — é singleLineText |
| `temperatura` | Single line text | Nome no Airtable para "temperature" (mapeado via FIELD_TO_AIRTABLE no código) |
| `rfPhone` | Single line text | Salva `whatsapp \|\| phone` (preferência celular). Assertiva atualiza quando encontra WhatsApp |

### Tabela Leads — Field IDs obrigatórios (campos Assertiva)

**REGRA:** Campos com prefixo "assertiva" no Airtable são reconhecidos APENAS por Field ID na REST API. Usar o nome do campo retorna 422.

| Campo | Field ID | Aceita nome? | Tipo |
|-------|----------|-------------|------|
| assertivaPhoneValidated | `fldcnS76Lxvemqkp4` | **NÃO** | singleLineText |
| assertivaWhatsappFlag | `fldrdDxps8r6C86sP` | **NÃO** | checkbox |
| rfPhone | `fld8I7Eb1tGJfhSyw` | SIM | phoneNumber |
| enrichmentStatus | `fldoGOPUsqbP4fwzc` | SIM | singleLineText |
| employees | `fld7D8lIRW6xEiWJe` | SIM | number |
| companyName | `fldBoavQTKIryQTWi` | SIM | singleLineText |
| cnpj | `fldpsnHQDMCvYU3Ub` | SIM | singleLineText |
| assertivaEnrichDate | — | **NÃO EXISTE** | — |

### Tabela Contacts — Field IDs

| Campo | Field ID | Tipo |
|-------|----------|------|
| name | `fldnP5Nv7I4bxKohq` | singleLineText |
| whatsapp | `fldaRqlIC0D6sxRgm` | phoneNumber |
| contactType | `fldtKbUnJH47E0IKB` | singleSelect |
| source | `fldlzSs66OcbhCLIu` | singleSelect |
| whatsappConfirmed | `fldMY9uwCUYFrZGfR` | checkbox |
| Lead (linked) | `fldTOTIfGn70ozcqm` | multipleRecordLinks |
| **phone** | — | **NÃO EXISTE** |

---

## Referência de Copy Standards para Labels no Frontend

Os labels exibidos no frontend seguem os padrões definidos pela auditoria Copy Squad (2026-04-14):

| Campo Airtable | Label no Frontend | Contexto |
|---------------|-------------------|----------|
| enrichmentStatus = "complete" | "Dados completos" / "Enriquecido" | Badge verde no card do lead |
| enrichmentStatus = "cnpja"/"assertiva" | "Processando..." | Badge amarelo animado |
| enrichmentStatus = "none" | (sem badge) | — |
| temperatura = "Quente" (score >= 3.7) | "Quente — prontos para contato" | KPI Dashboard com hint |
| temperatura = "Morno" (score 2.5–3.6) | "Morno — qualificar para aquecer" | KPI Dashboard com hint |
| temperatura = "Frio" (score < 2.5) | "Frio — aquecer com cadência" | KPI Dashboard com hint |
| segment (vazio) | "Segmento pendente" | Nunca "Sem segmento" |
| status campanha COMPLETED | "Concluída" | Feminino (campanha) |

> Ver seção completa de Copy Standards em `OUTBILI.md`.
