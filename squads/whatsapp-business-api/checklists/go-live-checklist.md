# Checklist de Go-Live

## Conta e Verificacao

### Meta Business
- [ ] Verificacao de empresa (Business Verification) concluida
- [ ] Numero de telefone registrado e verificado
- [ ] Display name aprovado pela Meta
- [ ] Business profile configurado (descricao, endereco, website, vertical)
- [ ] Conta WABA em status "CONNECTED"

---

## Infraestrutura Tecnica

### Webhook
- [ ] Endpoint de webhook ativo e respondendo (HTTP 200)
- [ ] Verificacao de assinatura implementada (HMAC SHA256)
- [ ] Deduplicacao de webhook ativa (Redis SET NX + TTL 24h)
- [ ] Retry logic configurado para falhas temporarias
- [ ] Timeout de webhook dentro do limite (20 segundos)

### Credenciais
- [ ] Credenciais armazenadas no Supabase settings (NAO em variaveis de ambiente)
- [ ] Token de acesso com permissoes corretas (whatsapp_business_management, whatsapp_business_messaging)
- [ ] Rotacao de token agendada
- [ ] System User configurado (nao token pessoal)

### API
- [ ] Versao da API definida como v24.0 (nao hardcoded para versao anterior)
- [ ] Base URL: https://graph.facebook.com/v24.0
- [ ] Validacao de formato E.164 para telefones ativa (sem prefixo +)
- [ ] Content-Type: application/json em todas as requisicoes

---

## Tratamento de Erros

### Error Handling
- [ ] Mapeamento de codigos de erro implementado (60+ codigos)
- [ ] Erros 131xxx (envio) tratados com retry adequado
- [ ] Erros 132xxx (template) tratados com notificacao
- [ ] Erros 133xxx (conta/telefone) tratados com alerta critico
- [ ] Erro 368 (bloqueio temporario) tratado com backoff exponencial
- [ ] Logs estruturados para todos os erros

### Rate Limiting
- [ ] Throttle adaptativo configurado (AIMD: +5% sucesso / -40% erro)
- [ ] Tier atual identificado e limites respeitados
- [ ] Monitoramento de utilizacao de rate limit ativo
- [ ] Queue/fila implementada para picos de envio

---

## Templates e Mensagens

### Templates
- [ ] Pelo menos 1 template aprovado por categoria necessaria
- [ ] Templates testados com valores reais de variaveis
- [ ] Fallback definido para templates rejeitados/pausados

### Mensagens de Teste
- [ ] Mensagem de texto simples enviada e recebida com sucesso
- [ ] Mensagem com template enviada e recebida com sucesso
- [ ] Mensagem com midia enviada e recebida com sucesso (se aplicavel)
- [ ] Webhook recebeu e processou mensagens de teste corretamente
- [ ] Resposta dentro da janela de 24h testada

---

## Compliance e Monitoramento

### Compliance
- [ ] Checklist de compliance APROVADO (checklists/compliance-checklist.md)
- [ ] Politica de privacidade publicada
- [ ] Mecanismo de opt-in implementado
- [ ] Mecanismo de opt-out implementado

### Monitoramento
- [ ] Monitoramento de quality score configurado
- [ ] Alertas para falhas de entrega configurados
- [ ] Dashboard de metricas operacional (delivery, read, response rates)
- [ ] Alertas para erros criticos configurados
- [ ] Plano de escalacao definido para incidentes

---

## Aprovacao Final

### Sign-off
- [ ] @whatsapp-chief: aprovacao tecnica
- [ ] @compliance-guardian: aprovacao de compliance
- [ ] @integration-engineer: aprovacao de infraestrutura
- [ ] Data de go-live definida e comunicada
