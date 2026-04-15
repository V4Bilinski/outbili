# Tech Stack — Copy Squad

Ferramentas e plataformas utilizadas pelos copywriters do squad para producao,
distribuicao, teste e analise de copy.

---

## Email Marketing

### ActiveCampaign
**Uso:** Email sequences, automacoes, lead scoring, CRM integrado  
**Quando usar:** Lancamentos complexos com automacao, segmentacao avancada, nurture multi-etapa  
**Recursos relevantes:**
- Tags e segmentos para separar prospects por awareness level
- Automacoes condicionais (abriu / nao abriu / clicou)
- Split testing de assuntos e conteudo
- Integracao com landing pages via webhook

**Configuracoes recomendadas para copy:**
```
- From name: [nome pessoal] (nao nome da empresa — maior abertura)
- Reply-to: email real que alguem monitora
- Assuntos: testar text-only vs. com emoji (depende do avatar)
- Frequencia maxima: 1 email/dia durante cart aberto
```

### ConvertKit
**Uso:** Criadores de conteudo, listas menores, simplidade de automacao  
**Quando usar:** Lancamentos internos, nurture de audiencia organica, newsletters  
**Recursos relevantes:**
- Sequences com delays customizados
- Broadcast para tags especificas
- Landing pages nativas (simples)
- Formularios de opt-in embedaveis

**Quando escolher ConvertKit vs. ActiveCampaign:**
```
ConvertKit: Lista < 10k, foco em conteudo, produto digital simples
ActiveCampaign: Lista > 10k, multiplos produtos, automacao complexa, CRM
```

### Klaviyo (e-commerce)
**Uso:** Copy para e-commerce, abandoned cart, post-purchase sequences  
**Quando usar:** Produto fisico, loja online, LTV de cliente e-commerce

---

## Landing Pages

### Unbounce
**Uso:** Landing pages de alto desempenho com A/B testing nativo  
**Quando usar:** Campanhas de trafego pago, testes de headline, opt-in pages de lancamento  
**Recursos relevantes:**
- A/B testing e multi-variant testing
- Dynamic text replacement (DTR) — personalizar headline por anuncio
- Integracoes diretas com ActiveCampaign / ConvertKit
- Smart Traffic (AI distribui visitantes por variante)

**Templates recomendados para copy:**
```
- Opt-in page: formulario acima do fold, headline + subheadline + bullets de beneficio
- Sales page: scroll longa, secoes com ancora, CTA repetido a cada secao
- Webinar page: data + hora + beneficios + formulario
```

### Leadpages
**Uso:** Landing pages rapidas, templates prontos, menor curva de aprendizado  
**Quando usar:** Testes rapidos, listas menores, orcamento menor  
**Recursos relevantes:**
- Biblioteca de templates por objetivo
- Pop-ups e banners in-site
- Leadmeter (score de qualidade da pagina)

### WordPress + Elementor / Divi
**Uso:** Sales pages longas com total customizacao, sites completos  
**Quando usar:** Presenca permanente do produto, sales page como pagina do site  
**Plugins essenciais para copy:**
```
- Thrive Architect: blocks especificos para copy (testimonial, countdown, bullet)
- ThriveLeads: opt-in forms com A/B testing
- WP Countdown: urgencia real com deadline
```

### ClickFunnels / GoHighLevel
**Uso:** Funis completos com upsell/downsell integrado  
**Quando usar:** Oferta com order bump, one-click upsell, sequencia de checkout

---

## VSL e Video

### Vimeo (Business / Premium)
**Uso:** Hosting de VSL sem distracao, analytics de retencao  
**Quando usar:** VSL pago, produto premium, sem ads do YouTube  
**Recursos relevantes:**
- Player customizavel (sem logo Vimeo no plano Business)
- Analytics: onde o espectador para de assistir
- Domain restriction (so toca no seu dominio)
- Transcricoes automaticas para versao texto

**Configuracoes para VSL:**
```
- Desabilitar botoes de share e like (remover distracao)
- Habilitar CTA customizado no final do video
- Thumbnail: screenshot do apresentador com texto da promessa principal
- Capitulos: nao usar (mantém o espectador em suspense)
```

### Wistia
**Uso:** VSL B2B, analytics avancado, turnstile (gate com email)  
**Quando usar:** Produto B2B, video marketing corporativo, captura de lead dentro do video  
**Recursos relevantes:**
- Turnstile: pedir email para assistir (a partir de X:XX do video)
- Heatmap de atencao por segundo
- A/B testing de thumbnails
- CTAs clicaveis dentro do video

**Quando escolher Wistia vs. Vimeo:**
```
Wistia: B2B, lead capture dentro do video, analytics de comportamento
Vimeo: DTC, VSL direto sem gate, maior velocidade de streaming
```

