import jwt from 'jsonwebtoken'

export const SESSION_COOKIE_NAME = 'falavinha_session'

const DEV_FALLBACK_SECRET = 'dev-falavinha-next-jwt-secret-change-in-prod'
const DEFAULT_EXPIRES_IN = '7d'
const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Obtém o segredo JWT do ambiente.
 * Em produção, exige que JWT_SECRET esteja definido explicitamente.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET não está configurado no ambiente de produção.')
  }

  return DEV_FALLBACK_SECRET
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_EXPIRES_IN
}

/**
 * Converte strings simples de expiração ('7d', '12h', '30m', '60s') em milissegundos para o cookie.
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

export function signSessionToken(jogadorId) {
  return jwt.sign({ sub: jogadorId }, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  })
}

export function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret())
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: parseDurationToMs(getJwtExpiresIn()),
  }
}

export function setSessionCookie(res, jogadorId) {
  const token = signSessionToken(jogadorId)
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
  return token
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}
