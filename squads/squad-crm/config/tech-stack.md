# Squad CRM — Tech Stack Reference

## Frontend
| Tecnologia | Versao | Uso |
|-----------|--------|-----|
| React | 18.3 | UI Framework |
| TypeScript | Strict | Type safety |
| Vite | 5.4 | Build tool |
| Tailwind CSS | 3.4 | Styling (utility-first) |
| shadcn-ui | Latest | Component library (Radix) |
| React Router | v6 | Routing |
| TanStack React Query | Latest | Server state management |
| React Hook Form | Latest | Forms |
| Zod | Latest | Validation |
| Recharts | Latest | Charts/graphs |
| date-fns | Latest | Date handling |
| @dnd-kit | Latest | Drag & drop |
| Sonner | Latest | Toast notifications |

## Backend
| Tecnologia | Uso |
|-----------|-----|
| Supabase | PostgreSQL + Auth + RLS + Edge Functions + Real-time |
| PostgreSQL | Database principal |
| Row-Level Security | Controle de acesso por usuario/equipe |
| Edge Functions | Calculos sensiveis (financeiro) |
| Real-time Subscriptions | Updates em tempo real |

## Integracoes
| Servico | Uso |
|---------|-----|
| Google Calendar | Sync de reunioes |
| WhatsApp | Digest de comunicacao |
| n8n | Automacoes complexas (via MCP) |

## Padrao de Data Flow
```
Page → Custom Hook → useQuery/useMutation → Supabase Client → PostgreSQL (RLS)
                                                                    ↓
                                                    Edge Function (dados sensiveis)
                                                                    ↓
                                                            UI Components
```
