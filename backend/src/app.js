import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import helmet from 'helmet'
import { createCsrfProtection, isOriginAuthorized } from './middleware/csrfProtection.js'
import apiRouter from './routes/index.js'
import { SESSION_COOKIE_NAME, verifySessionToken } from './utils/jwt.js'
import { logSecurityEvent } from './utils/securityLogger.js'

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

function parseTrustProxySetting(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    // Padrão seguro: confia apenas em proxies na mesma máquina ou rede privada (Docker/LAN)
    return 'loopback, linklocal, uniquelocal'
  }

  const trimmed = String(rawValue).trim().toLowerCase()
  if (trimmed === 'false' || trimmed === '0') return false
  if (trimmed === 'true') return true
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return String(rawValue).trim()
}

function parseAllowedOrigins(rawOrigin) {
  const source = rawOrigin || 'http://localhost:5174'
  return source
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean)
}

function createRateLimitHandler(limiterName, messagePayload) {
  return (req, res, _next, options) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      limiter: limiterName,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      email: getNormalizedEmailFromBody(req) || undefined,
      jogadorId: getAuthenticatedUserId(req) || undefined,
    })
    res.status(options.statusCode || 429).json(messagePayload)
  }
}

export function createApp() {
  const app = express()
  const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_ORIGIN)

  app.set('trust proxy', parseTrustProxySetting(process.env.TRUST_PROXY))

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isOriginAuthorized(origin, allowedOrigins)) {
          return callback(null, true)
        }
        return callback(null, false)
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
    })
  )

  app.use(cookieParser())
  app.use(express.json({ limit: '50kb' }))

  // Teto global amplo por IP pensando em rede corporativa (200+ pessoas atrás do mesmo NAT/Wi-Fi)
  const ipFloodLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 12000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: createRateLimitHandler('ip_flood', {
      erro: 'Muitas requisições simultâneas na rede. Aguarde alguns segundos e tente novamente.',
    }),
  })

  // Limite individual por colaborador autenticado (não afeta colegas no mesmo IP)
  const userSessionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 150,
    skip: (req) => !getAuthenticatedUserId(req),
    keyGenerator: (req) => `user:${getAuthenticatedUserId(req)}`,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: createRateLimitHandler('user_session', {
      erro: 'Muitas ações em sequência. Aguarde alguns segundos e tente novamente.',
    }),
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
    handler: createRateLimitHandler('login_ip_email', {
      erro: 'Muitas tentativas de login incorretas para este e-mail. Aguarde 15 minutos e tente novamente.',
    }),
  })

  // Proteção secundária anti brute-force distribuído: teto global por e-mail independente do IP
  const loginEmailGlobalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    skipSuccessfulRequests: true,
    skip: (req) => !getNormalizedEmailFromBody(req),
    keyGenerator: (req) => `email:${getNormalizedEmailFromBody(req)}`,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: createRateLimitHandler('login_email_global', {
      erro: 'Esta conta atingiu o limite temporário de tentativas incorretas. Aguarde 15 minutos e tente novamente.',
    }),
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
    handler: createRateLimitHandler('register_ip_email', {
      erro: 'Muitas tentativas de cadastro para este e-mail. Aguarde alguns minutos.',
    }),
  })

  const registerIpCeilingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: createRateLimitHandler('register_ip_ceiling', {
      erro: 'Limite temporário de novos cadastros na rede atingido. Aguarde alguns minutos.',
    }),
  })

  const csrfProtection = createCsrfProtection(allowedOrigins)

  app.use('/api', ipFloodLimiter, csrfProtection, userSessionLimiter)
  app.use('/api/auth/login', loginAccountLimiter, loginEmailGlobalLimiter)
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

  app.use((_req, res) => {
    res.status(404).json({
      erro: 'Rota não encontrada.',
    })
  })

  // Error handler final: garante que nenhum stack trace ou detalhe interno vaze ao cliente
  app.use((err, req, res, _next) => {
    console.error('[express/error]', {
      method: req.method,
      path: req.originalUrl,
      message: err?.message,
    })
    if (res.headersSent) return
    res.status(500).json({
      erro: 'Erro interno do servidor.',
    })
  })

  return app
}
