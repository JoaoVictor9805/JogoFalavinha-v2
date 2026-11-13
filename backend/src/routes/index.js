import { Router } from 'express'
import authRouter from './auth.js'
import desafiosRouter from './desafios.js'
import partidasRouter from './partidas.js'
import rankingRouter from './ranking.js'

const router = Router()

/**
 * Healthcheck de disponibilidade da API e do banco
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'jogofalavinha-v2-backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Montagem dos submódulos da API
router.use('/auth', authRouter)
router.use('/desafios', desafiosRouter)
router.use('/partidas', partidasRouter)
router.use('/ranking', rankingRouter)

export default router
