O que Continua Planejado para Depois (Já Mapeado)

Estes são os únicos itens de peso real que ainda ficam pendentes — justamente os dois que você separou para as próximas etapas:

Item 3 — Verificação de identidade corporativa (alinhar com gestor): definir se vai usar SSO da empresa, código OTP por e-mail ou lista de colaboradores do RH para impedir contas fictícias @falavinha.com.br ou cadastro usando o e-mail de outro colega.
Item 4 + Item 9-B — Preparação de Produção (no final):
docker-compose.prod.yml com NODE_ENV=production, JWT_SECRET forte (≥ 32 caracteres) fora do Git e containers rodando sem root.
PostgreSQL com senha forte e sem porta 5433 exposta na rede.
Frontend compilado (vite build) servido por Nginx/Caddy com HTTPS — ponto crucial: em NODE_ENV=production, o cookie de sessão liga a flag Secure, que exige HTTPS para o navegador aceitar salvar o login!
Headers de segurança no Nginx/Caddy do frontend (Content-Security-Policy, X-Frame-Options: DENY, Referrer-Policy, HSTS).
