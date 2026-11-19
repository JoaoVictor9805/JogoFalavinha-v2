# Escape Room Virtual Falavinha — v2 (`JogoFalavinha-v2`)

Aplicação web full-stack do **Conselho Next** com **React (Vite + Three.js + Tailwind CSS)** no frontend, **Node.js (Express)** no backend e **PostgreSQL (Prisma ORM)** no banco de dados, preparada para execução via Docker.

---

## Arquitetura do Projeto

```text
JogoFalavinha-v2/
├── docker-compose.yml            # Orquestra PostgreSQL, Backend Express e Frontend Vite (ambiente dev)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Modelos: Jogador, Partida, Desafio, OpcaoDesafio, Tentativa, Bloqueio
│   │   ├── migrations/           # Histórico de migrations SQL
│   │   └── seed.js               # Seed oficial dos 7 desafios do Conselho Next
│   ├── src/
│   │   ├── app.js                # Express, Helmet, CORS, CSRF, Rate Limiters e Error Handlers
│   │   ├── server.js             # Bootstrap HTTP + validação de JWT_SECRET em produção
│   │   ├── middleware/
│   │   │   ├── requireAuth.js    # Validação de JWT HS256 (cookie httpOnly) + tokenVersion
│   │   │   └── csrfProtection.js # Validação de X-Requested-With e Origin em rotas de escrita
│   │   ├── routes/               # /api/auth, /api/desafios, /api/partidas, /api/ranking
│   │   └── utils/                # jwt.js, gameRules.js, securityLogger.js, dateFormatter.js
│   └── tests/api.test.js         # Suíte automatizada de API, regras de negócio e segurança
└── frontend/
    ├── vite.config.js            # Proxy same-origin /api -> backend:3001 (porta 5174)
    └── src/
        ├── services/apiService.js
        ├── context/GameContext.jsx
        └── components/           # Telas, Visual Novel, HUD e Labirinto 3D
```

---

## Controles de Segurança & Integridade Implementados

- **Autenticação & Sessão:** senhas com hash `bcryptjs` (limite de 72 bytes UTF-8), cookie `httpOnly` + `SameSite=Strict` + `Secure` (em produção), JWT assinado com `HS256` (expiração padrão `24h`) e revogação imediata no logout via `tokenVersion` no banco.
- **Proteção de Rotas & Privacidade:** `/api/desafios`, `/api/partidas/*`, `/api/ranking` e `/api/ranking/setores` exigem sessão autenticada; checagem anti-IDOR por propriedade da partida/histórico; ranking oculta e-mails e UUIDs de terceiros; `localStorage` não armazena dados pessoais.
- **Anti-Cheat:**
  - `GET /api/desafios` omite `correta` e `mensagemAprovacao` (entregue apenas após acerto validado em `POST /api/partidas/:id/validar`).
  - Cronômetro contínuo **100% server-side** calculado a partir de `cronometroIniciadoEm` (ignora tempo enviado pelo cliente e não pausa/reseta em F5 ou re-login).
  - Validação transacional com `SELECT ... FOR UPDATE` impedindo race condition e dupla penalidade.
- **Proteção HTTP & Abuso:** `helmet`, limite de JSON (`50kb`), middleware CSRF (`X-Requested-With` + `Origin`), `trust proxy` restrito a proxies locais/privados (`TRUST_PROXY`), rate limiting corporativo compatível com NAT (`IP + e-mail`, limite global por e-mail e limite por sessão autenticada) e logs estruturados `[SECURITY_AUDIT]`.

---

## Executando em Desenvolvimento (Docker)

```bash
docker compose up -d --build
```

- **Frontend:** `http://localhost:5174`
- **Backend API:** `http://localhost:3001/api/health`
- **PostgreSQL (host):** `localhost:5433`

### Variáveis de Ambiente do Backend (`backend/.env`)

Baseie-se em [backend/.env.example](file:///c:/Users/joao.oliveira/Documents/Projetos/JogoFalavinha-v2/backend/.env.example):

- `PORT`: porta da API (`3001`).
- `NODE_ENV`: `development` ou `production`.
- `FRONTEND_ORIGIN`: origem(ns) permitida(s) pelo CORS/CSRF (ex.: `http://localhost:5174`).
- `TRUST_PROXY`: configuração do `trust proxy` do Express (padrão: `loopback,linklocal,uniquelocal`).
- `JWT_SECRET`: segredo de assinatura JWT (em produção, obrigatório com no mínimo 32 caracteres).
- `JWT_EXPIRES_IN`: validade do token/cookie (padrão: `24h`).
- `DATABASE_URL`: string de conexão PostgreSQL consumida pelo Prisma.

---

## Testes Automatizados e Qualidade

### Backend (API, Regras de Negócio e Segurança)

```bash
cd backend
npx prisma migrate deploy
npm run prisma:seed
npm test
```

> **Nota sobre migrations Prisma:** a tabela `partidas` possui o índice único parcial `partidas_unica_em_andamento_por_jogador` (`WHERE status = 'EM_ANDAMENTO'`), criado via SQL customizado na migration `20261119163500_add_unique_active_partida_index`. Ao gerar novas migrations com `npx prisma migrate dev`, confira o SQL gerado para garantir que o Prisma não tente remover esse índice.

### Frontend (Lint e Build)

```bash
cd frontend
npm run lint
npm run build
```
