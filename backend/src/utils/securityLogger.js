/**
 * Mascara parcialmente endereços de e-mail para conformidade com LGPD nos logs de auditoria.
 * Exemplo: "joao.oliveira@falavinha.com.br" -> "jo***@falavinha.com.br"
 */
export function maskEmail(email) {
  if (typeof email !== 'string') return undefined
  const trimmed = email.trim().toLowerCase()
  const atIndex = trimmed.indexOf('@')
  if (atIndex <= 0) return '***'

  const local = trimmed.slice(0, atIndex)
  const domain = trimmed.slice(atIndex)
  const visiblePrefix = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2)
  return `${visiblePrefix}***${domain}`
}

/**
 * Logger leve e estruturado para eventos de auditoria de segurança.
 * Mascara e-mails automaticamente (LGPD) e emite JSON em linha única.
 */
export function logSecurityEvent(event, details = {}) {
  const sanitized = { ...details }
  if (typeof sanitized.email === 'string' && sanitized.email.trim()) {
    sanitized.email = maskEmail(sanitized.email)
  }

  const entry = {
    tag: 'SECURITY_AUDIT',
    timestamp: new Date().toISOString(),
    event,
    ...sanitized,
  }

  if (
    event === 'CSRF_BLOCKED' ||
    event === 'RATE_LIMIT_EXCEEDED' ||
    event === 'SUSPICIOUS_COMPLETION_TIME' ||
    event === 'SUSPICIOUS_FAST_ANSWER'
  ) {
    console.warn(`[SECURITY_AUDIT] ${JSON.stringify(entry)}`)
  } else {
    console.info(`[SECURITY_AUDIT] ${JSON.stringify(entry)}`)
  }
}
