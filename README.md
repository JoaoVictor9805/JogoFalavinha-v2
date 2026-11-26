# Escape Room Virtual Falavinha — v2 (`JogoFalavinha-v2`)

Aplicação web full-stack do **Conselho Next** com **React (Vite + Three.js + Tailwind CSS)** no frontend, **Node.js (Express)** no backend e **PostgreSQL (Prisma ORM)** no banco de dados, containerizada para desenvolvimento local e deploy separado no **Coolify** (homologação e produção).

---

## Arquitetura do Projeto

```text
JogoFalavinha-v2/
├── docker-compose.dev.yml              # Ambiente local: PostgreSQL, Mailpit, Backend (:3001) e Frontend (:5174)
├── USUARIO_TESTE.md                    # Instruções da conta de avaliação sem SMTP
├── backend/
│   ├── Dockerfile                      # Multi-stage (base, dev e prod com USER node e porta padrão 3000)
│   ├── docker-compose.yml              # Deploy do Backend no Coolify (porta interna 3000, target: prod)
│   ├── .env.example                    # Modelo de variáveis de ambiente do Backend (Coolify / produção)
│   ├── prisma/
│   │   ├── schema.prisma               # Modelos: Jogador, CodigoVerificacao, Partida, Desafio,
│   │   │                               # OpcaoDesafio, OpcaoDesabilitada, BloqueioConselheiro, Tentativa
│   │   ├── migrations/                 # Histórico de migrations SQL
│   │   ├── seed.js                     # Seed oficial dos 7 desafios do Conselho Next
│   │   └── criarUsuarioTeste.js        # Criação/remoção de usuário pré-verificado para avaliação
│   ├── src/
│   │   ├── app.js                      # Express, Helmet, CORS, CSRF, Rate Limiters e Error Handlers
│   │   ├── db.js                       # Instância Prisma Client + defaults de pool (50 conexões / 30s)
│   │   ├── server.js                   # Bootstrap HTTP (porta padrão 3000), validação JWT e graceful shutdown
│   │   ├── middleware/
│   │   │   ├── requireAuth.js          # Validação JWT HS256 (cookie httpOnly) + cache e tokenVersion
│   │   │   └── csrfProtection.js       # Validação de X-Requested-With e Origin em rotas de escrita
│   │   ├── routes/                     # /api/health, /api/auth, /api/desafios, /api/partidas, /api/ranking
│   │   └── utils/                      # jwt.js, mailer.js, otp.js, gameRules.js, securityLogger.js, etc.
│   └── tests/api.test.js               # Suíte automatizada de API, regras de negócio e segurança
└── frontend/
    ├── Dockerfile                      # Multi-stage (dev Vite :5174, builder e prod Nginx 1.27 Alpine :80)
    ├── docker-compose.yml              # Deploy do Frontend no Coolify (porta interna 80, target: prod)
    ├── nginx.conf                      # Template Nginx: proxy /api/ -> BACKEND_URL, gzip, CSP, cache 7d em /assets/
    ├── .env.example                    # Modelo de variáveis do Frontend (BACKEND_URL)
    ├── vite.config.js                  # Proxy same-origin /api -> API_PROXY_TARGET (dev na porta 5174)
    └── src/
        ├── services/apiService.js      # Cliente HTTP (/api) com proteção CSRF e credenciais via cookie
        ├── context/GameContext.jsx     # Estado global do jogo, autenticação, OTP e sincronização
        └── components/                 # Telas, Visual Novel, desafios dos conselheiros, HUD e Labirinto 3D
```

---

## Fluxo de Autenticação, E-mail (SMTP/OTP) e Segurança

- **Cadastro e Verificação por E-mail (OTP):**
  - Restrito a e-mails corporativos `@falavinha.com.br`.
  - No cadastro (`POST /api/auth/cadastrar`) e na recuperação de senha (`POST /api/auth/esqueci-senha`), um código numérico de **6 dígitos** é gerado via `crypto.randomInt`, salvo em `codigos_verificacao` como hash **HMAC-SHA256** (`OTP_SECRET` ou chave derivada do `JWT_SECRET`) e enviado via **SMTP (Nodemailer)**.
  - Regras do OTP: validade de **15 minutos**, máximo de **5 tentativas** e intervalo (*cooldown*) de **60 segundos** para reenvio.
  - A conta só é liberada para login após confirmação em `POST /api/auth/verificar-email`.
- **Sessão & Senhas:**
  - Senhas com hash `bcrypt` (limite de 72 bytes UTF-8).
  - Cookie `falavinha_session` (`httpOnly`, `SameSite=Strict` e `Secure` quando `NODE_ENV=production`) com JWT assinado em `HS256` (validade padrão `24h`).
  - Revogação real de sessões anteriores no logout (`POST /api/auth/logout`) e na redefinição de senha (`POST /api/auth/redefinir-senha`) via incremento de `tokenVersion` no banco.
