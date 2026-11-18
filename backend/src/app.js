import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import apiRouter from './routes/index.js'

export function createApp() {
  const app = express()
  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5174'

  app.set('trust proxy', 1)

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  )

  app.use(cookieParser())
  app.use(express.json({ limit: '50kb' }))

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Muitas requisições em sequência. Aguarde alguns segundos e tente novamente.',
    },
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Muitas tentativas de acesso. Aguarde alguns minutos antes de tentar novamente.',
    },
  })

  app.use('/api', apiLimiter)
  app.use('/api/auth/login', authLimiter)
  app.use('/api/auth/cadastrar', authLimiter)

  app.use('/api', apiRouter)

  app.use((err, _req, res, next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ erro: 'Payload muito grande.' })
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ erro: 'JSON inválido na requisição.' })
    }
    return next(err)
  })

  app.use((req, res) => {
    res.status(404).json({
      error: 'Rota não encontrada',
      path: req.originalUrl,
    })
  })

  return app
}
