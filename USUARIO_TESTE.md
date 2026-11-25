# Usuário de Teste para Avaliação (Sem SMTP)

Enquanto as credenciais SMTP corporativas (`@falavinha.com.br`) ainda não estiverem configuradas no Coolify, o cadastro de **novas contas** pela tela fica indisponível (pois depende do envio do código de 6 dígitos por e-mail).

Para que os avaliadores consigam acessar e testar o sistema completo desde já, utilize a conta pré-verificada abaixo.

---

## Credenciais para Enviar aos Avaliadores

1. Acesse a URL da aplicação.
2. Clique na aba **"Já sou Cadastrado"** (Login).
3. Informe os dados abaixo:
   - **E-mail:** `avaliacao@falavinha.com.br`
   - **Senha:** `Falavinha@Teste2026`

---

## Como Criar esse Usuário no Banco de Produção (Coolify)

Após subir o projeto com o `docker-compose.yml`, abra o terminal do container **`backend`** no painel do Coolify (ou via SSH na VPS) e execute:

```sh
node prisma/criarUsuarioTeste.js
```

> Caso queira definir outro e-mail ou senha na criação, basta passar as variáveis antes do comando:
> `TEST_USER_EMAIL="outro@falavinha.com.br" TEST_USER_PASSWORD="OutraSenha123" node prisma/criarUsuarioTeste.js`

---

## Como Remover Após Ativar o E-mail Corporativo

Quando o TI liberar a conta SMTP e você preencher as variáveis `SMTP_*` no Coolify, remova esta conta de avaliação executando no terminal do container `backend`:

```sh
node prisma/criarUsuarioTeste.js --remover
```
