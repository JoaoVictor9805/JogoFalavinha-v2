# Escape Room Virtual Falavinha — v2 (`JogoFalavinha-v2`)

Aplicação web full-stack do **Conselho Next** com **React (Vite + Three.js + Tailwind CSS)** no frontend, **Node.js (Express)** no backend e **PostgreSQL (Prisma ORM)** no banco de dados, containerizada para desenvolvimento local e deploy separado no **Coolify**.

> **Nota sobre esta branch (`minigames-semEmail`):** esta variante opera **sem verificação de e-mail via OTP/SMTP** e **sem recuperação de senha por e-mail** — o colaborador realiza o cadastro e já inicia a sessão autenticada diretamente.

---

## Arquitetura do Projeto

```text
JogoFalavinha-v2/
├── docker-compose.dev.yml              # Ambiente local: PostgreSQL (:5433), Backend (:3001) e Frontend (:5174)
├── .env.prod.example                   # Referência de variáveis de ambiente para homologação no Coolify
├── backend/
│   ├── Dockerfile                      # Multi-stage (base, dev e prod com USER node e porta padrão 3000)
│   ├── docker-compose.yml              # Deploy do Backend no Coolify (porta interna 3000, target: prod)
│   ├── .env.example                    # Modelo de variáveis de ambiente locais do Backend
│   ├── prisma/
│   │   ├── schema.prisma               # Modelos: Jogador, Partida, Desafio, OpcaoDesafio,
│   │   │                               # OpcaoDesabilitada, BloqueioConselheiro, Tentativa
│   │   ├── migrations/                 # Histórico de migrations SQL
│   │   └── seed.js                     # Seed oficial dos 7 desafios do Conselho Next
│   ├── src/
│   │   ├── app.js                      # Express, Helmet, CORS, CSRF, Rate Limiters e Error Handlers
│   │   ├── db.js                       # Instância Prisma Client + defaults de pool (50 conexões / 30s)
│   │   ├── server.js                   # Bootstrap HTTP (porta padrão 3000), validação JWT e graceful shutdown
│   │   ├── middleware/
│   │   │   ├── requireAuth.js          # Validação JWT HS256 (cookie httpOnly) + cache e tokenVersion
│   │   │   └── csrfProtection.js       # Validação de X-Requested-With e Origin em rotas de escrita
│   │   ├── routes/                     # /api/health, /api/auth, /api/desafios, /api/partidas, /api/ranking
│   │   └── utils/                      # jwt.js, gameRules.js, securityLogger.js, dateFormatter.js, etc.
│   └── tests/api.test.js               # Suíte automatizada de API, regras de negócio e segurança
└── frontend/
    ├── Dockerfile                      # Multi-stage (dev Vite :5174, builder e prod Nginx 1.27 Alpine :80)
    ├── docker-compose.yml              # Deploy do Frontend no Coolify (porta interna 80, target: prod)
    ├── nginx.conf                      # Template Nginx: proxy /api/ -> BACKEND_URL, gzip, CSP, cache 7d em /assets/
    ├── .env.example                    # Exemplo local de VITE_API_URL fora do Docker
    ├── vite.config.js                  # Proxy same-origin /api -> API_PROXY_TARGET (dev na porta 5174)
    └── src/
        ├── services/apiService.js      # Cliente HTTP (/api) com proteção CSRF e credenciais via cookie
        ├── context/GameContext.jsx     # Estado global do jogo, autenticação e sincronização
        └── components/                 # Telas, Visual Novel, desafios dos conselheiros, HUD e Labirinto 3D
```

---

## Controles de Segurança & Integridade Implementados

- **Autenticação & Sessão:**
  - Cadastro direto com validação de e-mail corporativo `@falavinha.com.br` e emissão imediata da sessão (sem fluxo SMTP/OTP).
  - Senhas com hash `bcrypt` (limite de 72 bytes UTF-8), cookie `falavinha_session` (`httpOnly` + `SameSite=Strict` + `Secure` em produção), JWT assinado com `HS256` (validade padrão `24h`) e revogação imediata no logout via `tokenVersion` no banco.
