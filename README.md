# SkillYard

SkillYard é uma plataforma acadêmica de troca de habilidades construída sobre o **Next.js (App Router)**. O projeto unifica frontend e backend em um único repositório, oferecendo autenticação com RBAC, CRUD de posts, chat em tempo real e esteira pronta para deploy na Vercel.

## Visão Geral

- ✅ Autenticação via **Auth.js (Credentials)** com papéis **Admin** e **User**
- ✅ Posts informativos públicos com busca instantânea (`q`) no feed autenticado
- ✅ Painel administrativo separado por sessões (Criar posts, Administrar posts, Administrar usuários)
- ✅ Filtros refinados para localizar posts e usuários no painel, com bloqueio para excluir a própria conta
- ✅ Chat em tempo real com WebSocket nativo (Edge runtime)
- ✅ Prisma + PostgreSQL com seed inicial (`admin@local.dev`, `user@local.dev`)
- ✅ Configuração pensada para deploy na Vercel e ambientes preview

## Stack Principal

- **Next.js 16 (canary)** + **TypeScript** + **CSS Modules**
- **Prisma ORM** + **PostgreSQL** (Neon, Railway ou local)
- **Auth.js (NextAuth)** + JWT session
- **Zod** para validações e **pino** para observabilidade estruturada
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
│  └─ (private)/layout.tsx # Gatekeeper de rotas autenticadas
├─ next.config.ts          # Configuração Next.js
└─ src/app/globals.css     # Estilos globais e tokens de design
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

### 4. Banco de dados (Neon/PostgreSQL)

1. Defina `DATABASE_URL` no `.env`. Exemplo (Neon com pooler):
   ```
   postgresql://USER:PASSWORD@HOST/dbname?sslmode=require&channel_binding=require
   ```
2. Gere a primeira migration e aplique localmente:
   ```bash
   pnpm prisma migrate dev --name init
   ```
   > Caso o banco já esteja provisionado, gere apenas o arquivo com  
   > `pnpm prisma migrate dev --name init --create-only` e aplique depois com `pnpm prisma migrate deploy`.
3. Aplique migrations em outros ambientes:
   ```bash
   pnpm prisma migrate deploy
   ```
4. Popule os dados iniciais (roles e usuários demo):
   ```bash
   pnpm prisma db seed
   ```

### 5. Ambiente de desenvolvimento

```bash
pnpm dev
```

Aplicação disponível em [http://localhost:3000](http://localhost:3000).

### Contas demo

Após rodar o seed, as credenciais padrão são:

- Admin: `admin@local.dev` / `12345678`
- Usuário: `user@local.dev` / `12345678`

## Scripts Úteis

- `pnpm dev` – servidor Next.js em modo watch
- `pnpm build` / `pnpm start` – build e execução de produção
- `pnpm lint` – checagem ESLint
- `pnpm format:write` – aplica Prettier no projeto
- `pnpm db:*` – atalhos `prisma generate`, `migrate`, `db push` e `seed`

## Notas de Arquitetura

- **Layout protegido** em `src/app/(private)/layout.tsx` garante sessão ativa e filtra navegação Admin.
- **Route handlers** usam `dynamic = "force-dynamic"` e Node runtime (exceto `/api/chat`, que roda no Edge) para evitar cache involuntário.
- **Chat** usa `Deno.upgradeWebSocket` no runtime Edge, realizando broadcast simples entre clientes conectados.
- **RBAC** centralizado em `src/lib/rbac.ts` com helpers `assertRole` / `hasRole`.
- **Painel admin** acessível em `/admin/users` com ações de server components e filtros client-side.
- **Busca de posts** utiliza query string `?q=` e renderização server-side para manter consistência de dados.
- **Validações** reutilizam esquemas Zod (`src/lib/validators.ts`) tanto nas APIs quanto nos formulários do App Router.

## Próximos Passos Sugeridos

1. Completar formulários com Server Actions (perfil, posts)
2. Configurar pipeline de deploy na Vercel + banco gerenciado (Neon/Railway)
3. Criar roteiro de demo e métricas de observabilidade

## Licença

Projeto acadêmico licenciado sob **MIT**. Ajuste conforme a necessidade do time.
