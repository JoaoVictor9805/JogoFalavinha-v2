import { isValidUuid } from '../data/constantes.js'
import prisma from '../db.js'
import { SESSION_COOKIE_NAME, clearSessionCookie, verifySessionToken } from '../utils/jwt.js'

const TOKEN_VERSION_CACHE_TTL_MS = 60000
const TOKEN_VERSION_CACHE_MAX_SIZE = 5000
const tokenVersionCache = new Map()
const RESOLVED_SESSION_KEY = Symbol('resolvedSession')

export function setAuthSessionCache(jogadorId, tokenVersion) {
  if (!jogadorId || !Number.isInteger(tokenVersion)) return
  if (tokenVersionCache.size >= TOKEN_VERSION_CACHE_MAX_SIZE && !tokenVersionCache.has(jogadorId)) {
    const oldestKey = tokenVersionCache.keys().next().value
    if (oldestKey !== undefined) tokenVersionCache.delete(oldestKey)
  }
  tokenVersionCache.set(jogadorId, {
    tokenVersion,
    expiresAt: Date.now() + TOKEN_VERSION_CACHE_TTL_MS,
  })
}

export function invalidateAuthSessionCache(jogadorId) {
  if (!jogadorId) return
  tokenVersionCache.delete(jogadorId)
}

/**
 * Decodifica e valida o JWT do cookie apenas uma vez por requisição HTTP,
 * evitando verificações repetidas entre os rate limiters e o middleware `requireAuth`.
 */
export function resolveSessionFromRequest(req) {
  if (req[RESOLVED_SESSION_KEY]) {
    return req[RESOLVED_SESSION_KEY]
  }

  const token = req.cookies?.[SESSION_COOKIE_NAME]
  if (!token) {
    const result = { state: 'missing', jogadorId: null, tokenVersion: null }
    req[RESOLVED_SESSION_KEY] = result
    return result
  }

  let decoded
  try {
    decoded = verifySessionToken(token)
  } catch {
    const result = { state: 'invalid', jogadorId: null, tokenVersion: null }
    req[RESOLVED_SESSION_KEY] = result
    return result
  }

  const jogadorId = decoded?.sub
  const tokenVersion = decoded?.tv

  if (!isValidUuid(jogadorId) || !Number.isInteger(tokenVersion)) {
    const result = { state: 'invalid', jogadorId: null, tokenVersion: null }
    req[RESOLVED_SESSION_KEY] = result
    return result
  }

  const result = { state: 'valid', jogadorId, tokenVersion }
  req[RESOLVED_SESSION_KEY] = result
  return result
}

/**
 * Middleware de autenticação via cookie httpOnly contendo JWT HS256 assinado.
 * Também verifica `tokenVersion` no banco (com cache curto em memória invalidado no logout)
 * para garantir revogação imediata após logout sem saturar o pool sob alta concorrência.
 * Extrai o ID do jogador autenticado para `req.jogadorId`.
 */
export async function requireAuth(req, res, next) {
  const session = resolveSessionFromRequest(req)

  if (session.state === 'missing') {
    return res.status(401).json({
      erro: 'Sessão não encontrada. Faça login para continuar.',
    })
  }

  if (session.state === 'invalid') {
    clearSessionCookie(res)
    return res.status(401).json({
      erro: 'Sessão expirada ou inválida. Faça login novamente.',
    })
  }

  const { jogadorId, tokenVersion } = session

  try {
    const now = Date.now()
    const cached = tokenVersionCache.get(jogadorId)

    let resolvedTokenVersion = null
    if (cached && cached.expiresAt > now) {
      resolvedTokenVersion = cached.tokenVersion
    } else {
      const jogador = await prisma.jogador.findUnique({
        where: { id: jogadorId },
        select: { id: true, tokenVersion: true },
      })

      if (!jogador) {
        tokenVersionCache.delete(jogadorId)
        clearSessionCookie(res)
        return res.status(401).json({
          erro: 'Sessão revogada ou expirada. Faça login novamente.',
        })
      }

      resolvedTokenVersion = jogador.tokenVersion
      setAuthSessionCache(jogador.id, resolvedTokenVersion)
    }

    if (resolvedTokenVersion !== tokenVersion) {
      clearSessionCookie(res)
      return res.status(401).json({
        erro: 'Sessão revogada ou expirada. Faça login novamente.',
      })
    }

    req.jogadorId = jogadorId
    req.tokenVersion = resolvedTokenVersion
    return next()
  } catch (error) {
    console.error('[requireAuth] Erro ao validar sessão no banco:', error?.message || error)
    return res.status(503).json({
      erro: 'Serviço temporariamente ocupado. Tente novamente em instantes.',
    })
  }
}
