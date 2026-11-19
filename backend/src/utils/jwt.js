import jwt from 'jsonwebtoken'

export const SESSION_COOKIE_NAME = 'falavinha_session'

const DEV_FALLBACK_SECRET = 'dev-falavinha-next-jwt-secret-change-in-prod'
const MIN_PROD_SECRET_LENGTH = 32
const DEFAULT_EXPIRES_IN = '24h'
const DEFAULT_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000
const JWT_ALGORITHM = 'HS256'

/**
 * Obtém o segredo JWT do ambiente.
 * Em produção, exige que JWT_SECRET esteja definido, seja forte (>= 32 chars)
 * e diferente do segredo padrão de desenvolvimento.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim()

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEV_FALLBACK_SECRET || secret.length < MIN_PROD_SECRET_LENGTH) {
      throw new Error(
        `FATAL: JWT_SECRET em produção deve estar configurado, diferente do padrão de dev e ter no mínimo ${MIN_PROD_SECRET_LENGTH} caracteres.`
      )
    }
    return secret
  }

  return secret || DEV_FALLBACK_SECRET
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_EXPIRES_IN
}

/**
 * Converte strings simples de expiração ('24h', '12h', '7d', '30m', '60s') em milissegundos para o cookie.
 */
function parseDurationToMs(expr) {
  const match = /^(\d+)\s*([smhd])$/i.exec(String(expr || '').trim())
  if (!match) return DEFAULT_COOKIE_MAX_AGE_MS

  const value = Number(match[1])
  const unit = match[2].toLowerCase()
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }
  return value * multipliers[unit]
}

export function signSessionToken(jogadorId, tokenVersion = 0) {
  const safeVersion = Number.isInteger(tokenVersion) ? tokenVersion : 0
  return jwt.sign({ sub: jogadorId, tv: safeVersion }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: getJwtExpiresIn(),
  })
}

export function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
  })
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: parseDurationToMs(getJwtExpiresIn()),
  }
}

export function setSessionCookie(res, jogadorId, tokenVersion = 0) {
  const token = signSessionToken(jogadorId, tokenVersion)
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
  return token
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}
