SkillSwap (Next.js – projeto acadêmico)

App único em Next.js com Auth (Credentials), RBAC, posts e chat em tempo real via WebSocket nativo. Preparado para deploy na Vercel.

✨ Funcionalidades (MVP)

Cadastro, login (Auth.js), edição e exclusão de conta

Papéis: Admin (gerencia usuários e posts) e Usuário (perfil e chat)

Posts informativos administráveis

Chat em tempo real (canal geral)

Deploy simples na Vercel

🧰 Stack

Next.js 15 (App Router) + TypeScript + Tailwind

Prisma + PostgreSQL (Neon/Railway/Local)

Auth.js (NextAuth) com Credentials e JWT

WebSocket nativo (Route Handler)

Zod, ESLint/Prettier

🚀 Começando
Pré‑requisitos

Node.js ≥ 20, pnpm ≥ 9

PostgreSQL ≥ 14

Instalação
git clone <seu-repo>
cd <seu-repo>
pnpm i
cp .env.example .env
Banco de dados
pnpm prisma migrate dev
pnpm prisma db seed
Rodar em desenvolvimento
pnpm dev

App: http://localhost:3000

🔐 Usuários demo

Admin: admin@local / 12345678

Usuário: user@local / 12345678

📦 Scripts úteis

pnpm dev – dev server

pnpm build – build de produção

pnpm start – start (Node runtime)

pnpm lint – lint

🔧 Configuração (env)

Consulte .env.example. Variáveis mínimas:

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
DATABASE_URL=postgresql://user:pass@localhost:5432/skillswap?schema=public
🗺️ Roadmap

📜 Licença

Uso acadêmico (MIT recomendado).

🎥 Roteiro da apresentação (15 min)

Login como Admin → criar/editar post; listar usuários

Chat em duas abas → mensagens em tempo real

Login como Usuário → editar perfil, exclusão da conta

Mostrar repositório e URL na Vercel
