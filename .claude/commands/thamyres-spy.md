# Thamyres Digital Spy

Skill de espionagem digital e prospeccao outbound. Integrada com CNPJa (dados cadastrais) e Assertiva (enriquecimento de contatos) como fontes primarias de dados.

## Trigger

Esta skill deve ser usada quando o usuario quiser:
- Espionar uma empresa digitalmente
- Mapear presenca digital de um alvo
- Detectar se empresa roda anuncios (Meta, Google, TikTok)
- Analisar SEO/SEM
- Prospectar leads outbound
- Encontrar decision-makers
- Estimar faturamento/custos de uma empresa
- Auditar presenca digital
- Coletar dados cadastrais via CNPJ
- Validar contatos WhatsApp via Assertiva

## Arsenal de Dados

Ferramentas disponiveis para coleta e enriquecimento:

| Ferramenta | Uso |
|-----------|-----|
| CNPJa API | Dados cadastrais: CNPJ, socios, QSA, endereco, situacao cadastral |
| Assertiva Localize | Enriquecimento: telefones, emails, decisores, WhatsApp confirmado |
| WebSearch | Busca web programatica para inteligencia de mercado |
| WebFetch | Extracao de conteudo de paginas web |
| EXA (via Docker) | Pesquisa semantica avancada |

## Execution Protocol

Quando ativada, esta skill DEVE:

1. **Identificar o alvo** - URL, nome da empresa, CNPJ, ou segmento
2. **Consultar CNPJa** - Obter dados cadastrais completos via CNPJ
3. **Enriquecer via Assertiva** - Buscar telefones, decisores, WhatsApp
4. **Complementar com web** - WebSearch/EXA para presenca digital, ads, SEO
5. **Cruzar dados** - Cross-reference multiplas fontes
6. **Classificar confianca** - Marcar cada dado como VERIFIED/HIGH/MEDIUM/LOW/ESTIMATED
7. **Gerar relatorio** - Output estruturado com scores e recomendacoes

## Task: Map Company

**Input:** URL, nome da empresa, ou CNPJ
**Output:** Relatorio completo de inteligencia

### Passos:

1. **Dados Cadastrais (CNPJa)**
   - Consultar CNPJa API com CNPJ da empresa
   - Extrair: razao social, nome fantasia, CNAE, porte, socios, QSA, endereco, situacao cadastral
   - Se nao tem CNPJ: buscar via WebSearch "CNPJ {nome empresa}"

2. **Enriquecimento de Contatos (Assertiva)**
   - Consultar Assertiva Localize com dados dos socios/decisores
   - Extrair: telefones, emails, WhatsApp confirmado
   - Priorizar: CEO > CMO > Head of Marketing > Head of Growth

3. **Website Crawl**
   - Usar WebFetch para extrair conteudo do site
   - Extrair: paginas, produtos/servicos, precos, equipe, blog, contato

4. **Social Media Scan**
   - Buscar perfis via WebSearch: Instagram, LinkedIn, Facebook, TikTok, YouTube
   - Extrair metricas publicas disponiveis

5. **SEO/SEM Intelligence**
   - WebSearch para analise de presenca organica
   - Verificar presenca em resultados patrocinados

6. **Tech Stack Detection**
   - Analisar source code do site via WebFetch
   - Detectar: CMS, analytics (GA4/GTM), pixels (Meta/Google/TikTok), chat widgets, CRM

7. **Compilar Relatorio**
   - Cruzar todos os dados
   - Score de maturidade digital (0-100)
   - Identificar gaps e oportunidades
   - Sugerir angulo de abordagem outbound

## Task: Prospect Outbound

**Input:** ICP (segmento, regiao, tamanho, sinais)
**Output:** Lista qualificada de leads com scores

### Lead Scoring Model:

| Criterio | Peso | Sinais |
|----------|------|--------|
| Maturidade Digital | 25% | Qualidade do site, presenca social, frequencia de conteudo |
| Atividade de Ads | 20% | Roda anuncios, pixel instalado, multi-canal |
| Fit de Mercado | 25% | Match com ICP, segmento certo, tamanho certo |
| Sinais de Crescimento | 15% | Contratando, novos produtos, expandindo |
| Acessibilidade | 15% | Contato encontrado, decision-makers identificados |

### Score Tiers:
- **A (80-100):** Lead quente - abordar imediatamente
- **B (60-79):** Lead morno - nutrir com valor
- **C (40-59):** Lead frio - adicionar a cadencia
- **D (0-39):** Nao qualificado - skip

## Task: Find Decision Makers

**Input:** Nome da empresa ou CNPJ
**Output:** Lista de decision-makers com dados de contato

### Execucao:
1. Consultar CNPJa para obter socios e QSA
2. Enriquecer via Assertiva Localize: telefones, emails, WhatsApp
3. Complementar com WebSearch: LinkedIn, cargo, senioridade
4. Priorizar: CEO > CMO > Head of Marketing > Head of Growth > Marketing Manager

## Task: Revenue Estimation

**Input:** Dados coletados de map-company
**Output:** Estimativa de faturamento e custos

### Sinais utilizados:
- **Porte (CNPJa):** MEI, ME, EPP, Medio, Grande
- **CNAE (CNPJa):** Setor e atividade economica
- **Socios (CNPJa):** Numero e perfil dos socios
- **Trafego:** Estimativas de trafego web
- **Team Size:** Funcionarios estimados
- **Growth Signals:** Tendencia de trafego, contratacoes, novos produtos

### Output:
- Faturamento estimado (range): R$ X - R$ Y / mes
- Marketing spend estimado: R$ X / mes
- Custo estimado com equipe: R$ X / mes
- Confianca da estimativa: LOW / MEDIUM / HIGH

## Report Template

```markdown
# Intelligence Report: {empresa}
**Data:** {data} | **Analista:** Thamyres | **Confianca:** {level}

## Executive Summary
{resumo em 3-4 linhas}

## Company Overview (CNPJa)
- **Razao Social:** {razao_social}
- **Nome Fantasia:** {nome_fantasia}
- **CNPJ:** {cnpj}
- **CNAE:** {cnae} - {descricao}
- **Porte:** {porte}
- **Situacao:** {situacao_cadastral}
- **Endereco:** {endereco}
- **Socios:** {lista_socios}

## Decision Makers (Assertiva)
| Nome | Cargo | Telefone | WhatsApp | Email |
|------|-------|----------|----------|-------|
| {nome} | {cargo} | {tel} | {whatsapp} | {email} |

## Digital Maturity Score: {score}/100
| Dimensao | Score | Detalhe |
|----------|-------|---------|
| Website | {X}/10 | {detalhe} |
| SEO | {X}/10 | {detalhe} |
| Social Media | {X}/10 | {detalhe} |
| Paid Media | {X}/10 | {detalhe} |
| Conteudo | {X}/10 | {detalhe} |
| Reputacao | {X}/10 | {detalhe} |

## Outbound Approach
- **Angulo recomendado:** {abordagem}
- **Pain points detectados:** {lista}
- **Decision Maker:** {nome} - {cargo}
- **Canal preferido:** {canal}

## Fontes & Confianca
{lista de fontes com nivel de confianca}
```
