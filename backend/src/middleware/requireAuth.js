import { isValidUuid } from '../data/constantes.js'
import prisma from '../db.js'
import { SESSION_COOKIE_NAME, clearSessionCookie, verifySessionToken } from '../utils/jwt.js'

const TOKEN_VERSION_CACHE_TTL_MS = 10000
const TOKEN_VERSION_CACHE_MAX_SIZE = 5000
const tokenVersionCache = new Map()

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
 * Middleware de autenticação via cookie httpOnly contendo JWT HS256 assinado.
 * Também verifica `tokenVersion` no banco (com cache curto em memória invalidado no logout)
 * para garantir revogação imediata após logout sem saturar o pool sob alta concorrência.
 * Extrai o ID do jogador autenticado para `req.jogadorId`.
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME]

  if (!token) {
    return res.status(401).json({
      erro: 'Sessão não encontrada. Faça login para continuar.',
    })
  }

  try {
    const decoded = verifySessionToken(token)
    const jogadorId = decoded?.sub
    const tokenVersion = decoded?.tv

    if (!isValidUuid(jogadorId) || !Number.isInteger(tokenVersion)) {
      clearSessionCookie(res)
      return res.status(401).json({
        erro: 'Sessão inválida. Faça login novamente.',
      })
    }

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
  } catch {
    clearSessionCookie(res)
    return res.status(401).json({
      erro: 'Sessão expirada ou inválida. Faça login novamente.',
    })
  }
}
