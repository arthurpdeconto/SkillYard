# SkillYard — Plataforma de Troca de Habilidades (HTML, CSS, JS + Node/Express + MySQL)

Um site completo de troca de habilidades com **login**, **cadastro**, **listagem/registro de habilidades** e **pedidos de troca**.  
Frontend em **HTML, CSS e JavaScript puro** e backend em **Node.js/Express** com banco **MySQL**.

## Requisitos
- Node.js 18+
- MySQL 8+

## Passo a passo de instalação

1) **Crie o banco e tabelas**
   - Abra o MySQL e rode o arquivo: `server/schema.sql`

2) **Configurar variáveis de ambiente**
   - Copie `server/.env.example` para `server/.env` e ajuste as variáveis (usuário, senha e host do MySQL).
   
3) **Instalar dependências do backend**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   - Isso iniciará o servidor em `http://localhost:4000`

4) **Abrir o site**
   - Acesse `http://localhost:4000`
   - Cadastre-se, faça login e use o sistema.

## Scripts úteis
- `npm run dev` — inicia com nodemon (desenvolvimento)
- `npm start`  — inicia o servidor em produção

## Estrutura
```
skillyard/
├─ server/
│  ├─ server.js
│  ├─ db.js
│  ├─ middleware/
│  │  └─ auth.js
│  ├─ routes/
│  │  ├─ auth.js
│  │  ├─ skills.js
│  │  └─ requests.js
│  ├─ schema.sql
│  ├─ .env.example
│  └─ package.json
└─ client/
   └─ public/
      ├─ index.html
      ├─ styles.css
      ├─ app.js
      ├─ api.js
      └─ logo.svg
```
