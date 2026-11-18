import { isValidUuid } from '../data/constantes.js'
import { SESSION_COOKIE_NAME, verifySessionToken } from '../utils/jwt.js'

/**
 * Middleware de autenticação via cookie httpOnly contendo JWT assinado.
 * Extrai o ID do jogador autenticado para `req.jogadorId`.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME]

  if (!token) {
    return res.status(401).json({
      erro: 'Sessão não encontrada. Faça login para continuar.',
    })
  }

  try {
    const decoded = verifySessionToken(token)
    const jogadorId = decoded?.sub

    if (!isValidUuid(jogadorId)) {
      return res.status(401).json({
        erro: 'Sessão inválida. Faça login novamente.',
      })
    }

    req.jogadorId = jogadorId
    return next()
  } catch {
    return res.status(401).json({
      erro: 'Sessão expirada ou inválida. Faça login novamente.',
    })
  }
}
