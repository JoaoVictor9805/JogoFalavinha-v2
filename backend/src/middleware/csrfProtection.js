import { logSecurityEvent } from '../utils/securityLogger.js'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const ALLOWED_X_REQUESTED_WITH = new Set(['fetch', 'xmlhttprequest'])

const DEV_TUNNEL_SUFFIXES = [
  '.trycloudflare.com',
  '.ngrok-free.app',
  '.ngrok.io',
  '.devtunnels.ms',
  '.loca.lt',
]

function isPrivateNetworkHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase()
  if (!host) return false
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    return true
  }
  if (host.endsWith('.local')) return true

  // RFC1918 IPv4 privado: 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!ipv4Match) return false

  const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])]
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function isDevAllowedOrigin(origin) {
  try {
    const parsed = new URL(origin)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }
    const hostname = parsed.hostname.toLowerCase()
    if (isPrivateNetworkHost(hostname)) return true
    return DEV_TUNNEL_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  } catch {
    return false
  }
}

/**
 * Valida se uma origem HTTP é autorizada:
 * - Em produção (`NODE_ENV === 'production'`): exige correspondência estrita com `FRONTEND_ORIGIN`.
 * - Em desenvolvimento: aceita `FRONTEND_ORIGIN`, qualquer host da rede local/privada (LAN/localhost)
 *   e os domínios de túnel configurados no Vite, bloqueando origens externas arbitrárias.
 */
export function isOriginAuthorized(origin, allowedOrigins = []) {
  const normalized = String(origin || '').trim().replace(/\/+$/, '')
  if (!normalized) return true

  const normalizedAllowed = new Set(
    allowedOrigins.map((o) => String(o || '').trim().replace(/\/+$/, '')).filter(Boolean)
  )

  if (normalizedAllowed.has(normalized)) {
    return true
  }

  if (process.env.NODE_ENV !== 'production') {
    return isDevAllowedOrigin(normalized)
  }

  return false
}

/**
 * Proteção CSRF em defesa em profundidade para APIs JSON com cookie httpOnly:
 * 1. Exige cabeçalho customizado `X-Requested-With: fetch` (ou `XMLHttpRequest`) em mutações,
 *    bloqueando submissões de formulários HTML e forçando preflight CORS em requests cross-origin.
 * 2. Quando o cabeçalho `Origin` está presente, valida se é autorizado (estrito em produção;
 *    rede local + túneis de teste liberados em development).
 */
export function createCsrfProtection(allowedOrigins = []) {
  return function csrfProtection(req, res, next) {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
      return next()
    }

    const xRequestedWith = String(req.get('X-Requested-With') || '')
      .trim()
      .toLowerCase()

    if (!ALLOWED_X_REQUESTED_WITH.has(xRequestedWith)) {
      logSecurityEvent('CSRF_BLOCKED', {
        reason: 'missing_or_invalid_x_requested_with',
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
      })
      return res.status(403).json({
        erro: 'Requisição bloqueada por proteção de origem (CSRF).',
      })
    }

    const origin = req.get('Origin')?.trim().replace(/\/+$/, '')
    if (origin && !isOriginAuthorized(origin, allowedOrigins)) {
      logSecurityEvent('CSRF_BLOCKED', {
        reason: 'disallowed_origin',
        origin,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
      })
      return res.status(403).json({
        erro: 'Origem da requisição não autorizada.',
      })
    }

    return next()
  }
}
