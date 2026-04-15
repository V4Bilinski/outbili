---
task: Type Generation
responsavel: "@db-architect"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - output_path: Caminho do arquivo de types (default: src/integrations/supabase/types.ts)
  - include_views: Incluir views nos types (bool)
Saida: |
  - types_file: Arquivo TypeScript gerado
  - diff_report: Diff em relacao a versao anterior
Checklist:
  - "[ ] Schema extraido via Supabase MCP"
  - "[ ] Types gerados com generate_typescript_types"
  - "[ ] Diff com versao anterior documentado"
  - "[ ] Imports verificados no projeto"
  - "[ ] npx tsc --noEmit passa"
---

# Task: fortress-type-generation

**Agent:** @db-architect
**Trigger:** `*type-generation`
**Objetivo:** Gerar TypeScript types a partir do schema Supabase e verificar integracao

---

## Inputs

```yaml
elicit: true
fields:
  - output_path: "Caminho do arquivo de types? (default: src/integrations/supabase/types.ts)"
  - include_views: "Incluir views nos types? (sim/nao)"
```

---

## Execucao

### FASE 1 — Extracao do Schema

```sql
-- Listar todas as tabelas e colunas atuais
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Usar Supabase MCP `list_tables` para inventario completo.

### FASE 2 — Geracao de Types

Usar Supabase MCP `generate_typescript_types`:
- Project ID do Supabase configurado
- Incluir Database types (Tables, Views, Functions, Enums)

**Estrutura esperada:**
```typescript
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      [table_name]: {
        Row: { /* columns */ }
        Insert: { /* insertable columns */ }
        Update: { /* updatable columns */ }
      }
    }
    Views: { /* if include_views */ }
    Functions: { /* RPC functions */ }
    Enums: { /* custom enums */ }
  }
}
```

### FASE 3 — Diff com Versao Anterior

```markdown
#### TYPE CHANGES
| Tabela | Mudanca | Antes | Depois |
|--------|---------|-------|--------|
| [tbl]  | Nova coluna | - | `col: string` |
| [tbl]  | Tipo alterado | `col: number` | `col: string` |
| [tbl]  | Coluna removida | `col: boolean` | - |
| [tbl]  | **NOVA TABELA** | - | Full type |
```

### FASE 4 — Verificacao de Integracao

```bash
# Verificar que types compilam
npx tsc --noEmit

# Verificar imports no projeto
grep -r "from.*supabase/types" src/ --include="*.ts" --include="*.tsx"
```

| Verificacao | Status |
|------------|--------|
| Types compilam (tsc) | PASS/FAIL |
| Imports existentes nao quebraram | PASS/FAIL |
| Novas tabelas acessiveis | PASS/FAIL |

---

## Outputs

- Arquivo TypeScript atualizado em [output_path]
- Diff report (tabelas/colunas adicionadas, alteradas, removidas)
- Resultado de `npx tsc --noEmit`
