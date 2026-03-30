# Squad CRM — Source Tree Reference

## Brabissimo Application Structure
```
brabssimo/src/
├── pages/                          # 46 pages (routed)
│   ├── Dashboard.tsx               # KPIs, health scores
│   ├── CommandCenter.tsx           # Central de comando executivo
│   ├── Clients.tsx                 # Listagem de clientes
│   ├── ClientProfile.tsx           # Perfil detalhado do cliente
│   ├── Sales.tsx                   # Pipeline de vendas
│   ├── PreSales.tsx                # Pre-vendas, leads
│   ├── CSTickets.tsx               # Customer Success tickets
│   ├── UpsellTickets.tsx           # Upsell/expansion
│   ├── ExpansionOpportunities.tsx  # Oportunidades
│   ├── FinancialTickets.tsx        # Tickets financeiros
│   ├── PPTickets.tsx               # People & People tickets
│   ├── People.tsx                  # Gestao de equipe
│   ├── EmployeeProfile.tsx         # Perfil do colaborador
│   ├── Teams.tsx                   # Equipes
│   ├── Meetings.tsx                # Reunioes
│   ├── Goals.tsx                   # OKRs
│   ├── OneTimeProjects.tsx         # Projetos pontuais
│   ├── ProjectDetail.tsx           # Detalhe projeto
│   ├── Tasks.tsx                   # Tarefas
│   ├── ProductionDesign.tsx        # Demandas design
│   ├── ProductionTech.tsx          # Demandas tech
│   ├── ProductionCopywriting.tsx   # Demandas copy
│   ├── MonetizationDashboards.tsx  # NRR, monetizacao
│   ├── Reports.tsx                 # Relatorios
│   └── ...                         # +23 pages mais
│
├── hooks/                          # 100+ hooks por dominio
│   ├── clients/                    # 8 hooks (useClients, useClientProfile, etc)
│   ├── sales/                      # 7 hooks (useSalesLeads, useSalesOpportunities, etc)
│   ├── tickets/                    # 13 hooks (useCSTickets, useUpsellTickets, etc)
│   ├── people/                     # 7 hooks (useTeams, useEmployeeProfile, etc)
│   ├── meetings/                   # 6 hooks (useMeetings, useGoogleCalendar, etc)
│   ├── goals/                      # 2 hooks (useGoals, useGoalAssignments)
│   ├── projects/                   # 6 hooks (useProjects, useProjectTemplates, etc)
│   ├── tasks/                      # 7 hooks (useTasks, useSubtasks, etc)
│   ├── production/                 # 6 hooks (useProductionDemands, etc)
│   ├── dashboard/                  # 6 hooks (useCommandCenter, useV4KPIs, etc)
│   ├── journey/                    # 6 hooks (useJourneyData, etc)
│   ├── shared/                     # 20+ hooks compartilhados
│   ├── integrations/               # 4 hooks (useWhatsAppDigest, etc)
│   └── auth/                       # 11 permission hooks
│
├── components/                     # 150+ componentes por dominio
│   ├── clients/                    # 20+ componentes
│   ├── sales/                      # 15 componentes
│   ├── cs/                         # 5 componentes
│   ├── financial/                  # 4 componentes
│   ├── projects/                   # 18 componentes
│   ├── meetings/                   # 16 componentes
│   ├── people/                     # 14 componentes
│   ├── tasks/                      # 10+ componentes
│   ├── production/                 # 10+ componentes
│   └── ui/                         # shadcn-ui primitives
│
├── types/                          # 27 type files
│   ├── client.ts                   # ClientFull, ClientProfile, etc
│   ├── salesOpportunity.ts         # SalesOpportunity, stages
│   ├── csTicket.ts                 # CSTicket, impact_type
│   ├── financialTicket.ts          # FinancialTicket
│   └── ...                         # +23 type files
│
├── contexts/                       # 3 React contexts
├── lib/                            # Utilities (auditLog, exportCsv, filterUtils)
├── integrations/                   # Supabase client
└── App.tsx                         # Routing setup
```

## Tabelas Supabase (40+ tabelas)
```
Clientes:    clients, client_stakeholders, client_team_members, client_services,
             revenue_history, client_transition_history
Vendas:      sales_leads, sales_opportunities, sales_opportunity_comments, account_planning
Tickets:     cs_tickets, upsell_tickets, financial_tickets, pp_tickets, tickets, *_messages
Pessoas:     profiles, teams, team_members, disc_results
Reunioes:    meetings, meeting_followups
Metas:       goals, goal_assignments
Projetos:    projects, project_templates, recurring_projects, project_demands
Tarefas:     tasks, subtasks, task_assignments
Producao:    demand_templates, production_demands, production_approvals
Admin:       audit_logs, alerts
```
