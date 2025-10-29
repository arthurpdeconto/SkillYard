# SkillYard · Guia de Referência dos Agentes

## 1. Propósito do Produto

SkillYard é uma plataforma acadêmica para troca de habilidades. O aplicativo reúne autenticação RBAC, feed de posts com busca instantânea, painel administrativo completo e chat em tempo real em um único projeto **Next.js App Router** pronto para rodar na Vercel.

### Capacidades atuais

- Autenticação via credenciais com papéis **Admin** e **User**
- Feed autenticado com filtro `?q=` para localizar posts por título, conteúdo ou autor
- Painel admin com três seções (Criar post, Administrar posts, Administrar usuários) e filtros dedicados
- Bloqueio para impedir que o admin remova a própria conta
- Chat em tempo real sobre WebSocket nativo (runtime Edge)
- Prisma + PostgreSQL com seeds (`admin@local.dev` / `user@local.dev`)
- Esteira pensada para deploy na Vercel (Next.js 16 canary)

## 2. Stack & Convenções

- **Runtime:** Next.js 16 (App Router) + TypeScript
- **Estilização:** CSS Modules + variáveis globais (`globals.css`)
- **Banco:** PostgreSQL 15/16 via Prisma ORM
- **Auth:** Auth.js (Credentials) + JWT
- **Validação:** Zod
- **Observabilidade:** `pino` (server) + console estruturado
- **Ferramentas:** ESLint (flat) + Prettier + pnpm
- **WebSocket:** `Deno.upgradeWebSocket` em `/api/chat` (Edge runtime)

## 3. Estrutura do Repositório

```
.
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # Rotas públicas (login, registro)
│  │  ├─ (private)/           # Rotas autenticadas (feed, perfil, chat, admin)
│  │  │  └─ admin/users/      # Painel administrativo completo
│  │  └─ api/                 # Route handlers (auth, posts, chat)
│  ├─ lib/                    # Prisma, Auth, RBAC, validators
│  └─ types/                  # Tipagens compartilhadas
├─ public/                    # Assets estáticos
├─ README.md
└─ agents.md
```

## 4. Papéis dos Agentes e Prompts

### 4.1 Product Planner
**Objetivo:** Definir backlog mínimo (MVP) e roadmap incremental.
```
Você é Product Planner. Gere épicos e histórias (formato Gherkin) para autenticação, feed com busca, painel admin com filtros e chat. Priorize MVP → Next Steps e destaque dependências.
```

### 4.2 Arquiteto(a) de Software
**Objetivo:** Validar camadas, cachê, runtime e contratos.
```
Aja como Arquiteto(a) para Next.js App Router. Delimite componentes server/client, políticas de caching (force-dynamic), uso de runtime Edge para WebSocket, RBAC via layout protegido e mapear variáveis de ambiente obrigatórias.
```

### 4.3 Engenheiro(a) Back-end
**Objetivo:** Implementar Auth, CRUD de posts e chat.
```
Você é Engenheiro(a) Back-end. Implemente `/api/auth/register`, Auth.js Credentials em `[...nextauth]`, handlers de posts (GET/POST/PATCH/DELETE) com Zod, e WebSocket em `/api/chat` com broadcast. Garanta RBAC nas server actions.
```

### 4.4 Engenheiro(a) Front-end
**Objetivo:** Construir UI/UX com foco nas telas privadas.
```
Você é Engenheiro(a) Front-end. Entregue páginas Login/Register, feed autenticado com filtro instantâneo, painel admin com navegação em três seções e filtros, e chat consumindo o WebSocket nativo. Use CSS Modules e componha Client Components apenas onde houver interação.
```

### 4.5 DBA / Modelagem
**Objetivo:** Manter schema Prisma, índices e seed.
```
Aja como DBA. Revise `schema.prisma`, índices em `createdAt`, relações entre User/Post/Message/Role, e mantenha o seed com contas padrão. Descreva migrações necessárias antes de alterações críticas.
```

### 4.6 DevOps / Release
**Objetivo:** Pipeline de build, envs e deploy na Vercel.
```
Você é DevOps. Estruture as variáveis de ambiente (NEXTAUTH, DATABASE_URL), defina comandos (pnpm install/build/start), configure preview deployments e detalhe requisitos do banco gerenciado (Neon/Railway).
```

### 4.7 Tech Writer / Apresentação
**Objetivo:** Documentação e roteiro de demo.
```
Você é Tech Writer. Atualize README/agents.md com setup, credenciais demo, instruções de busca no feed e fluxo do painel admin. Prepare roteiro de demo de até 15 minutos.
```

## 5. Fluxo de Desenvolvimento

1. `pnpm install`
2. `cp .env.example .env` e ajuste:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
3. Banco:
   - `pnpm prisma migrate dev --name init`
   - `pnpm prisma db seed`
4. Desenvolvimento: `pnpm dev`
5. Qualidade: `pnpm lint` (e `pnpm format:write` quando necessário)
6. Produção: `pnpm build && pnpm start`

## 6. Contratos Essenciais

### 6.1 Auth
- `POST /api/auth/register`
- Auth.js Credentials (`[...nextauth]/route.ts`) para login/logout

### 6.2 Posts
- `GET /api/posts` — lista posts publicados
- `POST /api/posts` — cria post (Admin)
- `PATCH /api/posts/:id` — atualiza (Admin)
- `DELETE /api/posts/:id` — remove (Admin)
- Feed autenticado: `/?(q=string)` filtra título/conteúdo/autor

### 6.3 Usuários (Painel Admin)
- Server Actions em `src/app/(private)/admin/users/actions.ts`
  - `createPostAction`
  - `deletePostAction`
  - `deleteUserAction` (bloqueia autoexclusão)

### 6.4 Chat
- `GET /api/chat` — WebSocket (Edge) com broadcast

## 7. Segurança & Boas Práticas

- Hash de senha com `bcryptjs`
- RBAC checado nas Server Actions e layout protegido
- Validações com Zod em todas as entradas
- Sem cache para dados sensíveis (`dynamic = "force-dynamic"`)
- Nunca expor dados sensíveis em logs (`pino`)

## 8. Variáveis de Ambiente

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
DATABASE_URL="postgresql://user:pass@host:5432/skillyard?schema=public"
```

Variáveis adicionais opcionais podem ser adicionadas conforme roadmap (ex.: chaves de observabilidade).

## 9. Roadmap Sugerido

| Fase | Entregas |
| --- | --- |
| MVP (Semana 1–2) | Auth + RBAC, feed com busca, painel admin com filtros, chat |
| Semana 3 | Formulários de perfil, auditoria básica, testes e2e |
| Semana 4 | Automação de deploy na Vercel, métricas e roteiros de demo |

## 10. Referências Rápidas

- **Painel admin:** `src/app/(private)/admin/users/admin-users-client.tsx`
- **Busca no feed:** `src/app/(private)/page.tsx` + `search-posts-input.tsx`
- **Server actions:** `src/app/(private)/admin/users/actions.ts`
- **Chat:** `src/app/(private)/chat` e `src/app/api/chat/route.ts`

Use este documento como base para alinhar expectativas entre os agentes e acelerar novas iterações no SkillYard.