- **Proteção de Rotas & Privacidade:**
  - `/api/desafios`, `/api/partidas/*`, `/api/ranking` e `/api/ranking/setores` exigem sessão autenticada; checagem anti-IDOR por propriedade da partida/histórico; ranking oculta e-mails e UUIDs de terceiros; `localStorage` não armazena dados pessoais.
- **Anti-Cheat:**
  - `GET /api/desafios` omite `correta` e `mensagemAprovacao` (entregue apenas após acerto validado em `POST /api/partidas/:id/validar`).
  - Cronômetro contínuo **100% server-side** calculado a partir de `cronometroIniciadoEm` (considerando pausas de leitura de aprovação controladas pelo servidor e sem pausar/resetar em F5 ou re-login).
  - Validação transacional com `SELECT ... FOR UPDATE` impedindo *race condition* e dupla penalidade, além de bloqueio temporário por conselheiro após erros consecutivos.
- **Proteção HTTP, Proxy & Abuso:**
  - Backend com `helmet`, limite de JSON (`50kb`), middleware CSRF (`X-Requested-With` + `Origin`), `trust proxy` restrito a redes privadas (`TRUST_PROXY`), logs estruturados `[SECURITY_AUDIT]` com e-mails mascarados e rate limiting corporativo compatível com NAT (`IP + e-mail`, limite global por e-mail e limite por sessão autenticada).
  - Frontend em produção servido via **Nginx** com `server_tokens off`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Content-Security-Policy`, compressão `gzip`, cache de **7 dias** (`expires 7d`) para `/assets/` com hash do Vite e proxy reverso `/api/` para `${BACKEND_URL}`.

---

## Executando em Desenvolvimento (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Serviços disponibilizados localmente:
- **Frontend (Vite):** `http://localhost:5174`
- **Backend API (Express + Nodemon):** `http://localhost:3001/api/health`
- **PostgreSQL (porta exposta no host):** `localhost:5433`

---

## Deploy no Coolify

O **Backend** e o **Frontend** são implantados como recursos Docker Compose **independentes**, conectados à mesma rede interna do Coolify (*Connect to Predefined Network*), junto de um **PostgreSQL** gerenciado no Coolify.

### 1. Serviço Backend
- **Base Directory:** `/backend` | **Compose Location:** `/docker-compose.yml`
- **Porta:** `3000` (apenas interna via `expose`, sem domínio público)
- **Healthcheck:** `GET http://127.0.0.1:3000/api/health` (com `start_period: 60s` para migrations e seed)
- **Variáveis de ambiente** (veja [backend/.env.example](backend/.env.example) e [.env.prod.example](.env.prod.example)):
  - `FRONTEND_ORIGIN`: URL HTTPS pública do frontend, sem `/` no final (ex.: `https://homol-conselhonext.falavinha.com.br`).
  - `JWT_SECRET`: segredo aleatório forte com no mínimo **32 caracteres** (obrigatório em `NODE_ENV=production`).
  - `JWT_EXPIRES_IN`: validade do token/cookie (padrão: `24h`).
  - `TRUST_PROXY`: proxies confiáveis no Express (padrão: `loopback,linklocal,uniquelocal`).
  - `DATABASE_URL`: *Internal Postgres URL* do PostgreSQL no Coolify (porta `5432`).
  - `IMAGE_TAG` *(opcional)*: padrão `homol`.

### 2. Serviço Frontend
- **Base Directory:** `/frontend` | **Compose Location:** `/docker-compose.yml`
- **Domínio HTTPS público:** configurado apontando para a porta **`80`** do container Nginx.
- **Variável de ambiente:**
  - `BACKEND_URL`: endereço interno do container backend na rede do Coolify, sem `/` no final (ex.: `http://nome-interno-do-container-backend:3000`).
  - `IMAGE_TAG` *(opcional)*: padrão `homol`.

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
