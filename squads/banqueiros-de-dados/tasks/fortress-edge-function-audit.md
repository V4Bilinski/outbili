---
name: fortress-edge-function-audit
description: Auditar Edge Functions deployadas no Supabase — seguranca, performance e conformidade
agent: devops-pipeline-master
---

# Fortress Edge Function Audit

## Objetivo
Realizar auditoria completa de todas as Edge Functions deployadas no projeto Supabase, cobrindo seguranca, performance, error handling, e conformidade com padroes do squad.

## Pre-requisitos
- Acesso ao projeto Supabase (admin)
- Supabase CLI instalado e autenticado
- Acesso ao repositorio com codigo das functions

## Passos

### 1. Inventario de Edge Functions

```bash
# Listar todas as functions deployadas
supabase functions list --project-ref $PROJECT_REF

# Para cada function, coletar detalhes
supabase functions get <function-name> --project-ref $PROJECT_REF
```

Preencher inventario:

| Function | Rota | Versao | Ultimo Deploy | Status |
|----------|------|--------|---------------|--------|
| | | | | |

### 2. Auditoria de seguranca

Para cada function, verificar:

```typescript
// CHECK 1: Authorization header validado?
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  return new Response('Unauthorized', { status: 401 })
}

// CHECK 2: JWT validado via Supabase client?
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) {
  return new Response('Invalid token', { status: 401 })
}

// CHECK 3: Service role key NAO exposta?
// ⛔ NUNCA: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') em resposta
// ✅ APENAS: usar server-side para operacoes privilegiadas

// CHECK 4: CORS configurado?
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://seu-dominio.com', // NAO usar '*'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CHECK 5: Rate limiting implementado?
// Verificar se ha throttling por IP ou por usuario

// CHECK 6: Input validation?
// Verificar se todos os inputs sao validados (zod, etc.)
```

Checklist por function:

| Check | Descricao | Resultado |
|-------|-----------|-----------|
| AUTH | Authorization header validado | ✅/⛔ |
| JWT | Token verificado via Supabase Auth | ✅/⛔ |
| SECRET | Service role key protegida | ✅/⛔ |
| CORS | Origin restrito (nao wildcard) | ✅/⛔ |
| RATE | Rate limiting implementado | ✅/⛔ |
| INPUT | Input validation em todos os endpoints | ✅/⛔ |
| ERROR | Error handling sem leak de info interna | ✅/⛔ |

### 3. Auditoria de performance

```bash
# Verificar logs de execucao
supabase functions logs <function-name> --project-ref $PROJECT_REF
```

Para cada function:

```sql
-- Verificar via Supabase logs (se disponivel)
-- Metricas a coletar:
-- - Avg execution time
-- - P95/P99 execution time
-- - Error rate
-- - Invocations/hour
```

| Function | Avg Time | P99 Time | Error Rate | Invocations/h |
|----------|----------|----------|------------|---------------|
| | | | | |

### 4. Auditoria de dependencias

```bash
# Para cada function, verificar:
# 1. Imports de URLs externas (Deno) — estao pinados a versao?
# 2. Ha dependencias vulneraveis?
# 3. Tamanho do bundle esta razoavel?

# Verificar imports
grep -rn 'import.*from.*http' supabase/functions/*/index.ts
```

### 5. Verificar configuracao de secrets

```bash
# Listar secrets configurados
supabase secrets list --project-ref $PROJECT_REF

# Verificar que secrets criticos existem
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 6. Testar health de cada function

```bash
# Health check para cada function
for fn in $(supabase functions list --project-ref $PROJECT_REF --json | jq -r '.[].slug'); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://$PROJECT_REF.supabase.co/functions/v1/$fn" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY")
  echo "$fn: HTTP $STATUS"
done
```

### 7. Gerar relatorio

| Metrica | Valor |
|---------|-------|
| Total functions deployadas | |
| Functions com auth completo | /total |
| Functions sem rate limiting | |
| Avg execution time (geral) | |
| Functions com error rate > 5% | |
| Secrets configurados | /esperados |

## Output
- Inventario completo de Edge Functions
- Security audit por function (checklist preenchido)
- Performance baseline por function
- Lista de vulnerabilidades e remediações
- Relatorio consolidado

## Validacao
- [ ] Todas as functions tem auth header validation
- [ ] Zero functions expondo service_role key
- [ ] CORS configurado com origin especifico (nao wildcard)
- [ ] P99 execution time < 5s para todas as functions
- [ ] Error rate < 5% em todas as functions
- [ ] Todos os secrets necessarios configurados
- [ ] Dependencias externas pinadas a versao