- **Proteção de Rotas & Privacidade:**
  - `/api/desafios`, `/api/partidas/*`, `/api/ranking` e `/api/ranking/setores` exigem sessão autenticada; checagem anti-IDOR por propriedade da partida/histórico; ranking oculta e-mails e UUIDs de terceiros; `localStorage` não armazena dados pessoais.
- **Anti-Cheat:**
  - `GET /api/desafios` omite `correta` e `mensagemAprovacao` (entregue apenas após acerto validado em `POST /api/partidas/:id/validar`).
  - Cronômetro contínuo **100% server-side** calculado a partir de `cronometroIniciadoEm` (considerando pausas de leitura de aprovação controladas pelo servidor e sem pausar/resetar em F5 ou re-login).
  - Validação transacional com `SELECT ... FOR UPDATE` impedindo *race condition* e dupla penalidade, além de bloqueio temporário por conselheiro após erros consecutivos.
- **Proteção HTTP, Proxy & Abuso:**
  - Backend com `helmet`, limite de JSON (`50kb`), middleware CSRF (`X-Requested-With` + `Origin`), `trust proxy` restrito a redes privadas (`TRUST_PROXY`), logs estruturados `[SECURITY_AUDIT]` com e-mails mascarados e rate limiting corporativo compatível com NAT (limites por `IP + e-mail`, global por e-mail, por sessão autenticada e por envio/validação de OTP).
  - Frontend em produção servido via **Nginx** com `server_tokens off`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Content-Security-Policy`, compressão `gzip`, cache de **7 dias** (`expires 7d`) para `/assets/` com hash do Vite e proxy reverso `/api/` para `${BACKEND_URL}`.

---

## Executando em Desenvolvimento (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Serviços disponibilizados localmente:
- **Frontend (Vite):** `http://localhost:5174`
- **Backend API (Express + Nodemon):** `http://localhost:3001/api/health`
- **Mailpit (Caixa de entrada local para testar OTP):** `http://localhost:8025` *(SMTP interno na porta `1025`)*
- **PostgreSQL (porta exposta no host):** `localhost:5433`

> Em desenvolvimento local via `docker-compose.dev.yml`, o backend recebe `SMTP_HOST=mailpit` e `SMTP_PORT=1025` automaticamente, permitindo testar cadastro e recuperação de senha sem servidor SMTP externo.

---

## Deploy no Coolify (Homologação e Produção)

Em produção/homologação, o **Backend** e o **Frontend** são implantados como recursos Docker Compose **independentes**, conectados à mesma rede interna do Coolify (*Connect to Predefined Network*), junto de um **PostgreSQL** gerenciado no Coolify.

### 1. Serviço Backend
- **Base Directory:** `/backend` | **Compose Location:** `/docker-compose.yml`
- **Porta:** `3000` (apenas interna via `expose`, sem domínio público)
- **Healthcheck:** `GET http://127.0.0.1:3000/api/health` (com `start_period: 60s` para migrations e seed)
- **Variáveis de ambiente** (baseie-se em [backend/.env.example](backend/.env.example)):
  - `FRONTEND_ORIGIN`: URL HTTPS pública do frontend, sem `/` no final (ex.: `https://conselhonext.falavinha.com.br`).
  - `JWT_SECRET`: segredo aleatório forte com no mínimo **32 caracteres** (obrigatório em `NODE_ENV=production`).
  - `JWT_EXPIRES_IN`: validade do token/cookie (padrão: `24h`).
  - `TRUST_PROXY`: proxies confiáveis no Express (padrão: `loopback,linklocal,uniquelocal`).
  - `DATABASE_URL`: *Internal Postgres URL* do PostgreSQL no Coolify (porta `5432`).
  - `SMTP_HOST`, `SMTP_PORT` (`587` ou `465`), `SMTP_SECURE` (`false` para `587`, `true` para `465`), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: credenciais SMTP corporativas para envio dos códigos OTP.
  - `OTP_SECRET` *(opcional)*: segredo extra para HMAC dos códigos OTP (se omitido, deriva do `JWT_SECRET`).
  - `IMAGE_TAG` *(opcional)*: padrão `prod` na branch `minigames-prod` e `homol` na branch `minigames-homol`.

### 2. Serviço Frontend
- **Base Directory:** `/frontend` | **Compose Location:** `/docker-compose.yml`
- **Domínio HTTPS público:** configurado apontando para a porta **`80`** do container Nginx.
- **Variável de ambiente** (baseie-se em [frontend/.env.example](frontend/.env.example)):
  - `BACKEND_URL`: endereço interno do container backend na rede do Coolify, sem `/` no final (ex.: `http://nome-interno-do-container-backend:3000`).
  - `IMAGE_TAG` *(opcional)*: padrão `prod` na branch `minigames-prod` e `homol` na branch `minigames-homol`.

> **Avaliação sem SMTP configurado:** caso suba o ambiente antes da liberação das credenciais SMTP corporativas, consulte [USUARIO_TESTE.md](USUARIO_TESTE.md) para criar/remover a conta pré-verificada via `node prisma/criarUsuarioTeste.js`.

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
