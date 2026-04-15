---
task: Container Orchestration
responsavel: "@cloud-infra-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - container_runtime: Runtime (docker/easypanel)
  - environment: Ambiente (dev/staging/prod)
  - include_monitoring: Incluir monitoring containers (bool)
Saida: |
  - dockerfile_optimized: Dockerfile otimizado
  - orchestration_config: Config de orquestracao
  - security_report: Relatorio de seguranca de containers
Checklist:
  - "[ ] Inventario de containers atual"
  - "[ ] Arquitetura de rede revisada"
  - "[ ] Health checks configurados"
  - "[ ] Seguranca verificada (base image, non-root, secrets)"
  - "[ ] Multi-stage build implementado"
  - "[ ] Orquestracao configurada"
---

# Task: fortress-container-orchestration

**Agent:** @cloud-infra-engineer (com @devops-pipeline-master)
**Trigger:** `*container-orchestration`
**Objetivo:** Projetar e revisar setup de containers para a aplicacao

---

## Inputs

```yaml
elicit: true
fields:
  - container_runtime: "Runtime? (docker/easypanel)"
  - environment: "Ambiente? (dev/staging/prod)"
  - include_monitoring: "Incluir containers de monitoring? (sim/nao)"
```

---

## Execucao

### FASE 1 — Inventario de Containers

| Container | Imagem | Tamanho | Porta | Health Check | Status |
|-----------|--------|---------|-------|-------------|--------|
| app | node:22-alpine | [X]MB | 3000 | /health | Running |
| nginx | nginx:alpine | [X]MB | 80,443 | / | Running |
| [service] | [image] | [X]MB | [port] | [path] | [status] |

### FASE 2 — Architecture Review

| Aspecto | Atual | Recomendado | Acao |
|---------|-------|------------|------|
| Networking | bridge default | Custom network isolado | Criar network dedicada |
| Volumes | bind mounts | Named volumes | Migrar para named |
| Health checks | Nenhum | HTTP + cmd | Adicionar em todos |
| Restart policy | no | unless-stopped | Atualizar |
| Resource limits | Sem limites | CPU/Memory limits | Definir por container |

### FASE 3 — Security Scan

| Verificacao | Container | Status | Fix |
|------------|-----------|--------|-----|
| Base image atualizada | [all] | PASS/FAIL | Update tag |
| Non-root user | [all] | PASS/FAIL | USER directive |
| Secrets via env | [all] | PASS/FAIL | Docker secrets |
| Read-only filesystem | [app] | PASS/FAIL | --read-only flag |
| No privilege escalation | [all] | PASS/FAIL | --security-opt |

### FASE 4 — Otimizacao

**Multi-stage Dockerfile:**
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
WORKDIR /app
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:3000/health
CMD ["node", "dist/index.js"]
```

### FASE 5 — Orchestration Config

**Docker Compose (ou Easypanel equivalent):**
```yaml
services:
  app:
    build: .
    restart: unless-stopped
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks: [app-network]

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./dist:/usr/share/nginx/html:ro
    networks: [app-network]

networks:
  app-network:
    driver: bridge
```

---

## Outputs

- Dockerfile otimizado (multi-stage, non-root, health check)
- Docker Compose / Easypanel config
- Security report de containers