### YouTube (nao listado / unlisted)
**Uso:** VSL de baixo custo, audiencia ja existente no YouTube  
**Quando usar:** Lancamento seed, audiencia organica, menor orcamento  
**Atencao para copy:**
```
- Thumbnail e o "headline" do video — mesmas regras de headline se aplicam
- Description: copy completo da oferta (indexado pelo Google)
- Pinned comment: link de compra com texto de urgencia
- Cards e end screens: CTA adicional
```

### Loom
**Uso:** VSLs de onboarding, tutoriais de produto, video pessoal informal  
**Quando usar:** B2B outbound, onboarding de clientes, follow-up personalizado

---

## Analytics e Otimizacao

### Google Analytics 4 (GA4)
**Uso:** Tracking de conversao, comportamento na pagina, origem do trafego  
**Configuracoes essenciais para copy:**

```javascript
// Eventos customizados a trackear:
- scroll_depth: 25%, 50%, 75%, 100% (mede engajamento com o copy)
- cta_click: qual CTA foi clicado e em que posicao
- video_play / video_complete: engajamento com VSL
- form_start / form_complete: taxa de abandono de formulario
- time_on_page: tempo medio por secao
```

**Relatorios prioritarios para copy:**
```
- Behavior Flow: ver onde os usuarios saem da pagina
- Scroll Depth Report: ate onde o copy esta sendo lido
- Conversion Rate por fonte de trafego
- Device breakdown: mobile vs. desktop (formatar copy diferente)
```

### Hotjar
**Uso:** Heatmaps de clique e scroll, gravacoes de sessao, feedback in-page  
**Quando usar:** Otimizar sales page existente, identificar onde o copy perde atencao

**Configuracoes para copy:**
```
- Heatmap de scroll: ver ate onde os usuarios leem
- Click heatmap: quais elementos recebem atencao inesperada
- Recordings filter: so gravar sessoes com duracaoo > 30s (eliminar bounces)
- Feedback widget: pergunta aberta "O que impediu voce de comprar hoje?"
```

**Insights de copy que o Hotjar revela:**
```
- Headline que nao convence: alto scroll sem clique logo abaixo
- CTA na posicao errada: poucos cliques no CTA principal
- Prova social ignorada: scroll rapido sobre testimonials
- Preco como barreira: pausa longa na secao de preco
```

### Google Tag Manager
**Uso:** Implementar todos os eventos de tracking sem depender de dev  
**Tags essenciais para copy:**
```
- Facebook Pixel (conversao)
- Google Ads conversion
- Hotjar tracking code
- ActiveCampaign site tracking
- Custom scroll depth events
```

### Microsoft Clarity (gratuito)
**Uso:** Alternativa gratuita ao Hotjar para heatmaps e gravacoes  
**Quando usar:** Projetos com orcamento limitado, validacao inicial de copy

---

## Copy Writing e Producao

### Google Docs
**Uso:** Escrita colaborativa, comentarios do cliente, historico de versao  
**Convencoes de formatacao para copy:**
```
H1: Headline principal
H2: Subheadlines principais
H3: Sub-subheadlines
Bold: Claims principais, numeros, palavras-chave de conversao
Itálico: Voz do personagem, citacoes
[INSTRUCAO]: Notas de producao para designer/dev (entre colchetes)
[CTA]: Marcacao de botao de call to action
```

### Notion
**Uso:** Base de conhecimento do squad, templates de copy, research  
**Estrutura recomendada:**
```
Copy Squad KB/
├── Swipe File/ (exemplos de copy excelente por categoria)
├── Avatar Research/ (pesquisa por nicho)
├── Mecanismos Unicos/ (lista de mecanismos por produto)
├── Testimonials Bank/ (banco de depoimentos por produto)
└── A/B Test Results/ (resultados de testes anteriores)
```

### Hemingway App / Grammarly
**Uso:** Legibilidade do copy (Hemingway), gramatica e clareza (Grammarly)  
**Meta de legibilidade:** Grade 6-8 no Hemingway (copy de resposta direta deve ser simples)

---

## Plataformas de Entrega do Produto

### Hotmart / Eduzz / Kiwify (Brasil)
**Uso:** Checkout, entrega digital, gestao de afiliados  
**Copy relevante para estas plataformas:**
```
- Pagina de checkout: headline de reassurance + bullets de beneficio + garantia
- Order bump: headline curta + 1 beneficio + preco separado
- Upsell page: headline baseada no que acabou de comprar + complemento logico
- Email de boas-vindas automatico: copy de onboarding + quick win
```

### Teachable / Hotmart Club / Kajabi
**Uso:** Plataforma de membros, entrega de curso  
**Copy relevante:**
```
- Welcome email da plataforma: primeiro passo especifico + expectativa
- Lesson titles: mini-headlines com promessa de resultado especifico
- Module names: nomes que criam antecipacao e desejo de avancaro
```
