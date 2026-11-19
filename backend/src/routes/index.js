import { Router } from 'express'
import prisma from '../db.js'
import authRouter from './auth.js'
import desafiosRouter from './desafios.js'
import partidasRouter from './partidas.js'
import rankingRouter from './ranking.js'

const router = Router()

/**
 * Healthcheck real de disponibilidade da API e do PostgreSQL
 */
router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.json({
      status: 'ok',
      database: 'ok',
      service: 'jogofalavinha-v2-backend',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[health] Falha na verificação do banco de dados:', error?.message)
    return res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      service: 'jogofalavinha-v2-backend',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    })
  }
})

// Montagem dos submódulos da API
router.use('/auth', authRouter)
router.use('/desafios', desafiosRouter)
router.use('/partidas', partidasRouter)
router.use('/ranking', rankingRouter)

export default router
