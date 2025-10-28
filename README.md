# SkillYard

SkillYard é uma plataforma acadêmica de troca de habilidades construída sobre o **Next.js (App Router)**. O projeto unifica frontend e backend em um único repositório, oferecendo autenticação com RBAC, CRUD de posts, chat em tempo real e esteira pronta para deploy na Vercel.

## Visão Geral

- ✅ Autenticação via **Auth.js (Credentials)** com papéis **Admin** e **User**
- ✅ Posts informativos públicos com gestão avançada para Admin
- ✅ Chat em tempo real com WebSocket nativo (Edge runtime)
- ✅ Prisma + PostgreSQL com seed inicial (`admin@local`, `user@local`)
- ✅ Configuração pensada para deploy na Vercel e ambientes preview

## Stack Principal

- **Next.js 16 (canary)** + **TypeScript** + **CSS Modules**
- **Prisma ORM** + **PostgreSQL** (Neon, Railway ou local)
- **Auth.js (NextAuth)** + JWT session
- **Zod** para validações e **pino** para observabilidade estruturada
- **Vitest + Testing Library** para testes
- **ESLint + Prettier** com configuração flat

## Arquitetura & Pastas

```
.
├─ prisma/                 # Schema, migrations e seeds
│  ├─ schema.prisma
│  └─ seed.ts
├─ public/                 # Assets estáticos
├─ src/
│  ├─ app/
│  │  ├─ (public)/         # Login/Register (rotas públicas)
│  │  ├─ (private)/        # Rotas autenticadas (feed, perfil, admin, chat)
│  │  └─ api/              # Route handlers (auth, posts, chat)
│  ├─ lib/                 # Prisma, Auth.js, RBAC, validadores
│  ├─ styles/              # Guia de estilos e notas de UI
│  └─ middleware.ts        # Proteção de rotas + RBAC
├─ tests/                  # Base para Vitest + Testing Library
├─ next.config.ts          # Configuração Next.js
├─ src/app/globals.css     # Estilos globais e tokens de design
└─ vitest.config.ts        # Setup de testes
```

## Setup Rápido

### 1. Pré-requisitos

- Node.js **>= 20**
- pnpm **>= 9**
- Banco PostgreSQL acessível (local ou gerenciado)

### 2. Instalação de dependências

```bash
pnpm install
```

### 3. Configuração de ambiente

```bash
cp .env.example .env
```

Edite `DATABASE_URL`, `NEXTAUTH_SECRET` e demais variáveis conforme seu ambiente.

### 4. Banco de dados

```bash
pnpm db:migrate       # gera o schema
pnpm db:seed          # cria roles + usuários admin/usuário (senha 12345678)
```

### 5. Ambiente de desenvolvimento

```bash
pnpm dev
```

Aplicação disponível em [http://localhost:3000](http://localhost:3000).

## Scripts Úteis

- `pnpm dev` – servidor Next.js em modo watch
- `pnpm build` / `pnpm start` – build e execução de produção
- `pnpm lint` – checagem ESLint
- `pnpm format:write` – aplica Prettier no projeto
- `pnpm test` / `pnpm test:watch` – suíte Vitest
- `pnpm db:*` – atalhos `prisma generate`, `migrate`, `db push` e `seed`

## Notas de Arquitetura

- **Middleware** redireciona rotas públicas/privadas e bloqueia a área admin para perfis não autorizados.
- **Route handlers** usam `dynamic = "force-dynamic"` e Node runtime (exceto `/api/chat`, que roda no Edge) para evitar cache involuntário.
- **Chat** usa `Deno.upgradeWebSocket` no runtime Edge, realizando broadcast simples entre clientes conectados.
- **RBAC** centralizado em `src/lib/rbac.ts` com helpers `assertRole` / `hasRole`.
- **Validações** reutilizam esquemas Zod (`src/lib/validators.ts`) tanto nas APIs quanto nos formulários do App Router.

## Próximos Passos Sugeridos

1. Completar formulários com Server Actions (perfil, posts)
2. Adicionar testes de integração para handlers críticos (auth, RBAC, chat)
3. Configurar pipeline de deploy na Vercel + banco gerenciado (Neon/Railway)
4. Criar roteiro de demo e métricas de observabilidade

## Licença

Projeto acadêmico licenciado sob **MIT**. Ajuste conforme a necessidade do time.
