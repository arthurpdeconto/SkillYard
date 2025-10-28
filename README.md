# SkillSwap (Next.js – projeto acadêmico)

App único em **Next.js** com **Auth (Credentials)**, **RBAC**, **posts** e **chat em tempo real** via **WebSocket nativo**. Preparado para **deploy na Vercel**.

## ✨ Funcionalidades (MVP)

- Cadastro, login (Auth.js), edição e exclusão de conta
- Papéis: **Admin** (gerencia usuários e posts) e **Usuário** (perfil e chat)
- Posts informativos administráveis
- Chat em tempo real (canal geral)
- Deploy simples na Vercel

## 🧰 Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Prisma + PostgreSQL** (Neon/Railway/Local)
- **Auth.js (NextAuth)** com **Credentials** e JWT
- **WebSocket nativo** (Route Handler)
- Zod, ESLint/Prettier

## 🚀 Começando

### Pré‑requisitos

- Node.js ≥ 20, pnpm ≥ 9
- PostgreSQL ≥ 14

### Instalação

```bash
git clone <seu-repo>
cd <seu-repo>
pnpm i
cp .env.example .env
```

### Banco de dados

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

### Rodar em desenvolvimento

```bash
pnpm dev
```

- App: [http://localhost:3000](http://localhost:3000)

## 🔐 Usuários demo

- **Admin:** `admin@local` / `12345678`
- **Usuário:** `user@local` / `12345678`

## 📦 Scripts úteis

- `pnpm dev` – dev server
- `pnpm build` – build de produção
- `pnpm start` – start (Node runtime)
- `pnpm lint` – lint

## 🔧 Configuração (env)

Consulte `.env.example`. Variáveis mínimas:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
DATABASE_URL=postgresql://user:pass@localhost:5432/skillswap?schema=public
```

## 🗺️ Roadmap

- [x] Auth (Credentials) + RBAC
- [x] CRUD de posts (Admin)
- [x] Chat (WebSocket nativo)
- [ ] Painel Admin (UI completa)
- [ ] Testes
- [ ] Deploy Vercel + DB gerenciado

## 📜 Licença

Uso acadêmico (MIT recomendado).

## 🎥 Roteiro da apresentação (15 min)

1. Login como **Admin** → criar/editar post; listar usuários
2. **Chat** em duas abas → mensagens em tempo real
3. Login como **Usuário** → editar perfil, exclusão da conta
4. Mostrar repositório e URL na Vercel
