import { isValidUuid } from '../data/constantes.js'
import prisma from '../db.js'
import { SESSION_COOKIE_NAME, clearSessionCookie, verifySessionToken } from '../utils/jwt.js'

/**
 * Middleware de autenticação via cookie httpOnly contendo JWT HS256 assinado.
 * Também verifica `tokenVersion` no banco para garantir revogação imediata após logout.
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

    const jogador = await prisma.jogador.findUnique({
      where: { id: jogadorId },
      select: { id: true, tokenVersion: true },
    })

    if (!jogador || jogador.tokenVersion !== tokenVersion) {
      clearSessionCookie(res)
      return res.status(401).json({
        erro: 'Sessão revogada ou expirada. Faça login novamente.',
      })
    }

    req.jogadorId = jogador.id
    req.tokenVersion = jogador.tokenVersion
    return next()
  } catch {
    clearSessionCookie(res)
    return res.status(401).json({
      erro: 'Sessão expirada ou inválida. Faça login novamente.',
    })
  }
}
