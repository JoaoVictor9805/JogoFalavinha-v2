import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import helmet from 'helmet'
import apiRouter from './routes/index.js'
import { SESSION_COOKIE_NAME, verifySessionToken } from './utils/jwt.js'

function getAuthenticatedUserId(req) {
  const token = req.cookies?.[SESSION_COOKIE_NAME]
  if (!token) return null
  try {
    const decoded = verifySessionToken(token)
    return typeof decoded?.sub === 'string' ? decoded.sub : null
  } catch {
    return null
  }
}

function getNormalizedEmailFromBody(req) {
  const email = req.body?.email
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 120) : ''
}

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

  // Teto global amplo por IP pensando em rede corporativa (200+ pessoas atrás do mesmo NAT/Wi-Fi)
  const ipFloodLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Muitas requisições simultâneas na rede. Aguarde alguns segundos e tente novamente.',
    },
  })

  // Limite individual por colaborador autenticado (não afeta colegas no mesmo IP)
  const userSessionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    skip: (req) => !getAuthenticatedUserId(req),
    keyGenerator: (req) => `user:${getAuthenticatedUserId(req)}`,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Muitas ações em sequência. Aguarde alguns segundos e tente novamente.',
    },
  })

  // Proteção anti brute-force no login por par (IP + e-mail): 200 colegas diferentes não colidem entre si
  const loginAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const ipKey = ipKeyGenerator(req.ip || '127.0.0.1')
      const email = getNormalizedEmailFromBody(req)
      return email ? `${ipKey}:${email}` : ipKey
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Muitas tentativas de login incorretas para este e-mail. Aguarde 15 minutos e tente novamente.',
    },
  })

  // Proteção no cadastro: por par (IP + e-mail) + teto folgado por IP para evento com 200+ pessoas
  const registerEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => {
      const ipKey = ipKeyGenerator(req.ip || '127.0.0.1')
      const email = getNormalizedEmailFromBody(req)
      return email ? `${ipKey}:${email}` : ipKey
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Muitas tentativas de cadastro para este e-mail. Aguarde alguns minutos.',
    },
  })

  const registerIpCeilingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      erro: 'Limite temporário de novos cadastros na rede atingido. Aguarde alguns minutos.',
    },
  })

  app.use('/api', ipFloodLimiter, userSessionLimiter)
  app.use('/api/auth/login', loginAccountLimiter)
  app.use('/api/auth/cadastrar', registerEmailLimiter, registerIpCeilingLimiter)

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
