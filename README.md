# Escape Room Virtual Falavinha — v2 (`JogoFalavinha-v2`)

Estrutura base web com **React (Vite)** no frontend e **Node.js (Express)** no backend, preparada para execução em Docker.

> **Escopo atual (1ª versão):** Apenas o frontend foi implementado e está ativo no fluxo principal, consumindo diretamente o JSON estruturado de desafios (`frontend/src/data/desafios.json`). O backend Node está estruturado e pronto para a próxima etapa de desenvolvimento (persistência em banco, validação server-side e ranking centralizado).

---

## Estrutura do Projeto

```text
JogoFalavinha-v2/
├── docker-compose.yml            # Sobe o container do frontend (e perfil opcional para backend)
├── backend/                      # Esqueleto Node.js + Express para próxima fase
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js             # Servidor HTTP com CORS e montagem de rotas /api
│       └── routes/index.js       # Healthcheck GET /api/health + rotas planejadas
└── frontend/                     # Aplicação React + Vite (1ª versão funcional)
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js            # Porta 5174 configurada para não conflitar com a v1 (5173)
    └── src/
        ├── data/desafios.json    # JSON completo autodescritivo dos desafios e regras
        ├── utils/validacaoDesafio.js
        ├── services/storageService.js
        ├── components/
        └── pages/
```

---

## Estrutura do JSON (`frontend/src/data/desafios.json`)

O arquivo consolida todas as informações levantadas em `ESCAPE ROOM.docx` e `Levantamento de Requisitos - Escape Room Virtual Falavinha.pdf`:

- **`jogo`**: título, subtítulo, descrição, regras (`cronometroContinuo`, `tentativasIlimitadas`, `exibirDicas`, `salvarProgresso`, `revelarRespostaAoErrar`), configuração do labirinto (`Johnny` → `Porta do Cliente`), campos dinâmicos do formulário de cadastro (`cadastro.campos`) e textos da tela de conclusão.
- **`etapas` (7 desafios)**:
  - `id`, `codigo`, `ordem`, `faseLabel`, `titulo`, `categoria`, `eixoTematico`, `tipo`, `subtipo`
  - `exibicao`: ícone, tema de cor, flags de exibição e embaralhamento
  - `conteudo`: `cenario`, `pergunta`, `instrucao` e configuração do `input` (`placeholder`, `inputMode`, `maxCaracteres`, `somenteNumeros`, `transformarMaiusculas`, `rotuloBotao`)
  - `opcoes`: lista de alternativas com `id` e `texto` (quando `multipla_escolha`)
  - `validacao`: `modo`, `respostaCorretaId` / `respostasAceitas` e regras de `normalizacao`
  - `feedback`: mensagens para `acerto` e `erro` (sem revelar resposta nem exibir dicas)
  - `progressoLabirinto`: rótulo do checkpoint e mensagem de avanço do Johnny

---

## Executando no Docker

### Subir o container do frontend (1ª versão)

```bash
docker compose up -d --build
```

- Container criado: `jogofalavinha_v2_frontend`
- URL: `http://localhost:5174`

### Subir também o esqueleto do backend Node (opcional / próxima fase)

```bash
docker compose --profile backend up -d --build
```

- Container do backend: `jogofalavinha_v2_backend`
- Healthcheck: `http://localhost:3001/api/health`

