# WhatsApp Business API — Knowledge Base

## Cloud API v24.0 — Endpoints Principais

| Operacao | Metodo | Endpoint | Notas |
|----------|--------|----------|-------|
| Enviar mensagem | POST | `/{phone_number_id}/messages` | messaging_product: "whatsapp" |
| Upload de midia | POST | `/{phone_number_id}/media` | form-data, max varia por tipo |
| Download de midia | GET | `/{media_id}` | URL expira em 5 min |
| Deletar midia | DELETE | `/{media_id}` | Somente midia propria |
| Criar template | POST | `/{waba_id}/message_templates` | Requer aprovacao Meta |
| Listar templates | GET | `/{waba_id}/message_templates` | Paginacao cursor-based |
| Deletar template | DELETE | `/{waba_id}/message_templates?name={name}` | Deleta todas as linguas |
| Registrar telefone | POST | `/{phone_number_id}/register` | Requer code de verificacao |
| Business profile | GET/POST | `/{phone_number_id}/whatsapp_business_profile` | about, address, etc. |
| QR Code | GET/POST | `/{phone_number_id}/message_qrdls` | Deep link para conversa |

**Base URL:** `https://graph.facebook.com/v24.0`
**Auth:** `Authorization: Bearer {access_token}`

---

## Tipos de Mensagem — Referencia Rapida

| Tipo | Campo | Janela 24h | Template Necessario |
|------|-------|-----------|-------------------|
| text | `type: "text"` | Sim (resposta) ou Template | Fora da janela: sim |
| image | `type: "image"` | Sim (resposta) ou Template | Fora da janela: sim |
| video | `type: "video"` | Sim (resposta) ou Template | Fora da janela: sim |
| audio | `type: "audio"` | Sim (resposta) ou Template | Fora da janela: sim |
| document | `type: "document"` | Sim (resposta) ou Template | Fora da janela: sim |
| sticker | `type: "sticker"` | Somente dentro da janela | N/A |
| location | `type: "location"` | Somente dentro da janela | N/A |
| contacts | `type: "contacts"` | Somente dentro da janela | N/A |
| interactive (list) | `type: "interactive"` | Somente dentro da janela | N/A |
| interactive (button) | `type: "interactive"` | Somente dentro da janela | N/A |
| template | `type: "template"` | Qualquer momento | Sim (obrigatorio) |
| reaction | `type: "reaction"` | Somente dentro da janela | N/A |

---

## Top 20 Codigos de Erro

| Codigo | Descricao | Resolucao |
|--------|-----------|-----------|
| 131000 | Erro generico de envio | Verificar payload e tentar novamente |
| 131005 | Permissao negada | Verificar token e permissoes |
| 131008 | Parametro obrigatorio ausente | Checar campos required no payload |
| 131009 | Parametro invalido | Validar formato (E.164, IDs, etc.) |
| 131016 | Destinatario nao e usuario WhatsApp | Numero nao registrado no WhatsApp |
| 131021 | Limite de envio atingido (rate limit) | Implementar backoff, aguardar |
| 131026 | Mensagem nao entregue | Telefone offline ou erro de rede |
| 131042 | Tempo de envio expirou | Reenviar com novo request |
| 131045 | Mensagem nao enviada (24h expirada) | Usar template em vez de mensagem livre |
| 131047 | Re-engagement necessario | Aguardar resposta do usuario |
| 131051 | Tipo de mensagem nao suportado | Verificar tipo e formato |
| 131053 | Upload de midia falhou | Verificar formato e tamanho |
| 132000 | Erro generico de template | Verificar status do template |
| 132001 | Template nao existe | Verificar nome e idioma |
| 132005 | Template com parametros incorretos | Verificar numero e formato das variaveis |
| 132007 | Template nao aprovado | Aguardar aprovacao ou resubmeter |
| 132012 | Template pausado | Quality score baixo, revisar conteudo |
| 132015 | Template desabilitado | Criar novo template |
| 133000 | Erro de conta/telefone | Verificar registro do numero |
| 368 | Bloqueio temporario (spam/quality) | Parar envios, melhorar quality score |

---

## Sistema de Tiers

| Tier | Limite de Mensagens/24h | Requisito para Progredir |
|------|------------------------|--------------------------|
| Tier 1 | 250 contatos unicos | Enviar >= 2x o limite atual |
| Tier 2 | 1.000 contatos unicos | Quality score "Conectado" |
| Tier 3 | 10.000 contatos unicos | Quality score "Conectado" |
| Tier 4 | 100.000 contatos unicos | Quality score "Conectado" |
| Ilimitado | Sem limite | Solicitacao a Meta |

**Regras:**
- Progressao automatica apos enviar >= 2x o limite com quality score "Conectado"
- Regressao se quality score cair para "Low" (Vermelho)
- Limite e por numero de telefone, NAO por WABA
- Contatos unicos = numeros distintos em 24h rolling window

---

## Precos Brasil (Estimativa)

| Categoria | Custo por Mensagem (BRL) | Quem Paga |
|-----------|--------------------------|-----------|
| MARKETING | ~R$ 0,50 - 0,80 | Empresa |
| UTILITY | ~R$ 0,15 - 0,25 | Empresa |
| AUTHENTICATION | ~R$ 0,15 - 0,25 | Empresa |
| SERVICE (dentro 24h) | Gratis (primeiras 1000/mes) | — |

**Nota:** Precos variam conforme BSP e volume. Consultar Meta Business para valores atualizados.

---

## Limites de Templates

| Item | Limite |
|------|--------|
| Templates por WABA | 250 (padrao), solicitar aumento |
| Idiomas por template | Sem limite |
| Body characters | 1.024 |
| Header characters (texto) | 60 |
| Footer characters | 60 |
| Button text characters | 25 |
| Botoes por template | 10 (max) |
| Quick reply buttons | 3 (max) |
| Variaveis no body | Sem limite fixo |

---

## Limites de Midia

| Tipo | Formatos | Tamanho Max |
|------|----------|-------------|
| Imagem | JPEG, PNG | 5 MB |
| Video | MP4, 3GPP | 16 MB |
| Audio | AAC, MP4, MPEG, AMR, OGG | 16 MB |
| Documento | PDF, DOC, DOCX, PPT, XLS, etc. | 100 MB |
| Sticker | WEBP | 100 KB (estatico), 500 KB (animado) |

---

## Regras da Janela de 24 Horas

1. **Abertura:** Janela abre quando o usuario envia uma mensagem para o numero da empresa
2. **Duracao:** 24 horas a partir da ultima mensagem do usuario
3. **Dentro da janela:** Qualquer tipo de mensagem pode ser enviado (texto livre, midia, interativo)
4. **Fora da janela:** SOMENTE mensagens de template podem ser enviadas
5. **Renovacao:** Cada nova mensagem do usuario renova a janela por mais 24h
6. **Custo:** Mensagens de servico dentro da janela sao gratuitas (primeiras 1000/mes)
7. **Excecao:** Templates podem ser enviados a qualquer momento, com ou sem janela aberta
