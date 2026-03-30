# Squad CRM — Coding Standards

## Stack do Brabissimo
- React 18.3 + TypeScript + Vite 5.4
- Tailwind CSS 3.4 + shadcn-ui (Radix primitives)
- Supabase (PostgreSQL + RLS + Edge Functions)
- TanStack React Query + React Router v6
- React Hook Form + Zod validation
- Recharts (graficos)

## Convencoes de Codigo

### Hooks
- Path: `src/hooks/{domain}/use{Feature}.ts`
- Dominios existentes: clients, sales, tickets, people, meetings, goals, projects, tasks, production, dashboard, journey, shared, integrations, auth
- Usar useQuery para fetching, useMutation para escrita
- Sempre retornar loading, error, data

### Pages
- Path: `src/pages/{PageName}.tsx`
- Early return com Loader2 para loading state
- Usar hooks de dominio para dados
- Protected via ProtectedRoute

### Components
- Path: `src/components/{domain}/{ComponentName}.tsx`
- UI primitives em `src/components/ui/` (shadcn-ui)
- Dialogos para CRUD: `Create{Entity}Dialog.tsx`, `{Entity}DetailDialog.tsx`

### Types
- Path: `src/types/{entity}.ts`
- Interfaces com TypeScript strict
- Discriminated unions para status/tipo

### Imports
- Sempre usar `@/` para imports absolutos
- Nunca imports relativos cross-directory

## Regras de Cor (Brandbook ABSOLUTO)
- AZUL PROIBIDO em qualquer forma
- Tailwind `slate-*` proibido → usar `stone-*`
- Cores primarias: #FF3B00, #D91A1A, #FF6B1A
- DISC: D=vermelho, I=amarelo, S=verde, C=violeta (NUNCA azul)
