import { Router } from 'express'

const router = Router()

/**
 * Healthcheck básico para confirmar disponibilidade da API Node.
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'jogofalavinha-v2-backend',
    version: '2.0.0',
    message: 'Estrutura base pronta. Nesta 1ª versão, o fluxo roda no frontend.',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Placeholder das rotas planejadas para a fase de integração com backend:
 * - GET  /api/desafios          -> Lista etapas sem expor respostas corretas
 * - POST /api/desafios/:id/validar -> Valida resposta no servidor
 * - POST /api/partidas          -> Cria/retoma sessão do colaborador
 * - GET  /api/ranking           -> Ranking geral e por setor/departamento
 */
router.get('/', (_req, res) => {
  res.json({
    name: 'Escape Room Virtual Falavinha v2 API',
    status: 'scaffold',
    plannedEndpoints: [
      'GET /api/health',
      'GET /api/desafios',
      'POST /api/desafios/:id/validar',
      'POST /api/partidas',
      'GET /api/ranking',
    ],
  })
})

export default router

