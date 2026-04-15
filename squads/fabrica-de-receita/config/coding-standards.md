# Coding Standards — Fábrica de Receita

Padrões de output, nomenclatura e qualidade mínima para todos os artefatos produzidos pelo squad.

---

## 1. Formato de Diagnóstico

### Estrutura obrigatória
Todo diagnóstico deve seguir exatamente o template `diagnostico-travas-tmpl.md` e conter:

1. **Contexto do negócio** — empresa, segmento, faturamento atual e meta
2. **Tabela T1–T8** — todas as 8 travas avaliadas (Ativa / Inativa / N/A)
3. **Gargalo principal** — identificado via TOC, com causa raiz e cadeia de causalidade
4. **Dados coletados** — mínimo 4 métricas por pilar (tráfego, engajamento, conversão, retenção)
5. **Recomendação** — produto DR correto com justificativa

### Regras de evidência
- Toda trava classificada como "Ativa" DEVE ter pelo menos 2 evidências quantitativas
- Nunca classificar trava com base apenas em percepção qualitativa sem dado
- Impacto financeiro é obrigatório para a trava principal (pode ser estimativa fundamentada)
- Score de confiança é obrigatório: Alto (dados suficientes), Médio (dados parciais), Baixo (estimativa)

### Proibido em diagnósticos
- Classificar múltiplas travas como "principal" sem definir o gargalo único
- Recomendar produto DR sem vincular ao diagnóstico
- Usar jargão técnico sem explicação para o cliente

---

## 2. Formato de Report de Growth

### Frequência e tipos
- **Report semanal:** Métricas das 4 pilares + experimentos + próximos passos
- **Report mensal:** Consolidado com OKR progress + análise profunda + revisão de estratégia

### Estrutura obrigatória (ambos os tipos)
1. Resumo executivo (máximo 3 linhas, linguagem não técnica)
2. Status geral do ciclo: `No prazo` / `Atenção necessária` / `Em risco`
3. Tabela de métricas por pilar (baseline vs. atual vs. meta)
4. Análise qualitativa por pilar (mínimo 2 linhas por pilar)
5. Experimentos do período (hipótese, resultado, próxima ação)
6. OKRs com % de atingimento
7. Próximos passos priorizados
8. Bloqueios e riscos

### Regras de variação
- Variação é sempre calculada em relação ao período anterior, não ao baseline
- Variações >= +20% devem ser destacadas como conquista
- Variações <= -10% devem ter análise de causa obrigatória
- Sem dado disponível: registrar `N/D` (não disponível) — nunca inventar número

---

## 3. Naming Conventions

### Arquivos e documentos
```
diagnostico-[nome-cliente]-[data-YYYYMMDD].md
proposta-dr-[nome-cliente]-v[N].md
ciclo-90d-[nome-cliente]-[data-inicio-YYYYMM].md
report-[semanal|mensal]-[nome-cliente]-s[N]|m[N]-[ano].md
```

### IDs de travas
- Sempre `T1` a `T8` (nunca `trava-1`, `trava_1`, `Trava 1`)

### IDs de produtos
- Sempre `DR-X`, `DR-O`, `DR-T`, `DR-E` (maiúsculas com hífen)

### IDs de pilares
- Sempre `P1`, `P2`, `P3`, `P4` ou por nome: `Tráfego`, `Engajamento`, `Conversão`, `Retenção`

### Variáveis em templates
- Placeholders: `{{NOME_VARIAVEL}}` (chaves duplas, maiúsculas, underscore)
- Alternativas: `{{Opção A | Opção B | Opção C}}` (pipe separando opções)
- Números a preencher: `{{N}}` ou `{{VALOR_NUMERICO}}`

---

## 4. Quality Minimums por Pilar

### Tráfego
| Critério | Mínimo aceitável |
|---------|-----------------|
| Período de dados analisado | >= 90 dias |
| Canais auditados | Todos os ativos (pelo menos 3) |
| Precisão do CAC | Calculado, não estimado |
| Benchmark competitivo | Pelo menos 1 concorrente direto |

### Engajamento
| Critério | Mínimo aceitável |
|---------|-----------------|
| Canais de e-mail | Taxa de abertura dos últimos 30 dias |
| Redes sociais | Pelo menos 30 posts analisados |
| Comportamento on-site | Hotjar ou equivalente configurado |
| Segmentação | Pelo menos 2 segmentos avaliados |

### Conversão
| Critério | Mínimo aceitável |
|---------|-----------------|
| Funil mapeado | Todas as etapas com taxa calculada |
| Volume mínimo | >= 100 eventos de conversão analisados |
| Pontos de abandono | Top 3 identificados |
| Velocidade do ciclo | Calculada com dados reais |

### Retenção
| Critério | Mínimo aceitável |
|---------|-----------------|
| Churn calculado | Últimos 3 meses no mínimo |
| LTV calculado | Com histórico de compra real |
| Segmentação | Churn por cohort (se >= 6 meses de dados) |
| Motivos de churn | Pelo menos 5 saídas investigadas |

---

## 5. Padrões de Linguagem

### Tom nos artefatos para clientes
- Direto, sem rodeios
- Baseado em dados (mostrar números antes de conclusões)
- Orientado a ação (cada insight deve ter um "e portanto...")
- Sem jargão de marketing sem explicação

### Tom nos artefatos internos do squad
- Técnico e preciso
- Referências a metodologia V4, TOC, SPICED quando aplicável
- IDs de travas, pilares e produtos sempre no formato padronizado

### Proibido em qualquer artefato
- Prometer resultados sem baseline e premissas documentadas
- Usar "best practice" sem vincular a um contexto específico
- Afirmar causalidade sem dados suficientes (usar "correlação" quando apropriado)
- Números sem fonte (sempre indicar: GA4, Meta Ads, cliente, estimativa)

---

## 6. Versionamento de Documentos

```
v1.0  — Primeira versão entregue ao cliente
v1.1  — Revisão leve (correções, clareza)
v2.0  — Revisão estrutural (mudança de escopo, produto, timeline)
```

- Versões de rascunho internas: `v0.1`, `v0.2`
- Nunca enviar ao cliente documento sem número de versão
- Sempre registrar data de geração no rodapé do documento

---

## 7. Gates de Qualidade

Antes de entregar qualquer artefato ao cliente, verificar:

- [ ] Template correto utilizado
- [ ] Todos os placeholders preenchidos (nenhum `{{` visível)
- [ ] Métricas com fonte identificada
- [ ] Checklist correspondente passado (ex: `diagnostico-checklist.md`)
- [ ] Revisado por `@fabrica-de-receita-master` ou agente sênior do squad
- [ ] Versão e data registrados no documento
